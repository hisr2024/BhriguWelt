# API Reference

Base URL defaults to `http://localhost:8000` when running `PYTHONPATH="$(pwd)/src" python -m bhriguwelt.api`.

For machine-readable contracts, see `openapi.yaml` in this directory; it mirrors
the validation rules and response shapes enforced by the CLI/API handlers.

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
- `POST /matchmaking/pipeline`
- Body: `{ primary, partner, modern_preferences?, language? }`
- Returns compatibility sections plus analyser validation, interpreter summaries, and audience briefings for designers/interpreters.

## Wisdom bot (core analyser + interpreter bundle)
- `POST /wisdom-bot`
- Body: horoscope fields + `query`; optional `focus_areas: []`, `partner` (same horoscope shape), `modern_preferences: []`, `language`
- Returns: `ai_reply`, `core_wisdom` sections/charts/dashas, analyser + interpreter flow metadata, and a shareable markdown export (`download`).

## Calendar conversion
- `POST /calendar`
- Body: `birth_date` (YYYY-MM-DD), `birth_time` (HH:MM, 24h), `birth_place`
- Returns Śaka date, lunar month/phase, and conversion factors.

## Accuracy feedback
- `POST /feedback`
- Body: `engine` (`horoscope`, `past-life`, `future`, `matchmaking`, `calendar`, or `transits`), `rating` (1-5), optional
  `seeker_name`, optional `notes`
- Persists a record for quarterly review and returns the stored entry.

## Quarterly reviews
- `GET /feedback/quarterly`
- Returns `{ quarters: [{ label, average_rating, submissions, promoters, recent_notes: [...] }] }` to power dashboards and
  council reviews.

## Rate limiting and caching
- Every client IP is limited to 60 requests per minute; exceeding the window
  returns HTTP 429 with a JSON body `{ "message": "Rate limit exceeded; try
  again later" }`.
- Idempotent horoscope, past-life, future, matchmaking, calendar, and transits
  calls reuse cached payloads for up to 120 seconds. Sending a different body or
  invalidating the cache (see below) forces recomputation.

## Cache invalidation and admin controls
- Posting new manuscripts or retraining the ML feedback model clears cached
  horoscope/future/past responses so users never see stale narratives.
- `POST /ml/retrain` requires the header `X-Admin-Token: <BHRIGUWELT_ADMIN_TOKEN>`.
  If no `BHRIGUWELT_ADMIN_TOKEN` is set, the endpoint returns HTTP 403 to
  prevent accidental retraining.

## Error cases
- Missing required fields → HTTP 400 with message
- Out-of-range lunar tithi/houses or unsupported moon element → HTTP 400 with validation message
