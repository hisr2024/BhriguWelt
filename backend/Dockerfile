# ===========================================
# Backend Production Dockerfile
# Multi-stage Build - Optimized for Render.com
# ===========================================

# Stage 1: Builder - Install dependencies
FROM python:3.11.9-slim as builder

# Set environment variables for optimization
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Install build dependencies (needed for some Python packages)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        python3-dev \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
# Copy requirements first for better Docker layer caching
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ===========================================
# Stage 2: Runtime - Minimal production image
# ===========================================
FROM python:3.11.9-slim

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend \
    PORT=10000 \
    WORKERS=1 \
    TIMEOUT=120 \
    FLASK_ENV=production \
    PATH=/home/appuser/.local/bin:$PATH

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# CRITICAL FIX: Copy Python packages to appuser's home directory
# This ensures the non-root user can access installed packages
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Copy application code
COPY --chown=appuser:appuser . /app/backend

# Copy core wisdom files if they exist (for Bhrigu/Nadi rules)
# Note: This assumes core_wisdom is at repo root
COPY --chown=appuser:appuser ../core_wisdom /app/core_wisdom 2>/dev/null || true

# Create necessary directories with proper permissions
RUN mkdir -p /app/backend/logs /app/backend/data \
    && chown -R appuser:appuser /app \
    && chmod +x /app/backend/start.sh

# Switch to non-root user
USER appuser

WORKDIR /app/backend

# Expose port (Render uses PORT environment variable)
EXPOSE 10000

# Health check for container health monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/health || exit 1

# Use the start.sh script which handles environment validation and gunicorn startup
CMD ["./start.sh"]
