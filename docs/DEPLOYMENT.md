# BhriguWelt Deployment Guide

Complete guide for deploying and operating BhriguWelt in production environments.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [Redis Setup](#redis-setup)
6. [Celery Workers](#celery-workers)
7. [Migration Scripts](#migration-scripts)
8. [Staging/Canary Rollout](#staging-canary-rollout)
9. [Rollback Procedures](#rollback-procedures)
10. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Environment Variables

### Required Variables (Production)

The following environment variables are **required** in production and will cause the application to fail startup if missing:

#### Backend (Flask/Python)

```bash
# Flask Security
SECRET_KEY=<64-char-hex>          # Flask session security
JWT_SECRET_KEY=<64-char-hex>      # JWT token signing
BHRIGUWELT_JWT_SECRET=<64-char-hex>  # Alternative JWT secret (used by some modules)

# OpenAI Integration
OPENAI_API_KEY=sk-...             # OpenAI API key for predictions
OPENAI_MODEL=gpt-4                # OpenAI model to use (default: gpt-4)
OPENAI_MAX_TOKENS=4000            # Max tokens for responses
OPENAI_TEMPERATURE=0.7            # Temperature for creativity (0-1)
OPENAI_USE_JSON_FORMAT=true       # Force JSON output format

# Frontend CORS
FRONTEND_URL=https://yourdomain.com   # Frontend URL for CORS

# Database
DATABASE_URL=postgresql://...     # PostgreSQL connection string

# Redis (Required for caching & Celery)
REDIS_URL=redis://...             # Redis connection string

# Flask Environment
FLASK_ENV=production              # Set to 'production' for production mode
```

**Generate secure secrets:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Optional Variables

```bash
# Geocoding (Optional - falls back to Nominatim)
MAPBOX_ACCESS_TOKEN=pk....        # Mapbox API token for geocoding
MAPBOX_TOKEN=pk....               # Alternative env var name

# Security
DISABLE_CSP=false                 # Disable Content Security Policy (dev only)

# Sentry (Recommended for production)
SENTRY_DSN=https://...            # Sentry error tracking

# Celery Configuration
CELERY_BROKER_URL=${REDIS_URL}    # Defaults to REDIS_URL
CELERY_RESULT_BACKEND=${REDIS_URL}

# Rate Limiting
RATE_LIMIT_GENERAL=100            # General API rate limit (per minute)
RATE_LIMIT_AI=10                  # AI endpoint rate limit (per minute)
PASSCODE_MAX_ATTEMPTS=10          # Max failed passcode attempts
PASSCODE_LOCKOUT_DURATION=600     # Lockout duration in seconds (10 min)

# Redis Configuration
REDIS_MAX_CONNECTIONS=50          # Max Redis connections in pool
REDIS_DEFAULT_TTL=3600            # Default cache TTL in seconds (1 hour)
ENABLE_CACHING=true               # Enable/disable Redis caching

# Section Parser Configuration
SECTION_PARSER_MIN_LENGTH=120     # Min section length (default: 120)
SECTION_PARSER_KEYWORD_MATCH_RATIO=0.5  # Keyword match ratio (0-1)

# Quotas
DAILY_AI_QUOTA=1000               # Daily AI requests per user
MONTHLY_AI_QUOTA=30000            # Monthly AI requests per user

# Request Limits
MAX_REQUEST_BYTES=1048576         # Max request size (1MB default)
```

#### Frontend (Next.js)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com    # Backend API URL

# Feature Flags
FRONTEND_ENABLE_STORAGE_FALLBACK=true             # Enable IndexedDB fallback
```

---

## Backend Deployment

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- Gunicorn (included in requirements.txt)

### Deployment Steps

#### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 2. Set Environment Variables

Create a `.env` file or set environment variables in your hosting platform:

```bash
# See "Required Variables" section above
```

#### 3. Run Database Migrations

```bash
# Initialize database
flask db upgrade

# Or using Python
python -c "from app import db; db.create_all()"
```

#### 4. Start Application

**Using Procfile (Recommended):**

The included `Procfile` defines two processes:

```
web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120
worker: celery -A services.celery_tasks.celery_app worker --loglevel=info --pool=solo
```

**On Heroku/Render.com:**
- Web process starts automatically
- Enable worker process in dashboard (required for background tasks)

**Manual start:**
```bash
# Web server
gunicorn app:app --bind 0.0.0.0:8000 --workers 4 --timeout 120

# Celery worker (separate process/dyno)
celery -A services.celery_tasks.celery_app worker --loglevel=info --pool=solo
```

#### 5. Verify Deployment

```bash
curl https://api.yourdomain.com/health
# Expected: {"status": "healthy", ...}
```

### Render.com Deployment

The included `render.yaml` configures deployment on Render.com:

```yaml
services:
  - type: web
    name: bhriguwelt-backend
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120
```

**Deploy:**
1. Connect GitHub repository to Render.com
2. Create Web Service from `render.yaml`
3. Add environment variables in Render dashboard
4. Add Worker service for Celery (separate service)

---

## Frontend Deployment

### Prerequisites

- Node.js 18+
- npm or yarn

### Deployment Steps

#### 1. Install Dependencies

```bash
cd frontend
npm install
```

#### 2. Set Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
FRONTEND_ENABLE_STORAGE_FALLBACK=true
```

#### 3. Build Application

```bash
npm run build
```

#### 4. Start Production Server

```bash
npm start
```

### Vercel Deployment

**Deploy:**
```bash
vercel --prod
```

**Environment Variables:**
- Set in Vercel dashboard under Settings > Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL

---

## Database Setup

### PostgreSQL Setup

#### 1. Create Database

```sql
CREATE DATABASE bhriguwelt;
CREATE USER bhriguwelt WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE bhriguwelt TO bhriguwelt;
```

#### 2. Set DATABASE_URL

```bash
DATABASE_URL=postgresql://bhriguwelt:secure_password@localhost:5432/bhriguwelt
```

#### 3. Run Migrations

```bash
cd backend
python -c "from app import db; db.create_all()"
```

### SQLite (Development Only)

For local development, SQLite is used by default:

```bash
# No setup needed - auto-created at backend/bhriguwelt.db
```

---

## Redis Setup

### Managed Redis (Recommended)

**Providers:**
- Render.com: Redis Add-on
- Heroku: Redis To Go / Heroku Redis
- Railway: Redis Plugin
- Upstash: Serverless Redis

**Configuration:**
```bash
REDIS_URL=redis://:password@host:port/0
```

### Self-Hosted Redis

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test connection
redis-cli ping
# Expected: PONG
```

---

## Celery Workers

### Worker Setup

Celery workers handle background tasks like:
- Cleanup old predictions/sessions
- Generate daily insights
- Send notifications
- Async prediction generation

### Starting Workers

**On Heroku/Render:**
- Enable worker dyno/service in dashboard
- Worker uses `Procfile` worker definition

**Manual start:**
```bash
celery -A services.celery_tasks.celery_app worker --loglevel=info --pool=solo
```

**With beat scheduler (for periodic tasks):**
```bash
celery -A services.celery_tasks.celery_app beat --loglevel=info
```

### Periodic Tasks

Configured in `backend/services/celery_tasks.py`:

- `cleanup_old_predictions`: Daily at 2 AM UTC (deletes predictions >90 days)
- `cleanup_old_sessions`: Daily at 3 AM UTC (deletes sessions >90 days, low-access predictions >180 days)
- `generate_daily_insights`: Daily at midnight UTC (generates insights for last 7 days active users, limit 50)

### Monitoring Workers

```bash
# Check worker status
celery -A services.celery_tasks.celery_app inspect active

# Check scheduled tasks
celery -A services.celery_tasks.celery_app inspect scheduled

# Check registered tasks
celery -A services.celery_tasks.celery_app inspect registered
```

---

## Migration Scripts

### Legacy Profile Migration

If upgrading from an older version with legacy profile storage:

#### Option 1: Dry Run (Recommended First)

```bash
cd frontend
npx ts-node scripts/migrate-legacy-profiles.ts
```

This will:
- Analyze IndexedDB for legacy profile entries
- Show what would be changed
- Generate a browser-compatible migration script

#### Option 2: Browser-Based Migration

1. Open the app in a browser
2. Open DevTools Console
3. Run the generated migration script:

```javascript
// Copy from browser-migration.js
await migrateProfiles(true)  // Dry run
await migrateProfiles(false) // Apply migration
```

#### Option 3: Apply with Backup

```bash
npx ts-node scripts/migrate-legacy-profiles.ts --apply
```

**Backup location:** `profile-backup.json` (auto-generated)

### Manual localStorage Fix

If users report profile loading issues, they can manually fix:

1. Open DevTools Console (F12)
2. Check current profile ID:
   ```javascript
   localStorage.getItem('current_profile_id')
   ```
3. If null or incorrect, set manually:
   ```javascript
   // Replace '123' with actual profile ID
   localStorage.setItem('current_profile_id', '123')
   ```
4. Reload page

---

## Staging/Canary Rollout

### Pre-Deployment Checklist

- [ ] All tests passing (frontend + backend)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis connection verified
- [ ] Celery worker configured
- [ ] Health check endpoint responding
- [ ] Sentry DSN configured (if using)
- [ ] Backup created (if applicable)

### Staging Verification

Deploy to staging first and verify:

#### 1. Profile Flow
- [ ] Create profile via /get-started
- [ ] Verify `localStorage.current_profile_id` is set
- [ ] Visit /dashboard - profile loads correctly
- [ ] Visit /horoscope - predictions load
- [ ] Visit /birth-chart - chart renders

#### 2. API Endpoints
- [ ] `/health` returns 200
- [ ] `/api/astrology/birth-chart` returns chart
- [ ] `/api/bhrigu-predictions/*` returns predictions
- [ ] `/api/ai/*` endpoints work (if OpenAI key set)

#### 3. Background Tasks
- [ ] Celery worker running
- [ ] Tasks execute successfully
- [ ] Check logs for errors

#### 4. Security
- [ ] CSP headers present
- [ ] HTTPS enforced (production)
- [ ] Rate limiting working
- [ ] JWT authentication working

#### 5. Storage
- [ ] IndexedDB encryption working
- [ ] Profile fallback logic working
- [ ] Data persists across sessions

### Canary Rollout Strategy

**Week 1: 10% traffic**
- Deploy to 10% of users
- Monitor error rates in Sentry
- Check Celery task success rates
- Verify no storage issues

**Week 2: 50% traffic**
- Increase to 50% if no issues
- Continue monitoring

**Week 3: 100% traffic**
- Full rollout
- Continue monitoring for 7 days

---

## Rollback Procedures

### Quick Rollback (Emergency)

#### Backend Rollback

**Heroku:**
```bash
heroku releases:rollback -a bhriguwelt-backend
```

**Render.com:**
- Go to Dashboard > Service > Deploys
- Click "Rollback" on previous successful deploy

**Manual:**
```bash
git revert HEAD
git push origin main
```

#### Frontend Rollback

**Vercel:**
```bash
vercel rollback
```

**Manual:**
```bash
git revert HEAD
git push origin main
vercel --prod
```

### Feature Flag Disable

If issues with storage fallback:

```bash
# Backend: Disable CSP if causing issues
DISABLE_CSP=true

# Frontend: Disable storage fallback
FRONTEND_ENABLE_STORAGE_FALLBACK=false
```

### Database Rollback

If migration causes issues:

```bash
# PostgreSQL
pg_restore -d bhriguwelt backup_file.dump

# Or restore from Render/Heroku backup:
# Render: Dashboard > Database > Backups > Restore
# Heroku: heroku pg:backups:restore
```

### Manual User Fix

Instruct users to:

1. Export data: Settings > Export Data
2. Clear storage: DevTools > Application > IndexedDB > Delete
3. Import data: Settings > Import Data
4. Or set localStorage manually (see Migration Scripts section)

---

## Monitoring & Troubleshooting

### Health Checks

**Backend:**
```bash
curl https://api.yourdomain.com/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "database": "connected",
  "redis": "connected"
}
```

### Log Analysis

**Backend logs:**
```bash
# Heroku
heroku logs --tail -a bhriguwelt-backend

# Render.com
# Dashboard > Logs

# Check for startup errors
grep "ERROR" logs.txt
grep "WARNING" logs.txt
```

**Celery worker logs:**
```bash
# Check worker-specific logs
heroku logs --tail --ps worker -a bhriguwelt-backend
```

### Common Issues

#### Issue: "Please complete your profile first"

**Cause:** `localStorage.current_profile_id` not set or profile not found

**Fix:**
```javascript
// DevTools Console
const db = await indexedDB.open('BhriguWelt');
// Inspect profiles store, find profile ID
localStorage.setItem('current_profile_id', '<ID>');
location.reload();
```

#### Issue: Celery tasks not running

**Cause:** Worker not started or Redis not connected

**Fix:**
1. Verify worker dyno/service is running
2. Check REDIS_URL is set
3. Check worker logs for connection errors
4. Restart worker

#### Issue: Rate limit exceeded

**Cause:** Too many requests from single IP/user

**Fix:**
1. Check rate limiter configuration
2. Temporarily increase limits
3. Implement Redis-backed rate limiter for distributed systems

#### Issue: OpenAI API errors

**Cause:** Invalid API key, rate limits, or network issues

**Fix:**
1. Verify OPENAI_API_KEY starts with `sk-`
2. Check OpenAI API status
3. App falls back to offline mode automatically
4. Check logs for specific error messages

#### Issue: Database connection errors

**Cause:** Invalid DATABASE_URL or database down

**Fix:**
1. Verify DATABASE_URL format
2. Check database service status
3. Verify credentials
4. Check connection limits

---

## Performance Optimization

### Backend

- **Redis caching:** Enabled by default with 1-hour TTL
- **Connection pooling:** Max 50 Redis connections
- **Circuit breaker:** Auto-disabled after 5 failures (60s recovery)
- **Rate limiting:** 100 req/min general, 10 req/min AI endpoints

### Frontend

- **IndexedDB:** Encrypted offline storage
- **Service worker:** PWA offline support
- **Code splitting:** Automatic with Next.js

### Database

```sql
-- Add indexes for common queries
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_created_at ON predictions(created_at);
```

---

## Security Checklist

- [ ] All secrets stored in environment variables (never in code)
- [ ] HTTPS enforced in production
- [ ] CSP headers enabled
- [ ] Rate limiting active
- [ ] JWT secrets secure and rotated
- [ ] Database credentials secure
- [ ] Redis password set (if exposed)
- [ ] Sentry PII sanitization enabled
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (SQLAlchemy ORM)
- [ ] XSS prevention (React escaping + CSP)

---

## Support & Contact

- **Issues:** https://github.com/hisr2024/BhriguWelt/issues
- **Documentation:** https://github.com/hisr2024/BhriguWelt/wiki
- **CI/CD Status:** https://github.com/hisr2024/BhriguWelt/actions

---

## Appendix: Quick Reference

### Environment Variable Checklist

```bash
# Backend (Required in Production)
✓ SECRET_KEY
✓ JWT_SECRET_KEY
✓ OPENAI_API_KEY
✓ FRONTEND_URL
✓ DATABASE_URL
✓ REDIS_URL
✓ FLASK_ENV=production

# Backend (Optional)
○ MAPBOX_ACCESS_TOKEN
○ SENTRY_DSN
○ DISABLE_CSP (dev only)

# Frontend
✓ NEXT_PUBLIC_API_URL
○ FRONTEND_ENABLE_STORAGE_FALLBACK
```

### Service Ports

- Backend: 8000 (or $PORT)
- Frontend: 3000
- PostgreSQL: 5432
- Redis: 6379

### Key Files

- Backend config: `backend/app.py`
- Celery tasks: `backend/services/celery_tasks.py`
- Deployment: `backend/Procfile`, `backend/render.yaml`
- Frontend config: `frontend/next.config.js`
- Storage: `frontend/lib/storage.ts`
- Profile helpers: `frontend/lib/profileHelpers.ts`

---

**Last Updated:** 2024-01-11
**Version:** 2.0
