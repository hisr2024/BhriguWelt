#!/usr/bin/env bash
set -euo pipefail

# Load optional local overrides so HOST/PORT/BHRIGU_DATA_PATH remain consistent
# between local runs and hosted environments without extra flags.
if [ -f .env ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8000}
python - <<'PY'
import os
print("Starting Bhrigu API", flush=True)
print(f"PYTHONPATH: {os.environ.get('PYTHONPATH')}", flush=True)
try:
    from bhriguwelt.api import serve
    print("Import successful", flush=True)
except ImportError as e:
    print(f"Import error: {e}", flush=True)
    exit(1)
host = os.environ.get("HOST", "0.0.0.0")
port = int(os.environ.get("PORT", "8000"))
print(f"Host: {host}, Port: {port}", flush=True)
serve(host, port)
PY
