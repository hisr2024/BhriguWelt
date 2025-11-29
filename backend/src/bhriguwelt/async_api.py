"""Async HTTP API built on aiohttp for scalable serving."""

from __future__ import annotations

import asyncio
import json
import os
from http import HTTPStatus
from typing import Any, Dict

try:  # pragma: no cover - optional dependency for async HTTP serving
    from aiohttp import web
except Exception as exc:  # pragma: no cover - optional dependency
    raise ImportError(
        "aiohttp is required for the async API server; install it from PyPI when network access is available."
    ) from exc

from .api import RateLimiter, handle_command
from .data_loader import load_bhrigu_data, persist_bhrigu_data
from .feedback import quarterly_reviews, record_feedback, serialize_entry
from .ml_service import get_ml_health, retrain_feedback_model

_ADMIN_TOKEN = os.environ.get("BHRIGUWELT_ADMIN_TOKEN")


def _cache_key(command: str, payload: Dict[str, Any]) -> str:
    serialized = json.dumps(payload or {}, sort_keys=True, ensure_ascii=False)
    return f"{command}:{serialized}"


class AsyncResponseCache:
    """Async-friendly TTL cache to avoid blocking the event loop."""

    def __init__(self, ttl_seconds: int = 120, max_entries: int = 256) -> None:
        self.ttl = ttl_seconds
        self.max_entries = max_entries
        self._store: Dict[str, tuple[float, Dict[str, Any]]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Dict[str, Any] | None:
        now = asyncio.get_event_loop().time()
        async with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            expires_at, payload = entry
            if now > expires_at:
                self._store.pop(key, None)
                return None
            return payload

    async def set(self, key: str, payload: Dict[str, Any]) -> None:
        expires_at = asyncio.get_event_loop().time() + self.ttl
        async with self._lock:
            if len(self._store) >= self.max_entries:
                oldest = next(iter(self._store.keys()))
                self._store.pop(oldest, None)
            self._store[key] = (expires_at, payload)

    async def clear(self) -> None:
        async with self._lock:
            self._store.clear()


def _add_cors_headers(response: web.Response) -> web.Response:
    response.headers.update(
        {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
        }
    )
    return response


def _json_response(data: Dict[str, Any], status: int = HTTPStatus.OK) -> web.Response:
    response = web.json_response(data, status=status)
    return _add_cors_headers(response)


def create_app() -> web.Application:
    rate_limiter = RateLimiter()
    cache = AsyncResponseCache()

    async def guard_rate_limit(request: web.Request) -> str | None:
        client = request.remote or "anonymous"
        allowed = await asyncio.to_thread(rate_limiter.allow, client)
        if not allowed:
            response = _json_response({"message": "Rate limit exceeded; try again later"}, status=HTTPStatus.TOO_MANY_REQUESTS)
            raise web.HTTPTooManyRequests(text=response.text, headers=response.headers)
        return client

    async def handle_cached_command(command: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        key = _cache_key(command, payload)
        cached = await cache.get(key)
        if cached is not None:
            return cached
        response = await asyncio.to_thread(handle_command, command, payload)
        await cache.set(key, response)
        return response

    async def health(_: web.Request) -> web.Response:
        return _json_response({"status": "ok", "source": "Bhrigu Samhita", "ml": get_ml_health()})

    async def feedback(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        context = payload.get("prediction_request") or payload.get("inputs") or payload.get("context")
        if isinstance(context, dict):
            context.setdefault("engine", payload.get("engine"))
        entry = await asyncio.to_thread(
            record_feedback,
            payload.get("engine", ""),
            int(payload.get("rating", 0)),
            payload.get("seeker_name"),
            payload.get("notes", ""),
            context,
        )
        return _json_response(serialize_entry(entry), status=HTTPStatus.CREATED)

    async def feedback_quarterly(request: web.Request) -> web.Response:  # pylint: disable=unused-argument
        await guard_rate_limit(request)
        summary = await asyncio.to_thread(quarterly_reviews)
        return _json_response({"quarters": summary})

    async def horoscope(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("horoscope", payload)
        return _json_response(response)

    async def past_life(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("past-life", payload)
        return _json_response(response)

    async def future(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("future", payload)
        return _json_response(response)

    async def matchmaking(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("matchmaking", payload)
        return _json_response(response)

    async def calendar(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("calendar", payload)
        return _json_response(response)

    async def transits(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("transits", payload)
        return _json_response(response)

    async def manuscript_get(request: web.Request) -> web.Response:  # pylint: disable=unused-argument
        await guard_rate_limit(request)
        corpus = await asyncio.to_thread(load_bhrigu_data)
        return _json_response(corpus)

    async def manuscript_update(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        updated = await asyncio.to_thread(persist_bhrigu_data, payload)
        await cache.clear()
        return _json_response({"message": "Manuscript updated", "principles": len(updated.get("principles", []))})

    async def ml_retrain(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        if not _ADMIN_TOKEN or request.headers.get("X-Admin-Token") != _ADMIN_TOKEN:
            return _json_response({"message": "Admin token required for retraining"}, status=HTTPStatus.FORBIDDEN)

        payload = await request.json()
        limit = payload.get("limit")
        limit_value = None
        if limit is not None:
            limit_value = int(limit)
        metrics = await asyncio.to_thread(retrain_feedback_model, limit_value)
        await cache.clear()
        return _json_response({"message": "Retraining complete", "metrics": metrics}, status=HTTPStatus.ACCEPTED)

    async def handle_options(_: web.Request) -> web.Response:
        return _json_response({}, status=HTTPStatus.NO_CONTENT)

    app = web.Application()
    app.router.add_route("GET", "/health", health)
    app.router.add_route("POST", "/feedback", feedback)
    app.router.add_route("GET", "/feedback/quarterly", feedback_quarterly)
    app.router.add_route("POST", "/horoscope", horoscope)
    app.router.add_route("POST", "/past-life", past_life)
    app.router.add_route("POST", "/future", future)
    app.router.add_route("POST", "/matchmaking", matchmaking)
    app.router.add_route("POST", "/calendar", calendar)
    app.router.add_route("POST", "/transits", transits)
    app.router.add_route("GET", "/manuscript", manuscript_get)
    app.router.add_route("POST", "/manuscript", manuscript_update)
    app.router.add_route("POST", "/ml/retrain", ml_retrain)
    app.router.add_route("OPTIONS", "/{tail:.*}", handle_options)
    return app


def main() -> None:
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    web.run_app(create_app(), host=host, port=port)


__all__ = ["create_app", "main"]


if __name__ == "__main__":  # pragma: no cover - manual execution
    main()
