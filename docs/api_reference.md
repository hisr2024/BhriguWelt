# API Reference

Base URL defaults to `http://localhost:8000` when running `PYTHONPATH="$(pwd)/src" python -m bhriguwelt.api`.

For machine-readable contracts, see `openapi.yaml` in this directory; it mirrors
the validation rules and response shapes enforced by the CLI/API handlers. For
an interactive playground powered by Swagger UI, jump to
[`docs/api_playground.md`](./api_playground.md).

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
- `POST /matchmaking/diagnostics`
- Body: `{ primary, partner, modern_preferences? }`
- Returns detailed dosha diagnostics and alignment notes to troubleshoot compatibility outcomes.

## Timeline & syntheses
- `POST /timeline`
- Body: same as horoscope with optional `focus_areas: []`
- Returns timeline narrative cards suitable for app timelines.
- `POST /future-directives`
- Body: same as horoscope
- Returns prioritized directives for upcoming windows.
- `POST /past-future`
- Body: same as horoscope with optional `focus_areas: []`
- Returns linked past/future narratives with a shared karmic thesis.
- `POST /varshaphal`
- Body: same as horoscope
- Returns solar return highlights and key year themes.
- `POST /transits`
- Body: same as horoscope
- Returns transit overlays and impact summaries.

## Core wisdom + unified engines
- `POST /core-wisdom`
- Body: horoscope fields; optional `ai_summary` boolean.
- Returns core wisdom sections, charts, and optional AI summary.
- `POST /core-engines`
- Body: same as horoscope
- Returns core outputs for multiple engines in a single payload.
- `POST /implementation-core`
- Body: same as horoscope
- Returns implementation-focused action steps and safeguards.
- `POST /karmic-dashboard`
- Body: same as horoscope
- Returns dashboard-ready insights for karmic focus areas.
- `POST /experience-flow`
- Body: same as horoscope
- Returns a unified experience flow across all engines.
- `POST /wisdom-aggregator`
- Body: horoscope fields + `query`
- Returns aggregated wisdom digest for the bot interface.

## Wisdom bot (core analyser + interpreter bundle)
- `POST /wisdom-bot`
- Body: horoscope fields + `query`; optional `focus_areas: []`, `partner` (same horoscope shape), `modern_preferences: []`, `language`
- Returns: `ai_reply`, `core_wisdom` sections/charts/dashas, analyser + interpreter flow metadata, and a shareable markdown export (`download`).

## Chat + session memory
- `POST /chat`
- Body: `{ message, session_id, user_id?, profile_id?, profile? }`
- Returns: reply, session transcript, and reminders. Conversations are persisted per `session_id`.

## Profiles + sessions
- `POST /profiles/register`
- Body: profile fields (see horoscope) + optional metadata
- Returns: `{ profile, token }` where `token` is a bearer token for profile access.
- `POST /profiles`
- Body: profile fields; requires `Authorization: Bearer <token>` from `/profiles/register`.
- Returns: stored profile payload.
- `POST /profiles/get`
- Body: `{ profile_id? | user_id?, session_id }`; requires bearer token.
- Returns: profile + session transcript for the requested session.
- `POST /profiles/token`
- Body: `{ profile_id? | user_id?, role }`; requires `X-Admin-Token`.
- Returns: bearer token for admin/user access.
- `GET /profiles`
- Query: `?limit=10`; requires `X-Admin-Token`.
- Returns list of profiles and summaries.

## Alerts + analytics
- `POST /alerts`
- Body: `{ profile_id | user_id, label, event_time, notes? }`; requires bearer token.
- Returns the created alert plus upcoming alerts.
- `GET /alerts`
- Query: `?profile_id=123`; requires bearer token (profile owner) or admin token to list all.
- `GET /analytics`
- Requires `X-Admin-Token`; returns profile/session/feedback summary metrics.

## Manuscript + admin
- `GET /manuscript` returns the Bhrigu corpus snapshot.
- `POST /manuscript` updates the manuscript data (admin only; requires `X-Admin-Token`).
- `POST /ml/retrain` retrains the feedback model (admin only; requires `X-Admin-Token`) with optional `{ "limit": <int> }`.

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
- When `REDIS_URL` or `BHRIGUWELT_REDIS_URL` is configured, cached responses are
  also stored in Redis to speed up repeated requests across deployments.

## Cache invalidation and admin controls
- Posting new manuscripts or retraining the ML feedback model clears cached
  horoscope/future/past responses so users never see stale narratives.
- `POST /ml/retrain` requires the header `X-Admin-Token: <BHRIGUWELT_ADMIN_TOKEN>`.
  If no `BHRIGUWELT_ADMIN_TOKEN` is set, the endpoint returns HTTP 403 to
  prevent accidental retraining.

## Error cases
- Missing required fields → HTTP 400 with message
- Out-of-range lunar tithi/houses or unsupported moon element → HTTP 400 with validation message
