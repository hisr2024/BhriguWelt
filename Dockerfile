FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install backend dependencies up front to leverage Docker layer caching.
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy the backend source
COPY backend /app/backend

ENV PYTHONPATH=/app/backend \
    PORT=8000 \
    WORKERS=1 \
    TIMEOUT=120

EXPOSE 8000

# Health check for backend readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import sys,urllib.request; sys.exit(0) if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).status == 200 else sys.exit(1)"]

# Make start script executable
RUN chmod +x /app/backend/start.sh

# Set working directory to backend where app.py exists
WORKDIR /app/backend

# Use the startup script for better error handling and logging
CMD ["./start.sh"]
