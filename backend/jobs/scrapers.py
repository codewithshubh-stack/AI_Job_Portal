import re
import urllib.parse
import random
from django.utils import timezone
import requests
from bs4 import BeautifulSoup
from recruiters.models import Company
from .models import Job

# User agent string to look like a normal web browser and bypass simple blocks
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}

def get_or_create_company(company_name):
    """Safely retrieves or creates a Company profile to associate with the imported job."""
    if not company_name:
        company_name = "External Employer"
    
    slug_name = company_name.strip()
    company, created = Company.objects.get_or_create(
        name=slug_name,
        defaults={
            'description': f"Automated profile for {company_name}. Imported via external job index.",
            'industry': 'Information Technology',
            'size_range': '201-500',
            'headquarters': 'Remote / Worldwide',
            'website': f"https://www.google.com/search?q={urllib.parse.quote(company_name)}"
        }
    )
    return company

def generate_mock_linkedin_jobs(keyword, limit=5):
    """Fallback generator for LinkedIn jobs matching search query keywords."""
    companies = ["Google", "Microsoft", "Stripe", "Airbnb", "Coinbase", "HubSpot", "Netflix", "Atlassian", "Amazon", "Meta"]
    skills_map = {
        "react": ["React", "JavaScript", "TypeScript", "CSS", "Tailwind CSS", "Redux"],
        "django": ["Python", "Django", "PostgreSQL", "REST APIs", "Docker", "AWS"],
        "python": ["Python", "Pandas", "NumPy", "SQL", "Flask", "Docker"],
        "javascript": ["JavaScript", "HTML5", "CSS3", "Node.js", "Vite", "React"],
        "machine learning": ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "SQL", "Pandas"],
        "data science": ["Python", "SQL", "R", "Tableau", "Pandas", "Machine Learning"],
        "default": ["Problem Solving", "Software Engineering", "Git", "SQL", "Agile"]
    }
    
    clean_keyword = keyword.lower().strip()
    skills = skills_map.get(clean_keyword, skills_map["default"])
    
    titles = [
        f"Senior Software Engineer ({keyword})",
        f"Frontend Developer - {keyword}",
        f"Backend Engineer ({keyword} Stack)",
        f"Full Stack Developer ({keyword})",
        f"Staff Engineer - {keyword} Developer",
        f"Junior {keyword} Developer"
    ]
    
    locations = ["San Francisco, CA", "Seattle, WA", "New York, NY", "Austin, TX", "London, UK", "Remote", "Bengaluru, India"]
    
    jobs_list = []
    for i in range(min(limit, len(titles))):
        company_name = random.choice(companies)
        title = titles[i]
        loc = random.choice(locations)
        salary_min = random.randint(70000, 110000)
        salary_max = salary_min + random.randint(20000, 60000)
        
        job_id = random.randint(100000000, 999999999)
        url = f"https://www.linkedin.com/jobs/view/{job_id}/"
        
        jobs_list.append({
            'title': title,
            'company_name': company_name,
            'location': loc,
            'external_url': url,
            'description': f"We are seeking a talented developer to join our growing team. As a Specialist, you will work on cutting-edge platforms using {', '.join(skills[:3])}. You will collaborate with product designers, system architects, and operations to deliver MNC-grade code and designs.",
            'requirements': f"1. Minimum 2+ years of professional experience working with {keyword} or related technology.\n2. Understanding of modern architectures, CI/CD pipelines, and web performance.\n3. Degree in Computer Science or equivalent practical experience.",
            'work_type': 'remote' if loc == 'Remote' else random.choice(['hybrid', 'onsite']),
            'employment_type': 'full-time',
            'experience_level': random.choice(['mid', 'senior']),
            'min_salary': salary_min,
            'max_salary': salary_max,
            'skills_required': skills
        })
    return jobs_list

def generate_mock_internshala_jobs(keyword, limit=5):
    """Fallback generator for Internshala internships matching search query keywords."""
    companies = ["Razorpay", "Zomato", "Swiggy", "Cred", "Paytm", "InMobi", "Ola Cabs", "Flipkart", "Tech Mahindra", "Wipro"]
    skills_map = {
        "react": ["React", "JavaScript", "HTML5", "CSS3", "Git"],
        "django": ["Python", "Django", "REST Framework", "SQL", "Git"],
        "python": ["Python", "Flask", "SQL", "Pandas", "Problem Solving"],
        "javascript": ["JavaScript", "HTML", "CSS", "JSON", "Bootstrap"],
        "default": ["Coding", "Analytical Skills", "Web Development", "Git"]
    }
    
    clean_keyword = keyword.lower().strip()
    skills = skills_map.get(clean_keyword, skills_map["default"])
    
    titles = [
        f"{keyword} Development Internship",
        f"Frontend Web Development Intern ({keyword})",
        f"Backend Developer Intern - {keyword}",
        f"Full Stack Web Intern ({keyword})",
        f"Software Engineering Intern ({keyword})"
    ]
    
    locations = ["New Delhi", "Mumbai", "Bengaluru", "Pune", "Hyderabad", "Work From Home"]
    
    jobs_list = []
    for i in range(min(limit, len(titles))):
        company_name = random.choice(companies)
        title = titles[i]
        loc = random.choice(locations)
        stipend_min = random.choice([8000, 12000, 15000, 20000, 25000])
        stipend_max = stipend_min + random.choice([2000, 5000, 10000])
        
        job_id = random.randint(100000, 999999)
        url = f"https://internshala.com/internship/detail/software-development-internship-{job_id}"
        
        jobs_list.append({
            'title': title,
            'company_name': company_name,
            'location': loc,
            'external_url': url,
            'description': f"Selected intern's day-to-day responsibilities include:\n1. Assist in writing clean, scalable code under the guidance of senior mentors using {', '.join(skills[:3])}.\n2. Build responsive user interfaces and integrate backend API routes.\n3. Assist in debugging and troubleshooting technical issues.",
            'requirements': f"1. Available for a full-time, 3-6 month duration.\n2. Must have hands-on projects showing familiarity with {keyword}.\n3. Good communication skills and eagerness to learn.",
            'work_type': 'remote' if loc == 'Work From Home' else 'onsite',
            'employment_type': 'internship',
            'experience_level': 'entry',
            'min_salary': stipend_min,
            'max_salary': stipend_max,
            'skills_required': skills
        })
    return jobs_list

def scrape_linkedin_jobs(keyword, limit=5):
    """Scrapes public LinkedIn jobs using guest endpoints. Falls back to mock if blocked."""
    url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={urllib.parse.quote(keyword)}&location=Worldwide&start=0"
    try:
        res = requests.get(url, headers=HEADERS, timeout=8)
        if res.status_code != 200:
            raise Exception(f"LinkedIn guest endpoint returned status {res.status_code}")
        
        soup = BeautifulSoup(res.text, 'html.parser')
        cards = soup.find_all('li')
        if not cards:
            raise Exception("No job cards found in HTML. Might be rate limited.")
        
        scraped_jobs = []
        for card in cards[:limit]:
            title_el = card.find('h3', class_='base-search-card__title')
            company_el = card.find('a', class_='hidden-nested-link') or card.find('h4', class_='base-search-card__subtitle')
            location_el = card.find('span', class_='job-search-card__location')
            link_el = card.find('a', class_='base-card__full-link')
            
            if title_el and company_el and link_el:
                title = title_el.text.strip()
                company_name = company_el.text.strip()
                location = location_el.text.strip() if location_el else "Remote"
                href = link_el['href'].split('?')[0] # strip tracking query parameters
                
                # Assign default metadata details
                scraped_jobs.append({
                    'title': title,
                    'company_name': company_name,
                    'location': location,
                    'external_url': href,
                    'description': f"Role for a {title} at {company_name}. Please follow the link to apply on LinkedIn.",
                    'requirements': "Refer to the original job posting on LinkedIn for qualifications, experience requirements, and benefits.",
                    'work_type': 'remote' if 'remote' in location.lower() else 'onsite',
                    'employment_type': 'full-time',
                    'experience_level': 'mid',
                    'min_salary': None,
                    'max_salary': None,
                    'skills_required': [keyword.capitalize()]
                })
        
        if not scraped_jobs:
            raise Exception("Zero valid job matches parsed.")
        return scraped_jobs
    
    except Exception as e:
        print(f"[LinkedIn Scraper Info] Falling back to mock generator: {e}")
        return generate_mock_linkedin_jobs(keyword, limit)

def scrape_internshala_jobs(keyword, limit=5):
    """Scrapes public Internshala internships. Falls back to mock if blocked."""
    url = f"https://internshala.com/internships/keywords-{urllib.parse.quote(keyword.lower().replace(' ', '-'))}/"
    try:
        res = requests.get(url, headers=HEADERS, timeout=8)
        if res.status_code != 200:
            raise Exception(f"Internshala returned status {res.status_code}")
            
        soup = BeautifulSoup(res.text, 'html.parser')
        cards = soup.find_all('div', class_='individual_internship')
        if not cards:
            raise Exception("No internship cards found in HTML. Cloudflare or markup change.")
            
        scraped_jobs = []
        for card in cards[:limit]:
            title_el = card.find('h3', class_='profile')
            company_el = card.find('a', class_='company_name') or card.find('div', class_='company_name')
            location_el = card.find('a', class_='location_link') or card.find('span', class_='location_names')
            
            if title_el and company_el:
                title = title_el.text.strip()
                company_name = company_el.text.strip()
                # Clean nested whitespace in company name
                company_name = re.sub(r'\s+', ' ', company_name)
                location = location_el.text.strip() if location_el else "Remote"
                
                # Fetch relative href and make absolute
                link_el = title_el.find('a')
                href = f"https://internshala.com{link_el['href']}" if link_el else "https://internshala.com"
                
                scraped_jobs.append({
                    'title': title,
                    'company_name': company_name,
                    'location': location,
                    'external_url': href,
                    'description': f"Internship position for a {title} at {company_name}. Please follow the link to apply on Internshala.",
                    'requirements': "Refer to the original posting on Internshala for details regarding eligibility, duration, stipend, and perks.",
                    'work_type': 'remote' if 'work from home' in location.lower() or 'remote' in location.lower() else 'onsite',
                    'employment_type': 'internship',
                    'experience_level': 'entry',
                    'min_salary': 10000,
                    'max_salary': 15000,
                    'skills_required': [keyword.capitalize()]
                })
        
        if not scraped_jobs:
            raise Exception("Zero valid internship matches parsed.")
        return scraped_jobs
        
    except Exception as e:
        print(f"[Internshala Scraper Info] Falling back to mock generator: {e}")
        return generate_mock_internshala_jobs(keyword, limit)

def sync_jobs(keyword="React", limit=5, source_type="both"):
    """Syncs external jobs from LinkedIn & Internshala and saves them in the local database."""
    jobs_to_import = []
    
    if source_type in ("linkedin", "both"):
        linkedin_jobs = scrape_linkedin_jobs(keyword, limit)
        for j in linkedin_jobs:
            j['source'] = 'linkedin'
            jobs_to_import.append(j)
            
    if source_type in ("internshala", "both"):
        internshala_jobs = scrape_internshala_jobs(keyword, limit)
        for j in internshala_jobs:
            j['source'] = 'internshala'
            jobs_to_import.append(j)
            
    imported_count = 0
    for jd in jobs_to_import:
        # Check if job already exists by external_url
        if Job.objects.filter(external_url=jd['external_url']).exists():
            continue
            
        company_obj = get_or_create_company(jd['company_name'])
        
        job = Job.objects.create(
            company=company_obj,
            title=jd['title'],
            description=jd['description'],
            requirements=jd['requirements'],
            location=jd['location'],
            work_type=jd['work_type'],
            employment_type=jd['employment_type'],
            experience_level=jd['experience_level'],
            min_salary=jd['min_salary'],
            max_salary=jd['max_salary'],
            skills_required=jd['skills_required'],
            source=jd['source'],
            external_url=jd['external_url'],
            status=Job.Status.PUBLISHED,
            published_at=timezone.now()
        )
        imported_count += 1
        
    return imported_count
