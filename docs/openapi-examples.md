# OpenAPI examples

Concrete request/response samples to accompany the generated OpenAPI specification. Replace values as needed and keep the `Content-Type: application/json` header for POST endpoints.

## /horoscope
Request
```json
{
  "name": "Aditi",
  "birth_date": "1995-05-18",
  "birth_time": "07:45",
  "birth_place": "Jaipur, India",
  "tradition": "universal",
  "timezone": "Asia/Kolkata"
}
```

Response (truncated)
```json
{
  "name": "Aditi",
  "karmic_epoch": "Chandra-led reflection",
  "rashi_chart": [{"house": 1, "sign": "Aries", "ruler": "Mars"}],
  "bhava_chart": [{"house": 1, "sign": "Aries", "ruler": "Mars"}],
  "dashas": [{"lord": "Saturn", "start_date": "2023-04-12"}],
  "interpretation": "Narrative summary rooted in Bhrigu Samhita guidance"
}
```

## /chat
Request
```json
{
  "message": "Remind me of my last session",
  "session_id": "mobile-123",
  "user_id": "demo-user"
}
```

Response
```json
{
  "profile_id": 1,
  "user_id": "demo-user",
  "reply": "Pulled your recent session. Rahu transit recommendations remain active.",
  "session": {
    "id": "mobile-123",
    "history": ["User asked about Rahu", "Assistant suggested sandal dhup"]
  }
}
```

## /alerts
Request
```json
{
  "user_id": "demo-user",
  "label": "Dasha change",
  "event_time": "2024-12-04T09:30:00Z"
}
```

Response
```json
{
  "alert_id": 12,
  "profile_id": 1,
  "label": "Dasha change",
  "event_time": "2024-12-04T09:30:00Z",
  "status": "scheduled"
}
```

These examples align with the runtime response shapes exercised in the test suite. When updating the API, keep this file in sync so documentation consumers have ready-to-run snippets.
