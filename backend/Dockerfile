FROM python:3.10-slim

WORKDIR /app

# Allow running in platforms that invoke the start command without a leading
# './' by ensuring the project root is on PATH (e.g. `pythonpath=src`).
ENV PATH="/app:${PATH}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Ensure module resolution matches local development without a custom start command.
ENV PYTHONPATH=/app/src
# Install the pythonpath=src shim to a well-known location so ENTRYPOINT resolution
# does not depend on PATH configuration performed by the hosting platform.
RUN install -m 755 pythonpath=src /usr/local/bin/pythonpath=src \
  && chmod +x start.sh

# Use the `pythonpath=src` shim as an entrypoint so platforms that replace the image
# entrypoint with their start command still execute a known binary.
ENTRYPOINT ["/usr/local/bin/pythonpath=src"]
