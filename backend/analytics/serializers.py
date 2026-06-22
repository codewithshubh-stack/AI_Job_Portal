from rest_framework import serializers
from .models import Recommendation


class RecommendationSerializer(serializers.ModelSerializer):
    job_title = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    work_type = serializers.SerializerMethodField()
    employment_type = serializers.SerializerMethodField()

    min_salary = serializers.SerializerMethodField()
    max_salary = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    skills_required = serializers.SerializerMethodField()

    class Meta:
        model = Recommendation
        fields = [
            'id', 'job', 'job_title', 'company_name', 'location',
            'work_type', 'employment_type', 'score', 'reason',
            'is_dismissed', 'created_at',
            'min_salary', 'max_salary', 'currency', 'skills_required',
        ]
        read_only_fields = ['id', 'score', 'reason', 'created_at']

    def get_job_title(self, obj):
        return obj.job.title

    def get_company_name(self, obj):
        return obj.job.company.name if obj.job.company else None

    def get_location(self, obj):
        return obj.job.location

    def get_work_type(self, obj):
        return obj.job.work_type

    def get_employment_type(self, obj):
        return obj.job.employment_type

    def get_min_salary(self, obj):
        return obj.job.min_salary

    def get_max_salary(self, obj):
        return obj.job.max_salary

    def get_currency(self, obj):
        return obj.job.currency

    def get_skills_required(self, obj):
        return obj.job.skills_required
