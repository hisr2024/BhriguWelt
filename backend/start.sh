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

exec python -m bhriguwelt.api
