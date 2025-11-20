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

## Local development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=src  # keep set for CLI, API, and tests
```

### CLI usage

```bash
export PYTHONPATH=src

# Comprehensive horoscope (includes past + future engines)
python -m bhriguwelt.horoscope horoscope --name "Asha" --birth-date 1995-05-18 \
    --birth-time 14:45 --birth-place "Varanasi" --lunar-tithi 5 --moon-element water \
    --mars-house 10 --saturn-house 2 --venus-house 2 --rahu-aspects-ascendant

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
- `POST /matchmaking`
- `POST /calendar` (Gregorian → Śaka conversion with IST reference)

Every route is powered by the same request/response dataclasses, so backend
consumers, CLI tooling, and HTTP integrations all stay in sync even when new
manuscript folios are added.

### Testing & deployment

Add tests under `backend/tests/` and execute them with the same module layout
used in production:

```bash
cd backend
PYTHONPATH=src pytest
```

(ensure your virtual environment is activated first so the package resolves to
the local source tree).

#### Render blueprint

The repository root ships with a `render.yaml` blueprint that provisions the
backend as a Python Web Service:

```yaml
services:
  - type: web
    name: bhriguwelt-backend
    env: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: PYTHONPATH=src python -m bhriguwelt.api
    healthCheckPath: /health
```

Connect your GitHub repo inside Render, point it at this blueprint, and every
push will deploy the API used by the Vercel-hosted frontend as well as mobile
clients.
