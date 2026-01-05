# Deployment playbook

BhriguWelt uses a two-tier deployment model: the Python backend runs on Render
while the React/Next.js frontend deploys on Vercel. Native apps (Android/iOS)
reuse the same HTTP contracts exposed by the backend. No hosted instances ship
with the repository, so follow the steps below to publish your own endpoints
before testing clients.

> **HTTPS only:** Configure every public URL (backend and frontend) with TLS and
> keep `NEXT_PUBLIC_BACKEND_URL` pointed to an HTTPS origin. The Next.js
> `middleware.ts` automatically redirects `http://` traffic to `https://` when
> reverse proxies forward the `x-forwarded-proto` header.

## Backend → Render

Render hosts the backend with the included [`render.yaml`](../render.yaml)
blueprint. It provisions Python 3.11, attaches a persistent disk for manuscript
updates, and wires the same start command used locally.

1. In Render, click **New + → Blueprint** and point it at your GitHub fork. Keep
   the repo root unchanged; the blueprint already scopes the service to
   `backend/`.
2. The blueprint sets `pythonVersion: 3.11`, runs `pip install -r
   requirements.txt`, and starts the API via `./start.sh` (which exports
   `PYTHONPATH` automatically).
3. Accept the `bhriguwelt-data` disk mount at `/opt/render/project/data`; the
   start script seeds `BHRIGUWELT_DATA_PATH` with the canonical corpus on first
   boot so `/manuscript` updates persist across deploys.
4. Render auto-generates `BHRIGUWELT_ADMIN_TOKEN`. Add any optional AI
   variables (`AI_API_KEY`, `AI_API_BASE`, `AI_MODEL`, `OPENAI_API_KEY`) in the
   dashboard to enable chatbot flows.
5. Once the service is live, hit `https://<render-host>/health` to verify
   `{"status":"ok"}` and propagate the URL to the frontend as
   `NEXT_PUBLIC_BACKEND_URL`.
6. Keep the [Render deployment checklist](./render-deployment.md) handy for
   future projects or when teammates are onboarding. It summarizes the required
   commands, environment variables, and smoke tests to avoid `pip: not found`
   or `PYTHONPATH` import errors on new services.

## Backend → Railway (optional alternative)

Railway can also host the Python backend as a **Service**. Two repository layouts
are supported so the build always has Python + `pip` available:

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
   wraps `PYTHONPATH="$(pwd)/src" python -m bhriguwelt.api`).
7. Add environment variables:
   - `PYTHONPATH="$(pwd)/src"` for module resolution.
   - `PYTHONUNBUFFERED=1` for realtime logs in Railway.
8. Make sure both `start.sh` scripts are executable (`chmod +x start.sh` at the
   repo root and inside `backend/`) so Nixpacks can invoke them.
9. Deploy. Once Railway shows the service as running, copy the generated domain
   (for example `https://bhriguwelt-production.up.railway.app`).
10. Validate health with:

   ```bash
   curl https://<your-railway-host>/health
   ```

   A `{"status":"ok"}` response confirms the backend is ready to pair with the
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
   Render URL created above so server components and client fetches share the
   same base host.
4. (Optional) Add `NEXT_PUBLIC_BACKEND_FALLBACK_URL` to mirror a staging
   backend. The horoscope form will retry against this host whenever the
   primary URL returns a non-2xx response, keeping demos resilient.
5. Confirm the build/start commands:
   - **Build Command**: `npm run build` (defaults to `next build`).
   - **Start Command**: `npm run start` for production (Vercel runs this for
     previews and production automatically).
6. Deploy using Node 18+ (matches local development). Vercel automatically
   installs dependencies and runs `npm run build`. Preview deployments get
   unique URLs, perfect for QA.
7. After the first successful deploy, enable **Deploy Hooks** in the Vercel
   dashboard so backend retrains (`/ml/retrain`) or manuscript updates can
   trigger a fresh frontend build. Wire the hook URL into your CI or a Render
   cron job.

## Post-deploy API integration checks

1. Confirm the backend health endpoint responds over HTTPS at the Render
   hostname:

   ```bash
   curl https://<your-render-host>/health
   ```

2. Visit the Vercel deployment URL and open the browser Network tab. Submit a
   horoscope or past-life request; the network trace should show fetches against
   the Render domain you set in `NEXT_PUBLIC_BACKEND_URL`.
3. Run a basic horoscope request against the Render API using the same payloads
   documented in [`docs/openapi-examples.md`](./openapi-examples.md):

   ```bash
   curl -X POST https://<your-render-host>/horoscope \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Aditi",
       "birth_date": "1995-05-18",
       "birth_time": "07:45",
       "birth_place": "Jaipur, India",
       "tradition": "universal",
       "timezone": "Asia/Kolkata"
     }'
   ```

   A 200 response with `karmic_epoch` confirms the compute pipeline is healthy.
4. If the frontend falls back to demo data, double-check the Vercel environment
   variable, confirm the backend URL is reachable over HTTPS, and redeploy.
   Successful requests return the same JSON structure as local
   `PYTHONPATH="$(pwd)/src" pytest` fixtures.
5. Confirm the backend enforces throttling by making two quick POSTs to
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

1. Run `PYTHONPATH="$(pwd)/src" python -m bhriguwelt.api` inside `backend/`.
2. Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` and launch the frontend
   with `npm run dev`.
3. Exercise every form. The responses should match CLI/pytest outputs because the
   API reuses the same dataclasses.

Keep this doc updated as you add CI/CD, CDN, or infrastructure automation.
