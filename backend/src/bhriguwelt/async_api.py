"""Async HTTP API built on aiohttp for scalable serving."""

from __future__ import annotations

import asyncio
import json
import os
from dataclasses import asdict
from http import HTTPStatus
from typing import Any, Dict

try:  # pragma: no cover - optional dependency for async HTTP serving
    from aiohttp import web
except Exception as exc:  # pragma: no cover - optional dependency
    raise ImportError(
        "aiohttp is required for the async API server; install it from PyPI when network access is available."
    ) from exc

from .api import RateLimiter, ResponseCache, handle_command, _request_from_payload, build_rate_limiter
from .bhrigu_core import bhrigu_core
from .data_loader import persist_bhrigu_data
from .feedback import feedback_analytics_snapshot, quarterly_reviews, record_feedback, serialize_entry
from .horoscope import _snapshot_from_request
from .kundli_generator import generate_kundli
from .ml_service import get_ml_health, retrain_feedback_model
from .profiles import (
    create_or_update_profile,
    get_profile,
    list_profiles,
    fetch_session,
    add_alert,
    upcoming_alerts,
    alerts_summary,
    analytics_snapshot,
)
from .chatbot import generate_chat_reply
from .auth import decode_profile_token, issue_profile_token

_ADMIN_TOKEN = os.environ.get("BHRIGUWELT_ADMIN_TOKEN")


def _cache_key(command: str, payload: Dict[str, Any]) -> str:
    serialized = json.dumps(payload or {}, sort_keys=True, ensure_ascii=False)
    return f"{command}:{serialized}"


def _add_cors_headers(response: web.Response) -> web.Response:
    response.headers.update(
        {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token, Authorization",
        }
    )
    return response


def _json_response(data: Dict[str, Any], status: int = HTTPStatus.OK) -> web.Response:
    response = web.json_response(data, status=status)
    return _add_cors_headers(response)


class AsyncResponseCache(ResponseCache):
    """Async wrapper around the in-memory cache used by the sync API."""

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._async_lock = asyncio.Lock()

    async def get(self, key: str) -> Dict[str, Any] | None:  # type: ignore[override]
        async with self._async_lock:
            return super().get(key)

    async def set(self, key: str, payload: Dict[str, Any]) -> None:  # type: ignore[override]
        async with self._async_lock:
            super().set(key, payload)

    async def clear(self) -> None:  # type: ignore[override]
        async with self._async_lock:
            super().clear()


def create_app() -> web.Application:
    rate_limiter = build_rate_limiter()
    cache = AsyncResponseCache()

    async def guard_rate_limit(request: web.Request) -> tuple[str, Dict[str, int]]:
        client = request.remote or "anonymous"
        allowed, meta = await asyncio.to_thread(rate_limiter.allow, client, with_metadata=True)
        meta_dict: Dict[str, int] = meta if isinstance(meta, dict) else {}
        if not allowed:
            response = _json_response({"message": "Rate limit exceeded; try again later"}, status=HTTPStatus.TOO_MANY_REQUESTS)
            response.headers.update(
                {
                    "X-RateLimit-Limit": str(rate_limiter.max_requests),
                    "X-RateLimit-Remaining": str(meta_dict.get("remaining", 0)),
                    "Retry-After": str(meta_dict.get("reset_in", rate_limiter.window)),
                }
            )
            raise web.HTTPTooManyRequests(text=response.text, headers=response.headers)
        return client, meta_dict

    def _extract_bearer_token(request: web.Request) -> str | None:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header.replace("Bearer ", "", 1).strip()
        return None

    async def require_profile_claims(request: web.Request) -> Dict[str, Any]:
        token = _extract_bearer_token(request)
        if not token:
            raise web.HTTPUnauthorized(text=_json_response({"message": "Bearer token required for profile access"}, status=HTTPStatus.UNAUTHORIZED).text)
        try:
            return await asyncio.to_thread(decode_profile_token, token)
        except ValueError as exc:
            raise web.HTTPUnauthorized(text=_json_response({"message": str(exc)}, status=HTTPStatus.UNAUTHORIZED).text)

    def authorize_profile_access(profile, claims: Dict[str, Any]) -> bool:
        if claims.get("role") == "admin":
            return True
        return bool(profile.user_id and claims.get("sub") == profile.user_id)

    async def handle_cached_command(command: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        key = _cache_key(command, payload)
        cached = await cache.get(key)
        if cached is not None:
            return cached
        response = await asyncio.to_thread(handle_command, command, payload)
        await cache.set(key, response)
        return response

    async def resolve_profile(payload: Dict[str, Any], allow_update_only: bool = True):
        profile_payload = payload.get("profile") if isinstance(payload.get("profile"), dict) else {}
        session_id = payload.get("session_id") or payload.get("session_key")
        user_id = payload.get("user_id") or profile_payload.get("user_id") or session_id
        profile_id = payload.get("profile_id") or profile_payload.get("profile_id")

        base_payload = {
            "user_id": user_id,
            "full_name": payload.get("full_name") or profile_payload.get("full_name"),
            "date_of_birth": payload.get("date_of_birth") or profile_payload.get("date_of_birth"),
            "time_of_birth": payload.get("time_of_birth") or profile_payload.get("time_of_birth"),
            "place_of_birth": payload.get("place_of_birth") or profile_payload.get("place_of_birth"),
            "timezone": payload.get("timezone") or profile_payload.get("timezone"),
            "metadata": payload.get("metadata") or profile_payload.get("metadata"),
        }

        profile = None
        if profile_id:
            profile = await asyncio.to_thread(get_profile, profile_id=int(profile_id))
        if not profile and user_id:
            profile = await asyncio.to_thread(get_profile, user_id=str(user_id))

        if profile:
            base_payload["user_id"] = profile.user_id or user_id
            return await asyncio.to_thread(create_or_update_profile, base_payload)

        if allow_update_only and not any(value for key, value in base_payload.items() if key != "metadata"):
            raise ValueError("Provide profile_id, user_id, or profile fields")

        base_payload.setdefault("user_id", session_id or "guest")
        return await asyncio.to_thread(create_or_update_profile, base_payload)

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
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("horoscope", payload)
        reply = _json_response(response)
        reply.headers.update({"X-Cache-Hits": str(cache.stats()["hits"]), "X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def timeline(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        focus_areas = payload.get("focus_areas")
        if focus_areas is not None and not isinstance(focus_areas, list):
            return _json_response({"message": "focus_areas must be a list when provided"}, status=HTTPStatus.BAD_REQUEST)
        response = await handle_cached_command("timeline", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def past_life(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("past-life", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def future(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("future", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def future_directives(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("future-directives", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def varshaphal(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("varshaphal", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def matchmaking(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("matchmaking", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def matchmaking_diagnostics(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("matchmaking-diagnostics", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def matchmaking_pipeline(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        language = payload.get("language") or payload.get("design_language")
        preferences = payload.get("modern_preferences")
        if language is not None and not isinstance(language, str):
            return _json_response({"message": "language must be a string when provided"}, status=HTTPStatus.BAD_REQUEST)
        if preferences is not None and not isinstance(preferences, list):
            return _json_response(
                {"message": "modern_preferences must be a list when provided"}, status=HTTPStatus.BAD_REQUEST
            )
        response = await handle_cached_command("matchmaking-pipeline", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def calendar(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("calendar", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def transits(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("transits", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def chart(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        try:
            request_payload = _request_from_payload(payload)
        except ValueError as exc:
            return _json_response({"message": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        snapshot = _snapshot_from_request(request_payload)
        kundli = await asyncio.to_thread(
            generate_kundli,
            snapshot,
            weights=payload.get("weights"),
            timezone_name=request_payload.timezone,
        )
        response = {
            "rashi_chart": [asdict(item) for item in kundli.get("rashi_chart", [])],
            "bhava_chart": [asdict(item) for item in kundli.get("bhava_chart", [])],
            "dashas": [asdict(item) for item in kundli.get("dashas", [])],
            "ephemeris_source": kundli.get("ephemeris_source"),
        }
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def core_wisdom(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        if payload.get("focus_areas") is not None and not isinstance(payload.get("focus_areas"), list):
            return _json_response({"message": "focus_areas must be a list when provided"}, status=HTTPStatus.BAD_REQUEST)
        response = await handle_cached_command("core-wisdom", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def implementation_core(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        if payload.get("focus_areas") is not None and not isinstance(payload.get("focus_areas"), list):
            return _json_response({"message": "focus_areas must be a list when provided"}, status=HTTPStatus.BAD_REQUEST)
        response = await handle_cached_command("implementation-core", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def core_engines(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        response = await handle_cached_command("core-engines", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def karmic_dashboard(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        focus_areas = payload.get("focus_areas")
        issues = payload.get("issues")
        if focus_areas is not None and not isinstance(focus_areas, list):
            return _json_response({"message": "focus_areas must be a list when provided"}, status=HTTPStatus.BAD_REQUEST)
        if issues is not None and not isinstance(issues, list):
            return _json_response({"message": "issues must be a list when provided"}, status=HTTPStatus.BAD_REQUEST)
        response = await handle_cached_command("karmic-dashboard", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def wisdom_aggregator(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        if payload.get("focus_engines") is not None and not isinstance(payload.get("focus_engines"), list):
            return _json_response(
                {"message": "focus_engines must be a list when provided"}, status=HTTPStatus.BAD_REQUEST
            )
        response = await handle_cached_command("wisdom-aggregator", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def wisdom_bot(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        if not payload.get("query") and not payload.get("message"):
            return _json_response({"message": "query is required for wisdom bot"}, status=HTTPStatus.BAD_REQUEST)
        if payload.get("focus_areas") is not None and not isinstance(payload.get("focus_areas"), list):
            return _json_response({"message": "focus_areas must be a list when provided"}, status=HTTPStatus.BAD_REQUEST)
        if payload.get("modern_preferences") is not None and not isinstance(payload.get("modern_preferences"), list):
            return _json_response(
                {"message": "modern_preferences must be a list when provided"}, status=HTTPStatus.BAD_REQUEST
            )
        response = await handle_cached_command("wisdom-bot", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def experience_flow(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        modern_preferences = payload.get("modern_preferences")
        if modern_preferences is not None and not isinstance(modern_preferences, list):
            return _json_response(
                {"message": "modern_preferences must be a list when provided"}, status=HTTPStatus.BAD_REQUEST
            )
        language = payload.get("language") or payload.get("design_language")
        if language is not None and not isinstance(language, str):
            return _json_response({"message": "language must be a string when provided"}, status=HTTPStatus.BAD_REQUEST)
        tone = payload.get("tone")
        if tone is not None and not isinstance(tone, str):
            return _json_response({"message": "tone must be a string when provided"}, status=HTTPStatus.BAD_REQUEST)
        cultural_sensitivity = payload.get("cultural_sensitivity")
        if cultural_sensitivity is not None and not isinstance(cultural_sensitivity, str):
            return _json_response(
                {"message": "cultural_sensitivity must be a string when provided"}, status=HTTPStatus.BAD_REQUEST
            )
        response = await handle_cached_command("experience-flow", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def past_future(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        focus_areas = payload.get("focus_areas")
        if focus_areas is not None and not isinstance(focus_areas, list):
            return _json_response({"message": "focus_areas must be a list when provided"}, status=HTTPStatus.BAD_REQUEST)
        response = await handle_cached_command("past-future", payload)
        reply = _json_response(response)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def chat(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        message = payload.get("message") or payload.get("query")
        if not message:
            return _json_response({"message": "message is required for chat"}, status=HTTPStatus.BAD_REQUEST)
        try:
            profile = await resolve_profile(payload, allow_update_only=False)
        except ValueError as exc:
            return _json_response({"message": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        session_key = payload.get("session_id") or payload.get("session_key") or "default"
        reply = await asyncio.to_thread(
            generate_chat_reply,
            profile=profile,
            session_key=str(session_key),
            message=str(message),
        )
        response = {"profile_id": profile.id, "user_id": profile.user_id, **reply}
        return _json_response(response)

    async def profiles_register(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        payload = await request.json()
        try:
            profile = await resolve_profile(payload, allow_update_only=False)
            token = await asyncio.to_thread(issue_profile_token, user_id=str(profile.user_id), profile_id=profile.id)
        except ValueError as exc:
            return _json_response({"message": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        except RuntimeError as exc:
            return _json_response({"message": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)
        return _json_response({"profile": profile.to_dict(), "token": token}, status=HTTPStatus.CREATED)

    async def profiles_token(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        if not _ADMIN_TOKEN or request.headers.get("X-Admin-Token") != _ADMIN_TOKEN:
            return _json_response({"message": "Admin token required for profile token issuance"}, status=HTTPStatus.FORBIDDEN)
        payload = await request.json()
        profile_id = payload.get("profile_id")
        user_id = payload.get("user_id")
        role = payload.get("role", "user")
        if role not in {"user", "admin"}:
            return _json_response({"message": "role must be user or admin"}, status=HTTPStatus.BAD_REQUEST)
        profile = None
        if profile_id:
            profile = await asyncio.to_thread(get_profile, profile_id=int(profile_id))
        elif user_id:
            profile = await asyncio.to_thread(get_profile, user_id=str(user_id))
        if not profile:
            return _json_response({"message": "Profile not found"}, status=HTTPStatus.NOT_FOUND)
        try:
            token = await asyncio.to_thread(
                issue_profile_token, user_id=str(profile.user_id), profile_id=profile.id, role=str(role)
            )
        except RuntimeError as exc:
            return _json_response({"message": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)
        return _json_response({"token": token, "profile": profile.to_dict()})

    async def chat_socket(request: web.Request) -> web.StreamResponse:
        ws = web.WebSocketResponse(heartbeat=30.0)
        await ws.prepare(request)

        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    payload = json.loads(msg.data or "{}")
                except json.JSONDecodeError:
                    await ws.send_json({"error": "Invalid JSON payload"})
                    continue

                message = payload.get("message") or payload.get("query")
                if not message:
                    await ws.send_json({"error": "message is required for chat"})
                    continue

                try:
                    profile = await resolve_profile(payload, allow_update_only=False)
                except ValueError as exc:
                    await ws.send_json({"error": str(exc)})
                    continue

                session_key = payload.get("session_id") or payload.get("session_key") or "default"
                reply = await asyncio.to_thread(
                    generate_chat_reply,
                    profile=profile,
                    session_key=str(session_key),
                    message=str(message),
                )
                await ws.send_json({"profile_id": profile.id, "user_id": profile.user_id, **reply})
            elif msg.type == web.WSMsgType.ERROR:
                break

        return ws

    async def profiles_create(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        claims = await require_profile_claims(request)
        payload = await request.json()
        user_id = claims.get("sub")
        if not user_id:
            return _json_response({"message": "Token subject missing for profile access"}, status=HTTPStatus.FORBIDDEN)
        payload["user_id"] = user_id
        profile_id = payload.get("profile_id")
        if profile_id:
            profile = await asyncio.to_thread(get_profile, profile_id=int(profile_id))
            if not profile:
                return _json_response({"message": "Profile not found"}, status=HTTPStatus.NOT_FOUND)
            if not authorize_profile_access(profile, claims):
                return _json_response({"message": "Profile access forbidden"}, status=HTTPStatus.FORBIDDEN)
        try:
            profile = await resolve_profile(payload, allow_update_only=False)
        except ValueError as exc:
            return _json_response({"message": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        return _json_response(profile.to_dict(), status=HTTPStatus.CREATED)

    async def profiles_get(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        claims = await require_profile_claims(request)
        payload = await request.json()
        profile_id = payload.get("profile_id")
        user_id = payload.get("user_id") or payload.get("session_id") or payload.get("session_key")
        if not profile_id and not user_id:
            return _json_response(
                {"message": "profile_id, user_id, or session_id required"}, status=HTTPStatus.BAD_REQUEST
            )
        profile = await asyncio.to_thread(get_profile, profile_id=int(profile_id)) if profile_id else await asyncio.to_thread(get_profile, user_id=str(user_id))
        if not profile:
            return _json_response({"message": "Profile not found"}, status=HTTPStatus.NOT_FOUND)
        if not authorize_profile_access(profile, claims):
            return _json_response({"message": "Profile access forbidden"}, status=HTTPStatus.FORBIDDEN)
        alerts = [alert.to_dict() for alert in await asyncio.to_thread(upcoming_alerts, profile_id=profile.id)]
        session_id = payload.get("session_id") or "default"
        session = await asyncio.to_thread(fetch_session, profile.id, str(session_id))
        return _json_response({"profile": profile.to_dict(), "alerts": alerts, "session": session.to_dict() if session else None})

    async def profiles_list(request: web.Request) -> web.Response:  # pylint: disable=unused-argument
        await guard_rate_limit(request)
        claims = await require_profile_claims(request)
        profile_id = request.query.get("profile_id")
        user_id = request.query.get("user_id")
        session_id = request.query.get("session_id") or request.query.get("session_key")
        lookup_id = user_id or session_id
        if profile_id or lookup_id:
            profile = (
                await asyncio.to_thread(get_profile, profile_id=int(profile_id))
                if profile_id
                else await asyncio.to_thread(get_profile, user_id=str(lookup_id))
            )
            if not profile:
                return _json_response({"message": "Profile not found"}, status=HTTPStatus.NOT_FOUND)
            if not authorize_profile_access(profile, claims):
                return _json_response({"message": "Profile access forbidden"}, status=HTTPStatus.FORBIDDEN)
            alerts = [alert.to_dict() for alert in await asyncio.to_thread(upcoming_alerts, profile_id=profile.id)]
            session_key = session_id or "default"
            session = await asyncio.to_thread(fetch_session, profile.id, str(session_key))
            return _json_response(
                {
                    "profile": profile.to_dict(),
                    "alerts": alerts,
                    "session": session.to_dict() if session else None,
                }
            )
        if claims.get("role") != "admin":
            return _json_response({"message": "Admin token required for full profile list"}, status=HTTPStatus.FORBIDDEN)
        profiles = [profile.to_dict() for profile in await asyncio.to_thread(list_profiles)]
        return _json_response({"profiles": profiles})

    async def alerts_create(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        claims = await require_profile_claims(request)
        payload = await request.json()
        profile_id = payload.get("profile_id")
        user_id = payload.get("user_id")
        label = payload.get("label")
        event_time = payload.get("event_time")
        if not label or not event_time:
            return _json_response({"message": "label and event_time are required"}, status=HTTPStatus.BAD_REQUEST)
        profile = None
        if profile_id:
            profile = await asyncio.to_thread(get_profile, profile_id=int(profile_id))
        elif user_id:
            profile = await asyncio.to_thread(get_profile, user_id=str(user_id))
        if not profile:
            return _json_response({"message": "Profile required to attach alerts"}, status=HTTPStatus.NOT_FOUND)
        if not authorize_profile_access(profile, claims):
            return _json_response({"message": "Profile access forbidden"}, status=HTTPStatus.FORBIDDEN)
        alert = await asyncio.to_thread(
            add_alert,
            profile_id=profile.id,
            label=str(label),
            event_time=str(event_time),
            notes=payload.get("notes"),
        )
        upcoming = [item.to_dict() for item in await asyncio.to_thread(upcoming_alerts, profile_id=profile.id)]
        return _json_response({"alert": alert.to_dict(), "upcoming": upcoming}, status=HTTPStatus.CREATED)

    async def alerts_list(request: web.Request) -> web.Response:
        await guard_rate_limit(request)
        claims = await require_profile_claims(request)
        profile_id = request.query.get("profile_id")
        if profile_id:
            profile = await asyncio.to_thread(get_profile, profile_id=int(profile_id))
            if not profile:
                return _json_response({"message": "Profile not found"}, status=HTTPStatus.NOT_FOUND)
            if not authorize_profile_access(profile, claims):
                return _json_response({"message": "Profile access forbidden"}, status=HTTPStatus.FORBIDDEN)
            alerts = [alert.to_dict() for alert in await asyncio.to_thread(upcoming_alerts, profile_id=int(profile_id))]
        else:
            if claims.get("role") != "admin":
                return _json_response({"message": "Admin token required for all alerts"}, status=HTTPStatus.FORBIDDEN)
            alerts = await asyncio.to_thread(alerts_summary)
        return _json_response({"alerts": alerts})

    async def analytics(request: web.Request) -> web.Response:
        if not _ADMIN_TOKEN or request.headers.get("X-Admin-Token") != _ADMIN_TOKEN:
            return _json_response({"message": "Admin token required for analytics"}, status=HTTPStatus.FORBIDDEN)
        snapshot = await asyncio.to_thread(analytics_snapshot)
        snapshot["feedback"] = await asyncio.to_thread(feedback_analytics_snapshot)
        snapshot["feedback_quarterly"] = await asyncio.to_thread(quarterly_reviews, 4)
        return _json_response(snapshot)

    async def manuscript_get(request: web.Request) -> web.Response:  # pylint: disable=unused-argument
        _, rate_meta = await guard_rate_limit(request)
        corpus = await asyncio.to_thread(bhrigu_core.dataset)
        reply = _json_response(corpus)
        reply.headers.update({"X-RateLimit-Remaining": str(rate_meta.get("remaining", 0))})
        return reply

    async def manuscript_update(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
        payload = await request.json()
        updated = await asyncio.to_thread(persist_bhrigu_data, payload)
        await cache.clear()
        await asyncio.to_thread(bhrigu_core.refresh, updated)
        return _json_response({"message": "Manuscript updated", "principles": len(updated.get("principles", []))})

    async def ml_retrain(request: web.Request) -> web.Response:
        _, rate_meta = await guard_rate_limit(request)
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
    app.router.add_route("POST", "/timeline", timeline)
    app.router.add_route("POST", "/past-life", past_life)
    app.router.add_route("POST", "/future", future)
    app.router.add_route("POST", "/future-directives", future_directives)
    app.router.add_route("POST", "/varshaphal", varshaphal)
    app.router.add_route("POST", "/matchmaking", matchmaking)
    app.router.add_route("POST", "/matchmaking/diagnostics", matchmaking_diagnostics)
    app.router.add_route("POST", "/matchmaking/pipeline", matchmaking_pipeline)
    app.router.add_route("POST", "/calendar", calendar)
    app.router.add_route("POST", "/transits", transits)
    app.router.add_route("POST", "/chart", chart)
    app.router.add_route("POST", "/core-wisdom", core_wisdom)
    app.router.add_route("POST", "/implementation-core", implementation_core)
    app.router.add_route("POST", "/core-engines", core_engines)
    app.router.add_route("POST", "/karmic-dashboard", karmic_dashboard)
    app.router.add_route("POST", "/wisdom-aggregator", wisdom_aggregator)
    app.router.add_route("POST", "/wisdom-bot", wisdom_bot)
    app.router.add_route("POST", "/experience-flow", experience_flow)
    app.router.add_route("POST", "/past-future", past_future)
    app.router.add_route("POST", "/chat", chat)
    app.router.add_route("GET", "/ws/chat", chat_socket)
    app.router.add_route("POST", "/profiles", profiles_create)
    app.router.add_route("POST", "/profiles/register", profiles_register)
    app.router.add_route("POST", "/profiles/token", profiles_token)
    app.router.add_route("POST", "/profiles/get", profiles_get)
    app.router.add_route("GET", "/profiles", profiles_list)
    app.router.add_route("POST", "/alerts", alerts_create)
    app.router.add_route("GET", "/alerts", alerts_list)
    app.router.add_route("GET", "/analytics", analytics)
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
