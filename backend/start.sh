#!/usr/bin/env bash
set -euo pipefail

# Determine repository root for backend assets.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from .env when present.
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

export PYTHONPATH="${PYTHONPATH:-${SCRIPT_DIR}/src}"
export PORT="${PORT:-8000}"

# Bootstrap the manuscript corpus to the configured path when running in
# environments (e.g., Render) that mount a writable volume for updates.
if [[ -n "${BHRIGUWELT_DATA_PATH:-}" ]]; then
  if [[ ! -f "${BHRIGUWELT_DATA_PATH}" ]]; then
    echo "Seeding Bhrigu Samhita corpus to ${BHRIGUWELT_DATA_PATH}"
    python - <<'PY'
import os
from pathlib import Path

from bhriguwelt import bhrigu_data
from bhriguwelt.data_loader import persist_bhrigu_data

target = Path(os.environ["BHRIGUWELT_DATA_PATH"]).expanduser()
target.parent.mkdir(parents=True, exist_ok=True)
persist_bhrigu_data(bhrigu_data.as_dict(), target)
print(f"Initialized Bhrigu dataset at {target}")
PY
  else
    echo "Using existing Bhrigu corpus at ${BHRIGUWELT_DATA_PATH}"
  fi
fi

exec python -m bhriguwelt.api
