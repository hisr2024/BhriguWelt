# Multi-stage build for optimized image size and build caching
FROM python:3.11.9-slim AS builder

# Set build-time environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install build dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
  && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (leverage Docker layer caching)
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --user -r /app/backend/requirements.txt

# ============================================================================
# Final runtime stage
# ============================================================================
FROM python:3.11.9-slim AS runtime

# Set runtime environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend \
    PORT=8000 \
    WORKERS=1 \
    TIMEOUT=120

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy Python packages from builder stage
COPY --from=builder /root/.local /root/.local

# Copy backend application code
COPY --chown=appuser:appuser backend /app/backend

# CRITICAL: Copy core_wisdom directory for Bhrigu/Nadi rules
COPY --chown=appuser:appuser core_wisdom /app/core_wisdom

# Ensure start script is executable
RUN chmod +x /app/backend/start.sh

# Health check for backend readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import sys,urllib.request; sys.exit(0) if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).status == 200 else sys.exit(1)"]

# Switch to non-root user
USER appuser

# Set working directory to backend where app.py exists
WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Use the startup script for better error handling and logging
CMD ["./start.sh"]
