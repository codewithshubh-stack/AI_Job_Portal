import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Job(models.Model):
    """Job Listing entity posted by a Recruiter under a Company."""

    class WorkType(models.TextChoices):
        REMOTE = 'remote', 'Remote'
        HYBRID = 'hybrid', 'Hybrid'
        ONSITE = 'onsite', 'On-site'

    class EmploymentType(models.TextChoices):
        FULL_TIME = 'full-time', 'Full-Time'
        PART_TIME = 'part-time', 'Part-Time'
        CONTRACT = 'contract', 'Contract'
        INTERNSHIP = 'internship', 'Internship'

    class ExperienceLevel(models.TextChoices):
        ENTRY = 'entry', 'Entry Level'
        MID = 'mid', 'Mid Level'
        SENIOR = 'senior', 'Senior Level'
        LEAD = 'lead', 'Lead'
        EXECUTIVE = 'executive', 'Executive'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        CLOSED = 'closed', 'Closed'

    class Source(models.TextChoices):
        PORTAL = 'portal', 'TalentAI Portal'
        LINKEDIN = 'linkedin', 'LinkedIn'
        INTERNSHALA = 'internshala', 'Internshala'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('recruiters.Company', on_delete=models.CASCADE, related_name='jobs')
    recruiter = models.ForeignKey('accounts.RecruiterProfile', on_delete=models.SET_NULL, null=True, related_name='posted_jobs')
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    requirements = models.TextField()
    location = models.CharField(max_length=255, db_index=True)
    work_type = models.CharField(max_length=50, choices=WorkType.choices, default=WorkType.ONSITE)
    employment_type = models.CharField(max_length=50, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME)
    experience_level = models.CharField(max_length=50, choices=ExperienceLevel.choices, default=ExperienceLevel.MID)
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=3, default='USD')
    skills_required = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    source = models.CharField(max_length=50, choices=Source.choices, default=Source.PORTAL, db_index=True)
    external_url = models.URLField(max_length=500, blank=True, null=True)
    views_count = models.PositiveIntegerField(default=0)
    applications_count = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['location', 'work_type']),
            models.Index(fields=['source', 'status']),
        ]

    def __str__(self):
        return f"{self.title} at {self.company.name} ({self.get_source_display()})"

    @property
    def salary_range(self):
        if self.min_salary and self.max_salary:
            return f"{self.currency} {self.min_salary:,.0f} - {self.max_salary:,.0f}"
        return "Not disclosed"
