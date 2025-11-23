# Contributing to BhriguWelt

🙏 Thank you for strengthening this Bhrigu Samhita–rooted platform. Follow these guidelines to keep the codebase authentic, stable, and inclusive.

## Ground rules
- **Source fidelity:** All astrological logic must cite Bhrigu Samhita folios. Include references in code comments or docs when adding rules.
- **Safety first:** Do not collect credentials or PII beyond birth data required for predictions. See `SECURITY.md` for reporting vulnerabilities.
- **Tests + docs:** Every change should have regression tests and accompanying documentation updates.

## Development setup
1. Clone the repo and install tools:
   - Backend: `python -m pip install -r backend/requirements.txt`
   - Frontend: `cd frontend && npm install`
2. Export `PYTHONPATH=src` when running backend commands from `backend/`.
3. Use the provided `.env.example` files as a starting point for secrets and endpoints.

## Code style
- Python: prefer dataclasses and type hints; keep zero third-party runtime dependencies unless justified.
- Frontend: use TypeScript, functional React components, and Next.js conventions.
- Avoid adding try/except around imports per repo guidance.

## Design tools
- Ideation happens in **Figma** for flows, wireframes, and UI mocks.
- Attach Figma links or screenshots to PRs when altering core layouts so reviewers can trace visual intent.

## Running tests
- Backend: `cd backend && PYTHONPATH=src pytest`
- Frontend lint: `cd frontend && npm run lint`
- Frontend types: `cd frontend && npm run type-check`

## Commit and PR process
- Write descriptive commits.
- Ensure CI is green.
- Fill out the PR template and include Bhrigu Samhita references for new rules or datasets.

## Adding Bhrigu data
- Extend `backend/data/bhrigu_samhita_principles.yml` or `bhrigu_data.py` and document the manuscript folios in `docs/bhrigu_references.md`.
- Add tests that exercise the new principles or engines end-to-end (CLI and API).

## Accessibility & i18n
- Preserve semantic HTML, aria-labels, and focus states when changing UI.
- Keep copy short and clear; plan for localization by avoiding hard-coded date/number formats where possible.

## Governance metadata
- License: MIT (`LICENSE`). Keep the copyright notice intact when copying docs or
  code so merges stay clean across forks.
- Code of Conduct + security contact: `security@bhriguwelt.com` (shared with
  `CODE_OF_CONDUCT.md` and `SECURITY.md`).
