#!/usr/bin/env bash
# Legacy start script - delegates to backend/start.sh
set -euo pipefail

# Determine repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Delegate to backend start script
echo "Delegating to backend/start.sh..."
if [ ! -d "$SCRIPT_DIR/backend" ]; then
    echo "ERROR: backend directory not found at $SCRIPT_DIR/backend" >&2
    exit 1
fi
cd "$SCRIPT_DIR/backend" || exit 1
exec ./start.sh
