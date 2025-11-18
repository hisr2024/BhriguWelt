# BhriguWelt Astrology Platform

BhriguWelt is a full-stack scaffold for delivering astrology experiences whose
entire knowledge base is sourced from the **Bhrigu Samhita** corpus. The
repository is organized for teams that need a clean separation between backend
prediction services and frontend delivery layers while keeping authoritative
references to manuscript folios.

## Architecture

- **Backend** (`backend/`): Python package responsible for ingesting
  Bhrigu Samhita data (mirrored both as `data/bhrigu_samhita_principles.yml` and a
  fallback `bhriguwelt/bhrigu_data.py` module), applying deterministic
  calculations, and exposing CLI/API entry points for horoscopes, past-life
  readings, future directives, and matchmaking diagnostics.
- **Frontend** (`frontend/`): placeholder React/Vite-ready workspace meant for
  building cross-platform experiences that consume the backend APIs.
- **Documentation** (`docs/`): reference notes that enumerate the manuscript
  citations backing each rule embedded in the backend data files.

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
│   │   ├── data_loader.py
│   │   └── horoscope.py
│   └── tests/
├── docs/
│   └── bhrigu_references.md
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
   ```

4. (Optional) Add API endpoints by introducing a FastAPI or Flask app inside
   `backend/src` and importing the existing `horoscope` helpers.

## Frontend quick start

The `frontend/` directory intentionally begins as a lightweight scaffold so you
can pick any stack (React, Next.js, Flutter web, etc.). A typical flow:

1. Initialize your chosen framework, e.g. `npm create vite@latest bhriguwelt-ui`.
2. Store the generated files under `frontend/` (replacing the `.gitkeep`
   placeholders).
3. Consume backend APIs via REST/GraphQL and surface the Bhrigu Samhita
   predictions with high-fidelity typography and multilingual support.

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
