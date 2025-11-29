# Developer Onboarding

This quickstart documents how to stand up the BhriguWelt stack locally and on common hosts.

## Frontend (Next.js)
- Install dependencies: `cd frontend && npm ci`.
- Run locally: `npm run dev` (uses NEXT_PUBLIC_BACKEND_URL to reach the API).
- Deploy to Vercel:
  - Set **NEXT_PUBLIC_BACKEND_URL** pointing to the backend (Railway/Render/etc.).
  - Enable **NODE_OPTIONS=--experimental-json-modules** if using ES modules in config.
  - Include **NEXT_TELEMETRY_DISABLED=1** for privacy hardened previews.

## Backend (FastAPI-compatible HTTP server)
- Install dependencies: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`.
- Run locally: `python -m bhriguwelt.async_api` (defaults to port 8080).
- Deploy to Railway/Render:
  - Expose port 8080.
  - Persist the `backend/data` directory so profile + alert sqlite DB survives restarts.
  - Optional: set **BHRIGUWELT_ADMIN_TOKEN** for admin-only endpoints.

## API Pointers
All endpoints are defined in `backend/src/bhriguwelt/api.py`. Example payloads:
- `/horoscope`: `{ "full_name": "Asha", "birth_date": "1991-11-03", "birth_time": "05:45", "birth_place": "Jaipur, India" }`
- `/past-life`: same shape as `/horoscope`.
- `/future`: adds `"consent_for_date_predictions": true`.
- `/matchmaking`: `{ "primary": { ...birth fields }, "partner": { ...birth fields }, "modern_preferences": ["vegan", "mountains"] }`

Profiles are stored automatically when `profile_id` or `user_id` is provided. Dasha transitions become alerts linked to the profile for notification channels.
