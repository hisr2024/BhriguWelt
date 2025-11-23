# Frontend (Next.js)

The `frontend/` workspace now contains a production-ready Next.js application
that surfaces every Bhrigu Samhita engine (horoscope, past-life, future,
matchmaking, and Śaka calendar conversion). It is designed to deploy directly to
Vercel while consuming the Python backend hosted on Render (or any HTTPS URL you
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
NEXT_PUBLIC_BACKEND_URL=https://bhriguwelt-backend.onrender.com npm run dev
```

For Vercel previews and production, set `NEXT_PUBLIC_BACKEND_URL` in the Vercel
dashboard to the Render (or self-hosted) API endpoint you control. Vercel
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

- **Render health check:** After deploying the backend with `render.yaml`, run
  `curl https://<your-render-host>/health` to ensure the API is reachable.
- **Vercel preview smoke test:** Open the preview URL Vercel provides, submit
  each form, and confirm responses contain the manuscript citations returned by
  the backend. Adjust `NEXT_PUBLIC_BACKEND_URL` if requests fail.

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
  to your Render/Railway/local backend before running the app. Optional telemetry
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

## Deployment to Vercel

1. Push your changes to GitHub.
2. In Vercel, create a new project from this repository and select the `frontend`
   directory when asked for the root.
3. Define the `NEXT_PUBLIC_BACKEND_URL` environment variable so the UI knows
   which Render (or self-hosted) backend to call.
4. Deploy. Vercel automatically runs `npm install`, `npm run build`, and `npm
   run start` behind the scenes.

## Mobile & desktop parity

The UI is responsive out of the box. For native apps, you can reuse the same
REST calls from React Native, Flutter, or Kotlin/Swift clients—every screen in
this web app shows how to shape the payloads expected by `/horoscope`,
`/past-life`, `/future`, `/matchmaking`, and `/calendar`.
