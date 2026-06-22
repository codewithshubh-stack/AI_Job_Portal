from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Resume
from .serializers import ResumeSerializer
from recruiters.permissions import IsCandidate


class ResumeListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/resumes/ - List candidate's uploaded resumes
    POST /api/v1/resumes/ - Upload a new PDF resume (validates PDF + size)
    """
    serializer_class = ResumeSerializer
    permission_classes = [IsCandidate]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Resume.objects.filter(candidate_profile=self.request.user.candidate_profile)

    def perform_create(self, serializer):
        candidate_profile = self.request.user.candidate_profile
        file = self.request.FILES.get('file')
        resume = serializer.save(
            candidate_profile=candidate_profile,
            file_name=file.name if file else '',
            file_size=file.size if file else 0,
        )
        
        # Log Event
        try:
            from analytics.models import EventLog
            EventLog.objects.create(
                user=self.request.user, 
                event_type='resume_uploaded', 
                payload={'resume_id': str(resume.id), 'file_name': resume.file_name}
            )
        except Exception:
            pass

        # Create Notification
        try:
            from accounts.models import Notification
            Notification.objects.create(
                user=self.request.user,
                title='Resume Uploaded',
                message=f"Successfully uploaded and parsed resume '{resume.file_name}'.",
                notification_type='resume_uploaded'
            )
        except Exception:
            pass

        return resume


class ResumeDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/v1/resumes/<id>/ - Resume detail + download URL
    DELETE /api/v1/resumes/<id>/ - Delete a resume (cannot delete primary if only one)
    """
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'candidate':
            return Resume.objects.filter(candidate_profile=user.candidate_profile)
        elif user.role == 'recruiter':
            # Recruiters can view (via applications); filtered by application ownership would be in a separate view
            return Resume.objects.all()
        return Resume.objects.none()

    def perform_destroy(self, instance):
        candidate_profile = self.request.user.candidate_profile
        if instance.candidate_profile != candidate_profile:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own resumes.")
        if instance.is_primary:
            remaining = Resume.objects.filter(candidate_profile=candidate_profile).count()
            if remaining <= 1:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'detail': 'Cannot delete your only resume. Upload a new one first.'})
        instance.file.delete(save=False)
        instance.delete()


class ResumeMakePrimaryView(APIView):
    """
    POST /api/v1/resumes/<id>/make-primary/ - Set this resume as the primary active one
    """
    permission_classes = [IsCandidate]

    def post(self, request, pk):
        candidate_profile = request.user.candidate_profile
        try:
            resume = Resume.objects.get(pk=pk, candidate_profile=candidate_profile)
        except Resume.DoesNotExist:
            return Response({'detail': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Unset previous primary
        Resume.objects.filter(candidate_profile=candidate_profile, is_primary=True).update(is_primary=False)
        resume.is_primary = True
        resume.save()
        return Response({'detail': f'Resume v{resume.version} set as primary.'})
