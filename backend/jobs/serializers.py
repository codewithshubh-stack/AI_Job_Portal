from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    """Full Job serializer for create/update operations by Recruiters."""
    salary_range = serializers.ReadOnlyField()
    company_name = serializers.SerializerMethodField()
    company_logo = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'company', 'company_name', 'company_logo', 'recruiter',
            'title', 'description', 'requirements', 'location',
            'work_type', 'employment_type', 'experience_level',
            'min_salary', 'max_salary', 'currency', 'salary_range',
            'skills_required', 'status', 'source', 'external_url', 
            'views_count', 'applications_count', 'published_at', 'expires_at', 'created_at',
        ]
        read_only_fields = ['id', 'views_count', 'applications_count', 'published_at', 'created_at']

    def get_company_name(self, obj):
        return obj.company.name if obj.company else None

    def get_company_logo(self, obj):
        request = self.context.get('request')
        if obj.company and obj.company.logo:
            return request.build_absolute_uri(obj.company.logo.url) if request else obj.company.logo.url
        return None

    def validate(self, attrs):
        min_sal = attrs.get('min_salary')
        max_sal = attrs.get('max_salary')
        if min_sal and max_sal and min_sal > max_sal:
            raise serializers.ValidationError({'salary': 'min_salary cannot be greater than max_salary.'})
        return attrs


class JobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing jobs in search results."""
    salary_range = serializers.ReadOnlyField()
    company_name = serializers.SerializerMethodField()
    company_logo = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company_name', 'company_logo', 'location',
            'work_type', 'employment_type', 'experience_level',
            'salary_range', 'skills_required', 'status', 'source', 'external_url', 'created_at',
        ]

    def get_company_name(self, obj):
        return obj.company.name if obj.company else None

    def get_company_logo(self, obj):
        request = self.context.get('request')
        if obj.company and obj.company.logo:
            return request.build_absolute_uri(obj.company.logo.url) if request else obj.company.logo.url
        return None
