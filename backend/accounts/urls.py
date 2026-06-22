from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, VerifyEmailView, LogoutView,
    PasswordResetRequestView, PasswordResetConfirmView, ProfileView,
    EducationListCreateView, EducationDetailView,
    ExperienceListCreateView, ExperienceDetailView,
    NotificationListView, NotificationReadView,
)

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),

    # Education (Candidate only)
    path('education/', EducationListCreateView.as_view(), name='education_list_create'),
    path('education/<uuid:pk>/', EducationDetailView.as_view(), name='education_detail'),

    # Experience (Candidate only)
    path('experience/', ExperienceListCreateView.as_view(), name='experience_list_create'),
    path('experience/<uuid:pk>/', ExperienceDetailView.as_view(), name='experience_detail'),

    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/<uuid:pk>/read/', NotificationReadView.as_view(), name='notification_read'),
]

