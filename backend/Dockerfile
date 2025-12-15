FROM python:3.10-slim

WORKDIR /app

# Allow running in platforms that invoke the start command without a leading
# './' by ensuring the project root and the shim installation directory are on
# PATH (e.g. `pythonpath=src`).
ENV PATH="/usr/local/bin:/app:${PATH}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Ensure module resolution matches local development without a custom start command.
ENV PYTHONPATH=/app/src
# Ensure the shim is available on PATH for hosts that invoke `pythonpath=src`
# directly, and mark the shim plus start script executable regardless of how the
# container is launched. Creating the shim inline avoids any issues with files
# named with an equals sign being omitted or miscopied by build tooling.
RUN cat <<'EOF' >/usr/local/bin/pythonpath=src
#!/usr/bin/env bash
set -euo pipefail

APP_ROOT=${APP_ROOT:-/app}
cd "$APP_ROOT"

export PYTHONPATH=${PYTHONPATH:-"$APP_ROOT/src"}
exec "$APP_ROOT/start.sh" "$@"
EOF
RUN chmod +x /usr/local/bin/pythonpath=src pythonpath=src start.sh

# Use the shim directly as the entrypoint so hosts looking for the
# `pythonpath=src` executable always find it regardless of PATH handling.
ENTRYPOINT ["/usr/local/bin/pythonpath=src"]
