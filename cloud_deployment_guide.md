# Cloud Deployment Guide: Render, Railway, & Vercel

This guide outlines how to deploy the **TalentAI** stack on free or low-cost cloud platforms (specifically **Render** and **Railway**) using pre-configured blueprints and manual setups.

---

## Option 1: One-Click Deployment using Render Blueprints

Render supports automated infrastructure-as-code deployment using the `render.yaml` file in this repository.

### Steps to Deploy:
1. Push this codebase to your own GitHub account.
2. Sign in to your account on [Render Dashboard](https://dashboard.render.com/).
3. Navigate to **Blueprints** (in the top menu) and click **New Blueprint Instance**.
4. Connect your GitHub repository containing the TalentAI code.
5. Render will automatically parse the `render.yaml` blueprint and prepare:
   * A **PostgreSQL Database** (`talentai-db`)
   * A **Python Django Web Service** (`talentai-backend`)
   * A **Static Frontend Website** (`talentai-frontend`)
6. Review the settings and click **Apply**.
7. Render will build and deploy the database, backend, and frontend sequentially. The frontend will be automatically configured with the backend API URL.

---

## Option 2: Deploying Separately on Railway

If you prefer using **Railway** (or want manual separation), you can deploy the backend, database, and frontend independently.

### Step 1: Provision the PostgreSQL Database
1. Go to the [Railway Dashboard](https://railway.app/).
2. Click **New Project** > **Provision PostgreSQL**.
3. Under PostgreSQL variables, copy the connection details (specifically `DATABASE_URL` or individual host, user, port, and password fields).

### Step 2: Deploy the Django Backend
1. Click **New** > **GitHub Repo** and connect your repository.
2. Under service settings, set:
   * **Build Command**: `cd backend && pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --no-input`
   * **Start Command**: `cd backend && gunicorn core.wsgi:application`
3. Add the following environment variables:
   * `SECRET_KEY` = *[Generate a secure random key]*
   * `DEBUG` = `False`
   * `ALLOWED_HOSTS` = `*` or your Railway service subdomain
   * `DATABASE_URL` = *[Link to the PostgreSQL service database connection string]*
   * `CORS_ALLOWED_ORIGINS` = *[Link to the frontend service URL]*
   * `OPENAI_API_KEY` = *[Your OpenAI key (optional)]*
4. Railway will automatically build and assign a public subdomain (e.g., `https://backend-production.up.railway.app`).

### Step 3: Deploy the React Frontend (Railway or Vercel)
You can deploy the frontend on Railway as a static service or on Vercel for fast loading.

#### Deployment on Vercel:
1. Sign in to [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
2. Select your GitHub repository.
3. Configure the build parameters:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Under Environment Variables, add:
   * `VITE_API_URL` = `https://<your-backend-railway-url>.up.railway.app/api/v1`
5. Click **Deploy**.

---

## Verification
Once services are running, verify by:
1. Browsing the frontend URL.
2. Registering/Logging in as a candidate to check if backend connectivity is active.
3. Accessing the Job board and triggering the **Global Job Sync Indexer** to confirm external scrapers/fallbacks work on the live server.
