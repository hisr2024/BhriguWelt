# BhriguWelt Astrology Platform

BhriguWelt is a full-stack scaffold for delivering astrology experiences whose
entire knowledge base is sourced from the **Bhrigu Samhita** corpus. The
repository is organized for teams that need a clean separation between backend
prediction services and frontend delivery layers while keeping authoritative
references to manuscript folios.

## Architecture

- **Backend** (`backend/`): Python package responsible for ingesting Bhrigu
  Samhita data (mirrored both as `data/bhrigu_samhita_principles.yml` and a
  fallback `bhriguwelt/bhrigu_data.py` module), applying deterministic
  calculations, converting Gregorian birth records into the Hindu Śaka calendar,
  and exposing CLI/API entry points for horoscopes, past-life readings, future
  directives, matchmaking diagnostics, and calendar conversions. The backend is
  intentionally self-contained so mobile/web stacks can embed it without
  third-party runtime dependencies.
- **Frontend** (`frontend/`): production-grade Next.js app that already ships
  responsive flows for the horoscope, past-life, future, matchmaking, and Śaka
  calendar engines. It consumes the backend REST API via
  `NEXT_PUBLIC_BACKEND_URL`, builds with `npm run build`, and deploys straight to
  Vercel for immediate testing across desktop and mobile web. Point
  `NEXT_PUBLIC_BACKEND_URL` to a Render deployment, local tunnel, or any HTTPS
  instance of the Python API before running `npm run dev`, `npm run build`, or
  `npm run start`.
- **Documentation** (`docs/`): reference notes that enumerate the manuscript
  citations backing each rule embedded in the backend data files, plus targeted
  guides (for example the Hindu calendar conversion explainer).

## Repository layout

```
├── README.md
├── backend/
│   ├── data/
│   │   └── bhrigu_samhita_principles.yml
│   ├── requirements.txt
│   ├── src/bhriguwelt/
│   │   ├── __init__.py
│   │   ├── bhrigu_data.py
│   │   ├── calculations.py
│   │   ├── calendar_conversion.py
│   │   ├── data_loader.py
│   │   └── horoscope.py
│   └── tests/
├── docs/
│   ├── bhrigu_references.md
│   └── hindu_calendar_conversion.md
└── frontend/
    ├── public/
    └── src/
```

## Deployment readiness (Render + Vercel + Railway)

No live instances are bundled with the repository; you must deploy the backend
and frontend yourself. Follow the host-specific steps below to get an endpoint
ready for web and mobile clients:

1. **Backend → Render**: Connect the repo in Render and apply the included
   `render.yaml` blueprint (or follow the manual Web Service steps in
   `docs/deployment.md`). The blueprint uses `python -m pip install -r
   requirements.txt` plus `./start.sh` (which exports `PYTHONPATH=src` and
   runs the API) so the build mirrors local development. Once deployed, verify
   the service responds with a health payload:

   ```bash
   curl https://<your-render-host>/health
   ```

2. **Backend → Railway (alternative)**: If you prefer Railway, deploy the
   backend as a Python service and let the Nixpacks config supply Python 3.11
   and `pip`:
   - If your Railway root is set to `backend/`, the existing `backend/nixpacks.toml`
     handles setup plus `python -m pip install -r requirements.txt`.
   - If your Railway root stays at the repository root, the top-level
     `nixpacks.toml` runs the same `python -m pip install -r requirements.txt`
     flow from within `backend/` and invokes the root `./start.sh` wrapper
     (which cds into `backend/` before running the API). Both paths avoid the
     "pip: not found" Railpack error by explicitly provisioning `python311` and
     `python311Packages.pip`.
   - Ensure both `start.sh` scripts are executable (`chmod +x start.sh` at the
     repo root and inside `backend/`) before triggering a deploy so Nixpacks can
     invoke the wrapper successfully.
   - Add `PYTHONPATH=src` as an environment variable and confirm `/health`
     returns `{ "status": "ok" }`. See `docs/deployment.md` for the
     click-by-click flow plus the Railpack/Nixpacks notes.

3. **Frontend → Vercel**: Point Vercel at the `frontend/` directory (Node 18+)
   and set `NEXT_PUBLIC_BACKEND_URL` to the Render or Railway URL. After
   deployment, load the Vercel preview in a browser and submit each form
   (horoscope, past-life, future, matchmaking, calendar) to confirm responses
   render.
   - If the preview cannot reach your backend, double-check that the Render or
     Railway service is using the `python -m pip install -r requirements.txt`
     build command and that `./start.sh` is executable (`chmod +x start.sh`).

4. **Local parity**: Run `PYTHONPATH=src python -m bhriguwelt.api` inside
   `backend/`, export `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`, and run
   `npm run dev` from `frontend/` to mirror the hosted topology without needing
   cloud accounts.

## Backend quick start

1. Create an isolated environment inside `backend/` and install dependencies:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Generate a horoscope prediction sourced from the Bhrigu Samhita wisdom:

   ```bash
   export PYTHONPATH=src
   python -m bhriguwelt.horoscope horoscope \
       --name "Asha" \
       --birth-date 1995-05-18 \
       --birth-time 14:45 \
       --birth-place "Varanasi"
   ```

   The CLI prints karmic backlog, present-life guidance, and remedial rituals
   along with explicit manuscript citations pulled from the data corpus.

   > **Input guardrails:** Lunar tithis follow the Panchanga's full 1–30 range
   > and the Moon element accepts all five Mahabhutas (water, fire, air, earth,
   > ether) so the predictions remain faithful to the Bhrigu Samhita lineage.

3. Explore the dedicated engines documented in the CLI help:

   ```bash
   # Past-life memory reconstruction
   python -m bhriguwelt.horoscope past-life ...

   # Future directives
   python -m bhriguwelt.horoscope future ...

   # Modern Bhrigu matchmaking (supports --modern-preference tags)
   python -m bhriguwelt.horoscope matchmaking ...

   # Gregorian → Hindu (Śaka) calendar conversion helper
   python -m bhriguwelt.horoscope calendar \
       --birth-date 1995-05-18 \
       --birth-time 14:45 \
       --birth-place "Varanasi"
   ```

4. Build the UI/API bridge. The backend already ships with an offline-friendly
   HTTP server (documented below), and the `/frontend` Next.js experience calls
   it out of the box (see the Frontend quick start below). If you extend the
   backend, remember to run the pytest suite from inside
   `backend/` with `PYTHONPATH=src pytest` so the package layout mirrors
   production usage. To validate the web bundle, run `npm run lint` and `npm run
   type-check` from within `frontend/` after pointing
   `NEXT_PUBLIC_BACKEND_URL` at your chosen backend.

### Lightweight HTTP API

BhriguWelt already includes a zero-dependency HTTP server for mobile or web
clients. Launch it from the backend workspace:

```bash
cd backend
PYTHONPATH=src python -m bhriguwelt.api
```

Endpoints:

- `GET /health` – readiness probe referencing the Bhrigu Samhita source.
- `POST /horoscope` – accepts the same payload as the CLI arguments and
  responds with karmic epochs plus past/future narratives.
- `POST /past-life`, `POST /future`, `POST /matchmaking` – specialized engines
  for the dedicated experiences.
- `POST /calendar` – converts the supplied Gregorian birth record into the
  Hindu Śaka calendar (Śaka year, month, day, and IST reference notes).

Each POST body must supply the fields listed in `HoroscopeRequest` (see
`backend/src/bhriguwelt/horoscope.py`). Responses mirror the CLI output so the
frontend/mobile layers can present manuscripts alongside insights.

- A concise OpenAPI spec lives at `docs/openapi.yaml` and mirrors the
  validation rules enforced by the CLI/API handlers for `/health`, `/horoscope`,
  `/past-life`, `/future`, `/matchmaking`, and `/calendar`.
- A dataset backup helper is available via `cd backend && PYTHONPATH=src python
  scripts/backup_data.py`, which writes timestamped copies into
  `backend/backups/` for safe archival.
- Frontend telemetry is opt-in through `NEXT_PUBLIC_SENTRY_DSN`; without the
  DSN, telemetry calls become no-ops to preserve the zero-dependency baseline.

## Frontend & mobile quick start

The `frontend/` directory now contains a ready-to-ship Next.js application that
mirrors every backend capability.

```bash
cd frontend
npm install
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npm run dev
```

- `npm run build` matches the production bundle Vercel produces before serving
  the UI from its edge network.
- `npm run lint` / `npm run type-check` keep the React codebase aligned with the
  backend schema.
- The UI ships with a Hindi/English language toggle, ARIA-labelled forms, and
  live regions so screen readers can pick up validation states and results.
- Optional Playwright smoke tests live in `frontend/tests/e2e/`; install
  `@playwright/test` locally and run `npm run test:e2e` to validate form
  submissions against mocked backend responses.
- The bundled forms demonstrate the exact JSON payload expected by `/horoscope`,
  `/past-life`, `/future`, `/matchmaking`, and `/calendar`, so React Native or
  Flutter teams can reuse the same contracts when shipping Android/iOS builds.

See `docs/deployment.md` for Render (backend) and Vercel (frontend) recipes plus
notes on mobile packaging.

## Environment quick-start files

- Backend: copy `backend/.env.example` to `.env` and adjust `HOST`/`PORT` or
  `BHRIGU_DATA_PATH` as needed.
- Frontend: copy `frontend/.env.example` and point `NEXT_PUBLIC_BACKEND_URL` to
  your Render/Railway/local backend.

## CI/CD

GitHub Actions guardrails ship with the repo:
- `Backend CI` runs pytest with `PYTHONPATH=src`.
- `Frontend CI` installs dependencies, lints, and type-checks with Node 18.

## API reference and docs

- Endpoint contracts live in `docs/api_reference.md`.
- Deployment playbooks and hosting options are in `docs/deployment.md`.
- Backup and recovery guidance is documented in
  `docs/backup_and_recovery.md`.

## Contribution and community guidelines

- Start with `CONTRIBUTING.md` for style, testing, and sourcing rules that keep
  every addition aligned with Bhrigu Samhita folios.
- `CODE_OF_CONDUCT.md` outlines expected behavior.
- `SECURITY.md` describes how to report vulnerabilities privately.

## License

This repository is released under the MIT License (`LICENSE`) so the Bhrigu
Samhita wisdom can be shared responsibly.
