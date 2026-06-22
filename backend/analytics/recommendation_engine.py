"""
Job Recommendation Engine

Algorithm:
1. Fetch candidate skills, location, experience history
2. Query all published jobs not already applied to
3. Compute match_score for each job using skill overlap + location match + experience level match
4. Store top N recommendations in analytics_recommendation table
"""

from django.db.models import Q
from accounts.models import CandidateProfile
from jobs.models import Job
from .models import Recommendation


EXPERIENCE_LEVEL_WEIGHTS = {
    'entry': 1,
    'mid': 2,
    'senior': 3,
    'lead': 4,
    'executive': 5,
}

SCORE_WEIGHTS = {
    'skill_match': 0.60,     # 60% weight on skills
    'location_match': 0.20,  # 20% weight on location
    'experience_match': 0.20, # 20% weight on experience level
}


def _candidate_experience_level(profile: CandidateProfile) -> str:
    """Infer candidate experience level from number of experience records."""
    exp_count = profile.experience.count()
    if exp_count == 0:
        return 'entry'
    elif exp_count == 1:
        return 'mid'
    elif exp_count == 2:
        return 'senior'
    else:
        return 'lead'


def compute_job_score(profile: CandidateProfile, job: Job) -> float:
    """Compute a 0-100 recommendation score for a candidate-job pair."""
    candidate_skills = {s.lower().strip() for s in (profile.skills or [])}
    job_skills = {s.lower().strip() for s in (job.skills_required or [])}

    # Skill score
    if job_skills:
        matched = candidate_skills.intersection(job_skills)
        skill_score = (len(matched) / len(job_skills)) * 100
    else:
        skill_score = 50  # No skills required = neutral

    # Location score
    location_score = 0
    if job.work_type == 'remote':
        location_score = 100  # Remote always matches
    elif profile.location and job.location:
        if profile.location.lower() in job.location.lower() or job.location.lower() in profile.location.lower():
            location_score = 100
        else:
            location_score = 20
    else:
        location_score = 40  # Unknown location = partial match

    # Experience level score
    candidate_level = _candidate_experience_level(profile)
    candidate_weight = EXPERIENCE_LEVEL_WEIGHTS.get(candidate_level, 1)
    job_weight = EXPERIENCE_LEVEL_WEIGHTS.get(job.experience_level, 2)

    if candidate_weight == job_weight:
        exp_score = 100
    elif abs(candidate_weight - job_weight) == 1:
        exp_score = 70
    else:
        exp_score = 30

    total = (
        skill_score * SCORE_WEIGHTS['skill_match'] +
        location_score * SCORE_WEIGHTS['location_match'] +
        exp_score * SCORE_WEIGHTS['experience_match']
    )
    return round(total, 2)


def generate_recommendations(candidate_profile: CandidateProfile, top_n: int = 10):
    """
    Generate top N job recommendations for a candidate.
    Clears old recommendations and stores fresh ones.
    """
    # Jobs not already applied to
    applied_job_ids = candidate_profile.applications.values_list('job_id', flat=True)
    candidate_skills = [s.lower() for s in (candidate_profile.skills or [])]

    # Fetch relevant published jobs filtered by at least partial skill match
    if candidate_skills:
        jobs_qs = Job.objects.filter(
            status=Job.Status.PUBLISHED
        ).exclude(id__in=applied_job_ids).select_related('company')
    else:
        jobs_qs = Job.objects.filter(
            status=Job.Status.PUBLISHED
        ).exclude(id__in=applied_job_ids).select_related('company')[:50]

    scored = []
    for job in jobs_qs:
        score = compute_job_score(candidate_profile, job)
        if score >= 20:  # Minimum threshold
            skill_set = {s.lower() for s in (job.skills_required or [])}
            candidate_set = {s.lower() for s in (candidate_profile.skills or [])}
            matched_skills = skill_set.intersection(candidate_set)
            reason = f"Matches {int(score)}% of your profile"
            if matched_skills:
                reason += f" · Skills: {', '.join(list(matched_skills)[:3])}"
            scored.append((job, score, reason))

    # Sort by score desc and take top N
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:top_n]

    # Delete existing recommendations and recreate
    Recommendation.objects.filter(candidate_profile=candidate_profile).delete()

    recommendations = []
    for job, score, reason in top:
        rec = Recommendation(
            candidate_profile=candidate_profile,
            job=job,
            score=score,
            reason=reason,
        )
        recommendations.append(rec)

    Recommendation.objects.bulk_create(recommendations, ignore_conflicts=True)
    return recommendations
