FROM python:3.10-slim

WORKDIR /app

# Allow running in platforms that invoke the start command without a leading
# './' by ensuring the project root is on PATH (e.g. `pythonpath=src`).
ENV PATH="/app:${PATH}"

# Provide a global shim so even platforms that ignore the image PATH can
# resolve the fallback start command.
RUN ln -sf /app/pythonpath=src /usr/local/bin/pythonpath=src

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Ensure module resolution matches local development without a custom start command.
ENV PYTHONPATH=/app/src
RUN chmod +x start.sh "pythonpath=src"

# Use the start script as an entrypoint so custom Railway commands (e.g. PYTHONPATH=src)
# are treated as arguments instead of replacement executables. This keeps the service
# bootable even when the platform start command is misconfigured.
ENTRYPOINT ["./start.sh"]
