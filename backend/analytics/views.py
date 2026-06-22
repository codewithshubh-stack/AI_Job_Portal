from django.db.models import Count, Q
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from applications.models import Application
from jobs.models import Job
from resumes.models import Resume
from resumes.ai_service import analyze_resume_against_job, compute_skill_match_score
from recruiters.permissions import IsCandidate, IsRecruiter
from .models import Recommendation, EventLog
from .serializers import RecommendationSerializer
from .recommendation_engine import generate_recommendations


# ─── Candidate Analytics ──────────────────────────────────────────────────────

class CandidateDashboardView(APIView):
    """
    GET /api/v1/analytics/candidate/dashboard/
    Returns application funnel stats for the authenticated candidate.
    """
    permission_classes = [IsCandidate]

    def get(self, request):
        profile = request.user.candidate_profile
        apps = Application.objects.filter(candidate_profile=profile)

        data = {
            'total_applications': apps.count(),
            'by_status': {
                choice[0]: apps.filter(status=choice[0]).count()
                for choice in Application.Status.choices
            },
            'profile_completion': profile.completion_percentage,
            'total_resumes': Resume.objects.filter(candidate_profile=profile).count(),
            'avg_match_score': None,
        }

        scores = apps.exclude(ai_match_score__isnull=True).values_list('ai_match_score', flat=True)
        if scores:
            data['avg_match_score'] = round(sum(float(s) for s in scores) / len(scores), 1)

        return Response(data)


class RecommendationListView(generics.ListAPIView):
    """
    GET /api/v1/analytics/candidate/recommendations/
    Returns AI-generated job recommendations. Generates fresh ones if none exist.
    """
    serializer_class = RecommendationSerializer
    permission_classes = [IsCandidate]

    def get_queryset(self):
        profile = self.request.user.candidate_profile
        qs = Recommendation.objects.filter(
            candidate_profile=profile, is_dismissed=False
        ).select_related('job', 'job__company')

        if not qs.exists():
            generate_recommendations(profile)
            qs = Recommendation.objects.filter(
                candidate_profile=profile, is_dismissed=False
            ).select_related('job', 'job__company')

        return qs


class RecommendationRefreshView(APIView):
    """
    POST /api/v1/analytics/candidate/recommendations/refresh/
    Forces regeneration of job recommendations.
    """
    permission_classes = [IsCandidate]

    def post(self, request):
        profile = request.user.candidate_profile
        recs = generate_recommendations(profile)
        return Response({'detail': f'{len(recs)} recommendations generated.'})


class RecommendationDismissView(APIView):
    """
    PATCH /api/v1/analytics/candidate/recommendations/<id>/dismiss/
    Dismisses a recommendation card.
    """
    permission_classes = [IsCandidate]

    def patch(self, request, pk):
        profile = request.user.candidate_profile
        try:
            rec = Recommendation.objects.get(pk=pk, candidate_profile=profile)
        except Recommendation.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        rec.is_dismissed = True
        rec.save()
        return Response({'detail': 'Recommendation dismissed.'})


# ─── Recruiter Analytics ──────────────────────────────────────────────────────

class RecruiterDashboardView(APIView):
    """
    GET /api/v1/analytics/recruiter/dashboard/
    Returns hiring funnel metrics for the authenticated recruiter.
    """
    permission_classes = [IsRecruiter]

    def get(self, request):
        recruiter_profile = request.user.recruiter_profile

        jobs_qs = Job.objects.filter(recruiter=recruiter_profile)
        applications_qs = Application.objects.filter(job__recruiter=recruiter_profile)

        data = {
            'total_jobs': jobs_qs.count(),
            'jobs_by_status': {
                choice[0]: jobs_qs.filter(status=choice[0]).count()
                for choice in Job.Status.choices
            },
            'total_applications': applications_qs.count(),
            'application_funnel': {
                choice[0]: applications_qs.filter(status=choice[0]).count()
                for choice in Application.Status.choices
            },
            'top_jobs': list(
                jobs_qs.order_by('-applications_count').values(
                    'id', 'title', 'applications_count', 'views_count', 'status'
                )[:5]
            ),
        }
        return Response(data)


# ─── AI Resume Analyzer ───────────────────────────────────────────────────────

class ResumeAnalyzerView(APIView):
    """
    POST /api/v1/analytics/ai/analyze-resume/

    Body (JSON):
      - resume_id: UUID of a resume belonging to the candidate
      - job_description: Full job description text

    Returns:
      - match_score, strengths, weaknesses, missing_skills, suggestions
    """
    permission_classes = [IsCandidate]

    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = request.data.get('job_description', '').strip()

        if not resume_id:
            return Response({'detail': 'resume_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not job_description:
            return Response({'detail': 'job_description is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            resume = Resume.objects.get(
                pk=resume_id, candidate_profile=request.user.candidate_profile
            )
        except Resume.DoesNotExist:
            return Response({'detail': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not resume.file:
            return Response({'detail': 'Resume file is missing.'}, status=status.HTTP_400_BAD_REQUEST)

        from resumes.ai_service import extract_text_from_pdf
        resume_text = extract_text_from_pdf(resume.file.path)

        if not resume_text.strip():
            # Fallback to parsed_content if PDF extraction fails
            parsed = resume.parsed_content or {}
            resume_text = str(parsed)

        # Quick skill match as a bonus (no API cost)
        candidate_skills = request.user.candidate_profile.skills or []
        # Try full AI analysis
        try:
            result = analyze_resume_against_job(resume_text, job_description)
        except ValueError as e:
            # OpenAI key not set — fallback to skill-based analysis
            skill_result = compute_skill_match_score(candidate_skills, [])
            result = {
                'match_score': skill_result['score'],
                'strengths': [f"Skill match: {', '.join(skill_result['matched'])}"] if skill_result['matched'] else [],
                'weaknesses': [],
                'missing_skills': skill_result['missing'],
                'suggestions': ['Set OPENAI_API_KEY for full AI-powered analysis.'],
                'note': str(e),
            }
        except Exception as e:
            return Response(
                {'detail': f'AI analysis failed: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(result)


# ─── Candidate Dashboard Details & Portfolio Metrics ──────────────────────────

class CandidateDashboardDetailsView(APIView):
    """
    GET /api/v1/analytics/candidate/dashboard-details/
    Returns detailed portfolio metrics for candidates:
    - recent_activities
    - recent_applications
    - resume_analysis
    - skill_gap
    """
    permission_classes = [IsCandidate]

    def get(self, request):
        profile = request.user.candidate_profile
        
        # 1. Recent Activities
        logs = EventLog.objects.filter(user=request.user).order_by('-created_at')[:10]
        recent_activities = [
            {
                'id': str(log.id),
                'event_type': log.event_type,
                'payload': log.payload,
                'created_at': log.created_at
            }
            for log in logs
        ]

        # 2. Recent Applications
        apps = Application.objects.filter(candidate_profile=profile).select_related('job', 'job__company').order_by('-created_at')[:5]
        recent_applications = [
            {
                'id': str(app.id),
                'job_id': str(app.job.id),
                'job_title': app.job.title,
                'company_name': app.job.company.name,
                'status': app.status,
                'status_display': app.get_status_display(),
                'created_at': app.created_at,
                'ai_match_score': float(app.ai_match_score) if app.ai_match_score else None
            }
            for app in apps
        ]

        # 3. Resume Analysis Dashboard metrics
        primary_resume = Resume.objects.filter(candidate_profile=profile, is_primary=True).first()
        if not primary_resume:
            primary_resume = Resume.objects.filter(candidate_profile=profile).first()
            
        resume_analysis = {
            'has_resume': False,
            'resume_score': 0,
            'ats_score': 0,
            'missing_keywords': [],
            'strengths': [],
            'weaknesses': [],
            'suggestions': []
        }

        if primary_resume:
            # We mock the scores based on profile completeness + skills count if not already analyzed
            parsed = primary_resume.parsed_content or {}
            skills_extracted = parsed.get('skills', [])
            
            # Simple scoring logic
            comp = profile.completion_percentage
            resume_score = min(max(50 + len(skills_extracted) * 4, 60), 98)
            ats_score = min(max(45 + comp // 2 + len(skills_extracted) * 3, 55), 95)
            
            # Strengths, Weaknesses, suggestions
            strengths = ["Resume structure is clean & parses easily."]
            if len(skills_extracted) >= 5:
                strengths.append(f"Strong technical footprint with skills in: {', '.join(skills_extracted[:4])}.")
            if profile.experience.exists():
                strengths.append("Professional experience history is clearly detailed.")
                
            weaknesses = []
            suggestions = []
            
            # Find missing keywords by comparing profile skills with jobs recommended
            # We grab skills from published jobs that the candidate lacks
            applied_job_ids = profile.applications.values_list('job_id', flat=True)
            recom_jobs = Job.objects.filter(status=Job.Status.PUBLISHED).exclude(id__in=applied_job_ids)[:5]
            
            all_job_skills = set()
            for rj in recom_jobs:
                all_job_skills.update([s.lower().strip() for s in (rj.skills_required or [])])
                
            cand_skills_lower = {s.lower().strip() for s in (profile.skills or [])}
            missing_set = all_job_skills - cand_skills_lower
            missing_keywords = [m.capitalize() for m in list(missing_set)[:5]]
            
            if missing_keywords:
                weaknesses.append(f"Gaps identified in current trending skills: {', '.join(missing_keywords[:3])}.")
                suggestions.append(f"Add missing core keywords: {', '.join(missing_keywords)} to your profile and resume experience details.")
            else:
                weaknesses.append("Resume could highlight cloud deployment or team leadership attributes further.")
                suggestions.append("Incorporate quantitative metrics (e.g. '% efficiency gain') into your experience summaries.")
            
            resume_analysis = {
                'has_resume': True,
                'resume_id': str(primary_resume.id),
                'file_name': primary_resume.file_name,
                'resume_score': resume_score,
                'ats_score': ats_score,
                'missing_keywords': missing_keywords,
                'strengths': strengths,
                'weaknesses': weaknesses,
                'suggestions': suggestions
            }

        # 4. Skill Gap Analysis
        cand_skills = profile.skills or []
        cand_skills_lower = {s.lower().strip() for s in cand_skills}
        
        # Pull required skills from jobs candidate applied to or are recommended for
        recom_jobs = Job.objects.filter(status=Job.Status.PUBLISHED)[:15]
        job_skill_counts = {}
        for rj in recom_jobs:
            for s in (rj.skills_required or []):
                s_clean = s.strip().lower()
                job_skill_counts[s_clean] = job_skill_counts.get(s_clean, 0) + 1
                
        # Recommended skills are those requested in jobs but not held by candidate
        recommended_list = []
        for s_name, count in sorted(job_skill_counts.items(), key=lambda x: x[1], reverse=True):
            if s_name not in cand_skills_lower:
                priority = 'High' if count >= 3 else 'Medium' if count >= 2 else 'Low'
                recommended_list.append({
                    'name': s_name.capitalize(),
                    'priority': priority,
                    'count': count
                })
                
        recommended_skills = recommended_list[:6]
        missing_skills = [item['name'] for item in recommended_skills]
        
        learning_priority = "Update your skill stack with containerization and cloud hosting tools first."
        if missing_skills:
            learning_priority = f"Learn {missing_skills[0]} next; it is currently requested in multiple matching job listings."

        skill_gap = {
            'current_skills': cand_skills,
            'missing_skills': missing_skills,
            'recommended_skills': recommended_skills,
            'learning_priority': learning_priority
        }

        return Response({
            'recent_activities': recent_activities,
            'recent_applications': recent_applications,
            'resume_analysis': resume_analysis,
            'skill_gap': skill_gap
        })


# ─── AI Interview Preparation & Career Advisor ────────────────────────────────

class AIInterviewPrepView(APIView):
    """
    POST /api/v1/analytics/ai/interview-prep/
    Generates personalized interview questions based on candidate profile.
    """
    permission_classes = [IsCandidate]

    def post(self, request):
        profile = request.user.candidate_profile
        candidate_skills = profile.skills or []
        headline = profile.headline or "Software Engineer"
        
        # Check if OpenAI is enabled
        from decouple import config
        import openai
        api_key = config('OPENAI_API_KEY', default='')
        
        if api_key:
            try:
                client = openai.OpenAI(api_key=api_key)
                system_prompt = """
You are a highly experienced Senior Technical Interviewer.
Your task is to generate personalized interview questions based on the candidate's headline and skills.
You must return a valid JSON object. Do NOT include markdown code blocks.

JSON Response Format:
{
  "technical_questions": [{"question": "...", "focus": "...", "suggested_answer_points": ["..."]}],
  "hr_questions": [{"question": "...", "focus": "...", "suggested_answer_points": ["..."]}],
  "skill_based_questions": [{"question": "...", "focus": "...", "suggested_answer_points": ["..."]}]
}
"""
                user_prompt = f"Candidate Headline: {headline}\nCandidate Skills: {', '.join(candidate_skills)}"
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    max_tokens=1024,
                    temperature=0.4,
                )
                import json
                raw_content = response.choices[0].message.content.strip()
                if raw_content.startswith("```"):
                    raw_content = raw_content.split("```")[1]
                    if raw_content.startswith("json"):
                        raw_content = raw_content[4:]
                return Response(json.loads(raw_content))
            except Exception as e:
                pass

        # Local Fallback Question Bank
        tech_qs = []
        skill_qs = []
        hr_qs = [
            {
                "question": "Tell me about a challenging technical hurdle you solved recently. What was your approach?",
                "focus": "Problem Solving & Technical Ownership",
                "suggested_answer_points": ["State the context clearly", "Explain the technical complication", "Describe your actions & analysis", "Detail the quantitative results"]
            },
            {
                "question": "How do you handle team disagreements regarding architectural design decisions?",
                "focus": "Collaboration & Adaptability",
                "suggested_answer_points": ["Maintain objective, data-driven comparisons", "Facilitate open dialog", "Seek consensus or document trade-offs", "Support final decision wholeheartedly"]
            }
        ]

        # Skill-based questions generator
        skills_lower = [s.lower() for s in candidate_skills]
        if 'react' in skills_lower or 'javascript' in skills_lower:
            tech_qs.append({
                "question": "Explain the difference between functional state updates and standard state updates in React. When would you use functional updates?",
                "focus": "State Management & React Lifecycle",
                "suggested_answer_points": ["Explain queueing in React state updates", "Demonstrate race conditions on consecutive clicks", "Show functional syntax: setState(prev => prev + 1)"]
            })
            skill_qs.append({
                "question": "How do you optimize React component renders and prevent performance degradation?",
                "focus": "Performance Optimization",
                "suggested_answer_points": ["Mention React.memo for component caching", "Explain useMemo and useCallback hooks", "Profile renders using React DevTools Chrome extension"]
            })
            
        if 'python' in skills_lower or 'django' in skills_lower:
            tech_qs.append({
                "question": "How does Django handle database transaction isolation? When would you use select_for_update()?",
                "focus": "Concurrency & Django ORM",
                "suggested_answer_points": ["Discuss ACID guarantees", "Explain race conditions on simultaneous balance updates", "Show locking rows using select_for_update() to guarantee consistency"]
            })
            skill_qs.append({
                "question": "Explain the difference between lists and generators in Python. When is using a generator highly beneficial?",
                "focus": "Python Memory Management",
                "suggested_answer_points": ["Explain list load-in-memory overhead", "Explain lazy evaluation with yield statement", "Show generator syntax to handle large file streams efficiently"]
            })

        # Generic technical questions if skill list is sparse
        if len(tech_qs) < 2:
            tech_qs.append({
                "question": "Describe the differences between REST APIs and GraphQL. What are the key architectural trade-offs?",
                "focus": "System Integration Design",
                "suggested_answer_points": ["REST requires multiple roundtrips and has strict endpoints", "GraphQL allows custom field queries in a single post request", "Detail caching challenges on GraphQL endpoint"]
            })
            skill_qs.append({
                "question": "How would you design a rate-limiting middleware for an API. What caching mechanism would you use?",
                "focus": "System Scalability & Security",
                "suggested_answer_points": ["Define sliding-window or token bucket algorithms", "Use Redis as a centralized memory store for caching counts", "Attach rate limit headers to responses"]
            })

        return Response({
            "technical_questions": tech_qs,
            "hr_questions": hr_qs,
            "skill_based_questions": skill_qs
        })


class AICareerAdvisorView(APIView):
    """
    POST /api/v1/analytics/ai/career-advisor/
    Generates dynamic career roadmap milestones and suggested learning goals.
    """
    permission_classes = [IsCandidate]

    def post(self, request):
        profile = request.user.candidate_profile
        candidate_skills = profile.skills or []
        headline = profile.headline or "Software Engineer"
        
        # Check if OpenAI is enabled
        from decouple import config
        import openai
        api_key = config('OPENAI_API_KEY', default='')
        
        if api_key:
            try:
                client = openai.OpenAI(api_key=api_key)
                system_prompt = """
You are a highly experienced Principal Engineering Director and Career Coach.
Your task is to generate a personalized career roadmap and learning checklist based on the candidate's profile.
You must return a valid JSON object. Do NOT include markdown code blocks.

JSON Response Format:
{
  "roadmap": [{"milestone": "...", "duration": "...", "description": "...", "learning_topics": ["..."]}],
  "suggested_certifications": [{"name": "...", "provider": "...", "relevance": "..."}],
  "next_goals": [{"goal": "...", "timeframe": "...", "action_plan": "..."}]
}
"""
                user_prompt = f"Candidate Current Role: {headline}\nCandidate Current Skills: {', '.join(candidate_skills)}"
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    max_tokens=1024,
                    temperature=0.4,
                )
                import json
                raw_content = response.choices[0].message.content.strip()
                if raw_content.startswith("```"):
                    raw_content = raw_content.split("```")[1]
                    if raw_content.startswith("json"):
                        raw_content = raw_content[4:]
                return Response(json.loads(raw_content))
            except Exception as e:
                pass

        # Fallback Local Advisor Plan
        roadmap = [
            {
                "milestone": "Containerization & Cloud Infrastructure Mastery",
                "duration": "1 - 3 Months",
                "description": "Bridge the gap between application developer and systems engineer by learning modern container orchestration.",
                "learning_topics": ["Docker foundations", "Kubernetes cluster configuration", "CI/CD automation pipelines (GitHub Actions)"]
            },
            {
                "milestone": "System Architecture & High Scalability Design",
                "duration": "4 - 6 Months",
                "description": "Shift focus to large-scale system designs, distributed messaging databases, and system performance caching.",
                "learning_topics": ["Redis Caching strategies", "Message queues (RabbitMQ, Kafka)", "Database indexing and sharding"]
            }
        ]
        
        certs = [
            {
                "name": "AWS Certified Developer - Associate",
                "provider": "Amazon Web Services",
                "relevance": "Validates hands-on knowledge in developing cloud services and deployment automation."
            },
            {
                "name": "Certified Kubernetes Application Developer (CKAD)",
                "provider": "The Linux Foundation",
                "relevance": "Demonstrates the ability to design, build, and deploy cloud-native applications on clusters."
            }
        ]
        
        goals = [
            {
                "goal": "Build a multi-container Docker application",
                "timeframe": "Next 2 Weeks",
                "action_plan": "Dockerize the current Django + Postgres + Redis setup and run via docker-compose locally."
            },
            {
                "goal": "Contribute to open-source or system documentation",
                "timeframe": "Next 1 Month",
                "action_plan": "Strengthen technical documentation skills by drafting a detailed architecture design of a microservices project."
            }
        ]
        
        return Response({
            "roadmap": roadmap,
            "suggested_certifications": certs,
            "next_goals": goals
        })


# ─── Recruiter Candidate Ranking View ─────────────────────────────────────────

class CandidateRankingView(APIView):
    """
    GET /api/v1/analytics/recruiter/candidate-ranking/
    Lists candidates sorted by matching scores and experience filters.
    """
    permission_classes = [IsRecruiter]

    def get(self, request):
        from accounts.models import CandidateProfile
        profiles = CandidateProfile.objects.select_related('user').prefetch_related('education', 'experience')
        
        skill_filter = request.query_params.get('skill', '').strip()
        location_filter = request.query_params.get('location', '').strip()
        search_query = request.query_params.get('search', '').strip()
        
        if skill_filter:
            profiles = profiles.filter(skills__icontains=skill_filter)
        if location_filter:
            profiles = profiles.filter(location__icontains=location_filter)
        if search_query:
            profiles = profiles.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(headline__icontains=search_query)
            )

        ranked = []
        for p in profiles:
            exp_count = p.experience.count()
            primary_resume = p.resumes.filter(is_primary=True).first()
            if not primary_resume:
                primary_resume = p.resumes.first()
                
            recruiter_jobs = Job.objects.filter(recruiter=request.user.recruiter_profile)
            max_match = 0
            for j in recruiter_jobs:
                from .recommendation_engine import compute_job_score
                max_match = max(max_match, compute_job_score(p, j))
            
            ranked.append({
                'id': str(p.id),
                'first_name': p.user.first_name,
                'last_name': p.user.last_name,
                'email': p.user.email,
                'phone': p.phone_number,
                'location': p.location,
                'headline': p.headline,
                'skills': p.skills,
                'experience_years': exp_count * 2,
                'primary_resume_name': primary_resume.file_name if primary_resume else None,
                'primary_resume_id': str(primary_resume.id) if primary_resume else None,
                'match_score': float(max_match) if max_match > 0 else 50.0,
                'completion_pct': p.completion_percentage
            })
            
        ranked.sort(key=lambda x: x['match_score'], reverse=True)
        return Response(ranked)

