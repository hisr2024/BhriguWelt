# Contributing to BhriguWelt

🙏 Thank you for strengthening this Bhrigu Samhita–rooted platform. Follow these guidelines to keep the codebase authentic, stable, and inclusive.

## Ground rules
- **Source fidelity:** All astrological logic must cite Bhrigu Samhita folios. Include references in code comments or docs when adding rules.
- **Safety first:** Do not collect credentials or PII beyond birth data required for predictions. See `SECURITY.md` for reporting vulnerabilities.
- **Tests + docs:** Every change should have regression tests and accompanying documentation updates.

## Issue templates
Use the GitHub issue templates to keep triage consistent and actionable:
- **Bug report:** `.github/ISSUE_TEMPLATE/bug_report.md`
- **Feature request:** `.github/ISSUE_TEMPLATE/feature_request.md`
- **Documentation request:** `.github/ISSUE_TEMPLATE/docs_request.md`

Include links to the relevant API endpoints, UI routes, or manuscripts so maintainers can reproduce quickly.

## Development setup
1. Clone the repo and install tools:
   - Backend: `python -m pip install -r backend/requirements.txt`
   - Frontend: `cd frontend && npm install`
2. Export `PYTHONPATH="$(pwd)/src"` when running backend commands from `backend/`.
3. Use the provided `.env.example` files as a starting point for secrets and endpoints.

## Code style
- Python: prefer dataclasses and type hints; keep zero third-party runtime dependencies unless justified.
- Frontend: use TypeScript, functional React components, and Next.js conventions.
- Avoid adding try/except around imports per repo guidance.

## Security practices
**All contributors must follow these security guidelines:**

### Data Privacy
- **Never log or transmit PII**: Birth data (name, exact location, birth time) must be sanitized before any external API calls
- **Encryption first**: All user data stored in IndexedDB or SQLite must be encrypted at rest
- **Key management**: Encryption keys derived from user passcode, never stored persistently
- **See**: `SECURITY_ARCHITECTURE.md` for complete threat model and mitigation strategies

### API Security
- **Rate limiting**: Implement rate limits on all public endpoints (see `backend/middleware/rate_limiter.py`)
- **Input validation**: Sanitize all user inputs before processing (see `backend/middleware/sanitizer.py`)
- **CORS**: Use strict origin configuration, never `*` in production
- **Headers**: Apply security headers (CSP, HSTS, X-Frame-Options) via middleware
- **See**: `OPENAI_INTEGRATION.md` for AI API security guidelines

### Frontend Security
- **No secrets in code**: API keys and secrets must never be in frontend bundle
- **WebCrypto only**: Use browser's native WebCrypto API, not custom encryption
- **XSS prevention**: React's auto-escaping + CSP headers. Never use `dangerouslySetInnerHTML` with user content
- **Service worker**: Only cache public assets, never sensitive data in service worker scope
- **Session management**: Implement auto-lock timeout and clear keys on lock

### Backend Security
- **Environment variables**: Store all secrets in `.env` files, never commit to git
- **Request sanitization**: Remove PII before forwarding to AI APIs
- **Response validation**: Validate and sanitize all AI responses before returning to client
- **Error handling**: Never expose stack traces or internal errors in API responses
- **Logging**: Log security events but never log sensitive data (passcodes, keys, PII)

### Code Review Checklist
Before submitting a PR with security-sensitive changes:
- [ ] Run `gh-advisory-database` for dependency vulnerabilities (if adding dependencies)
- [ ] No hardcoded secrets or API keys in code
- [ ] All user inputs validated and sanitized
- [ ] Encryption keys not stored persistently
- [ ] PII removed before external API calls
- [ ] Rate limiting applied to new endpoints
- [ ] Security headers configured
- [ ] Error messages don't leak sensitive information
- [ ] Logs don't contain PII or secrets
- [ ] Documentation updated with security implications

### Reporting Security Issues
- **Never** open public GitHub issues for security vulnerabilities
- Email: `security@bhriguwelt.com` with details and reproduction steps
- See `SECURITY.md` for our responsible disclosure policy

## Design tools
- Ideation happens in **Figma** for flows, wireframes, and UI mocks.
- Attach Figma links or screenshots to PRs when altering core layouts so reviewers can trace visual intent.

## Running tests
- Backend: `cd backend && PYTHONPATH="$(pwd)/src" pytest`
- Frontend lint: `cd frontend && npm run lint`
- Frontend types: `cd frontend && npm run type-check`
- When adding engines or validation rules, include negative-path tests (malformed
  birth data, timezone mismatches, Swiss Ephemeris fallbacks) plus a positive
  integration check that exercises the HTTP surface.

## Commit and PR process
- Write descriptive commits.
- Ensure CI is green.
- Fill out the PR template and include Bhrigu Samhita references for new rules or datasets.
- Regenerate `backend/requirements.txt` with `pip-compile backend/requirements.in --output-file backend/requirements.txt` when
  adding/removing dependencies so reviewers get deterministic pins.

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
