# Deployment playbook

BhriguWelt is now wired for a two-tier deployment model: the Python backend runs
on Render (or any long-lived VM/container platform) while the React/Next.js
frontend deploys on Vercel. Native apps (Android/iOS) reuse the same HTTP
contracts exposed by the backend.

## Backend → Render

1. Ensure your repository is pushed to GitHub.
2. In Render, create a new Web Service **from blueprint** and select the
   `render.yaml` file in the repo root.
3. Confirm the defaults:
   - Runtime: Python 3.11+
   - Build command: `pip install -r requirements.txt`
   - Start command: `PYTHONPATH=src python -m bhriguwelt.api`
   - Health check path: `/health`
4. Deploy. Render will output a base URL such as
   `https://bhriguwelt-backend.onrender.com`. Use this host for all client calls
   (web, Android, iOS, partners).

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
