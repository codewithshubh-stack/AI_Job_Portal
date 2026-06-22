from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    """Company Profile Serializer."""
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'slug', 'website', 'description', 
            'logo', 'industry', 'size_range', 'headquarters', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at']
