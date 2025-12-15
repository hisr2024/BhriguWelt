FROM python:3.10-slim

WORKDIR /app

ENV PATH="/usr/local/bin:/app:${PATH}"
ENV PYTHONPATH=/app/src

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN chmod +x start.sh

CMD ["/app/start.sh"]
