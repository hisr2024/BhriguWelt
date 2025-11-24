# Changelog
All notable changes to this project will be documented here.

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
