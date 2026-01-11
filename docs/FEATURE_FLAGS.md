# Feature Flags and Configuration Guide

This document lists all feature toggles and configuration options for the BhriguWelt application.

## Table of Contents

1. [Caching Configuration](#caching-configuration)
2. [Celery Worker Configuration](#celery-worker-configuration)
3. [AI/OpenAI Configuration](#ai-openai-configuration)
4. [Mapbox Geocoding](#mapbox-geocoding)
5. [Security Configuration](#security-configuration)
6. [Section Parser Configuration](#section-parser-configuration)
7. [Rate Limiting Configuration](#rate-limiting-configuration)

---

## Caching Configuration

### `ENABLE_CACHING`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable/disable Redis caching for heavy endpoints (birth charts, predictions, geocoding)
- **Example**: `ENABLE_CACHING=true`
- **Required**: No
- **Impact**: When disabled, all caching is bypassed. May increase API latency and external service costs.

### `REDIS_URL`
- **Type**: String (URL)
- **Default**: `redis://localhost:6379/0`
- **Description**: Redis connection URL for caching and rate limiting
- **Example**: `REDIS_URL=redis://production-redis:6379/0`
- **Required**: Yes (when caching or rate limiting enabled)
- **Format**: `redis://[host]:[port]/[db]` or `rediss://` for TLS

---

## Celery Worker Configuration

### `ENABLE_CELERY_WORKER`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable/disable Celery background task processing
- **Example**: `ENABLE_CELERY_WORKER=true`
- **Required**: No
- **Impact**: When disabled, background tasks (cleanup, daily insights) won't execute

### `CELERY_BROKER_URL`
- **Type**: String (URL)
- **Default**: `redis://localhost:6379/0`
- **Description**: Celery broker URL (usually Redis)
- **Example**: `CELERY_BROKER_URL=redis://production-redis:6379/0`
- **Required**: Yes (when Celery enabled)

### `CELERY_RESULT_BACKEND`
- **Type**: String (URL)
- **Default**: `redis://localhost:6379/0`
- **Description**: Celery result backend for task results
- **Example**: `CELERY_RESULT_BACKEND=redis://production-redis:6379/0`
- **Required**: Yes (when Celery enabled)

---

## AI/OpenAI Configuration

### `OPENAI_API_KEY`
- **Type**: String
- **Default**: None
- **Description**: OpenAI API key for AI-powered predictions
- **Example**: `OPENAI_API_KEY=sk-proj-...`
- **Required**: Yes (for AI features)
- **Security**: ⚠️ **NEVER commit this to git**. Use environment variables or secrets management.

### `OPENAI_MODEL`
- **Type**: String
- **Default**: `gpt-4`
- **Description**: OpenAI model to use for predictions
- **Options**: `gpt-4`, `gpt-4-turbo`, `gpt-4o`, `gpt-3.5-turbo`
- **Example**: `OPENAI_MODEL=gpt-4-turbo`
- **Required**: No

### `OPENAI_MAX_TOKENS`
- **Type**: Integer
- **Default**: `4000`
- **Description**: Maximum tokens for OpenAI responses
- **Range**: 1-8000 (depends on model)
- **Example**: `OPENAI_MAX_TOKENS=6000`
- **Impact**: Higher values allow longer predictions but increase API costs

### `OPENAI_TEMPERATURE`
- **Type**: Float
- **Default**: `0.7`
- **Description**: Creativity/randomness of AI responses (0.0-1.0)
- **Range**: 0.0 (deterministic) to 1.0 (creative)
- **Example**: `OPENAI_TEMPERATURE=0.8`

### `OPENAI_USE_JSON_FORMAT`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Request structured JSON output from OpenAI
- **Example**: `OPENAI_USE_JSON_FORMAT=true`
- **Impact**: Improves parsing reliability and section extraction

### `OPENAI_MAX_RETRIES`
- **Type**: Integer
- **Default**: `3`
- **Description**: Number of retries for failed OpenAI API calls
- **Example**: `OPENAI_MAX_RETRIES=5`

### `OPENAI_TIMEOUT`
- **Type**: Integer (seconds)
- **Default**: `90`
- **Description**: Timeout for OpenAI API requests
- **Example**: `OPENAI_TIMEOUT=120`

---

## Mapbox Geocoding

### `ENABLE_MAPBOX`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable Mapbox geocoding (alternative to Nominatim)
- **Example**: `ENABLE_MAPBOX=true`
- **Required**: No
- **Impact**: When enabled, Mapbox is used for higher-quality geocoding

### `MAPBOX_ACCESS_TOKEN`
- **Type**: String
- **Default**: None
- **Description**: Mapbox API access token
- **Example**: `MAPBOX_ACCESS_TOKEN=pk.eyJ1...`
- **Required**: Yes (when ENABLE_MAPBOX=true)
- **Security**: ⚠️ **NEVER commit this to git**

### Fallback Behavior
- When `MAPBOX_ACCESS_TOKEN` is not set, the system automatically falls back to Nominatim (OpenStreetMap)
- Geocoding results are cached in Redis to reduce API calls and costs
- Rate limiting is applied to prevent exceeding geocoding service limits

---

## Security Configuration

### `SECRET_KEY` / `BHRIGUWELT_JWT_SECRET`
- **Type**: String
- **Default**: None (must be set)
- **Description**: Secret key for JWT token generation and session security
- **Example**: `SECRET_KEY=$(openssl rand -hex 32)`
- **Required**: ⚠️ **CRITICAL** - Application will fail to start without this
- **Security**:
  - Generate with: `openssl rand -hex 32`
  - **NEVER commit to git**
  - Rotate periodically (every 90 days recommended)

### `SENTRY_DSN`
- **Type**: String (URL)
- **Default**: None
- **Description**: Sentry DSN for error tracking and monitoring
- **Example**: `SENTRY_DSN=https://...@sentry.io/123456`
- **Required**: No (but strongly recommended for production)
- **Impact**: Without Sentry, errors are only logged locally

### `SENTRY_ENVIRONMENT`
- **Type**: String
- **Default**: `production`
- **Description**: Environment name for Sentry error grouping
- **Options**: `development`, `staging`, `production`
- **Example**: `SENTRY_ENVIRONMENT=production`

---

## Section Parser Configuration

### `SECTION_PARSER_MIN_LENGTH`
- **Type**: Integer
- **Default**: `100`
- **Description**: Minimum character length for valid prediction sections
- **Range**: 50-500 (recommended)
- **Example**: `SECTION_PARSER_MIN_LENGTH=120`
- **Impact**: Lower values accept shorter sections; higher values require more detailed content

### `SECTION_PARSER_HEADER_MIN_LENGTH`
- **Type**: Integer
- **Default**: `50`
- **Description**: Minimum length for header extraction
- **Example**: `SECTION_PARSER_HEADER_MIN_LENGTH=75`

### `SECTION_PARSER_KEYWORD_MATCH_RATIO`
- **Type**: Float
- **Default**: `0.5`
- **Description**: Keyword match ratio for section identification (0.0-1.0)
- **Example**: `SECTION_PARSER_KEYWORD_MATCH_RATIO=0.6`

---

## Rate Limiting Configuration

### Passcode Rate Limiting

#### `PASSCODE_MAX_ATTEMPTS`
- **Type**: Integer
- **Default**: `10`
- **Description**: Maximum failed passcode attempts before lockout
- **Range**: 3-20 (recommended)
- **Example**: `PASSCODE_MAX_ATTEMPTS=10`
- **Security**: Lower values increase security but may frustrate legitimate users

#### `PASSCODE_ATTEMPT_WINDOW`
- **Type**: Integer (seconds)
- **Default**: `300` (5 minutes)
- **Description**: Time window for counting failed attempts
- **Example**: `PASSCODE_ATTEMPT_WINDOW=600`

#### `PASSCODE_LOCKOUT_DURATION`
- **Type**: Integer (seconds)
- **Default**: `600` (10 minutes)
- **Description**: Duration of device lockout after exceeding max attempts
- **Example**: `PASSCODE_LOCKOUT_DURATION=900`
- **Security**: Balance between security and user experience

### API Rate Limiting

#### `FLASK_LIMITER_ENABLED`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable Flask-Limiter for API rate limiting
- **Example**: `FLASK_LIMITER_ENABLED=true`

---

## Environment Setup Examples

### Development Environment

```bash
# .env.development
ENABLE_CACHING=true
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

OPENAI_API_KEY=sk-proj-dev-key-here
OPENAI_MODEL=gpt-4
OPENAI_USE_JSON_FORMAT=true

SECRET_KEY=dev-secret-key-replace-in-production
SENTRY_ENVIRONMENT=development

PASSCODE_MAX_ATTEMPTS=10
PASSCODE_LOCKOUT_DURATION=600
```

### Production Environment

```bash
# .env.production
ENABLE_CACHING=true
REDIS_URL=rediss://prod-redis.example.com:6380/0
CELERY_BROKER_URL=rediss://prod-redis.example.com:6380/0
CELERY_RESULT_BACKEND=rediss://prod-redis.example.com:6380/0

OPENAI_API_KEY=sk-proj-prod-key-here
OPENAI_MODEL=gpt-4-turbo
OPENAI_MAX_TOKENS=6000
OPENAI_USE_JSON_FORMAT=true

MAPBOX_ACCESS_TOKEN=pk.eyJ1prod-token-here
ENABLE_MAPBOX=true

SECRET_KEY=<generated-with-openssl-rand-hex-32>
SENTRY_DSN=https://...@sentry.io/123456
SENTRY_ENVIRONMENT=production

PASSCODE_MAX_ATTEMPTS=10
PASSCODE_ATTEMPT_WINDOW=300
PASSCODE_LOCKOUT_DURATION=600

SECTION_PARSER_MIN_LENGTH=120
```

---

## Required vs Optional Configuration

### ⚠️ **CRITICAL - Must Set**
- `SECRET_KEY` or `BHRIGUWELT_JWT_SECRET`
- `REDIS_URL` (if caching/rate limiting enabled)
- `OPENAI_API_KEY` (if AI features enabled)

### **Highly Recommended**
- `SENTRY_DSN` (error tracking)
- `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` (background tasks)

### **Optional Enhancements**
- `MAPBOX_ACCESS_TOKEN` (better geocoding)
- All parser and rate limiting tuning parameters
- OpenAI model and token configurations

---

## Provisioning Redis

### Local Development (Docker)

```bash
docker run -d --name redis -p 6379:6379 redis:7
export REDIS_URL=redis://localhost:6379/0
```

### Production (Railway)

1. Go to Railway dashboard
2. Click "New" → "Database" → "Redis"
3. Copy the connection URL
4. Set `REDIS_URL` environment variable with the URL

### Production (Render)

1. Create a new Redis instance in Render
2. Copy the Internal/External URL
3. Set `REDIS_URL` in your web service environment

---

## Feature Flag Decision Matrix

| Feature | Enable When | Disable When |
|---------|------------|--------------|
| Caching | Production, high traffic | Development debugging, testing cache misses |
| Celery | Need background tasks | Minimal setup, testing only |
| AI (OpenAI) | Need AI predictions | Cost reduction, offline testing |
| Mapbox | Need accurate geocoding | Cost reduction, use free Nominatim |
| JSON Format | Production (more reliable) | Debugging free-text responses |
| Sentry | Production, staging | Local development |
| Rate Limiting | Production (security) | Development (convenience) |

---

## Rotating Secrets

### OpenAI Key Rotation

1. Generate new key in OpenAI dashboard
2. Update `OPENAI_API_KEY` in production
3. Monitor for errors
4. Delete old key from OpenAI

### JWT Secret Rotation

1. Generate new secret: `openssl rand -hex 32`
2. Keep old secret temporarily
3. Update `SECRET_KEY` in production
4. All users will need to re-authenticate
5. Remove old secret after 24 hours

---

## Monitoring Feature Flags

Monitor these metrics to ensure feature flags are working correctly:

- **Redis connection failures**: Check Sentry for `RedisError` events
- **OpenAI API failures**: Monitor `OPENAI_API_REQUEST_FAILED` errors
- **Passcode lockouts**: Track `DEVICE_LOCKED` responses (429 status codes)
- **Cache hit rates**: Use Redis INFO command or monitoring tools
- **Celery task failures**: Check Celery logs and Flower dashboard

---

## Support

For questions or issues with feature flags:
- Check logs: `backend/logs/app.log`
- Review Sentry errors: Dashboard → Errors
- Consult: `DEPLOYMENT_FIX_GUIDE.md`
- GitHub Issues: https://github.com/hisr2024/BhriguWelt/issues
