FROM python:3.10-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Ensure module resolution matches local development without a custom start command.
ENV PYTHONPATH=/app/src
RUN chmod +x start.sh

CMD ["./start.sh"]
