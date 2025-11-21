#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

export PYTHONPATH=${PYTHONPATH:-"$SCRIPT_DIR/src"}

# Load optional local overrides so HOST/PORT/BHRIGU_DATA_PATH remain consistent
# between local runs and hosted environments without extra flags.
if [ -f .env ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

export HOST=${HOST:-0.0.0.0}
export PORT=${PORT:-${RAILWAY_TCP_PORT:-8000}}
python - <<'PY'
import os
from bhriguwelt.api import serve
host = os.environ.get("HOST", "0.0.0.0")
port = int(os.environ.get("RAILWAY_TCP_PORT") or os.environ.get("PORT", "8000"))
serve(host, port)
PY
