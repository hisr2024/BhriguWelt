# Frontend (Next.js)

The `frontend/` workspace now contains a production-ready Next.js application
that surfaces every Bhrigu Samhita engine (horoscope, past-life, future,
matchmaking, and Śaka calendar conversion). It is designed to deploy directly to
Vercel while consuming the Python backend hosted on Render (or any HTTPS URL you
provide via an environment variable).

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

## Available scripts

| Command               | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `npm run dev`         | Launches the local Next.js dev server with live reload.                      |
| `npm run build`       | Produces the optimized production bundle (the same step Vercel executes).   |
| `npm run start`       | Serves the production build locally.                                        |
| `npm run lint`        | Runs ESLint using Next.js' recommended config.                              |
| `npm run type-check`  | Runs the TypeScript compiler without emitting files to catch regressions.   |

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
