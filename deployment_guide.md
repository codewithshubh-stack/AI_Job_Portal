# AWS Production Deployment Guide

This guide details the step-by-step process of deploying the AI-Powered Job Portal on an AWS EC2 instance running Ubuntu 22.04 LTS using Docker, Nginx, and GitHub Actions CI/CD.

---

## 1. Setup AWS Security Groups
Configure your EC2 Security Group to allow traffic on the following ports:
* `22` (SSH) — Restricted to your IP
* `80` (HTTP) — Open to anywhere (`0.0.0.0/0`)
* `443` (HTTPS) — Open to anywhere (`0.0.0.0/0`)
* `5432` (PostgreSQL) — (Optional) Open to your IP for remote database administration

---

## 2. Server Installation (Ubuntu 22.04 LTS)
SSH into your EC2 instance and run the following commands to install Docker and Docker Compose:

```bash
# Update local packages
sudo apt update && sudo apt upgrade -y

# Install Docker dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repo
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to the docker group
sudo usermod -aG docker ubuntu
```
*Note: Log out and log back in for user group changes to apply.*

---

## 3. Clone Repository & Setup Environment
Create the application directory, clone your source files, and configure the environmental settings:

```bash
# Create project folder
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app
```

Copy your workspace code (e.g. using git clone or SCP). Then, create a production `.env` file inside `/home/ubuntu/app/`:

```env
# Django Config
SECRET_KEY=generate-a-secure-random-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,your-ec2-public-ip

# Database Config
DB_NAME=jobportal
DB_USER=postgres
DB_PASSWORD=choose_a_strong_database_password
DB_HOST=db
DB_PORT=5432

# CORS Allowed Origins
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# OpenAI Config
OPENAI_API_KEY=your_openai_api_key_here

# SMTP Email Config (Production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

---

## 4. Run Docker Compose
Run the initial setup to build and start the application containers:

```bash
# Start Docker compose in detached mode
docker compose up -d --build

# Run initial migrations inside the web container
docker compose exec web python manage.py migrate

# Collect backend staticfiles
docker compose exec web python manage.py collectstatic --no-input

# Create a Django superuser (optional admin dashboard access)
docker compose exec web python manage.py createsuperuser
```

---

## 5. Provision SSL Certificates (Certbot + Let's Encrypt)
To secure the application with HTTPS:

1. Install Certbot on the EC2 host:
```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

2. Request an SSL certificate:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. Update the root `nginx.conf` to bind port 443 and mount the Let's Encrypt certificates:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    client_max_body_size 10M;

    location ~ ^/(api|admin) {
        proxy_pass http://web:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /media/ {
        alias /app/media/;
    }

    location /django_static/ {
        alias /app/staticfiles/;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

4. Mount the certificate folder into Nginx by updating the `nginx` service volumes in `docker-compose.yml`:
```yaml
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - static_volume:/app/staticfiles:ro
      - media_volume:/app/media:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
```
Restart the services: `docker compose down && docker compose up -d`

---

## 6. Configure CI/CD Actions Secrets
In your GitHub repository settings, under **Secrets and variables > Actions**, add the following repository secrets to automate deployments on code push:

| Secret Name | Value Description |
| :--- | :--- |
| `AWS_ACCESS_KEY_ID` | Your AWS IAM access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your AWS IAM secret access key |
| `AWS_DEFAULT_REGION` | e.g. `us-east-1` |
| `EC2_HOST` | Public IP or domain name of your EC2 instance |
| `EC2_SSH_KEY` | Private SSH key (`.pem` contents) of your EC2 instance |

---

## 7. Verify Setup
To confirm the services are operating properly on the host, run:
```bash
# Check running containers
docker compose ps

# Inspect logs
docker compose logs -f web
```
You can now access your application securely at `https://yourdomain.com`.
