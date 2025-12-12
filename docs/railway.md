# Railway deployment checklist (backend)

This guide walks through deploying the Python backend to Railway with the same
settings used in local development and CI. Follow every step to avoid the common
"pip: not found" and `PYTHONPATH` import errors that can surface on fresh
services.

## Prerequisites
- A fork of this repository connected to your GitHub account.
- Railway project access with permission to create a new **Service**.
- Python 3.11 is provided automatically by the included `nixpacks.toml`
  templates; no extra runtime selection is required.

## 1) Choose your service root
Railway supports two layouts and the repo ships Nixpacks configs for both:

- **Backend root (`backend/`)** – Point Railway at `backend/` and it will pick up
  `backend/nixpacks.toml` automatically. Build and start commands run from the
  backend directory.
- **Repository root** – Keep the root at `/` and Railway will use the top-level
  `nixpacks.toml`. It CDs into `backend/` for the build and uses the root
  `./start.sh` wrapper to launch the API.

Either layout installs `python311` + `pip`, runs `python -m pip install -r
requirements.txt`, and exports `PYTHONPATH` before starting the server.

## 2) Configure build + start commands
Set these explicitly in the Railway dashboard to mirror local runs:

- **Build Command:** `python -m pip install -r requirements.txt`
- **Start Command:** `./start.sh`

The start script handles `PYTHONPATH` and respects `.env` overrides when
present, so HOST/PORT stay aligned between Railway and your local environment.

## 3) Environment variables
Add the following variables to the Service:

- `PYTHONPATH=src`
- `BHRIGUWELT_ADMIN_TOKEN=<choose-a-strong-token>` (needed for `/ml/retrain`)
- Optional toggles:
  - `BHRIGU_ML_ENABLED=1` to force ML weighting in production
  - `BHRIGUWELT_DISABLE_ML_WEIGHTING=1` to disable ML when testing pure Bayesian
    scoring
  - `BHRIGUWELT_DATA_PATH` if you want to store the manuscript corpus outside the
    repo path

## 4) Permissions on start scripts
Ensure both start scripts are executable so Nixpacks can run them:

```bash
chmod +x start.sh backend/start.sh
```

If you commit this change locally, push it so the GitHub import that Railway
uses can read the updated file modes.

## 5) Deploy and verify
1. Trigger a deploy from the Railway dashboard.
2. Wait for the logs to show the "BhriguWelt API running on" message with the
   assigned port.
3. Confirm the service is healthy:

   ```bash
   curl https://<your-railway-host>/health
   ```

   A `{ "status": "ok" }` response confirms the server started with the correct
   `PYTHONPATH` and dependency set.

4. Smoke-test multiple engines to ensure manuscript data loaded correctly:
   - `POST /horoscope` for a full reading
   - `POST /future` for future predictions
   - `POST /past-life` to validate karmic lookups
   - `POST /matchmaking` to check modern preference handling

## 6) Wire up downstream clients
- Set `NEXT_PUBLIC_BACKEND_URL` in the Vercel frontend (or `.env` in mobile apps)
  to the Railway hostname, e.g., `https://bhriguwelt-production.up.railway.app`.
- If you use a staging backend, add `NEXT_PUBLIC_BACKEND_FALLBACK_URL` so the UI
  can retry against it when the primary host is unreachable.

## 7) Ongoing maintenance
- Use the `/manuscript` endpoints to refresh the corpus; cached responses clear
  automatically after updates.
- Keep `requirements.txt` up to date with any new dependencies so Nixpacks caches
  stay warm and rebuilds remain deterministic.
- Retain the default rate limiting (60 req/min/IP) unless you front the service
  with an external gateway.
