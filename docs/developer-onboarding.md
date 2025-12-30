# Developer onboarding guide

Welcome to BhriguWelt! This guide captures the minimum steps needed to boot both the backend (FastAPI-style HTTP server) and the Next.js frontend so new contributors can validate changes quickly.

## Prerequisites
- Python 3.11+
- Node.js 24+
- [uv](https://github.com/astral-sh/uv) or `pip` for Python dependency management
- `npm` for frontend dependencies

## Video tutorials (setup walkthroughs)
- [Backend setup and API smoke tests](https://example.com/bhriguwelt-backend-setup.mp4)
- [Frontend setup and local UI validation](https://example.com/bhriguwelt-frontend-setup.mp4)
- [Full-stack run-through (API + web app)](https://example.com/bhriguwelt-fullstack-setup.mp4)

## Backend setup
1. Change into the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies (uv is faster and supported):
   ```bash
   uv pip install -r requirements.txt
   ```
   Or fallback to pip:
   ```bash
   python -m pip install -r requirements.txt
   ```
3. Start the HTTP API (serves on port 8000 by default):
   ```bash
   python -m bhriguwelt.async_api
   ```
4. Run the test suite to confirm Swiss Ephemeris fallbacks and horoscope safeguards:
   ```bash
   pytest
   ```

## Frontend setup
1. Change into the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Provide API connectivity via environment variables (add to `.env.local`):
   ```bash
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_DEFAULT_LANGUAGE=en
   ```
4. Launch the Next.js dev server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000` and validate horoscope/calendar flows. Birth details will auto-fill across compatible forms when saved once.

## API smoke tests
- Health check: `curl -s http://localhost:8000/health`
- Horoscope request:
  ```bash
  curl -X POST http://localhost:8000/horoscope \
    -H "Content-Type: application/json" \
    -d '{"name":"Aditi","birth_date":"1995-05-18","birth_time":"07:45","birth_place":"Jaipur, India"}'
  ```
- Profiles + chatbot session memory:
  ```bash
  curl -X POST http://localhost:8000/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"Summarize my dashas","user_id":"demo-user","full_name":"Aditi"}'
  ```

Prefer a guided interface? Use the Swagger UI playground in
[`docs/api_playground.md`](./api_playground.md) to explore endpoints interactively.

Happy hacking! If you run into setup blockers, open a draft PR with log output so maintainers can assist.
