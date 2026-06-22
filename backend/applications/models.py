import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Application(models.Model):
    """Job Application entity linking a Candidate to a Job."""

    class Status(models.TextChoices):
        APPLIED = 'applied', 'Applied'
        UNDER_REVIEW = 'under_review', 'Under Review'
        SHORTLISTED = 'shortlisted', 'Shortlisted'
        INTERVIEW = 'interview', 'Interview Scheduled'
        REJECTED = 'rejected', 'Rejected'
        SELECTED = 'selected', 'Selected'
        WITHDRAWN = 'withdrawn', 'Withdrawn'

    # Status transitions allowed by Recruiter
    RECRUITER_TRANSITIONS = {
        Status.APPLIED: [Status.UNDER_REVIEW, Status.REJECTED],
        Status.UNDER_REVIEW: [Status.SHORTLISTED, Status.REJECTED],
        Status.SHORTLISTED: [Status.INTERVIEW, Status.REJECTED],
        Status.INTERVIEW: [Status.SELECTED, Status.REJECTED],
    }

    # Status transitions allowed by Candidate
    CANDIDATE_TRANSITIONS = {
        Status.APPLIED: [Status.WITHDRAWN],
        Status.UNDER_REVIEW: [Status.WITHDRAWN],
        Status.SHORTLISTED: [Status.WITHDRAWN],
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='applications', db_index=True)
    candidate_profile = models.ForeignKey(
        'accounts.CandidateProfile', on_delete=models.CASCADE, related_name='applications', db_index=True
    )
    resume = models.ForeignKey('resumes.Resume', on_delete=models.SET_NULL, null=True, blank=True)
    cover_letter = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.APPLIED, db_index=True)
    ai_match_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['job', 'candidate_profile']  # Prevent duplicate applications

    def __str__(self):
        return f"{self.candidate_profile} -> {self.job.title}"


class ApplicationStatusHistory(models.Model):
    """Immutable log of every status change on an Application."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='history')
    from_status = models.CharField(max_length=50, blank=True, null=True)
    to_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.application} | {self.from_status} -> {self.to_status}"


class Interview(models.Model):
    """Interview scheduling entity."""

    class InterviewType(models.TextChoices):
        VIDEO = 'video', 'Video Call'
        PHONE = 'phone', 'Phone Call'
        ONSITE = 'onsite', 'On-site'

    class InterviewStatus(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        RESCHEDULED = 'rescheduled', 'Rescheduled'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    interview_type = models.CharField(max_length=20, choices=InterviewType.choices, default=InterviewType.VIDEO)
    meeting_link = models.URLField(max_length=500, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=InterviewStatus.choices, default=InterviewStatus.SCHEDULED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Interview for {self.application} on {self.scheduled_at}"
