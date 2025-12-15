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
# container is launched. Using `install` avoids edge cases with copying files
# that contain an equals sign in the filename while still setting the correct
# permissions.
RUN install -m 755 "pythonpath=src" /usr/local/bin/pythonpath=src \
  && chmod +x pythonpath=src start.sh

# Use the start script directly so the container always has a resolvable entrypoint
# even when hosts disregard PATH manipulations or replace the entrypoint.
ENTRYPOINT ["/bin/bash", "/app/start.sh"]
