from rest_framework import serializers
from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    file_size_mb = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id', 'file', 'file_name', 'file_size', 'file_size_mb',
            'is_primary', 'version', 'parsed_content',
            'parsing_status', 'download_url', 'created_at',
        ]
        read_only_fields = [
            'id', 'file_name', 'file_size', 'version',
            'parsed_content', 'parsing_status', 'created_at',
        ]

    def get_file_size_mb(self, obj):
        return round(obj.file_size / (1024 * 1024), 2) if obj.file_size else None

    def get_download_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
