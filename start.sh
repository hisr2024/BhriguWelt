#!/usr/bin/env bash
# Legacy start script - delegates to backend/start.sh
set -euo pipefail

# Determine repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Delegate to backend start script
echo "Delegating to backend/start.sh..."
cd "$SCRIPT_DIR/backend" || {
    echo "ERROR: Failed to change to backend directory" >&2
    exit 1
}
exec ./start.sh
