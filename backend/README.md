# Backend (Python)

The backend houses the deterministic Bhrigu Samhita calculation engine. It is a
standard Python package (`bhriguwelt`) that exposes a CLI for generating
horoscope, past-life, future-prediction, and matchmaking narratives.

## Structure

```
backend/
├── data/                      # Canonical Bhrigu Samhita rule corpus
├── src/bhriguwelt/            # Python package source
│   ├── bhrigu_data.py         # Offline copy of the manuscript corpus
│   ├── calculations.py        # Core planetary math + karmic weightings
│   ├── data_loader.py         # YAML/JSON loaders with manuscript citations
│   └── horoscope.py           # CLI + orchestration helpers
├── requirements.txt           # Runtime dependencies
└── tests/                     # Pytest modules (add new suites here)
```

## Local development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
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
```

Outputs reference the originating Bhrigu folios from
`data/bhrigu_samhita_principles.yml` (and the mirrored
`bhriguwelt/bhrigu_data.py` module for offline environments). The matchmaking
engine supports `--modern-preference` tags such as `remote-first`,
`research-partnership`, `startup-ops`, and `arts-collab` to blend sutra guidance
with contemporary relationship goals.

### Testing

Add tests under `backend/tests/` and execute them with:

```bash
pytest
```

(ensure your virtual environment is activated first).
