import asyncio
from http import HTTPStatus

import pytest
from aiohttp.test_utils import TestClient, TestServer

from bhriguwelt.async_api import create_app
from bhriguwelt.api import RateLimiter, ResponseCache


@pytest.mark.asyncio
async def test_rate_limiter_blocks_after_window(monkeypatch):
    limiter = RateLimiter(max_requests=1, window_seconds=1)
    assert limiter.allow("client-1") is True
    assert limiter.allow("client-1") is False
    limiter.reset()
    assert limiter.allow("client-1") is True


@pytest.mark.asyncio
async def test_response_cache_sets_and_expires():
    cache = ResponseCache(ttl_seconds=0.01, max_entries=1)
    cache.set("hello", {"value": 1})
    assert cache.get("hello") == {"value": 1}
    await asyncio.sleep(0.02)
    assert cache.get("hello") is None
    cache.set("a", {"value": 2})
    cache.set("b", {"value": 3})
    assert cache.get("a") is None
    assert cache.get("b") == {"value": 3}


@pytest.mark.asyncio
async def test_health_endpoint_async():
    async with TestServer(create_app()) as server:
        async with TestClient(server) as client:
            resp = await client.get("/health")
            assert resp.status == HTTPStatus.OK
            payload = await resp.json()
            assert payload["status"] == "ok"
            assert payload["source"] == "Bhrigu Samhita"
