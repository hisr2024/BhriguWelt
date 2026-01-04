#!/bin/bash
set -e

# Ensure we're in the backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================"
echo "BhriguWelt Backend Starting..."
echo "================================"
echo "Environment: $FLASK_ENV"
echo "Port: $PORT"
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"
echo "================================"

# Validate critical environment variables
if [ "$FLASK_ENV" = "production" ]; then
    echo "Running in production mode - checking environment variables..."

    required_vars=("SECRET_KEY" "JWT_SECRET_KEY" "FRONTEND_URL")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "ERROR: Required environment variable $var is not set!"
            exit 1
        fi
    done

    # Warn if SARVAM_AI_API_KEY is not set (non-fatal)
    if [ -z "$SARVAM_AI_API_KEY" ]; then
        echo "WARNING: SARVAM_AI_API_KEY is not set. AI features will be disabled."
    fi
fi

echo "All required environment variables are set."
echo "================================"

# Set defaults if not provided
export WORKERS="${WORKERS:-1}"
export TIMEOUT="${TIMEOUT:-120}"
export WORKER_CLASS="${WORKER_CLASS:-sync}"
export MAX_REQUESTS="${MAX_REQUESTS:-1000}"
export MAX_REQUESTS_JITTER="${MAX_REQUESTS_JITTER:-50}"

echo "Gunicorn Configuration:"
echo "  Workers: $WORKERS"
echo "  Timeout: $TIMEOUT seconds"
echo "  Worker Class: $WORKER_CLASS"
echo "  Max Requests: $MAX_REQUESTS"
echo "================================"

# Test if the app can be imported
echo "Testing app import..."
python -c "from app import app; print('App imported successfully')" || {
    echo "ERROR: Failed to import app"
    exit 1
}

echo "App import successful!"
echo "================================"
echo "Starting Gunicorn..."
echo "================================"

# Start gunicorn with optimized settings for Render
exec gunicorn app:app \
    --bind 0.0.0.0:${PORT} \
    --workers ${WORKERS} \
    --worker-class ${WORKER_CLASS} \
    --timeout ${TIMEOUT} \
    --max-requests ${MAX_REQUESTS} \
    --max-requests-jitter ${MAX_REQUESTS_JITTER} \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --capture-output \
    --enable-stdio-inheritance
