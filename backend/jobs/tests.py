from django.test import TestCase
from django.urls import reverse
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APITestCase

from recruiters.models import Company
from jobs.models import Job
from jobs.scrapers import get_or_create_company, sync_jobs

class JobScraperTests(TestCase):
    """Test suite for scraping and database sync logic."""

    def test_get_or_create_company(self):
        """Verifies company lookup/creation returns correct instances and defaults."""
        company = get_or_create_company("Stripe")
        self.assertEqual(company.name, "Stripe")
        self.assertEqual(company.industry, "Information Technology")
        
        # Second retrieve should return the same object
        company2 = get_or_create_company("Stripe")
        self.assertEqual(company.id, company2.id)

    @patch('jobs.scrapers.scrape_linkedin_jobs')
    @patch('jobs.scrapers.scrape_internshala_jobs')
    def test_sync_jobs_saves_correctly(self, mock_scrape_internshala, mock_scrape_linkedin):
        """Verifies sync_jobs correctly parses, structures, and creates Job and Company entities."""
        mock_scrape_linkedin.return_value = [{
            'title': 'React Engineer',
            'company_name': 'Vercel',
            'location': 'Remote',
            'external_url': 'https://linkedin.com/jobs/view/112233',
            'description': 'Great React role',
            'requirements': 'React knowledge',
            'work_type': 'remote',
            'employment_type': 'full-time',
            'experience_level': 'mid',
            'min_salary': 80000,
            'max_salary': 120000,
            'skills_required': ['React', 'JavaScript']
        }]
        mock_scrape_internshala.return_value = [{
            'title': 'Frontend Intern',
            'company_name': 'Razorpay',
            'location': 'Bengaluru',
            'external_url': 'https://internshala.com/internship/detail/445566',
            'description': 'Help build products',
            'requirements': 'HTML/CSS/JS',
            'work_type': 'onsite',
            'employment_type': 'internship',
            'experience_level': 'entry',
            'min_salary': 15000,
            'max_salary': 20000,
            'skills_required': ['React', 'CSS']
        }]

        # Sync both sources
        count = sync_jobs(keyword="React", limit=1, source_type="both")
        self.assertEqual(count, 2)

        # Check in DB
        job_li = Job.objects.get(source='linkedin')
        self.assertEqual(job_li.title, 'React Engineer')
        self.assertEqual(job_li.company.name, 'Vercel')
        self.assertEqual(job_li.external_url, 'https://linkedin.com/jobs/view/112233')

        job_is = Job.objects.get(source='internshala')
        self.assertEqual(job_is.title, 'Frontend Intern')
        self.assertEqual(job_is.company.name, 'Razorpay')
        self.assertEqual(job_is.external_url, 'https://internshala.com/internship/detail/445566')

        # Syncing again should skip duplicates and return 0 imported
        count_dup = sync_jobs(keyword="React", limit=1, source_type="both")
        self.assertEqual(count_dup, 0)


class SyncExternalJobsAPITests(APITestCase):
    """Test suite for the API endpoint views relating to syncing jobs."""

    @patch('jobs.views.sync_jobs')
    def test_sync_external_endpoint(self, mock_sync_jobs):
        """Verifies POST /api/v1/jobs/sync-external/ parses inputs and returns success response."""
        mock_sync_jobs.return_value = 4
        url = reverse('sync_external_jobs')
        
        response = self.client.post(url, {
            'search': 'Django',
            'limit': 2,
            'source': 'both'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['imported_count'], 4)
        self.assertIn("Successfully synced jobs", response.data['detail'])
        mock_sync_jobs.assert_called_once_with(keyword='Django', limit=2, source_type='both')
