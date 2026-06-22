import uuid
import os
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

MAX_RESUME_SIZE_MB = 5


def validate_pdf(value):
    """Validates uploaded file is a PDF and within 5MB limit."""
    ext = os.path.splitext(value.name)[1].lower()
    if ext != '.pdf':
        raise ValidationError('Only PDF files are allowed.')
    if value.size > MAX_RESUME_SIZE_MB * 1024 * 1024:
        raise ValidationError(f'Resume file size cannot exceed {MAX_RESUME_SIZE_MB}MB.')


def resume_upload_path(instance, filename):
    """Dynamic upload path: resumes/<candidate_id>/<filename>"""
    return f"resumes/{instance.candidate_profile.id}/{filename}"


class Resume(models.Model):
    """Resume file storage with parsing status and version tracking."""

    class ParsingStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate_profile = models.ForeignKey(
        'accounts.CandidateProfile', on_delete=models.CASCADE, related_name='resumes'
    )
    file = models.FileField(upload_to=resume_upload_path, validators=[validate_pdf])
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text='Size in bytes')
    is_primary = models.BooleanField(default=False)
    version = models.PositiveIntegerField(default=1)
    parsed_content = models.JSONField(default=dict, blank=True)
    parsing_status = models.CharField(
        max_length=20, choices=ParsingStatus.choices, default=ParsingStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Auto-set file_name and file_size from the file field
        if self.file and not self.file_name:
            self.file_name = os.path.basename(self.file.name)
        if self.file and not self.file_size:
            self.file_size = self.file.size
        # Auto version: count existing resumes + 1
        is_new = not self.pk
        if is_new:
            existing = Resume.objects.filter(candidate_profile=self.candidate_profile).count()
            self.version = existing + 1
            self.parsing_status = self.ParsingStatus.PROCESSING

        super().save(*args, **kwargs)

        # Parse resume text synchronously if newly created
        if is_new and self.file:
            try:
                from .ai_service import extract_text_from_pdf
                text = extract_text_from_pdf(self.file.path)
                
                if text:
                    parsed = self._parse_text(text)
                    self.parsed_content = parsed
                    self.parsing_status = self.ParsingStatus.COMPLETED
                    
                    # Proactively update candidate profile skills with newly parsed ones
                    profile = self.candidate_profile
                    current_skills = set(profile.skills or [])
                    new_skills = set(parsed.get('skills', []))
                    updated_skills = list(current_skills.union(new_skills))
                    if updated_skills != list(current_skills):
                        profile.skills = updated_skills
                        profile.save()
                else:
                    self.parsing_status = self.ParsingStatus.FAILED
            except Exception as e:
                print(f"Sync parsing failed: {e}")
                self.parsing_status = self.ParsingStatus.FAILED
            
            # Save again to write parsed_content and status
            super().save(update_fields=['parsed_content', 'parsing_status'])

    def _parse_text(self, text):
        """Simple keyword-based parser for skills, education, and experience."""
        text_lower = text.lower()
        skills_keywords = [
            'python', 'django', 'javascript', 'react', 'node', 'sql', 'postgresql', 
            'docker', 'aws', 'kubernetes', 'html', 'css', 'git', 'java', 'c++', 
            'ruby', 'php', 'typescript', 'vue', 'mongodb', 'redis', 'linux'
        ]
        
        found_skills = []
        for skill in skills_keywords:
            if skill in text_lower:
                found_skills.append(skill.capitalize())
        
        education = []
        if any(term in text_lower for term in ['university', 'college', 'school', 'institute']):
            degree = "Degree"
            if "bachelor" in text_lower or "b.s." in text_lower or "b.a." in text_lower:
                degree = "Bachelor of Science"
            elif "master" in text_lower or "m.s." in text_lower or "mba" in text_lower:
                degree = "Master of Science"
            elif "phd" in text_lower or "ph.d." in text_lower:
                degree = "PhD"
                
            education.append({
                "degree": degree,
                "institution": "Extracted Institution"
            })
            
        experience = []
        if any(term in text_lower for term in ['engineer', 'developer', 'manager', 'specialist', 'analyst']):
            position = "Specialist"
            if "senior" in text_lower:
                position = "Senior Software Engineer"
            elif "engineer" in text_lower:
                position = "Software Engineer"
            elif "developer" in text_lower:
                position = "Developer"
                
            experience.append({
                "position": position,
                "company": "Extracted Employer"
            })
            
        return {
            "skills": found_skills,
            "education": education,
            "experience": experience
        }

    def __str__(self):
        return f"Resume v{self.version} - {self.candidate_profile}"

