# Security Audit Checklist

This checklist tracks mandatory security controls for the project. Complete each
item before release and on every significant backend or infrastructure change.

## Static analysis

- [ ] **CodeQL:** GitHub Actions workflow runs CodeQL for JavaScript/TypeScript
  and Python on every push and pull request.
- [ ] **Bandit:** Static analysis for Python executed in CI against the backend
  source code (`backend/src`).

## Dependency safety

- [ ] **Safety:** Scan Python dependencies (production and development) for
  known vulnerabilities; reports should fail CI on high-severity issues.
- [ ] **npm audit / `npm run audit:fix` optional review:** Track front-end
  packages and remediate critical findings quickly.
- [ ] **Dependabot:** Automated dependency updates enabled for backend and
  frontend ecosystems.

## Configuration and secrets

- [ ] Validate `.env` files are not committed; sample configuration is stored in
  `.env.example` files only.
- [ ] Ensure `SENTRY_DSN`, database credentials, and API tokens are provided via
  environment variables in deployment pipelines (Vercel/Railway).

## Access control and authentication

- [ ] Verify authenticated endpoints enforce authorization and least privilege.
- [ ] Confirm session tokens and cookies are HTTP-only, secure, and use proper
  expiry.

## Data protection

- [ ] Encrypt sensitive data at rest where applicable; prefer managed services
  with built-in encryption.
- [ ] Ensure all external connections use TLS (HTTPS) and validate certificates.

## Observability and backups

- [ ] Sentry is configured with `SENTRY_DSN` in each environment for runtime
  error capture.
- [ ] Backup scripts are scheduled and tested according to
  `docs/backup_and_recovery.md`.

## Deployment hygiene

- [ ] CI enforces formatting (Black), static typing (mypy), linting, and test
  coverage thresholds.
- [ ] Deployment manifests (Vercel/Railway) are kept in sync with environment
  variables and secrets requirements.

Update this document as you complete checks to maintain an auditable security
record.
