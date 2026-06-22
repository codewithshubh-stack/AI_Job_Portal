from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers, exceptions
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CandidateProfile, RecruiterProfile, Education, Experience, Notification

User = get_user_model()


# ─── Sub-Model Serializers ────────────────────────────────────────────────────

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = [
            'id', 'institution', 'degree', 'field_of_study',
            'start_date', 'end_date', 'is_current', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        if not attrs.get('is_current') and attrs.get('end_date') and attrs.get('start_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})
        return attrs


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = [
            'id', 'company', 'position', 'location', 'description',
            'start_date', 'end_date', 'is_current', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        if not attrs.get('is_current') and attrs.get('end_date') and attrs.get('start_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})
        return attrs


class CandidateProfileSerializer(serializers.ModelSerializer):
    education = EducationSerializer(many=True, read_only=True)
    experience = ExperienceSerializer(many=True, read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = CandidateProfile
        fields = [
            'id', 'phone_number', 'location', 'headline',
            'summary', 'skills', 'profile_picture', 'profile_picture_url',
            'github_url', 'linkedin_url', 'portfolio_url',
            'completion_percentage', 'education', 'experience',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'completion_percentage', 'created_at', 'updated_at']
        extra_kwargs = {'profile_picture': {'write_only': True, 'required': False}}

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture:
            return request.build_absolute_uri(obj.profile_picture.url) if request else obj.profile_picture.url
        return None

    def validate_skills(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Skills must be a list of strings.')
        return [str(s).strip() for s in value if str(s).strip()]


class RecruiterProfileSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = RecruiterProfile
        fields = ['id', 'job_title', 'is_admin', 'company', 'company_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_admin', 'company', 'company_name', 'created_at', 'updated_at']

    def get_company_name(self, obj):
        return obj.company.name if obj.company else None


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'is_verified', 'is_active', 'profile', 'created_at'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'is_active', 'created_at']

    def get_profile(self, obj):
        if obj.role == User.Roles.CANDIDATE:
            profile = getattr(obj, 'candidate_profile', None)
            if profile:
                return CandidateProfileSerializer(profile, context=self.context).data
        elif obj.role == User.Roles.RECRUITER:
            profile = getattr(obj, 'recruiter_profile', None)
            if profile:
                return RecruiterProfileSerializer(profile, context=self.context).data
        return None


# ─── Auth Serializers ─────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=[User.Roles.CANDIDATE, User.Roles.RECRUITER], required=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'role']
        extra_kwargs = {
            'first_name': {'required': True, 'allow_blank': False},
            'last_name': {'required': True, 'allow_blank': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role = validated_data.get('role')
        user = User.objects.create_user(password=password, **validated_data)
        if role == User.Roles.CANDIDATE:
            CandidateProfile.objects.create(user=user)
        elif role == User.Roles.RECRUITER:
            RecruiterProfile.objects.create(user=user)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['is_verified'] = user.is_verified
        return token

    def validate(self, attrs):
        email = attrs.get(self.username_field)
        password = attrs.get('password')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed("No active account found with the given credentials")
        if not user.check_password(password):
            raise exceptions.AuthenticationFailed("No active account found with the given credentials")
        if not user.is_verified:
            raise exceptions.AuthenticationFailed("Your email address is not verified. Please check your inbox for verification link.")
        if not user.is_active:
            raise exceptions.AuthenticationFailed("This account is inactive.")
        data = super().validate(attrs)
        data['user'] = UserSerializer(user, context=self.context).data
        return data


class EmailVerificationSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"detail": "Invalid activation link."})
        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({"detail": "Expired or invalid activation token."})
        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"detail": "Invalid reset link."})
        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({"detail": "Expired or invalid password reset token."})
        attrs['user'] = user
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'notification_type', 'created_at']
        read_only_fields = ['id', 'title', 'message', 'notification_type', 'created_at']

