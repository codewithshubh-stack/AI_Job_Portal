#!/bin/sh

echo "Running database migrations..."
python manage.py migrate --no-input

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Starting Gunicorn server..."
exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
