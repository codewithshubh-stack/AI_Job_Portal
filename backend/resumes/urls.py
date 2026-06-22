from django.urls import path
from .views import ResumeListCreateView, ResumeDetailView, ResumeMakePrimaryView

urlpatterns = [
    path('', ResumeListCreateView.as_view(), name='resume_list_create'),
    path('<uuid:pk>/', ResumeDetailView.as_view(), name='resume_detail'),
    path('<uuid:pk>/make-primary/', ResumeMakePrimaryView.as_view(), name='resume_make_primary'),
]
