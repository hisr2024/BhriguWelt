# Contributor onboarding tutorial

Follow this hands-on flow to make your first change to BhriguWelt.

## 1. Clone and install
- `git clone` the repo and run `python -m pip install -r backend/requirements.txt`.
- From `frontend/`, run `npm install` to pull the Next.js toolchain.

## 2. Run the stacks
- Backend: `cd backend && PYTHONPATH=src python -m bhriguwelt.api` for the threaded server or `python -m bhriguwelt.async_api` for the async server.
- Frontend: `cd frontend && NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npm run dev`.

## 3. Make a change
- Update copy in `frontend/lib/copy.ts` or add a new dataset rule in `backend/data/bhrigu_samhita_principles.yml`.
- Add tests alongside your change: `backend/tests` for Python, `frontend/tests/unit` for UI helpers.

## 4. Quality gates
- Run `pre-commit run --all-files` to apply Black, mypy, and Next.js lint/type checks.
- Push a branch and open a PR using the template in `.github/PULL_REQUEST_TEMPLATE.md`.
