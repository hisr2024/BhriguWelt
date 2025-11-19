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
- **Frontend** (`frontend/`): placeholder React/Vite-ready workspace meant for
  building cross-platform experiences that consume the backend APIs. Treat this
  directory as the landing zone for React Native, Flutter, or Vite projects so
  UI engineers are not blocked by backend changes.
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
   HTTP server (documented below), but teams can also wrap the engines using the
   framework of their choice by importing the `bhriguwelt` package directly. If
   you extend the backend, remember to run the pytest suite from inside
   `backend/` with `PYTHONPATH=src pytest` so the package layout mirrors
   production usage.

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

## Frontend & mobile quick start

The `frontend/` directory intentionally begins as a lightweight scaffold so you
can pick any stack (React, Next.js, Flutter, React Native, etc.). A typical
workflow:

1. Initialize your chosen framework, e.g. `npm create vite@latest bhriguwelt-ui`.
2. Store the generated files under `frontend/` (replacing the `.gitkeep`
   placeholders) and configure your bundler/dev server there.
3. Consume backend APIs via REST/GraphQL and surface the Bhrigu Samhita
   predictions with high-fidelity typography and multilingual support.
4. Mirror the `/calendar` endpoint response in onboarding flows so every new
   profile stores both the Gregorian and Śaka records exactly as required by the
   Samhita manuscripts.

## Contribution guidelines

- Preserve the **Bhrigu-only** sourcing requirement. Every new rule, remedy, or
  narrative string must cite the manuscript folio, language, and archive.
- Organize code by domain: calculations in `calculations.py`, orchestration in
  `horoscope.py`, loaders inside `data_loader.py`, and presentation-only logic
  in the frontend.
- Document any new modules inside the relevant README before opening a PR.

## License

This repository is released under the MIT License so the Bhrigu Samhita wisdom
can be shared responsibly.
