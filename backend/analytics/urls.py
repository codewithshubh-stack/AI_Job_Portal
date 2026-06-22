from django.urls import path
from .views import (
    CandidateDashboardView,
    RecommendationListView,
    RecommendationRefreshView,
    RecommendationDismissView,
    RecruiterDashboardView,
    ResumeAnalyzerView,
    CandidateDashboardDetailsView,
    AIInterviewPrepView,
    AICareerAdvisorView,
    CandidateRankingView,
)

urlpatterns = [
    path('candidate/dashboard/', CandidateDashboardView.as_view(), name='candidate_dashboard'),
    path('candidate/dashboard-details/', CandidateDashboardDetailsView.as_view(), name='candidate_dashboard_details'),
    path('candidate/recommendations/', RecommendationListView.as_view(), name='recommendations'),
    path('candidate/recommendations/refresh/', RecommendationRefreshView.as_view(), name='recommendations_refresh'),
    path('candidate/recommendations/<uuid:pk>/dismiss/', RecommendationDismissView.as_view(), name='recommendation_dismiss'),
    path('recruiter/dashboard/', RecruiterDashboardView.as_view(), name='recruiter_dashboard'),
    path('recruiter/candidate-ranking/', CandidateRankingView.as_view(), name='candidate_ranking'),
    path('ai/analyze-resume/', ResumeAnalyzerView.as_view(), name='ai_analyze_resume'),
    path('ai/interview-prep/', AIInterviewPrepView.as_view(), name='ai_interview_prep'),
    path('ai/career-advisor/', AICareerAdvisorView.as_view(), name='ai_career_advisor'),
]

