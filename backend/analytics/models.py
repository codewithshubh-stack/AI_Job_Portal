import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class EventLog(models.Model):
    """Stores user interaction events for analytics (job views, searches, etc.)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    event_type = models.CharField(max_length=100, db_index=True)
    payload = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} by {self.user or 'anonymous'}"


class Recommendation(models.Model):
    """AI-generated job recommendations for a candidate."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate_profile = models.ForeignKey(
        'accounts.CandidateProfile', on_delete=models.CASCADE, related_name='recommendations', db_index=True
    )
    job = models.ForeignKey(
        'jobs.Job', on_delete=models.CASCADE, related_name='recommendations', db_index=True
    )
    score = models.DecimalField(max_digits=5, decimal_places=2, db_index=True)
    reason = models.CharField(max_length=255)
    is_dismissed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score']
        unique_together = ['candidate_profile', 'job']

    def __str__(self):
        return f"Recommendation: {self.job.title} for {self.candidate_profile} (score={self.score})"
