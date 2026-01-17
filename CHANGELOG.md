# Changelog
All notable changes to this project will be documented here.

## [2026-01-17] - Comprehensive Security and Feature Improvements

### Critical Security Fixes
- Fixed bare exception handling across multiple files for better error tracking and debugging
  - `backend/middleware/csrf_protection.py`: Specific exception types for JSON parsing errors
  - `backend/routes/health_routes.py`: Specific exceptions for uptime calculation failures
  - `backend/services/redis_cache.py`: Redis-specific connection and timeout error handling
  - `backend/services/openai_service.py`: Attribute and type error handling for API responses
  - Test files: Improved exception handling in `test_platform_engines.py` and `test_resilient_response_system.py`
- Removed production assertions in legacy archive files, replacing with proper ValueError exceptions
  - `archive/legacy_backend/src/bhriguwelt/feedback.py`
  - `archive/legacy_backend/src/bhriguwelt/profiles.py`

### New Features
- **Datadog RUM Monitoring**: Full implementation of real-user monitoring for the frontend
  - Added `@datadog/browser-rum` package (v5.33.0)
  - Enabled initialization and event tracking in `frontend/lib/monitoring.ts`
  - Added configuration via environment variables (DATADOG_APP_ID, DATADOG_CLIENT_TOKEN, DATADOG_SITE)
- **Email Notification System**: Complete SendGrid integration for user notifications
  - Implemented in `backend/services/celery_tasks.py` with three helper functions
  - Added SendGrid to `backend/requirements.txt` (v6.11.0)
  - Supports multiple notification types (daily_insight, prediction_ready, custom)
  - Includes email templates with HTML formatting

### Documentation
- Consolidated changelog documentation
- Archived detailed system overhaul documents to `docs/archive/`:
  - OVERHAUL_CHANGES.md
  - COMPREHENSIVE_FIXES_SUMMARY.md
  - PREDICTION_FIXES_SUMMARY.md

### Dependencies Added
- Frontend: `@datadog/browser-rum@5.33.0`
- Backend: `sendgrid==6.11.0`

### Configuration
- Frontend `.env.example` updated with Datadog configuration
- Backend `.env.example` updated with SendGrid email configuration

## [Unreleased]
- Add production-ready Sentry hooks plus client bootstrapping alongside a
  multilingual toggle that now supports English, Hindi, Spanish, and Tamil with
  persisted defaults.
- Align governance metadata (license notice, conduct contact) across README and
  contributing docs to prevent recurring merge conflicts.
- Expand the Bhrigu Samhita corpus with tradition-aware entries, Panchang
  contexts, and checksum-backed integrity scaffolding for predictions.

## [2026-03-30]
- Documented API rate limiting, response caching, and admin hardening in the
  reference guide plus refreshed deployment steps for secure token handling.
- Added backend regression tests to prove rate limits apply to all routes and
  cached responses expire before recomputation.
- Expanded multilingual navigation shortcuts with Hindi/English/Spanish/Tamil
  coverage and ARIA labels plus a unit test that enforces translation
  completeness.

## [2025-11-20]
- Published an OpenAPI snapshot, backup helper script, and Dependabot config to
  tighten governance and data safety.
- Added Hindi/English toggles, ARIA improvements, and optional Sentry-powered
  telemetry hooks across the Next.js experience plus Playwright E2E scaffolding.
- Extended backend coverage with threaded HTTP integration tests and documented
  pytest coverage runs for CI.

## [2025-02-12]
- Added governance docs (License, Code of Conduct, Contributing, Security policy).
- Introduced CI workflows for backend pytest and frontend lint/type-check.
- Published API reference, backup plan, and environment examples.
- Hardened backend validation coverage with regression tests.
