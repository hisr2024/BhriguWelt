# GitHub Copilot instructions

Use these notes when generating code suggestions for BhriguWelt.

## Repository map
- **Backend**: `backend/` (Python 3.11, HTTP server in `app.py`).
- **Frontend**: `frontend/` (Next.js App Router, API helpers in `frontend/lib/api.ts`).
- **Docs**: `docs/` for deployment notes and onboarding.

## Backend conventions
- Keep API errors consistent with `BhriguAPIHandler.send_error` in `api.py`.
- Prefer raising `ValueError` for request validation issues inside API helpers.
- Avoid wrapping imports in `try/except` blocks.

## Frontend conventions
- Use the helpers in `frontend/lib/api.ts` when calling backend endpoints.
- Stick to existing UI patterns (cards, panels, and callouts in `frontend/components/`).

## General guidance
- Follow existing formatting and naming conventions in the touched module.
- Update documentation when introducing new developer workflows.
