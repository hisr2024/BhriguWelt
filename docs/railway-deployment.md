# Railway deployment recovery for the backend service

The Railway deploys must **not** prepend `pythonpath=src` to the start command. That
string is treated as an executable by the platform and fails the container
boot. Use the environment variable `PYTHONPATH=/app/src` instead and keep the
start command to `python -m bhriguwelt.api`.

## Dockerfile tweaks
- Expose port 8000 and set `PORT=8000` as a default for local runs; Railway will
  still override `PORT` when it injects its own value.
- Keep the module entry point as `python -m bhriguwelt.api`.

## Railway configuration (`railway.toml`)
The repository includes a `railway.toml` that pins the build and the start
command so dashboard overrides do not inject `pythonpath=src`:

```
[build]
builder = "dockerfile"
dockerfilePath = "backend/Dockerfile"
context = "backend"

[variables]
PYTHONPATH = "/app/src"
PYTHONUNBUFFERED = "1"

[deploy]
startCommand = "python -m bhriguwelt.api"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

Ensure the Railway service uses this file (no conflicting service-level start
command in the dashboard). Delete any custom start command or healthcheck that
prepends `pythonpath=src`.

## Clear cached settings and force a clean deploy
1. In the Railway dashboard, open the service → **Variables** and remove any
   variable or start command that includes `pythonpath=src`.
2. If a custom **Start Command** exists, reset it to `python -m bhriguwelt.api`
   or leave it empty so the Docker `CMD` is used.
3. Trigger a fresh build by clicking **Redeploy** after clearing the start
   command overrides. If the platform still reuses an old image, hit **Rollback**
   → **Rebuild** to force a new image.
4. Verify the logs after the container is created; the first line should show
   the `python -m bhriguwelt.api` command, not `pythonpath=src`.

## Other Railway settings to review
- Confirm the service region is `asia-southeast1` if that is required; otherwise
  leave it to the default to avoid cold-start delays.
- Make sure the service points to port 8000 (Railway injects `$PORT` and proxies
  to it; exposing 8000 in the Dockerfile helps discovery).
- Remove obsolete `start.sh`, `Procfile`, or `nixpacks.toml` overrides from the
  dashboard in case they survived earlier deploys.

## Local verification commands
Run these before pushing to confirm the image launches with the correct
command:

```bash
# From repository root
cd backend

# Build the image with the current Dockerfile
python -m venv .venv && source .venv/bin/activate  # optional for linting/tests

docker build -t bhriguwelt-backend .

# Run the image locally (Railway will override $PORT in production)
docker run --rm -p 8000:8000 -e PORT=8000 bhriguwelt-backend
```

If the container starts and serves traffic on http://localhost:8000 without
throwing the `pythonpath=src` executable error, the Railway deploy should also
succeed.
