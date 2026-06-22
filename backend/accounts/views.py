from django.contrib.auth import get_user_model
from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import CandidateProfile, RecruiterProfile, Education, Experience, Notification
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    EmailVerificationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    CandidateProfileSerializer,
    RecruiterProfileSerializer,
    EducationSerializer,
    ExperienceSerializer,
    NotificationSerializer,
)
from .utils import send_verification_email, send_password_reset_email

User = get_user_model()


# ─── Auth Views ───────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            try:
                send_verification_email(user)
            except Exception as e:
                print(f"Email send failed: {e}")
            return Response(
                {'user': UserSerializer(user, context={'request': request}).data,
                 'detail': 'Account registered. Please verify your email to log in.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.is_active = True
            user.is_verified = True
            user.save()
            return Response({'detail': 'Email verified. Account is now active.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if user:
                try:
                    send_password_reset_email(user)
                except Exception as e:
                    print(f"Email send failed: {e}")
            return Response({'detail': 'If a matching account exists, reset instructions have been sent.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'detail': 'Password reset successful. You may now log in.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Profile Views ────────────────────────────────────────────────────────────

class ProfileView(APIView):
    """GET / PATCH — returns and updates the authenticated user's own profile."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        # Update base user fields
        for field in ['first_name', 'last_name']:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()

        # Update profile-specific fields
        if user.role == User.Roles.CANDIDATE:
            profile = getattr(user, 'candidate_profile', None)
            if profile:
                serializer = CandidateProfileSerializer(
                    profile, data=request.data, partial=True, context={'request': request}
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()
        elif user.role == User.Roles.RECRUITER:
            profile = getattr(user, 'recruiter_profile', None)
            if profile:
                serializer = RecruiterProfileSerializer(
                    profile, data=request.data, partial=True, context={'request': request}
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()

        # Log Event
        try:
            from analytics.models import EventLog
            EventLog.objects.create(user=user, event_type='profile_updated', payload={})
        except Exception:
            pass

        return Response(UserSerializer(user, context={'request': request}).data)


# ─── Education Views ──────────────────────────────────────────────────────────

class EducationListCreateView(APIView):
    """
    GET  /api/v1/accounts/education/   - List candidate's education records
    POST /api/v1/accounts/education/   - Add a new education record
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile:
            return Response({'detail': 'Candidate profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EducationSerializer(profile.education.all(), many=True)
        return Response(serializer.data)

    def post(self, request):
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile:
            return Response({'detail': 'Candidate profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EducationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EducationDetailView(APIView):
    """
    PATCH  /api/v1/accounts/education/<id>/ - Update education record
    DELETE /api/v1/accounts/education/<id>/ - Delete education record
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_object(self, request, pk):
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile:
            return None
        try:
            return Education.objects.get(pk=pk, profile=profile)
        except Education.DoesNotExist:
            return None

    def patch(self, request, pk):
        obj = self._get_object(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EducationSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self._get_object(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Experience Views ─────────────────────────────────────────────────────────

class ExperienceListCreateView(APIView):
    """
    GET  /api/v1/accounts/experience/  - List candidate's experience records
    POST /api/v1/accounts/experience/  - Add a new experience record
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile:
            return Response({'detail': 'Candidate profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ExperienceSerializer(profile.experience.all(), many=True)
        return Response(serializer.data)

    def post(self, request):
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile:
            return Response({'detail': 'Candidate profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ExperienceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExperienceDetailView(APIView):
    """
    PATCH  /api/v1/accounts/experience/<id>/ - Update experience record
    DELETE /api/v1/accounts/experience/<id>/ - Delete experience record
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_object(self, request, pk):
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile:
            return None
        try:
            return Experience.objects.get(pk=pk, profile=profile)
        except Experience.DoesNotExist:
            return None

    def patch(self, request, pk):
        obj = self._get_object(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ExperienceSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self._get_object(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Notification Views ──────────────────────────────────────────────────────

class NotificationListView(APIView):
    """
    GET  /api/v1/accounts/notifications/ - List all notifications for authenticated user
    POST /api/v1/accounts/notifications/ - Mark all notifications as read
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})


class NotificationReadView(APIView):
    """
    PATCH /api/v1/accounts/notifications/<id>/read/ - Mark specific notification as read
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

