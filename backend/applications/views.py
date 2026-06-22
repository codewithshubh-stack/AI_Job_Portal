from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Application, ApplicationStatusHistory, Interview
from .serializers import (
    ApplicationSerializer,
    ApplicationStatusUpdateSerializer,
    InterviewSerializer,
)
from recruiters.permissions import IsRecruiter, IsCandidate
from accounts.models import Notification
from analytics.models import EventLog



class ApplicationListCreateView(generics.ListCreateAPIView):
    """
    Candidates: POST to apply. GET own applications.
    Recruiters: GET applications for their job listings.
    """
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'candidate':
            return Application.objects.filter(
                candidate_profile=user.candidate_profile
            ).select_related('job', 'job__company').prefetch_related('history')
        elif user.role == 'recruiter':
            return Application.objects.filter(
                job__recruiter=user.recruiter_profile
            ).select_related('job', 'candidate_profile__user').prefetch_related('history')
        return Application.objects.none()

    def perform_create(self, serializer):
        candidate_profile = self.request.user.candidate_profile
        application = serializer.save(candidate_profile=candidate_profile)
        job = application.job
        # Log initial status in history
        ApplicationStatusHistory.objects.create(
            application=application,
            from_status=None,
            to_status=Application.Status.APPLIED,
            changed_by=self.request.user,
            notes='Application submitted'
        )
        # Increment job applications counter
        application.job.__class__.objects.filter(pk=application.job.pk).update(
            applications_count=application.job.applications_count + 1
        )

        # Log Event
        EventLog.objects.create(
            user=self.request.user,
            event_type='job_applied',
            payload={
                'job_id': str(job.id),
                'job_title': job.title,
                'company_name': job.company.name,
                'match_score': float(application.ai_match_score) if application.ai_match_score else None
            }
        )

        # Create Candidate Notification
        Notification.objects.create(
            user=self.request.user,
            title='Application Submitted',
            message=f"You successfully applied to {job.title} at {job.company.name}.",
            notification_type='application_submitted'
        )

        # Create Recruiter Notification
        if job.recruiter and job.recruiter.user:
            Notification.objects.create(
                user=job.recruiter.user,
                title='New Application Received',
                message=f"{self.request.user.first_name} {self.request.user.last_name} applied for {job.title}.",
                notification_type='new_application'
            )

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsCandidate()]
        return [permissions.IsAuthenticated()]


class ApplicationDetailView(generics.RetrieveAPIView):
    """GET /api/v1/applications/<id>/ - Candidate or Recruiter views application."""
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'candidate':
            return Application.objects.filter(candidate_profile=user.candidate_profile)
        elif user.role == 'recruiter':
            return Application.objects.filter(job__recruiter=user.recruiter_profile)
        return Application.objects.none()


class ApplicationStatusUpdateView(APIView):
    """
    PATCH /api/v1/applications/<id>/status/ - Recruiter updates application status.
    PATCH /api/v1/applications/<id>/withdraw/ - Candidate withdraws application.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk, action=None):
        user = request.user

        try:
            if user.role == 'recruiter':
                application = Application.objects.get(pk=pk, job__recruiter=user.recruiter_profile)
            else:
                application = Application.objects.get(pk=pk, candidate_profile=user.candidate_profile)
        except Application.DoesNotExist:
            return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'withdraw':
            # Candidate withdraws
            allowed = Application.CANDIDATE_TRANSITIONS.get(application.status, [])
            if Application.Status.WITHDRAWN not in allowed:
                return Response(
                    {'detail': f'Cannot withdraw from status: {application.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            new_status = Application.Status.WITHDRAWN
            notes = 'Candidate withdrew application'
        else:
            # Recruiter updates status
            serializer = ApplicationStatusUpdateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            new_status = serializer.validated_data['status']
            notes = serializer.validated_data.get('notes', '')
            allowed = Application.RECRUITER_TRANSITIONS.get(application.status, [])
            if new_status not in allowed:
                return Response(
                    {'detail': f'Invalid transition: {application.status} -> {new_status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        old_status = application.status
        application.status = new_status
        application.save()

        # Log history
        ApplicationStatusHistory.objects.create(
            application=application,
            from_status=old_status,
            to_status=new_status,
            changed_by=user,
            notes=notes
        )

        job = application.job
        candidate_user = application.candidate_profile.user

        # Create notifications and event logs
        if action == 'withdraw':
            if job.recruiter and job.recruiter.user:
                Notification.objects.create(
                    user=job.recruiter.user,
                    title='Application Withdrawn',
                    message=f"{candidate_user.first_name} {candidate_user.last_name} has withdrawn their application for {job.title}.",
                    notification_type='application_withdrawn'
                )
            EventLog.objects.create(
                user=candidate_user,
                event_type='application_withdrawn',
                payload={'job_id': str(job.id), 'job_title': job.title}
            )
        else:
            readable_status = application.get_status_display()
            Notification.objects.create(
                user=candidate_user,
                title='Application Status Updated',
                message=f"Your application for {job.title} has been updated to '{readable_status}'.",
                notification_type='status_updated'
            )
            EventLog.objects.create(
                user=candidate_user,
                event_type='status_updated',
                payload={'job_id': str(job.id), 'job_title': job.title, 'status': new_status}
            )

        return Response({'detail': f'Status updated to {new_status}.', 'status': new_status})


class InterviewListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/applications/interviews/ - List scheduled interviews
    POST /api/v1/applications/interviews/ - Recruiter schedules interview (sends email)
    """
    serializer_class = InterviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsRecruiter()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'candidate':
            return Interview.objects.filter(
                application__candidate_profile=user.candidate_profile
            ).select_related('application__job')
        elif user.role == 'recruiter':
            return Interview.objects.filter(
                application__job__recruiter=user.recruiter_profile
            ).select_related('application__job')
        return Interview.objects.none()

    def perform_create(self, serializer):
        interview = serializer.save()
        # Update application status to INTERVIEW
        application = interview.application
        old_status = application.status
        application.status = Application.Status.INTERVIEW
        application.save()
        ApplicationStatusHistory.objects.create(
            application=application,
            from_status=old_status,
            to_status=Application.Status.INTERVIEW,
            changed_by=self.request.user,
            notes=f'Interview scheduled for {interview.scheduled_at}'
        )

        # Create Notification
        Notification.objects.create(
            user=application.candidate_profile.user,
            title='Interview Scheduled',
            message=f"Your interview for {application.job.title} at {application.job.company.name} has been scheduled for {interview.scheduled_at}.",
            notification_type='interview_scheduled'
        )
        # Log Event
        EventLog.objects.create(
            user=application.candidate_profile.user,
            event_type='interview_scheduled',
            payload={
                'job_id': str(application.job.id),
                'job_title': application.job.title,
                'scheduled_at': str(interview.scheduled_at)
            }
        )

        # Send email notification
        try:
            candidate_email = application.candidate_profile.user.email
            candidate_name = application.candidate_profile.user.first_name
            send_mail(
                subject=f"Interview Scheduled - {application.job.title}",
                message=(
                    f"Hi {candidate_name},\n\n"
                    f"Your interview for {application.job.title} at {application.job.company.name} has been scheduled.\n"
                    f"Date & Time: {interview.scheduled_at}\n"
                    f"Type: {interview.get_interview_type_display()}\n"
                    f"{'Meeting Link: ' + interview.meeting_link if interview.meeting_link else ''}\n"
                    f"{'Location: ' + interview.location if interview.location else ''}\n\n"
                    f"Best regards,\nAI Job Portal Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[candidate_email],
                fail_silently=True,
            )
        except Exception:
            pass


class InterviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/applications/interviews/<id>/ - Interview detail
    PATCH  /api/v1/applications/interviews/<id>/ - Recruiter reschedules/cancels
    DELETE /api/v1/applications/interviews/<id>/ - Recruiter cancels interview
    """
    serializer_class = InterviewSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return Interview.objects.filter(
            application__job__recruiter=self.request.user.recruiter_profile
        )
