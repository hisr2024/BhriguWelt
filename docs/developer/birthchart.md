# Birth Chart Feature Developer Guide

## Overview
This module adds a mobile-first birth chart workflow that computes planetary placements, generates a templated interpretation, and renders a lightweight SVG natal wheel. The backend endpoint lives in `backend/api_birthchart.py`, while the UI flows live under `frontend/app/birthchart/`.

## Dependencies
Install the Python packages required for computation and tests:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# or explicitly:
pip install pyswisseph timezonefinder python-dateutil pytest
```

Optional geocoding environment variable:

```bash
export GEOCODING_API_KEY=your_key_here
```

Enable Swiss Ephemeris by ensuring `pyswisseph` is installed (already in `backend/requirements.txt`).

## API Contract
**POST** `/api/v1/birthchart/compute`

Example request:

```json
{
  "name": "Asha",
  "dob": "1993-08-10",
  "time": "14:45",
  "timezone": "Asia/Kolkata",
  "latitude": 19.076,
  "longitude": 72.8777,
  "place_name": "Mumbai",
  "house_system": "Placidus",
  "options": {
    "detailed_interpretation": true,
    "include_remedies": false,
    "language": "en",
    "system": "vedic"
  }
}
```

Example response:

```json
{
  "profile": {
    "name": "Asha",
    "dob": "1993-08-10",
    "time": "14:45",
    "timezone": "Asia/Kolkata",
    "latitude": 19.076,
    "longitude": 72.8777,
    "place_name": "Mumbai",
    "house_system": "Placidus",
    "time_unknown": false
  },
  "chart": {
    "datetime_utc": "1993-08-10T09:15:00+00:00",
    "timezone": "Asia/Kolkata",
    "ascendant": { "sign": "Libra", "degree": 13.24, "house": 1 },
    "planets": {
      "sun": { "sign": "Leo", "degree": 17.2, "longitude": 137.2, "house": 11 },
      "moon": { "sign": "Aries", "degree": 5.18, "longitude": 5.18, "house": 6 }
    },
    "houses": [
      { "house": 1, "degree": 189.23, "sign": "Libra" }
    ],
    "aspects": [
      { "planet1": "sun", "planet2": "moon", "type": "trine", "orb": 1.2 }
    ],
    "elements": { "fire": 3, "earth": 4, "air": 2, "water": 1 },
    "nakshatra": "Swati"
  },
  "interpretation": {
    "summary": "...",
    "sections": [
      { "title": "Career & Wealth", "text": "...", "score": 0.82 }
    ],
    "placements": {
      "sun": "Sun in Leo at 17.2° suggests ..."
    },
    "confidence": 0.86
  },
  "confidence": 0.86,
  "metadata": { "generated_at": "...", "engine": "pyswisseph-2.10.3.2" }
}
```

### Toggle Vedic vs Western
Use `options.language` or `options.system` to adjust interpretation templates. The current implementation ships with a small rule corpus that blends Western placements with Vedic triggers (Moon nakshatra + Rahu/Ketu axis). Extend the template corpus in `backend/api_birthchart.py` for deeper support.

## Running Locally
### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=backend.app
flask run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Tests
```bash
pytest -q
```

## Mobile Design Notes
- Single-column layout by default; dual-column layout activates on medium screens and above.
- Birth chart wheel is an SVG with touch drag + pinch to zoom.
- Planet chips are minimum 44px touch targets and open modals.
- Reduced-motion preference is respected in the wheel animations.
- Offline-first: last chart is cached in `localStorage` for instant viewing.
- PDF/share actions use `window.print()` and `navigator.share()` to avoid re-fetching.

## Developer Checklist
- [ ] Confirm `/api/v1/birthchart/compute` returns validation errors via `BhriguAPIHandler.send_error`.
- [ ] Verify Vedic trigger text includes the Moon nakshatra and Rahu/Ketu axis in summary.
- [ ] Test mobile viewports: iPhone SE, iPhone 12, Pixel 5.
- [ ] Emulate slow 3G in Playwright CI tests (see `frontend/e2e/birthchart-mobile.spec.ts`).
- [ ] Ensure JS bundle for birth chart page stays under 200KB gzipped (use dynamic imports for the wheel).
- [ ] Confirm offline view loads from local cache after refreshing the page.

## Demo Dataset (used in tests)
```json
{
  "name": "Demo",
  "dob": "1990-01-01",
  "time": "12:00",
  "timezone": "UTC",
  "latitude": 0,
  "longitude": 0,
  "place_name": "Null Island",
  "house_system": "Placidus",
  "options": { "detailed_interpretation": true, "language": "en" }
}
```
