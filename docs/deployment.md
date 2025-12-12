# Deployment playbook

BhriguWelt is now wired for a two-tier deployment model: the Python backend runs
on Render (or any long-lived VM/container platform) while the React/Next.js
frontend deploys on Vercel. Native apps (Android/iOS) reuse the same HTTP
contracts exposed by the backend. No hosted instances ship with the repository,
so follow the steps below to publish your own endpoints before testing clients.

> **HTTPS only:** Configure every public URL (backend and frontend) with TLS and
> keep `NEXT_PUBLIC_BACKEND_URL` pointed to an HTTPS origin. The Next.js
> `middleware.ts` automatically redirects `http://` traffic to `https://` when
> reverse proxies forward the `x-forwarded-proto` header.

## Backend → Render

### Fast path (blueprint)

1. Push this repository to GitHub (Render reads the `render.yaml` blueprint at
   the repo root).
2. In the Render dashboard, click **New → Blueprint** and pick your GitHub repo.
3. Render auto-detects `render.yaml`; leave the defaults in place:
   - Runtime: Python 3.11+
   - Root directory: `backend`
   - Build command: `python -m pip install -r requirements.txt`
   - Start command: `./start.sh` (exports `PYTHONPATH=src` before running the API)
   - Health check path: `/health`
4. Add environment variables:
   - `BHRIGUWELT_ADMIN_TOKEN` (required to unlock `/ml/retrain`)
   - `PYTHONPATH=src`
   - Optional: `BHRIGU_ML_ENABLED=1` to keep ML weighting active in production
5. Deploy. Your live API URL will look like
   `https://bhriguwelt-production.up.railway.app`—copy this for the frontend
   and mobile clients.

### Manual service (if you skip the blueprint)

1. Create a **Web Service** in Render and point it at this repo.
2. Set **Root Directory** to `backend` and **Runtime** to Python 3.11.
3. Build command: `python -m pip install -r requirements.txt`
4. Start command: `./start.sh` (exports `PYTHONPATH=src` and launches the API)
5. Health check path: `/health`
6. Deploy and watch the Render logs until you see `Serving on ('0.0.0.0', 8000)`.
7. Verify with `curl https://<your-render-host>/health`; if it returns
   `{"status":"ok"}`, the backend is ready for Vercel and mobile traffic.
8. Set `BHRIGUWELT_ADMIN_TOKEN` for production; requests to `/ml/retrain` must
   include the matching `X-Admin-Token` header. If the variable is unset, the
   retrain endpoint stays locked down by returning HTTP 403.
9. Leave the default in-memory rate limiting (60 requests/min per IP) enabled
   unless you front the service with a dedicated gateway; cached responses stay
   fresh for 120 seconds and are invalidated automatically after retraining or
   manuscript edits.

## Backend → Railway

Railway can host the same Python backend as a **Service** that mirrors the
Render settings. Two repository layouts are supported so the build always has
Python + `pip` available:

1. Push this repository to GitHub (Railway will import the repo directly).
2. In Railway, click **New Project → Deploy from GitHub repo** and select your
   fork.
3. If you set the service root to `backend/`, the existing `backend/nixpacks.toml`
   provisions Python 3.11 + `pip` and runs `python -m pip install -r
   requirements.txt`.
4. If you keep the service root at the repository root, the top-level
   `nixpacks.toml` executes the same build commands from inside `backend/` and
   calls the root `./start.sh` wrapper (which cds into `backend/` before running
   the API). This avoids the `pip: not found` Railpack error even when the root
   isn’t restricted to `backend/`.
5. Set the **Build Command** to `python -m pip install -r requirements.txt`.
6. Set the **Start Command** to `./start.sh` (works in both root layouts and
   wraps `PYTHONPATH=src python -m bhriguwelt.api`).
7. Add an environment variable `PYTHONPATH=src` (matches local/testing usage).
8. Make sure both `start.sh` scripts are executable (`chmod +x start.sh` at the
   repo root and inside `backend/`) so Nixpacks can invoke them.
9. Deploy. Once Railway shows the service as running, copy the generated domain
   (for example `https://bhriguwelt-production.up.railway.app`).
10. Validate health with:

   ```bash
   curl https://<your-railway-host>/health
   ```

   A `{\"status\":\"ok\"}` response confirms the backend is ready to pair with the
   Vercel frontend and native clients. Use the copied URL as
   `NEXT_PUBLIC_BACKEND_URL` in Vercel or mobile `.env` files.
11. Keep the [Railway deployment checklist](./railway.md) handy for future
    projects or when teammates are onboarding. It summarizes the required
    commands, environment variables, and smoke tests to avoid `pip: not found`
    or `PYTHONPATH` import errors on new services.

## Frontend → Vercel

1. In Vercel, create a new project and point it at the same GitHub repository.
2. When prompted for the project root, choose `frontend/`.
3. Add the environment variable `NEXT_PUBLIC_BACKEND_URL` and set it to the
   Railway URL created above so server components and client fetches share the
   same base host. This keeps every frontend deployment pinned to the live
   Railway backend rather than the older Render demo URL.
4. (Optional) Add `NEXT_PUBLIC_BACKEND_FALLBACK_URL` to mirror a staging
   backend. The horoscope form will retry against this host whenever the
   primary URL returns a non-2xx response, keeping demos resilient.
5. Deploy using Node 18+ (matches local development). Vercel automatically
   installs dependencies and runs `npm run build`. Preview deployments get
   unique URLs, perfect for QA.
6. After the first successful deploy, enable **Deploy Hooks** in the Vercel
   dashboard so backend retrains (`/ml/retrain`) or manuscript updates can
   trigger a fresh frontend build. Wire the hook URL into your CI or a Render
   cron job.

## Post-deploy API integration checks

1. Confirm the backend health endpoint responds over HTTPS at the Railway
   hostname:

   ```bash
   curl https://<your-railway-host>/health
   ```

2. Visit the Vercel deployment URL and open the browser Network tab. Submit a
   horoscope or past-life request; the network trace should show fetches against
   the Railway domain you set in `NEXT_PUBLIC_BACKEND_URL`.
3. If the frontend falls back to demo data, double-check the Vercel environment
   variable, confirm the backend URL is reachable over HTTPS, and redeploy.
   Successful requests return the same JSON structure as local
   `PYTHONPATH=src pytest` fixtures.
4. Confirm the backend enforces throttling by making two quick POSTs to
   `/future` or `/health` from the same IP; the second call should return HTTP
   429. Cached responses should update after 2-3 minutes or immediately after
   invoking `/ml/retrain` or `/manuscript` with fresh content.

## Mobile apps

- **React Native / Expo**: reuse the fetch helpers from `frontend/lib/api.ts` or
  copy the payload structure visible in the web forms. Point the base URL to the
  Render host.
- **Flutter / Kotlin / Swift**: mirror the JSON bodies described in the backend
  README and API docstrings. Every route returns manuscript citations so they can
  be shown verbatim in native UI components.
- **Offline support**: if devices need offline fallback, bundle the canonical
  folios (see `backend/data/bhrigu_samhita_principles.yml`) and reuse the Python
  package through Pyodide or a microservice running locally on-device.

## Testing the full stack

1. Run `PYTHONPATH=src python -m bhriguwelt.api` inside `backend/`.
2. Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` and launch the frontend
   with `npm run dev`.
3. Exercise every form. The responses should match CLI/pytest outputs because the
   API reuses the same dataclasses.

Keep this doc updated as you add CI/CD, CDN, or infrastructure automation.
