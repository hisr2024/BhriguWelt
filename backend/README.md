# Backend (Python)

The backend houses the deterministic Bhrigu Samhita calculation engine. It is a
standard Python package (`bhriguwelt`) that exposes a CLI for generating
horoscope, past-life, future-prediction, matchmaking narratives, and Śaka
calendar conversions for onboarding parity across devices.

## Structure

```
backend/
├── data/                      # Canonical Bhrigu Samhita rule corpus
├── src/bhriguwelt/            # Python package source
│   ├── __init__.py            # Stable exports for CLI/API consumers
│   ├── bhrigu_data.py         # Offline copy of the manuscript corpus
│   ├── calculations.py        # Core planetary math + karmic weightings
│   ├── calendar_conversion.py # Gregorian → Śaka conversion utilities
│   ├── data_loader.py         # YAML/JSON loaders with manuscript citations
│   ├── horoscope.py           # CLI + orchestration helpers
│   └── api.py                 # Zero-dependency HTTP server
├── requirements.txt           # Runtime dependencies
└── tests/                     # Pytest modules (add new suites here)
```

- An OpenAPI snapshot of the HTTP surface ships in `docs/openapi.yaml` for quick
  client generation and contract review.
- Use `python scripts/backup_data.py` (with `PYTHONPATH=src`) to create
  timestamped backups of `data/bhrigu_samhita_principles.yml` under
  `backend/backups/` before changing manuscript data.

## Local development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=src  # keep set for CLI, API, and tests

# Deterministic dependency refresh (requires pip-tools from requirements-dev.txt)
pip-compile requirements.in --output-file requirements.txt

> **Optional Swiss Ephemeris:** For full astronomical precision, install
> `pyswisseph` separately when PyPI access is available. The package is pinned
> via `requirements.in` for repeatability but intentionally omitted from
> `requirements.txt` so test environments without binary wheels can rely on the
> deterministic pure-Python fallbacks baked into the calculation engine.
```

### Environment variables

- `PYTHONPATH=src` (required) keeps imports pointed at the local source tree.
- `BHRIGUWELT_ADMIN_TOKEN` gates `/ml/retrain` in production; set it locally to
  test the admin flow with `X-Admin-Token`.
- `BHRIGU_ML_ENABLED=1` forces ML weighting during development; unset or `0`
  keeps only Bayesian scoring active.
- `BHRIGUWELT_DISABLE_ML_WEIGHTING=1` disables the ML branch entirely for quick
  offline runs.
- `BHRIGUWELT_DATA_PATH` overrides the default corpus path for sandbox
  experiments.
- `AI_API_BASE` and `AI_API_KEY` enable OpenAI-compatible chat completions for the
  `/chat` and `/wisdom-bot` surfaces. Optionally set `AI_MODEL` (defaults to
  `gpt-4o-mini`) and `AI_API_TIMEOUT` (seconds) to control the provider call.

### CLI usage

```bash
export PYTHONPATH=src

# Comprehensive horoscope (includes past + future engines)
python -m bhriguwelt.horoscope horoscope --name "Asha" --birth-date 1995-05-18 \
    --birth-time 14:45 --birth-place "Varanasi" --lunar-tithi 5 --moon-element water \
    --mars-house 10 --saturn-house 2 --venus-house 2 --rahu-aspects-ascendant

# Five-phase karmic roadmap
python -m bhriguwelt.horoscope timeline --name "Asha" --birth-date 1995-05-18 \
    --birth-time 14:45 --birth-place "Varanasi" --lunar-tithi 5 --moon-element water \
    --mars-house 10 --saturn-house 2 --venus-house 2 --rahu-aspects-ascendant --focus-area career

# Annual Varshaphal (12-month karmic digest)
python -m bhriguwelt.horoscope varshaphal --name "Asha" --birth-date 1995-05-18 \
    --birth-time 14:45 --birth-place "Varanasi" --lunar-tithi 5 --moon-element water \
    --mars-house 10 --saturn-house 2 --venus-house 2 --target-year 2026 --focus-area career

# Focused past-life, future, and matchmaking engines
python -m bhriguwelt.horoscope past-life ...
python -m bhriguwelt.horoscope future ...
python -m bhriguwelt.horoscope matchmaking --modern-preference remote-first

# Gregorian → Śaka (Hindu) calendar helper
python -m bhriguwelt.horoscope calendar --birth-date 1995-05-18 --birth-time 14:45 --birth-place "Varanasi"
```

> **Samhita input fidelity:** Both the CLI and HTTP payloads accept the full
> Panchanga-compliant lunar tithi range (1–30) and the complete Mahabhuta set for
> the Moon element (`water`, `fire`, `air`, `earth`, `ether`). Requests outside
> these authentic Indian ranges are rejected early so downstream predictions stay
> aligned with the manuscripts. CLI flags now surface these guardrails directly
> via argparse `choices` so developers see the constraints before payloads reach
> the calculation engine.

Allowed ranges at a glance:

| Field                     | Constraint                                   |
| ------------------------- | --------------------------------------------- |
| `lunar_tithi`             | Integer 1–30 (inclusive)                      |
| `moon_element`            | `water`, `fire`, `air`, `earth`, `ether`      |
| `mars_house`/`saturn_house`/`venus_house` | Integer 1–12 (inclusive)     |

Outputs reference the originating Bhrigu folios from
`data/bhrigu_samhita_principles.yml` (and the mirrored
`bhriguwelt/bhrigu_data.py` module for offline environments). The matchmaking
engine supports `--modern-preference` tags such as `remote-first`,
`research-partnership`, `startup-ops`, and `arts-collab` to blend sutra guidance
with contemporary relationship goals.

### HTTP API usage

For web and mobile clients, run the bundled HTTP server (no third-party
framework required):

```bash
cd backend
PYTHONPATH=src python -m bhriguwelt.api
```

Example `curl` request:

```bash
curl -X POST http://localhost:8000/horoscope \
  -H 'Content-Type: application/json' \
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

Responses mirror the CLI content so the UI layer can display manuscripts,
insights, and remedies verbatim.

Supported routes:

- `GET /health`
- `POST /horoscope`
- `POST /past-life`
- `POST /future`
- `POST /varshaphal` (12-month Bhrigu Varshaphal digest)
- `POST /matchmaking`
- `POST /calendar` (Gregorian → Śaka conversion with IST reference)
- `POST /transits` (transit directives for an existing natal chart)
- `POST /core-wisdom` (8-section Bhrigu Core Wisdom digest for web/mobile apps)
- `POST /timeline` (five-phase karmic roadmap matching the UX timeline brief)
- `POST /wisdom-aggregator` (bot-friendly manuscript aggregate spanning all engines)
- `GET /manuscript` (retrieve the currently loaded Bhrigu corpus)
- `POST /manuscript` (persist an updated corpus to disk for offline use)

Every route is powered by the same request/response dataclasses, so backend
consumers, CLI tooling, and HTTP integrations all stay in sync even when new
manuscript folios are added.

#### Admin & offline manuscript updates

- The API supports `GET /manuscript` to fetch the in-use corpus and `POST
  /manuscript` to persist an updated payload (YAML when available, JSON as a
  fallback). Payloads must include a `principles` list and optional `metadata`
  mapping.
- Set `BHRIGUWELT_DATA_PATH` to point the backend at a writable file for local
  testing or ephemeral environments; it defaults to
  `backend/data/bhrigu_samhita_principles.yml`.
- Successful updates invalidate the response cache so subsequent horoscope
  calls reflect the new folios immediately.

#### Rate limiting & caching

- The zero-dependency HTTP server now ships with an in-memory rate limiter
  (default: 60 requests per minute per client IP) that returns `429` when the
  window is exceeded.
- Idempotent requests are cached in-memory for a short TTL to reduce repeated
  computation across the same payloads. The cache clears automatically when
  manuscript data is updated. The `aiohttp`-powered async server mirrors this
  behaviour with a non-blocking cache so event-loop latency stays low even on
  bursty traffic.

### Testing & deployment

Add tests under `backend/tests/` and execute them with the same module layout
used in production:

```bash
cd backend
PYTHONPATH=src pytest --cov=src --cov-report=xml
```

(ensure your virtual environment is activated first so the package resolves to
the local source tree). Install dev dependencies with `pip install -r
requirements-dev.txt` if your environment does not ship `pytest` by default.
The suite now includes threaded HTTP integration tests, so both handler
functions and the live API surface stay in sync.

#### Render blueprint

The repository root ships with a `render.yaml` blueprint that provisions the
backend as a Python Web Service. There is no default hosted instance; you must
deploy it yourself using the steps below. The build/start commands mirror local
development so PYTHONPATH is set and `pip` is guaranteed to exist:

```yaml
services:
  - type: web
    name: bhriguwelt-backend
    env: python
    rootDir: backend
    buildCommand: python -m pip install -r requirements.txt
    startCommand: ./start.sh  # exports PYTHONPATH=src before launching the API
    healthCheckPath: /health
```

Connect your GitHub repo inside Render, point it at this blueprint, and every
push will deploy the API used by the Vercel-hosted frontend as well as mobile
clients. If you prefer configuring a Web Service manually, mirror the settings
from the blueprint (`rootDir=backend`, Python 3.11, the build/start commands
above, and a `/health` check). See `docs/deployment.md` for a click-by-click
Render walk-through.

After Render finishes the first deploy, confirm the service is reachable:

```bash
curl https://<your-render-host>/health
```

> **Deployment note:** The blueprint locks the service to Python 3.11 and the
> included zero-dependency HTTP server. If you introduce dependencies, add them
> to `requirements.txt` so Render caches them between builds.

#### Railway service (alternative)

Railway can run the same backend as a Python **Service** without any code
changes. Two layouts are supported so Nixpacks always installs Python and `pip`:

1. Create a new Railway project and deploy from this GitHub repository.
2. If you set the project root to `backend/`, the included `backend/nixpacks.toml`
   provisions Python 3.11 and runs `python -m pip install -r requirements.txt`.
3. If you keep the Railway root at the repository root, the top-level
   `nixpacks.toml` executes the same build commands from within `backend/` and
   calls the root `./start.sh` wrapper (which cds into `backend/` before running
   `python -m bhriguwelt.api`).
4. Build command: `python -m pip install -r requirements.txt` (works in either
   layout because the Nixpacks files explicitly provide `python311Packages.pip`).
5. Start command: `./start.sh` (uses the correct wrapper in both root
   configurations and exports `PYTHONPATH=src`).
6. Add environment variable `PYTHONPATH=src` so the package resolves like local
   development.
7. Ensure both `start.sh` scripts are executable (`chmod +x start.sh` at the
   repo root and inside `backend/`) so Nixpacks can invoke them.
8. After deploy, hit `https://<your-railway-host>/health` and expect
   `{ "status": "ok" }` before wiring the URL into Vercel or mobile clients.

## Environment and CI helpers

- Copy `.env.example` to `.env` to mirror local settings used in deployment
  blueprints (including `HOST`, `PORT`, optional `BHRIGU_DATA_PATH` if you
  relocate the dataset, and `SENTRY_DSN` when telemetry is enabled). The start
  script reads these values automatically and exports `PYTHONPATH=src` before
  launching.
- Optional telemetry: set `SENTRY_DSN` (and `ENVIRONMENT` if you want to label
  staging vs. production) to capture unhandled API errors in Sentry. When the
  SDK is unavailable, the API continues running with no additional overhead.
- Backend GitHub Action (`Backend CI`) installs dependencies and runs
  `PYTHONPATH=src pytest` on pushes/PRs touching backend assets.
- Endpoint request/response formats are documented in `../docs/api_reference.md`.
