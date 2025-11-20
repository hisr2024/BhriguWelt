# API Reference

Base URL defaults to `http://localhost:8000` when running `PYTHONPATH=src python -m bhriguwelt.api`.

## Health
- `GET /health` → `{ "status": "ok", "source": "Bhrigu Samhita" }`

## Horoscope
- `POST /horoscope`
- Body: `name`, `birth_date`, `birth_time`, `birth_place`, `lunar_tithi` (1-30), `moon_element` (water/fire/air/earth/ether), `mars_house` (1-12), `saturn_house` (1-12), `venus_house` (1-12), `rahu_aspects_ascendant` (bool)
- Returns karmic epoch, principle weights, remedies, past-life insights, and future trajectories.

## Past life
- `POST /past-life`
- Body: same as horoscope
- Returns: `{ name, insights: [...] }`

## Future
- `POST /future`
- Body: same as horoscope
- Returns: `{ name, trajectories: [...] }`

## Matchmaking
- `POST /matchmaking`
- Body: `{ primary: <horoscope body>, partner: <horoscope body>, modern_preferences: ["music", "remote-first"] }`
- Returns compatibility index, breakdown, and modern highlights.

## Calendar conversion
- `POST /calendar`
- Body: `birth_date` (YYYY-MM-DD), `birth_time` (HH:MM, 24h), `birth_place`
- Returns Śaka date, lunar month/phase, and conversion factors.

## Error cases
- Missing required fields → HTTP 400 with message
- Out-of-range lunar tithi/houses or unsupported moon element → HTTP 400 with validation message
