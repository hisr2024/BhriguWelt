"""Shared Redis cache utilities for high-cost computations."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

try:  # pragma: no cover - optional dependency
    import redis
except Exception:  # pragma: no cover - optional dependency
    redis = None  # type: ignore[assignment]

logger = logging.getLogger("bhriguwelt.cache")


class RedisCache:
    """Small helper around Redis JSON payloads with graceful fallback."""

    def __init__(self, *, prefix: str, ttl_seconds: int = 900, url: str | None = None) -> None:
        self.prefix = prefix
        self.ttl_seconds = ttl_seconds
        self.url = url or os.environ.get("BHRIGUWELT_REDIS_URL") or os.environ.get("REDIS_URL")
        self._client: "redis.Redis[str] | None" = None

    def _client_or_none(self) -> "redis.Redis[str] | None":
        if not self.url or redis is None:
            return None
        if self._client is None:
            self._client = redis.Redis.from_url(self.url, decode_responses=True)
        return self._client

    def _format_key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    def get(self, key: str) -> Any | None:
        client = self._client_or_none()
        if not client:
            return None
        try:
            payload = client.get(self._format_key(key))
        except redis.RedisError as exc:  # pragma: no cover - non-fatal
            logger.info("Redis get failed", extra={"error": str(exc)})
            return None
        if payload is None:
            return None
        try:
            return json.loads(payload)
        except json.JSONDecodeError:
            return None

    def set(self, key: str, payload: Any, ttl_seconds: int | None = None) -> None:
        client = self._client_or_none()
        if not client:
            return
        try:
            client.setex(
                self._format_key(key),
                ttl_seconds or self.ttl_seconds,
                json.dumps(payload, ensure_ascii=False, default=str),
            )
        except redis.RedisError as exc:  # pragma: no cover - non-fatal
            logger.info("Redis set failed", extra={"error": str(exc)})
