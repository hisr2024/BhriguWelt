## Summary
- 

## Testing
- [ ] `cd backend && PYTHONPATH=src pytest`
- [ ] `cd frontend && npm run lint`
- [ ] `cd frontend && npm run type-check`

## Deployment readiness
- [ ] Backend URL (Render/Railway) documented and `/health` confirmed in logs or curl
- [ ] `NEXT_PUBLIC_BACKEND_URL` set for Vercel preview/prod and a UI form hits the
      live API without falling back to demo data

## Checklist
- [ ] Added/updated documentation
- [ ] Added/updated tests
- [ ] Confirmed Bhrigu Samhita sourcing for new rules
- [ ] Verified monitoring hooks (Sentry DSN or logs) for new error paths
- [ ] Ran accessibility smoke checks (skip links, focus order, screen reader labels)
- [ ] Repository topics updated in GitHub Settings → Topics (astrology, nextjs,
      python, bhrigu-samhita)
