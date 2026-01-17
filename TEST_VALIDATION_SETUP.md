# Supreme Validation Suite Setup

This document covers the local setup required to run `backend/test_supreme_validation.py` and ensure all 15 tests pass.

## 1) Python environment

Create and activate a virtual environment (recommended):

```bash
python -m venv .venv
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

If you are running the test suite in a lean environment and encounter missing Flask add-ons, install them explicitly:

```bash
pip install Flask Flask-Cors Flask-Limiter flask-caching
```

> Note: Some environments also require `redis` and `hiredis` Python packages when Redis-backed caching is enabled.

## 2) Redis for backend tests

The backend health checks and cache integrations expect a Redis service to be available. You can start Redis in one of these ways:

### Option A: Local Redis

```bash
redis-server --port 6379
```

### Option B: Docker

```bash
docker run --rm -p 6379:6379 redis:7
```

Set the connection URL in your shell if needed:

```bash
export REDIS_URL=redis://localhost:6379/0
```

## 3) Run the Supreme Validation Suite

From the repository root:

```bash
python backend/test_supreme_validation.py
```

## 4) Troubleshooting

- If you see import errors, confirm that `backend/requirements.txt` is fully installed.
- If Redis connection warnings appear, confirm the Redis server is running and `REDIS_URL` matches the active port.
- If OpenAI is not configured, the suite still passes because it relies on offline fallbacks, but online predictions will be skipped.
