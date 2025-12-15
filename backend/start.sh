#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/app"
if [ ! -d "${APP_ROOT}/src" ] && [ -d "/app/backend/src" ]; then
  ln -sf /app/backend/src "${APP_ROOT}/src"
fi

cd "$APP_ROOT"

export PYTHONPATH="${APP_ROOT}/src:${PYTHONPATH:-}"

if [ -f .env ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

export HOST="0.0.0.0"
export PORT="${PORT:-${RAILWAY_TCP_PORT:-8000}}"
export APP_MODULE="${APP_MODULE:-bhriguwelt.api:app}"

if python - <<'PY'
import importlib.util
import os

app_module = os.environ.get("APP_MODULE", "")
module_name = app_module.split(":", 1)[0] if app_module else ""

has_fastapi = importlib.util.find_spec("fastapi") is not None
has_uvicorn = importlib.util.find_spec("uvicorn") is not None
has_app_module = bool(module_name) and importlib.util.find_spec(module_name) is not None

if has_fastapi and has_uvicorn and has_app_module:
    raise SystemExit(0)
raise SystemExit(1)
PY
then
  exec uvicorn "${APP_MODULE}" --host "${HOST}" --port "${PORT}"
else
  exec python -m bhriguwelt.horoscope
fi
