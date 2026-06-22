from django.urls import path
from .views import JobListCreateView, JobDetailView, RecruiterJobsView, SyncExternalJobsView

urlpatterns = [
    path('', JobListCreateView.as_view(), name='job_list_create'),
    path('my-jobs/', RecruiterJobsView.as_view(), name='recruiter_jobs'),
    path('sync-external/', SyncExternalJobsView.as_view(), name='sync_external_jobs'),
    path('<uuid:pk>/', JobDetailView.as_view(), name='job_detail'),
]
