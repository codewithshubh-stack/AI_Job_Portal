from django.urls import path
from .views import (
    ApplicationListCreateView,
    ApplicationDetailView,
    ApplicationStatusUpdateView,
    InterviewListCreateView,
    InterviewDetailView,
)

urlpatterns = [
    path('', ApplicationListCreateView.as_view(), name='application_list_create'),
    path('<uuid:pk>/', ApplicationDetailView.as_view(), name='application_detail'),
    path('<uuid:pk>/status/', ApplicationStatusUpdateView.as_view(), name='application_status_update'),
    path('<uuid:pk>/withdraw/', ApplicationStatusUpdateView.as_view(), {'action': 'withdraw'}, name='application_withdraw'),
    path('interviews/', InterviewListCreateView.as_view(), name='interview_list_create'),
    path('interviews/<uuid:pk>/', InterviewDetailView.as_view(), name='interview_detail'),
]
