from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Company
from .serializers import CompanySerializer
from .permissions import IsRecruiter, IsCompanyAdmin
from accounts.serializers import RecruiterProfileSerializer


class CompanyListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/recruiters/companies/  - Public list of all companies
    POST /api/v1/recruiters/companies/  - Recruiter creates a company
    """
    queryset = Company.objects.all().order_by('-created_at')
    serializer_class = CompanySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsRecruiter()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        company = serializer.save()
        # Automatically link the creating recruiter as admin
        recruiter_profile = self.request.user.recruiter_profile
        recruiter_profile.company = company
        recruiter_profile.is_admin = True
        recruiter_profile.save()


class CompanyDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/v1/recruiters/companies/<slug>/ - Public company detail
    PATCH /api/v1/recruiters/companies/<slug>/ - Company admin updates it
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    lookup_field = 'slug'
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH'):
            return [IsCompanyAdmin()]
        return [permissions.AllowAny()]


class RecruiterProfileView(APIView):
    """
    GET   /api/v1/recruiters/profile/  - Get own recruiter profile
    PATCH /api/v1/recruiters/profile/  - Update own recruiter profile
    """
    permission_classes = [IsRecruiter]

    def get(self, request):
        profile = getattr(request.user, 'recruiter_profile', None)
        if not profile:
            return Response({'detail': 'Recruiter profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RecruiterProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = getattr(request.user, 'recruiter_profile', None)
        if not profile:
            return Response({'detail': 'Recruiter profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RecruiterProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CompanyTeamView(APIView):
    """
    GET /api/v1/recruiters/team/ - List all recruiters in same company
    """
    permission_classes = [IsRecruiter]

    def get(self, request):
        recruiter_profile = getattr(request.user, 'recruiter_profile', None)
        if not recruiter_profile or not recruiter_profile.company:
            return Response({'detail': 'You are not linked to any company.'}, status=status.HTTP_404_NOT_FOUND)
        team = recruiter_profile.company.recruiters.select_related('user').all()
        data = [
            {
                'id': str(r.id),
                'email': r.user.email,
                'first_name': r.user.first_name,
                'last_name': r.user.last_name,
                'job_title': r.job_title,
                'is_admin': r.is_admin,
            }
            for r in team
        ]
        return Response(data)
