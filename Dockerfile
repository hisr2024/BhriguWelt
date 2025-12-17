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

# Copy the backend source and the root start wrapper used by hosted runners.
COPY backend /app/backend
COPY start.sh /app/start.sh

ENV PYTHONPATH=/app/backend/src \
    PORT=8000
EXPOSE 8000

# Delegate to the repository start script so platform defaults and .env loading
# stay consistent with local development.
CMD ["bash", "/app/start.sh"]
