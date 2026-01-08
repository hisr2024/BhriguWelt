# Render deployment checklist for the backend

Use the repository-level [`render.yaml`](../render.yaml) blueprint to deploy the
Python backend as a Render Web Service. The blueprint mirrors local development
(`./start.sh` exports `PYTHONPATH` and runs `python -m bhriguwelt.api`) and
attaches a persistent disk so `/manuscript` updates survive restarts.

## One-time setup

1. In Render, click **New + → Blueprint** and select this repository.
2. Leave the repository root unchanged; the blueprint scopes the service to
   `backend/` so build/start commands run where `requirements.txt` lives.
3. Accept the defaults defined in the blueprint:
   - **Runtime:** Python 3.11
   - **Build command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start command:** `./start.sh` (reads `.env` when present and seeds the Bhrigu corpus)
   - **Health check:** `/health`
4. Keep the `bhriguwelt-data` disk mounted at `/opt/render/project/data`. The
   start script initializes `BHRIGUWELT_DATA_PATH` with the canonical corpus on
   first boot so manuscript edits persist across deploys.

## Environment variables

- `PYTHONPATH=/opt/render/project/src/backend/src` (set in the blueprint)
- `BHRIGUWELT_DATA_PATH=/opt/render/project/data/bhrigu_samhita_principles.yml`
  (set in the blueprint; uses the persistent disk mount)
- `BHRIGUWELT_ADMIN_TOKEN` is auto-generated. Copy it if you plan to call
  `/ml/retrain` or manage manuscripts from CI.
- Optional AI settings for chatbot + wisdom endpoints:
  - `AI_API_KEY`, `AI_API_BASE`, `AI_MODEL`
  - `OPENAI_API_KEY`, `OPENAI_BASE_URL`
- (Optional) Observability: `SENTRY_DSN` and `ENVIRONMENT`

Add any secrets in the Render dashboard after the first deploy; the blueprint
only pins defaults and secure generated values.

## Astrology calculator dependencies

Birth chart and compatibility endpoints require the following Python packages
to be installed in the backend environment (they are listed in
`backend/requirements.txt` for Render builds):

- `ephem`
- `pytz`
- `timezonefinder`
- `geopy`

## Smoke tests after deploy

1. Verify health:

   ```bash
   curl https://<render-host>/health
   # → {"status":"ok"}
   ```

2. Confirm the manuscript file exists on the attached disk (first start seeds
   it automatically):

   ```bash
   # Requires the Render Shell
   ls -l /opt/render/project/data/bhrigu_samhita_principles.yml
   ```

3. Exercise a prediction endpoint with minimal payload (replace placeholders):

   ```bash
   curl -X POST https://<render-host>/past-life \
     -H "Content-Type: application/json" \
     -d '{
           "name": "Asha",
           "birth_date": "1995-05-18",
           "birth_time": "14:45",
           "birth_place": "Varanasi",
           "lunar_tithi": 5,
           "moon_element": "water",
           "mars_house": 10,
           "saturn_house": 2,
           "venus_house": 2,
           "rahu_aspects_ascendant": true
         }'
   ```

4. If you plan to let admins upload updated folios, use the `BHRIGUWELT_ADMIN_TOKEN`
   value in an `X-Admin-Token` header when calling `/manuscript` or `/ml/retrain`.

## Frontend pairing

Point the Vercel frontend at the Render URL with
`NEXT_PUBLIC_BACKEND_URL=https://<render-host>` (and optional
`NEXT_PUBLIC_BACKEND_FALLBACK_URL` for a staging service). The health endpoint
must return `{"status":"ok"}` before the forms will switch off demo data.
