#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH=${PYTHONPATH:-src}
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8000}
python - <<'PY'
import os
from bhriguwelt.api import serve
host = os.environ.get("HOST", "0.0.0.0")
port = int(os.environ.get("PORT", "8000"))
serve(host, port)
PY
