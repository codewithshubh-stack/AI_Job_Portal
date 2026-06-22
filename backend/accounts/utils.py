from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from decouple import config

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')


def send_verification_email(user):
    """Generates verification token and sends email containing verification link."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    
    # We point to frontend route, which will capture parameters and POST to backend verification endpoint
    verification_link = f"{FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    
    subject = "Verify Your Email Address - AI Job Portal"
    message = (
        f"Hi {user.first_name},\n\n"
        f"Thank you for registering at our AI-Powered Job Portal. "
        f"Please click the link below to verify your email address and activate your account:\n\n"
        f"{verification_link}\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Best regards,\nAI Job Portal Team"
    )
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user):
    """Generates password reset token and sends email containing reset link."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    
    reset_link = f"{FRONTEND_URL}/reset-password?uid={uid}&token={token}"
    
    subject = "Reset Your Password - AI Job Portal"
    message = (
        f"Hi {user.first_name},\n\n"
        f"We received a request to reset the password for your account associated with {user.email}.\n"
        f"Please click the link below to set a new password:\n\n"
        f"{reset_link}\n\n"
        f"If you did not request this, please ignore this email and your password will remain unchanged.\n\n"
        f"Best regards,\nAI Job Portal Team"
    )
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
