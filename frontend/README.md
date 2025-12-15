# Frontend (Next.js)

The `frontend/` workspace now contains a production-ready Next.js application
that surfaces every Bhrigu Samhita engine (horoscope, past-life, future,
matchmaking, and Śaka calendar conversion). It is designed to deploy directly to
Vercel while consuming the Python backend hosted on Railway (or any HTTPS URL you
provide via an environment variable). The UI is intentionally bold—glassmorphic
panels, gradients, and multi-page navigation that stay legible for seekers of
every age. Language support now spans English, Hindi, Spanish, and Tamil with
preferences persisted per visitor.

## Getting started

```bash
cd frontend
npm install
npm run dev
```

The development server defaults to `http://localhost:3000` and expects the
backend to be reachable at `http://localhost:8000`. Point the UI at a different
backend by setting `NEXT_PUBLIC_BACKEND_URL` before running any script:

```bash
NEXT_PUBLIC_BACKEND_URL=https://bhriguwelt-production.up.railway.app npm run dev
```

For Vercel previews and production, set `NEXT_PUBLIC_BACKEND_URL` in the Vercel
dashboard to the Railway (or self-hosted) API endpoint you control. Keep it
aligned with `https://bhriguwelt-production.up.railway.app` (or your own
Railway domain) so every deploy targets the live backend. Vercel
defaults to a Node 18 runtime, which matches the app's tested environment. For
local testing against a remote backend, create a `.env.local` file with the same
key so `npm run dev` and `npm run build` compile against the right host.

## Experience map

- `/` (Home): hero story plus quick-access horoscope, calendar, and
  matchmaking forms—all styled with neon gradients and mobile-friendly grids.
- `/horoscope`: full Panchanga-aligned intake with citations for dashboards and
  mobile onboarding.
- `/past-life`: reincarnation storytelling with the same validated inputs for
  parity across devices.
- `/future`: actionable future directives ready for streaks, notifications, and
  checklists.
- `/matchmaking`: dual-profile intake with modern preference tags for families,
  friends, or partners.
- `/calendar`: standalone Gregorian → Śaka converter for international users.
- Skip links and high-contrast defaults keep the neon look while preserving
  keyboard/screen-reader usability.

### Deployment verification

- **Railway health check:** After deploying the backend to Railway, run
  `curl https://<your-railway-host>/health` to ensure the API is reachable.
- **Vercel preview smoke test:** Open the preview URL Vercel provides, submit
  each form, and confirm responses contain the manuscript citations returned by
  the Railway backend. Adjust `NEXT_PUBLIC_BACKEND_URL` if requests fail.

## Available scripts

| Command               | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `npm run dev`         | Launches the local Next.js dev server with live reload.                      |
| `npm run build`       | Produces the optimized production bundle (the same step Vercel executes).   |
| `npm run start`       | Serves the production build locally.                                        |
| `npm run lint`        | Runs ESLint using Next.js' recommended config.                              |
| `npm run type-check`  | Runs the TypeScript compiler without emitting files to catch regressions.   |
| `npm run test:e2e`    | Runs Playwright smoke tests (install `@playwright/test` before running).    |

- E2E coverage now includes accessibility smoke checks for the skip link, main
  navigation landmark, and language toggle labels so screen readers stay in
  parity with visual navigation.

## Environment and CI

- Copy `.env.example` to `.env.local` (or `.env`) and set `NEXT_PUBLIC_BACKEND_URL`
  to your Railway (or local) backend before running the app. Optional telemetry
  hooks use `NEXT_PUBLIC_SENTRY_DSN` plus `NEXT_PUBLIC_SENTRY_ENVIRONMENT` and
  sampling controls for traces/profiles.
- Optional client telemetry is controlled by `NEXT_PUBLIC_SENTRY_DSN`; when set
  and paired with `@sentry/nextjs`, errors surface in your Sentry project. When
  unset, telemetry helpers no-op to preserve the zero-dependency runtime.
- Choose the default locale with `NEXT_PUBLIC_DEFAULT_LANGUAGE` (supported: en,
  hi, es, ta). The multilingual toggle persists the selected language in
  `localStorage` so visitors keep their preference across visits.
- GitHub Actions (`Frontend CI`) runs `npm install`, `npm run lint`, and
  `npm run type-check` with Node 18 on pushes and pull requests that touch the
  frontend.

Quick troubleshooting tips:

- If forms render demo copy, confirm `.env.local` exists and restart `npm run dev`
  after updating `NEXT_PUBLIC_BACKEND_URL`.
- Railway self-signed certificates can block fetches during local dev; export
  `NODE_TLS_REJECT_UNAUTHORIZED=0` temporarily when testing against those hosts
  (never in production).
- Clear Next.js cache between backend URL changes with `rm -rf .next`.
- Console warnings like `Failed to load resource: net::ERR_CONNECTION_REFUSED`
  for `/health` or `/calendar` mean the backend at
  `http://localhost:8000` (or `NEXT_PUBLIC_BACKEND_URL`) is unreachable. Start
  the backend locally or point the frontend at a reachable API host to clear
  the warning; otherwise the UI will fall back to cached demo responses.
- A minified React error `#310` expands to "Rendered more hooks than during the
  previous render," which is triggered when a component calls hooks
  conditionally. Ensure every render of a component executes the same sequence
  of hooks (e.g., move hooks above conditionals or guard returns) to remove this
  client-side error. A fast triage loop is:
  1. Switch to dev mode (`npm run dev`) so React prints the full message.
  2. Confirm no hooks are placed inside `if/for/try` blocks or nested functions
     that may be skipped on some renders.
  3. Move all hooks to the top of the component body and replace conditional
     hooks with conditional values inside the hook callbacks.
- A minified React error `#418` signals a hydration mismatch between the HTML
  pre-rendered on the server and the first client render (text vs. HTML). Common
  causes are non-deterministic values like `Date.now()`/`new Date()` output,
  locale-dependent translations that change after reading `localStorage`, or
  random IDs used directly in JSX. To eliminate the mismatch:
  1. Use stable defaults for any text rendered during SSR (e.g., seed dates
     with fixed strings instead of `new Date()` until the client hydrates).
  2. Gate client-only reads (`localStorage`, `navigator.language`,
     `matchMedia`) behind a `useEffect` and render a placeholder until
     hydration completes.
  3. When unavoidable, wrap the dynamic text node with
     `suppressHydrationWarning` to prevent React from throwing while keeping the
     client render authoritative.

## Deployment to Vercel

1. Push your changes to GitHub.
2. In Vercel, create a new project from this repository and select the `frontend`
   directory when asked for the root.
3. Define the `NEXT_PUBLIC_BACKEND_URL` environment variable so the UI knows
   which Railway (or self-hosted) backend to call.
4. Deploy. Vercel automatically runs `npm install`, `npm run build`, and `npm
   run start` behind the scenes.

## Mobile & desktop parity

The UI is responsive out of the box. For native apps, you can reuse the same
REST calls from React Native, Flutter, or Kotlin/Swift clients—every screen in
this web app shows how to shape the payloads expected by `/horoscope`,
`/past-life`, `/future`, `/matchmaking`, and `/calendar`.
