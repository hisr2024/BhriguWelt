#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/app"

# Ensure the application source directory is on PYTHONPATH so `python -m` can locate the module.
export PYTHONPATH="${APP_ROOT}/src:${PYTHONPATH:-}"

cd "${APP_ROOT}"

export HOST="0.0.0.0"
export PORT="${PORT:-${RAILWAY_TCP_PORT:-8000}}"

# Default entrypoint for the FastAPI app. Override APP_MODULE if needed.
export APP_MODULE="${APP_MODULE:-bhriguwelt.api:app}"

exec uvicorn "${APP_MODULE}" --host "${HOST}" --port "${PORT}"
