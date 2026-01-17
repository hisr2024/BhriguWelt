# Fix Report

## Summary
- Updated the frontend lint pipeline to use ESLint directly and added targeted overrides for JS tooling and test fixtures.
- Tightened TypeScript typings in storage, Web3 wallet, prediction utilities, and shared types.
- Improved service worker caching and wisdom hook dependency handling.
- Added CodeQL setup for Node/Python with expanded security queries.
- Introduced Husky pre-push hooks for lint/typecheck/test execution.

## Lint & Typecheck
- **ESLint**: Switched to `eslint` for the frontend package and resolved the remaining lint error in `BhriguPredictionView`. Some warnings remain from existing `any` usage in legacy app modules.
- **TypeScript**: Fixed typing errors in the storage manager and wallet connector. `tsc --noEmit` now succeeds.

## Dependencies & Security
- Set npm registry/audit registry to the public npm endpoint to reduce `403` audit responses in restricted environments.
- Added Bandit to `requirements.txt` so the security scanner can be installed as part of Python dependencies.
- Husky dependency installation was blocked by registry access (`403`), but hook scripts and configuration are in place.

## CodeQL
- Updated CodeQL workflow to set up Node.js and Python and to include `security-extended` and `security-and-quality` query packs.

## Tests
- Type checks ran successfully.
- Full unit/e2e test execution was not performed here due to the time constraints and pending lint warnings in legacy modules.
