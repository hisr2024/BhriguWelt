# AI Quota Guard

## Environment Variables

- `REDIS_URL`: Redis connection URL for daily quota tracking.
- `USER_DAILY_TOKEN_LIMIT`: Daily per-user token limit (integer).
- `OPENAI_COST_PER_1K`: Cost per 1,000 tokens (float USD).
- `PER_REQUEST_COST_LIMIT`: Maximum allowed cost per request (float USD).
- `OPENAI_MAX_TOKENS`: Response token cap used for cost estimation.
- `OPENAI_MODEL`: OpenAI model name.
- `OPENAI_BASE_URL`: Base URL for OpenAI API.
- `OPENAI_API_KEY`: OpenAI API key.

## Running Tests

```bash
cd frontend && npm test
```

```bash
cd backend && pytest -q
```
