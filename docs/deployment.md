# Deployment playbook

BhriguWelt is now wired for a two-tier deployment model: the Python backend runs
on Render (or any long-lived VM/container platform) while the React/Next.js
frontend deploys on Vercel. Native apps (Android/iOS) reuse the same HTTP
contracts exposed by the backend.

## Backend → Render

### Fast path (blueprint)

1. Push this repository to GitHub (Render reads the `render.yaml` blueprint at
   the repo root).
2. In the Render dashboard, click **New → Blueprint** and pick your GitHub repo.
3. Render auto-detects `render.yaml`; leave the defaults in place:
   - Runtime: Python 3.11+
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `PYTHONPATH=src python -m bhriguwelt.api`
   - Health check path: `/health`
4. Deploy. Your live API URL will look like
   `https://bhriguwelt-backend.onrender.com`—copy this for the frontend and
   mobile clients.

### Manual service (if you skip the blueprint)

1. Create a **Web Service** in Render and point it at this repo.
2. Set **Root Directory** to `backend` and **Runtime** to Python 3.11.
3. Build command: `pip install -r requirements.txt`
4. Start command: `PYTHONPATH=src python -m bhriguwelt.api`
5. Health check path: `/health`
6. Deploy and watch the Render logs until you see `Serving on ('0.0.0.0', 8000)`.
7. Verify with `curl https://<your-render-host>/health`; if it returns
   `{"status":"ok"}`, the backend is ready for Vercel and mobile traffic.

## Backend → Railway

Railway can host the same Python backend as a **Service** that mirrors the
Render settings:

1. Push this repository to GitHub (Railway will import the repo directly).
2. In Railway, click **New Project → Deploy from GitHub repo** and select your
   fork.
3. When prompted for the root, choose `backend/` so the build runs against the
   Python package.
4. Set the **Build Command** to `pip install -r requirements.txt`.
5. Set the **Start Command** to `PYTHONPATH=src python -m bhriguwelt.api`.
6. Add an environment variable `PYTHONPATH=src` (matches local/testing usage).
7. Deploy. Once Railway shows the service as running, copy the generated domain
   (for example `https://bhriguwelt-production.up.railway.app`).
8. Validate health with:

   ```bash
   curl https://<your-railway-host>/health
   ```

   A `{\"status\":\"ok\"}` response confirms the backend is ready to pair with the
   Vercel frontend and native clients. Use the copied URL as
   `NEXT_PUBLIC_BACKEND_URL` in Vercel or mobile `.env` files.

## Frontend → Vercel

1. In Vercel, create a new project and point it at the same GitHub repository.
2. When prompted for the project root, choose `frontend/`.
3. Add the environment variable `NEXT_PUBLIC_BACKEND_URL` and set it to the
   Render URL created above.
4. Deploy. Vercel automatically installs dependencies and runs `npm run build`.
   Preview deployments get unique URLs, perfect for QA.

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
