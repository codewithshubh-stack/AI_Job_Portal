from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationTests(APITestCase):
    
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.verify_email_url = reverse('verify_email')
        self.logout_url = reverse('logout')
        self.profile_url = reverse('profile')
        self.password_reset_url = reverse('password_reset_request')
        self.password_reset_confirm_url = reverse('password_reset_confirm')
        
        self.candidate_data = {
            "email": "candidate@example.com",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "first_name": "John",
            "last_name": "Doe",
            "role": "candidate"
        }
        
        self.recruiter_data = {
            "email": "recruiter@example.com",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "first_name": "Jane",
            "last_name": "Smith",
            "role": "recruiter"
        }

    def test_candidate_registration_flow(self):
        """Test candidate registration creates active user and profile."""
        response = self.client.post(self.register_url, self.candidate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "candidate@example.com")
        self.assertEqual(response.data["user"]["role"], "candidate")
        
        user = User.objects.get(email="candidate@example.com")
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_verified)
        self.assertIsNotNone(user.candidate_profile)

    def test_recruiter_registration_flow(self):
        """Test recruiter registration creates active user and profile."""
        response = self.client.post(self.register_url, self.recruiter_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], "recruiter")
        
        user = User.objects.get(email="recruiter@example.com")
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_verified)
        self.assertIsNotNone(user.recruiter_profile)

    def test_registration_password_mismatch(self):
        """Test registration fails with mismatched passwords."""
        data = self.candidate_data.copy()
        data["password_confirm"] = "DifferentPassword123!"
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_email_verification_success(self):
        """Test account activation upon email verification."""
        # 1. Register candidate
        self.client.post(self.register_url, self.candidate_data, format='json')
        user = User.objects.get(email="candidate@example.com")
        # Reset to unverified first to test verification flow
        user.is_active = False
        user.is_verified = False
        user.save()
        
        # 2. Generate tokens manually to simulate email link
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # 3. Post to verify endpoint
        verify_data = {"uid": uid, "token": token}
        response = self.client.post(self.verify_email_url, verify_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_verified)

    def test_email_verification_invalid_token(self):
        """Test verification fails with invalid tokens."""
        self.client.post(self.register_url, self.candidate_data, format='json')
        uid = urlsafe_base64_encode(force_bytes(9999))  # invalid uid
        verify_data = {"uid": uid, "token": "invalid-token"}
        response = self.client.post(self.verify_email_url, verify_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_unverified_user_fails(self):
        """Test unverified users cannot login."""
        self.client.post(self.register_url, self.candidate_data, format='json')
        user = User.objects.get(email=self.candidate_data["email"])
        user.is_verified = False
        user.save()

        login_data = {
            "email": self.candidate_data["email"],
            "password": self.candidate_data["password"]
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)
        self.assertIn("not verified", response.data["detail"].lower())


    def test_login_verified_user_success(self):
        """Test verified users can login and receive JWT tokens."""
        # Register and verify
        self.client.post(self.register_url, self.candidate_data, format='json')
        user = User.objects.get(email="candidate@example.com")
        user.is_active = True
        user.is_verified = True
        user.save()
        
        login_data = {
            "email": self.candidate_data["email"],
            "password": self.candidate_data["password"]
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "candidate@example.com")

    def test_logout_blacklists_token(self):
        """Test logging out blacklists the refresh token."""
        # Setup active user
        self.client.post(self.register_url, self.candidate_data, format='json')
        user = User.objects.get(email="candidate@example.com")
        user.is_active = True
        user.is_verified = True
        user.save()
        
        # Login to get tokens
        login_response = self.client.post(self.login_url, {
            "email": self.candidate_data["email"],
            "password": self.candidate_data["password"]
        }, format='json')
        access_token = login_response.data["access"]
        refresh_token = login_response.data["refresh"]
        
        # Logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_response = self.client.post(self.logout_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(logout_response.status_code, status.HTTP_205_RESET_CONTENT)

    def test_profile_retrieval_and_update(self):
        """Test retrieving and updating profile attributes."""
        self.client.post(self.register_url, self.candidate_data, format='json')
        user = User.objects.get(email="candidate@example.com")
        user.is_active = True
        user.is_verified = True
        user.save()
        
        login_response = self.client.post(self.login_url, {
            "email": self.candidate_data["email"],
            "password": self.candidate_data["password"]
        }, format='json')
        access_token = login_response.data["access"]
        
        # Get profile
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        profile_response = self.client.get(self.profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data["first_name"], "John")
        
        # Update profile
        update_data = {
            "first_name": "Johnny",
            "location": "San Francisco, CA",
            "skills": ["Python", "Django", "React"]
        }
        update_response = self.client.patch(self.profile_url, update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["first_name"], "Johnny")
        self.assertEqual(update_response.data["profile"]["location"], "San Francisco, CA")
        self.assertIn("Python", update_response.data["profile"]["skills"])

    def test_password_reset_flow(self):
        """Test password reset request and confirmation."""
        # 1. Register and verify
        self.client.post(self.register_url, self.candidate_data, format='json')
        user = User.objects.get(email="candidate@example.com")
        user.is_active = True
        user.is_verified = True
        user.save()
        
        # 2. Request reset link
        reset_req_response = self.client.post(self.password_reset_url, {"email": user.email}, format='json')
        self.assertEqual(reset_req_response.status_code, status.HTTP_200_OK)
        
        # 3. Simulate reset token validation
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # 4. Confirm new password
        confirm_data = {
            "uid": uid,
            "token": token,
            "password": "NewSecurePassword123!",
            "password_confirm": "NewSecurePassword123!"
        }
        confirm_response = self.client.post(self.password_reset_confirm_url, confirm_data, format='json')
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        
        # 5. Try login with new password
        login_response = self.client.post(self.login_url, {
            "email": user.email,
            "password": "NewSecurePassword123!"
        }, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
