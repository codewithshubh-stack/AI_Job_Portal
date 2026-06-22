from django.urls import path
from .views import CompanyListCreateView, CompanyDetailView, RecruiterProfileView, CompanyTeamView

urlpatterns = [
    path('profile/', RecruiterProfileView.as_view(), name='recruiter_profile'),
    path('companies/', CompanyListCreateView.as_view(), name='company_list_create'),
    path('companies/<slug:slug>/', CompanyDetailView.as_view(), name='company_detail'),
    path('team/', CompanyTeamView.as_view(), name='recruiter_team'),
]
