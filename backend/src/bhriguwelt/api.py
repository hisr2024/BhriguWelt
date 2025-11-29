"""Minimal HTTP API exposing the Bhrigu Samhita prediction engines."""

from __future__ import annotations

import json
import os
import logging
import re
from datetime import datetime
from dataclasses import asdict
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from time import monotonic
from typing import Any, Dict, Tuple
from urllib.parse import urlparse, parse_qs

from .data_loader import load_bhrigu_data, persist_bhrigu_data
from .calendar_conversion import convert_birth_details
from .feedback import record_feedback, quarterly_reviews, serialize_entry
from .ml_service import get_ml_health, record_model_load, retrain_feedback_model
from .telemetry import capture_exception, init_telemetry
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
from .horoscope import (
    HoroscopeRequest,
    build_future_report,
    build_matchmaking_report,
    build_transit_report,
    build_past_life_report,
    build_prediction,
    _snapshot_from_request,
)
from .kundli_generator import SIGNS, generate_kundli

_JSON_HEADER = ("Content-Type", "application/json; charset=utf-8")
_ADMIN_TOKEN = os.environ.get("BHRIGUWELT_ADMIN_TOKEN")

init_telemetry()
record_model_load()


class _JsonFormatter(logging.Formatter):
    """Render logs as JSON for structured ingestion."""

    def format(self, record: logging.LogRecord) -> str:  # pragma: no cover - formatting only
        payload = {
            "level": record.levelname,
            "message": record.getMessage(),
            "time": datetime.utcnow().isoformat() + "Z",
        }
        for key in ("path", "method", "client"):
            value = getattr(record, key, None)
            if value:
                payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


logger = logging.getLogger("bhriguwelt.api")
logger.setLevel(logging.INFO)
logger.handlers.clear()
handler = logging.StreamHandler()
handler.setFormatter(_JsonFormatter())
logger.addHandler(handler)


class RateLimiter:
    """Thread-safe, in-memory token bucket for per-client throttling."""

    def __init__(self, max_requests: int = 60, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window = window_seconds
        self._lock = Lock()
        self._tokens: Dict[str, tuple[int, float]] = {}

    def allow(self, key: str, *, with_metadata: bool = False) -> bool | tuple[bool, Dict[str, int]]:
        now = monotonic()
        with self._lock:
            count, reset = self._tokens.get(key, (0, now + self.window))
            if now > reset:
                count, reset = 0, now + self.window
            count += 1
            self._tokens[key] = (count, reset)
            allowed = count <= self.max_requests
            if not with_metadata:
                return allowed
            remaining = max(self.max_requests - count, 0)
            metadata = {"remaining": remaining, "reset_in": max(int(reset - now), 0)}
            return allowed, metadata

    def reset(self) -> None:
        with self._lock:
            self._tokens.clear()


class ResponseCache:
    """Small in-memory cache for idempotent API responses."""

    def __init__(self, ttl_seconds: int = 120, max_entries: int = 256) -> None:
        self.ttl = ttl_seconds
        self.max_entries = max_entries
        self._lock = Lock()
        self._store: Dict[str, tuple[float, Dict[str, Any]]] = {}
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Dict[str, Any] | None:
        now = monotonic()
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                self._misses += 1
                return None
            expires_at, payload = entry
            if now > expires_at:
                self._store.pop(key, None)
                self._misses += 1
                return None
            self._hits += 1
            return payload

    def set(self, key: str, payload: Dict[str, Any]) -> None:
        expires_at = monotonic() + self.ttl
        with self._lock:
            if len(self._store) >= self.max_entries:
                oldest = next(iter(self._store.keys()))
                self._store.pop(oldest, None)
            self._store[key] = (expires_at, payload)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def stats(self) -> Dict[str, int]:
        with self._lock:
            return {"hits": self._hits, "misses": self._misses, "entries": len(self._store)}


class BhriguAPIHandler(BaseHTTPRequestHandler):
    """HTTP handler serving JSON endpoints for native + partner insights."""

    routes: Dict[Tuple[str, str], str] = {
        ("GET", "/health"): "_handle_health",
        ("POST", "/feedback"): "_handle_feedback",
        ("GET", "/feedback/quarterly"): "_handle_feedback_quarterly",
        ("POST", "/horoscope"): "_handle_horoscope",
        ("POST", "/past-life"): "_handle_past_life",
        ("POST", "/future"): "_handle_future",
        ("POST", "/matchmaking"): "_handle_matchmaking",
        ("POST", "/calendar"): "_handle_calendar",
        ("POST", "/transits"): "_handle_transits",
        ("POST", "/chat"): "_handle_chat",
        ("POST", "/profiles"): "_handle_profiles",
        ("POST", "/profiles/get"): "_handle_profile_get",
        ("GET", "/profiles"): "_handle_profile_list",
        ("POST", "/alerts"): "_handle_alert_create",
        ("GET", "/alerts"): "_handle_alerts_list",
        ("GET", "/analytics"): "_handle_analytics",
        ("GET", "/manuscript"): "_handle_get_manuscript",
        ("POST", "/manuscript"): "_handle_update_manuscript",
        ("POST", "/ml/retrain"): "_handle_ml_retrain",
    }

    rate_limiter = RateLimiter()
    cache = ResponseCache()

    def do_GET(self) -> None:  # pragma: no cover - exercised via route map
        self._dispatch("GET")

    def do_POST(self) -> None:  # pragma: no cover - exercised via route map
        self._dispatch("POST")

    def do_OPTIONS(self) -> None:  # pragma: no cover - exercised via route map
        self.send_response(HTTPStatus.NO_CONTENT)
        self._add_cors_headers()
        self.end_headers()

    def log_message(self, format: str, *args: Any) -> None:  # pragma: no cover - silence
        return

    def _dispatch(self, method: str) -> None:
        client_id = self.client_address[0]
        allowed, meta = self.rate_limiter.allow(client_id, with_metadata=True)  # type: ignore[assignment]
        rate_meta: Dict[str, int] = meta if isinstance(meta, dict) else {}
        if not allowed:
            self.send_error(
                HTTPStatus.TOO_MANY_REQUESTS,
                "Rate limit exceeded; try again later",
                headers={
                    "X-RateLimit-Limit": str(self.rate_limiter.max_requests),
                    "X-RateLimit-Remaining": str(rate_meta.get("remaining", 0)),
                    "Retry-After": str(rate_meta.get("reset_in", self.rate_limiter.window)),
                },
            )
            return

        handler_name = self.routes.get((method, self.path))
        if not handler_name:
            self.send_error(HTTPStatus.NOT_FOUND, "Route not defined in Bhrigu Samhita server")
            return
        handler = getattr(self, handler_name)
        handler()

    # Individual endpoint handlers -------------------------------------------------
    def _handle_health(self) -> None:
        corpus = load_bhrigu_data()
        principles_loaded = len(corpus.get("principles") or [])
        self._send_json(
            {
                "status": "ok",
                "source": "Bhrigu Samhita",
                "ml": get_ml_health(),
                "data": {"principles_loaded": principles_loaded},
            }
        )

    def _handle_feedback(self) -> None:
        payload = self._read_json()
        try:
            context = payload.get("prediction_request") or payload.get("inputs") or payload.get("context")
            if isinstance(context, dict):
                context.setdefault("engine", payload.get("engine"))
            entry = record_feedback(
                engine=payload.get("engine", ""),
                rating=int(payload.get("rating", 0)),
                seeker_name=payload.get("seeker_name"),
                notes=payload.get("notes", ""),
                inputs=context,
            )
        except ValueError as exc:
            self.send_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
        self._send_json(serialize_entry(entry), status=HTTPStatus.CREATED)

    def _handle_feedback_quarterly(self) -> None:
        summary = quarterly_reviews()
        self._send_json({"quarters": summary})

    def _handle_horoscope(self) -> None:
        payload = self._read_json()
        self._respond_with_command("horoscope", payload)

    def _handle_past_life(self) -> None:
        payload = self._read_json()
        self._respond_with_command("past-life", payload)

    def _handle_future(self) -> None:
        payload = self._read_json()
        self._respond_with_command("future", payload)

    def _handle_matchmaking(self) -> None:
        payload = self._read_json()
        self._respond_with_command("matchmaking", payload)

    def _handle_calendar(self) -> None:
        payload = self._read_json()
        self._respond_with_command("calendar", payload)

    def _handle_transits(self) -> None:
        payload = self._read_json()
        self._respond_with_command("transits", payload)

    def _handle_chat(self) -> None:
        payload = self._read_json()
        message = payload.get("message") or payload.get("query")
        if not message:
            self.send_error(HTTPStatus.BAD_REQUEST, "message is required for chat")
            return
        try:
            profile = self._resolve_profile(payload)
        except ValueError as exc:
            self.send_error(HTTPStatus.BAD_REQUEST, str(exc))
            return

        session_key = payload.get("session_id") or payload.get("session_key") or "default"
        reply = generate_chat_reply(profile=profile, session_key=str(session_key), message=str(message))
        response = {
            "profile_id": profile.id,
            "user_id": profile.user_id,
            **reply,
        }
        self._send_json(response)

    def _handle_profiles(self) -> None:
        payload = self._read_json()
        try:
            profile = self._resolve_profile(payload, allow_update_only=False)
        except ValueError as exc:
            self.send_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
        self._send_json(profile.to_dict(), status=HTTPStatus.CREATED)

    def _handle_profile_get(self) -> None:
        payload = self._read_json()
        profile_id = payload.get("profile_id")
        user_id = payload.get("user_id")
        if not profile_id and not user_id:
            self.send_error(HTTPStatus.BAD_REQUEST, "profile_id or user_id required")
            return
        profile = get_profile(profile_id=int(profile_id)) if profile_id else get_profile(user_id=str(user_id))
        if not profile:
            self.send_error(HTTPStatus.NOT_FOUND, "Profile not found")
            return
        alerts = [alert.to_dict() for alert in upcoming_alerts(profile_id=profile.id)]
        session_id = payload.get("session_id") or "default"
        session = fetch_session(profile.id, str(session_id))
        self._send_json({"profile": profile.to_dict(), "alerts": alerts, "session": session.to_dict() if session else None})

    def _handle_profile_list(self) -> None:
        profiles = [profile.to_dict() for profile in list_profiles()]
        self._send_json({"profiles": profiles})

    def _handle_alert_create(self) -> None:
        payload = self._read_json()
        profile_id = payload.get("profile_id")
        user_id = payload.get("user_id")
        label = payload.get("label")
        event_time = payload.get("event_time")
        if not label or not event_time:
            self.send_error(HTTPStatus.BAD_REQUEST, "label and event_time are required")
            return
        profile = None
        if profile_id:
            profile = get_profile(profile_id=int(profile_id))
        elif user_id:
            profile = get_profile(user_id=str(user_id))
        if not profile:
            self.send_error(HTTPStatus.NOT_FOUND, "Profile required to attach alerts")
            return
        alert = add_alert(profile_id=profile.id, label=str(label), event_time=str(event_time), notes=payload.get("notes"))
        upcoming = [item.to_dict() for item in upcoming_alerts(profile_id=profile.id)]
        self._send_json({"alert": alert.to_dict(), "upcoming": upcoming}, status=HTTPStatus.CREATED)

    def _handle_alerts_list(self) -> None:
        profile_id = self._query_param("profile_id")
        if profile_id:
            alerts = [alert.to_dict() for alert in upcoming_alerts(profile_id=int(profile_id))]
        else:
            alerts = alerts_summary()
        self._send_json({"alerts": alerts})

    def _handle_analytics(self) -> None:
        summary = analytics_snapshot()
        summary["feedback_quarterly"] = quarterly_reviews(limit=4)
        self._send_json(summary)

    def _handle_ml_retrain(self) -> None:
        if not self._is_admin():
            self.send_error(HTTPStatus.FORBIDDEN, "Admin token required for retraining")
            return

        payload = self._read_json()
        limit = payload.get("limit")
        limit_value = None
        if limit is not None:
            try:
                limit_value = int(limit)
            except (TypeError, ValueError):
                self.send_error(HTTPStatus.BAD_REQUEST, "limit must be an integer")
                return

        try:
            result = retrain_feedback_model(limit=limit_value)
        except ValueError as exc:
            self.send_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
        except Exception as exc:  # pragma: no cover - defensive telemetry
            capture_exception(exc, {"path": self.path})
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, "Retraining failed")
            return

        self.cache.clear()
        self._send_json({"message": "Retraining complete", "metrics": result}, status=HTTPStatus.ACCEPTED)

    def _handle_get_manuscript(self) -> None:
        corpus = load_bhrigu_data()
        self._send_json(corpus)

    def _handle_update_manuscript(self) -> None:
        payload = self._read_json()
        try:
            updated = persist_bhrigu_data(payload)
        except ValueError as exc:
            self.send_error(HTTPStatus.BAD_REQUEST, str(exc))
            return

        self.cache.clear()
        self._send_json({"message": "Manuscript updated", "principles": len(updated.get("principles", []))})

    # Utility helpers --------------------------------------------------------------
    def _respond_with_command(self, command: str, payload: Dict[str, Any]) -> None:
        cache_key = self._cache_key(command, payload)
        cached = self.cache.get(cache_key)
        if cached is not None:
            self._send_json(cached, headers={"X-Cache": "HIT"})
            return

        try:
            response = handle_command(command, payload)
        except ValueError as exc:
            logger.warning("Validation error for %s: %s", command, exc, extra={"path": self.path})
            self.send_error(HTTPStatus.BAD_REQUEST, str(exc), explain="Request body failed validation")
            return
        except Exception as exc:  # pragma: no cover - defensive catch for telemetry
            capture_exception(exc, {"command": command, "path": self.path})
            logger.exception("Unexpected server error handling %s", command, extra={"path": self.path})
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, "Unexpected server error")
            return
        self.cache.set(cache_key, response)
        self._send_json(response, headers={"X-Cache": "MISS"})

    def _read_json(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError as exc:  # pragma: no cover - invalid client input
            self.send_error(HTTPStatus.BAD_REQUEST, f"Malformed JSON: {exc}")
            return {}

    def _send_json(
        self, data: Dict[str, Any], status: HTTPStatus = HTTPStatus.OK, headers: Dict[str, str] | None = None
    ) -> None:
        encoded = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header(*_JSON_HEADER)
        self._add_cors_headers()
        if headers:
            for header, value in headers.items():
                self.send_header(header, value)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _add_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token")

    def _resolve_profile(self, payload: Dict[str, Any], allow_update_only: bool = True):
        profile_payload = payload.get("profile") if isinstance(payload.get("profile"), dict) else {}
        user_id = payload.get("user_id") or profile_payload.get("user_id")
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
            profile = get_profile(profile_id=int(profile_id))
        if not profile and user_id:
            profile = get_profile(user_id=str(user_id))

        if profile:
            base_payload["user_id"] = profile.user_id or user_id
            return create_or_update_profile(base_payload)

        if allow_update_only and not any(value for key, value in base_payload.items() if key != "metadata"):
            raise ValueError("Provide profile_id, user_id, or profile fields")

        base_payload.setdefault("user_id", payload.get("session_id") or payload.get("session_key") or "guest")
        return create_or_update_profile(base_payload)

    def _query_param(self, key: str) -> str | None:
        parsed = urlparse(self.path)
        values = parse_qs(parsed.query).get(key)
        return values[0] if values else None

    def _is_admin(self) -> bool:
        if not _ADMIN_TOKEN:
            return False
        return self.headers.get("X-Admin-Token") == _ADMIN_TOKEN

    def _cache_key(self, command: str, payload: Dict[str, Any]) -> str:
        serialized = json.dumps(payload or {}, sort_keys=True, ensure_ascii=False)
        return f"{command}:{serialized}"

    def send_error(  # type: ignore[override]
        self,
        code: int,
        message: str | None = None,
        explain: str | None = None,
        headers: Dict[str, str] | None = None,
    ) -> None:
        client_ip = self.client_address[0]
        method = getattr(self, "command", "")
        log_message = message or HTTPStatus(code).phrase
        log_extra = {"path": self.path, "method": method, "client": client_ip}
        if code >= 500:
            logger.error("Request failed with status %s: %s", code, log_message, extra=log_extra)
        else:
            logger.warning("Request failed with status %s: %s", code, log_message, extra=log_extra)

        content = json.dumps(
            {
                "message": message or HTTPStatus(code).phrase,
                "details": {
                    "path": self.path,
                    "method": method,
                    "client": client_ip,
                    "hint": explain or "Review the request payload and headers for mistakes.",
                },
            },
            ensure_ascii=False,
        ).encode("utf-8")
        self.send_response(code)
        self.send_header(*_JSON_HEADER)
        self._add_cors_headers()
        if headers:
            for header, value in headers.items():
                self.send_header(header, value)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


def handle_command(command: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Process a JSON payload for the supplied command and return a response."""

    if command == "horoscope":
        request = _request_from_payload(payload)
        report = build_prediction(request)
        response = _serialize_horoscope_report(report)

        # Some hosted deployments previously omitted kundli charts from the
        # serialized response. Regenerate them defensively so the frontend can
        # always render the wheel instead of falling back to placeholder copy.
        def _has_chart(data: Dict[str, Any], key: str) -> bool:
            houses = data.get(key)
            return isinstance(houses, list) and len(houses) >= 12

        if not _has_chart(response, "rashi_chart") or not _has_chart(response, "bhava_chart"):
            snapshot = _snapshot_from_request(request)
            kundli = generate_kundli(snapshot, weights=report.weights)
            response.setdefault("rashi_chart", [_serialize_obj(item) for item in kundli.get("rashi_chart", [])])
            response.setdefault("bhava_chart", [_serialize_obj(item) for item in kundli.get("bhava_chart", [])])
            response.setdefault("dashas", [_serialize_obj(item) for item in kundli.get("dashas", [])])

        _ensure_visualization_payload(response)

        return response
    if command == "past-life":
        report = build_past_life_report(_request_from_payload(payload))
        return {
            "name": report.name,
            "insights": [_serialize_obj(item) for item in report.insights],
            "interpretation": report.interpretation,
        }
    if command == "future":
        report = build_future_report(_request_from_payload(payload))
        return {
            "name": report.name,
            "trajectories": [_serialize_obj(item) for item in report.trajectories],
            "transit_directives": [_serialize_obj(item) for item in report.transit_directives],
            "progression_directives": [_serialize_obj(item) for item in report.progression_directives],
            "interpretation": report.interpretation,
        }
    if command == "matchmaking":
        primary = _request_from_payload(payload.get("primary", {}))
        partner = _request_from_payload(payload.get("partner", {}))
        modern_preferences = payload.get("modern_preferences", [])
        report = build_matchmaking_report(primary, partner, modern_preferences)
        compatibility = report.compatibility
        return {
            "primary_name": report.primary_name,
            "partner_name": report.partner_name,
            "compatibility": {
                "compatibility_index": compatibility.compatibility_index,
                "long_term_index": compatibility.long_term_index,
                "short_term_index": compatibility.short_term_index,
                "breakdown": [_serialize_obj(entry) for entry in compatibility.breakdown],
                "modern_highlights": compatibility.modern_highlights,
                "synastry_overlays": [_serialize_obj(entry) for entry in compatibility.synastry_overlays],
                "alignment_percentages": compatibility.alignment_percentages,
                "shared_life_paths": compatibility.shared_life_paths,
            },
            "interpretation": report.interpretation,
        }
    if command == "calendar":
        try:
            context = convert_birth_details(
                birth_date=payload["birth_date"],
                birth_time=payload["birth_time"],
                birth_place=payload["birth_place"],
            )
        except KeyError as exc:
            missing = exc.args[0]
            raise ValueError(f"Missing required field: {missing}") from exc
        return context.as_payload()
    if command == "transits":
        try:
            request = _request_from_payload(payload["natal"])
            transit_payload = payload["transit"]
        except KeyError as exc:
            missing = exc.args[0]
            raise ValueError(f"Missing required field: {missing}") from exc
        report = build_transit_report(request, transit_payload)
        return {
            "name": report.name,
            "directives": [_serialize_obj(item) for item in report.directives],
            "interpretation": report.interpretation,
        }
    raise ValueError(f"Unsupported command: {command}")


def _request_from_payload(payload: Dict[str, Any]) -> HoroscopeRequest:
    def _validate_birth_date(value: Any) -> str:
        if not isinstance(value, str) or not value:
            raise ValueError("Invalid birth date: use YYYY-MM-DD")
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError as exc:  # pragma: no cover - defensive against malformed dates
            raise ValueError(
                "Invalid birth date: use YYYY-MM-DD (e.g., 1995-05-18) so planetary periods align"
            ) from exc
        return value

    def _validate_birth_time(value: Any) -> str:
        if not isinstance(value, str) or not re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", value):
            raise ValueError("Invalid birth time: use 24h HH:MM (00–23 for hours, 00–59 for minutes)")
        return value

    def _validate_birth_place(value: Any) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Invalid birth place: include city and country (e.g., Jaipur, Bharat)")
        if "," not in value:
            raise ValueError(
                "Invalid birth place: include city and country (e.g., Jaipur, Bharat) for accurate house mapping"
            )
        return value

    try:
        return HoroscopeRequest(
            name=payload["name"],
            birth_date=_validate_birth_date(payload["birth_date"]),
            birth_time=_validate_birth_time(payload["birth_time"]),
            birth_place=_validate_birth_place(payload["birth_place"]),
            tradition=payload.get("tradition", "universal"),
            timezone=payload.get("timezone"),
            consent_for_date_predictions=bool(payload.get("consent_for_date_predictions", False)),
            lunar_tithi=int(payload.get("lunar_tithi", 0)),
            moon_element=payload.get("moon_element", ""),
            mars_house=int(payload.get("mars_house", 0)),
            saturn_house=int(payload.get("saturn_house", 0)),
            venus_house=int(payload.get("venus_house", 0)),
            rahu_aspects_ascendant=bool(payload.get("rahu_aspects_ascendant", False)),
            ketu_house=int(payload.get("ketu_house", 0)),
            mercury_house=int(payload.get("mercury_house", 0)),
            jupiter_house=int(payload.get("jupiter_house", 0)),
            saturn_retrograde=bool(payload.get("saturn_retrograde", False)),
        )
    except KeyError as exc:  # pragma: no cover - validated via CLI/API tests
        missing = exc.args[0]
        raise ValueError(f"Missing required field: {missing}") from exc


def _serialize_horoscope_report(report) -> Dict[str, Any]:
    return {
        "name": report.name,
        "karmic_epoch": report.karmic_epoch,
        "weights": report.weights,
        "principles": report.principles,
        "remedies": report.remedies,
        "past_life_insights": [_serialize_obj(item) for item in report.past_life_insights],
        "future_trajectories": [_serialize_obj(item) for item in report.future_trajectories],
        "interpretation": report.interpretation,
        "rashi_chart": [_serialize_obj(item) for item in report.rashi_chart],
        "bhava_chart": [_serialize_obj(item) for item in report.bhava_chart],
        "dashas": [_serialize_obj(item) for item in report.dashas],
    }


def _serialize_obj(obj: Any) -> Dict[str, Any]:
    return asdict(obj)


def _ensure_visualization_payload(response: Dict[str, Any]) -> None:
    """Guarantee charts and dashas for UI parity even when generators fail."""

    def _house_placeholder(index: int) -> Dict[str, Any]:
        sign = SIGNS[(index - 1) % len(SIGNS)]
        return {
            "index": index,
            "sign": sign,
            "occupants": ["Pending calculation"],
            "bhrigu_notes": ["Placeholder chart generated; verify birth details for precise mapping."],
        }

    for chart_key in ("rashi_chart", "bhava_chart"):
        chart = response.get(chart_key)
        if not isinstance(chart, list):
            chart = []
        filled_chart = list(chart[:12])
        while len(filled_chart) < 12:
            filled_chart.append(_house_placeholder(len(filled_chart) + 1))
        normalized_chart: List[Dict[str, Any]] = []
        for house in filled_chart:
            occupants = house.get("occupants") if isinstance(house, dict) else None
            normalized_chart.append(
                {
                    "index": house.get("index") if isinstance(house, dict) else len(normalized_chart) + 1,
                    "sign": house.get("sign") if isinstance(house, dict) else SIGNS[len(normalized_chart) % len(SIGNS)],
                    "occupants": occupants if occupants else ["Pending calculation"],
                    "bhrigu_notes": house.get("bhrigu_notes", ["Visualization placeholder"]) if isinstance(house, dict) else [
                        "Visualization placeholder"
                    ],
                }
            )
        response[chart_key] = normalized_chart

    dashas = response.get("dashas")
    if not isinstance(dashas, list) or not dashas:
        dashas = [
            {
                "lord": "Awaiting ephemeris",
                "start": "TBD",
                "end": "TBD",
                "anchor_rule": "Dasha timings unavailable; confirm date, time, and location inputs.",
            }
        ]
    normalized_dashas: List[Dict[str, Any]] = []
    for entry in dashas:
        normalized_dashas.append(
            {
                "lord": entry.get("lord", "Awaiting ephemeris") if isinstance(entry, dict) else str(entry),
                "start": entry.get("start", "TBD") if isinstance(entry, dict) else "TBD",
                "end": entry.get("end", "TBD") if isinstance(entry, dict) else "TBD",
                "anchor_rule": entry.get("anchor_rule", "Aligned with natal snapshot")
                if isinstance(entry, dict)
                else "Aligned with natal snapshot",
            }
        )
    response["dashas"] = normalized_dashas


def serve(host: str = "0.0.0.0", port: int = 8000) -> None:
    """Run the HTTP server until interrupted."""

    with ThreadingHTTPServer((host, port), BhriguAPIHandler) as server:
        logger.info("BhriguWelt API running on http://%s:%s", host, port)
        try:  # pragma: no cover - manual shutdown
            server.serve_forever()
        except KeyboardInterrupt:  # pragma: no cover - manual shutdown
            logger.info("Shutting down Bhrigu API")


__all__ = ["BhriguAPIHandler", "handle_command", "serve"]


if __name__ == "__main__":  # pragma: no cover - manual execution
    env_port = os.environ.get("RAILWAY_TCP_PORT") or os.environ.get("PORT", "8000")
    serve(host=os.environ.get("HOST", "0.0.0.0"), port=int(env_port))
