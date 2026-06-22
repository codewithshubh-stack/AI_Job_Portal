from rest_framework.permissions import BasePermission


class IsRecruiter(BasePermission):
    """Allows access only to users with the 'recruiter' role."""
    message = "Access denied. Only Recruiters can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'recruiter'
        )


class IsCompanyAdmin(BasePermission):
    """Allows modification only to the recruiter marked as company admin."""
    message = "Access denied. Only Company Admins can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'recruiter'
        )

    def has_object_permission(self, request, view, obj):
        # Safe methods (GET) are allowed for all recruiters
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        recruiter_profile = getattr(request.user, 'recruiter_profile', None)
        if not recruiter_profile:
            return False
        return recruiter_profile.is_admin and recruiter_profile.company == obj


class IsCandidate(BasePermission):
    """Allows access only to users with the 'candidate' role."""
    message = "Access denied. Only Candidates can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'candidate'
        )
