# TalentAI - AI-Powered Job Portal

🔗 **Live Demo Link**: [https://ai-job-portal-faghmgy38-shubh19.vercel.app](https://ai-job-portal-faghmgy38-shubh19.vercel.app)

TalentAI is a production-grade, MNC-level portfolio project built using **Django REST Framework (DRF)**, **React (Vite)**, **PostgreSQL**, **JWT Authentication**, and **Tailwind CSS**. It incorporates advanced AI features, real-time in-app notifications, a three-way theme selector, candidate portfolio scorecards, and a resilient external job board indexer.

---

## 🚀 Key Features

### 💻 For Candidates
* **ATS Scorecard & AI Resume Auditor**: Upload a PDF resume and audit it against job descriptions to receive an ATS score, strengths/weaknesses summary, and revision suggestions.
* **Skill Gap Analysis**: Compares candidate skillsets against recommended job requirements to prioritize learning goals.
* **AI Interview Prep Coach**: Practice mock interviews (technical, HR, or custom role questions) with an AI workspace that scores answer quality.
* **AI Career Advisor**: Generates interactive career advisor roadmaps and certifications recommendations based on experience.
* **Activity Logs**: Track resume uploads, job submissions, and status changes in a centralized feed.

### 💼 For Recruiters
* **Candidate Match Rankings**: Uses a background ranking index that scores and matches applicants for job postings based on skills gap and experience.
* **Hiring Pipeline**: A Kanban-style interface tracking candidate stages (Applied, Review, Shortlisted, Interview, Offered, Rejected, Hired).
* **Interview Scheduler**: Directly schedule interviews from the pipeline screen.
* **Company Branding**: Fully manageable profile for company branding, industry tagging, and details.

### 🌟 Advanced Upgrades
* **3-Mode Theme Switcher**: Toggle between **Light**, **Dark**, and **System** modes. Automatically listens to system color preferences (`prefers-color-scheme`).
* **Real-time Notifications**: Triggers in-app alerts on status updates, interview schedules, and profile reviews.
* **LinkedIn & Internshala Sync Indexer**: On-demand search and sync parser that imports job listings from external boards, with a resilient local mock-data fallback when blocked.

---

## 🛠️ Architecture & Technology Stack

* **Backend**: Django 5.0, Django REST Framework, SimpleJWT (Access/Refresh Tokens).
* **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide React Icons, Chart.js.
* **Database**: SQLite (Development) / PostgreSQL (Production).
* **Deployment & Containerization**: Docker, Docker Compose, Nginx, Gunicorn.

---

## 📦 Getting Started

### Prerequisites
* Python 3.10+
* Node.js 18+

### 1. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. (Optional) Sync initial external jobs from LinkedIn & Internshala:
   ```bash
   python manage.py import_external_jobs --keyword React --limit 5
   ```
7. Start the backend development server:
   ```bash
   python manage.py runserver
   ```
   *The API will run at `http://127.0.0.1:8000/`.*

### 2. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The client will run at `http://localhost:5173/`.*

---

## 🧪 Testing

Run backend test cases covering account views, resume parsing, job boards, and scraper syncing:
```bash
cd backend
python manage.py test
```

---

## 🐳 Production & AWS Deployment

The project is container-ready and pre-configured for production hosting on AWS EC2 using a reverse-proxy setup.

* **Docker Compose**: Orchestrates Django (Gunicorn), Nginx, and PostgreSQL.
* **Nginx config**: Built-in configurations serving client files and reverse-proxying API calls to Gunicorn.
* **CI/CD Pipeline**: GitHub Actions workflows testing code and pushing container builds to AWS ECR.

Refer to the detailed [deployment guide](deployment_guide.md) for step-by-step staging configurations.
