# Backup and Recovery

## Data to protect
- `backend/data/bhrigu_samhita_principles.yml` and any manuscript-derived assets.
- Deployment configurations: `render.yaml`, `nixpacks.toml`, `start.sh` wrappers.

## Local backups
- Commit data changes to git with clear folio references.
- Keep an offline copy of `backend/data/` and `docs/` (encrypted if containing notes about manuscripts).

## Hosted backups
- Render/Railway: enable automatic disk snapshots if persistent volumes are used; otherwise, redeploy from git.
- Store environment variables securely (Render/ Railway dashboard export) and mirror them in `.env.example` without secrets.

## Recovery drill
1. Clone repository.
2. Restore `.env` from your secret manager.
3. Verify `start.sh` is executable: `chmod +x start.sh backend/start.sh`.
4. Rebuild and run tests: `cd backend && PYTHONPATH=src pytest`.
5. Redeploy using the documented blueprint or Nixpacks plan.
