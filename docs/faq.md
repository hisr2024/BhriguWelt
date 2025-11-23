# Frequently Asked Questions

## How do I point the UI to my backend?
Set `NEXT_PUBLIC_BACKEND_URL` in `.env.local` inside `frontend/` to your Render or Railway deployment. Restart `npm run dev` after updating.

## Why am I seeing rate limits?
Both the threaded and async Python APIs include a per-client token bucket. If you receive HTTP 429, wait a minute or reduce concurrent calls.

## Can I export readings?
Yes. Each form is designed to be PDF friendly with high-contrast colors. Use the browser's print-to-PDF option for quick exports.

## Where is telemetry stored?
Telemetry events flow through `sentry-sdk` per `backend/src/bhriguwelt/telemetry.py`. Provide a DSN via environment variables to enable collection.

## How do I extend language support?
Strings live in `frontend/lib/copy.ts`. Add additional scripts and right-to-left translations there, and mirror the changes in the i18n helper.
