from rest_framework import serializers
from .models import Application, ApplicationStatusHistory, Interview


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationStatusHistory
        fields = ['id', 'from_status', 'to_status', 'changed_by_email', 'notes', 'created_at']

    def get_changed_by_email(self, obj):
        return obj.changed_by.email if obj.changed_by else None


class ApplicationSerializer(serializers.ModelSerializer):
    history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    job_title = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    candidate_name = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'job_title', 'company_name',
            'candidate_profile', 'candidate_name',
            'resume', 'cover_letter', 'status',
            'ai_match_score', 'created_at', 'history',
        ]
        read_only_fields = ['id', 'status', 'ai_match_score', 'created_at']

    def get_job_title(self, obj):
        return obj.job.title if obj.job else None

    def get_company_name(self, obj):
        return obj.job.company.name if obj.job and obj.job.company else None

    def get_candidate_name(self, obj):
        user = obj.candidate_profile.user
        return f"{user.first_name} {user.last_name}"

    def validate(self, attrs):
        request = self.context.get('request')
        job = attrs.get('job')

        if job and job.status != 'published':
            raise serializers.ValidationError({'job': 'This job listing is not accepting applications.'})

        # Ensure candidate is not re-applying
        if request and request.user.is_authenticated:
            candidate_profile = getattr(request.user, 'candidate_profile', None)
            if candidate_profile and Application.objects.filter(job=job, candidate_profile=candidate_profile).exists():
                raise serializers.ValidationError({'detail': 'You have already applied to this job.'})
        return attrs


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    """Used by Recruiters to change the status of an application."""
    status = serializers.ChoiceField(choices=Application.Status.choices)
    notes = serializers.CharField(required=False, allow_blank=True)


class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = [
            'id', 'application', 'scheduled_at', 'duration_minutes',
            'interview_type', 'meeting_link', 'location', 'notes',
            'status', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
