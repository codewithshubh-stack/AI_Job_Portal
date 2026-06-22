from django.utils import timezone
from django.db.models import Q
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Job
from .serializers import JobSerializer, JobListSerializer
from recruiters.permissions import IsRecruiter
from .scrapers import sync_jobs


class JobListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/jobs/          - Public list, supports search & filter
    POST /api/v1/jobs/          - Recruiter creates a job posting
    """

    def get_queryset(self):
        qs = Job.objects.select_related('company', 'recruiter').filter(status=Job.Status.PUBLISHED)
        params = self.request.query_params

        # Text search: title, description, skills
        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(skills_required__icontains=search)
            )

        # Filters
        location = params.get('location')
        if location:
            qs = qs.filter(location__icontains=location)

        work_type = params.get('work_type')
        if work_type:
            qs = qs.filter(work_type=work_type)

        employment_type = params.get('employment_type')
        if employment_type:
            qs = qs.filter(employment_type=employment_type)

        experience_level = params.get('experience_level')
        if experience_level:
            qs = qs.filter(experience_level=experience_level)

        source = params.get('source')
        if source:
            qs = qs.filter(source=source)

        min_salary = params.get('min_salary')
        if min_salary:
            qs = qs.filter(max_salary__gte=min_salary)

        max_salary = params.get('max_salary')
        if max_salary:
            qs = qs.filter(min_salary__lte=max_salary)

        company = params.get('company')
        if company:
            qs = qs.filter(company__name__icontains=company)

        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JobSerializer
        return JobListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsRecruiter()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        recruiter_profile = self.request.user.recruiter_profile
        company = recruiter_profile.company
        if not company:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': 'You must be linked to a company before posting jobs.'})

        # Auto-publish if status=published, set published_at
        data_status = serializer.validated_data.get('status', Job.Status.DRAFT)
        published_at = timezone.now() if data_status == Job.Status.PUBLISHED else None
        serializer.save(company=company, recruiter=recruiter_profile, published_at=published_at)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/jobs/<id>/ - Job details (increments view count)
    PUT    /api/v1/jobs/<id>/ - Recruiter (owner) updates job
    DELETE /api/v1/jobs/<id>/ - Recruiter (owner) deletes/closes job
    """
    queryset = Job.objects.select_related('company', 'recruiter').all()
    serializer_class = JobSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsRecruiter()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view counter
        Job.objects.filter(pk=instance.pk).update(views_count=instance.views_count + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_update(self, serializer):
        job = self.get_object()
        recruiter_profile = self.request.user.recruiter_profile
        if job.recruiter != recruiter_profile:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own job listings.")
        # Handle publish timestamp
        new_status = serializer.validated_data.get('status', job.status)
        published_at = job.published_at
        if new_status == Job.Status.PUBLISHED and not published_at:
            published_at = timezone.now()
        serializer.save(published_at=published_at)

    def perform_destroy(self, instance):
        recruiter_profile = self.request.user.recruiter_profile
        if instance.recruiter != recruiter_profile:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own job listings.")
        instance.delete()


class RecruiterJobsView(generics.ListAPIView):
    """
    GET /api/v1/jobs/my-jobs/ - Recruiter views all their own job postings
    """
    serializer_class = JobSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user.recruiter_profile).order_by('-created_at')


class SyncExternalJobsView(APIView):
    """
    POST /api/v1/jobs/sync-external/ - Triggers importing/syncing external jobs from LinkedIn & Internshala
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        search = request.data.get('search', 'React')
        limit = request.data.get('limit', 5)
        source = request.data.get('source', 'both')

        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 5

        imported_count = sync_jobs(keyword=search, limit=limit, source_type=source)
        return Response({
            "detail": f"Successfully synced jobs for '{search}'. Imported {imported_count} new listings.",
            "imported_count": imported_count
        }, status=status.HTTP_200_OK)

