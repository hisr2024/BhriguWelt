"""Minimal HTTP API exposing the Bhrigu Samhita prediction engines."""

from __future__ import annotations

import json
import os
from dataclasses import asdict
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from time import monotonic
from typing import Any, Dict, Tuple

from .data_loader import load_bhrigu_data, persist_bhrigu_data
from .calendar_conversion import convert_birth_details
from .telemetry import capture_exception, init_telemetry
from .horoscope import (
    HoroscopeRequest,
    build_future_report,
    build_matchmaking_report,
    build_transit_report,
    build_past_life_report,
    build_prediction,
)

_JSON_HEADER = ("Content-Type", "application/json; charset=utf-8")

init_telemetry()


class RateLimiter:
    """Thread-safe, in-memory token bucket for per-client throttling."""

    def __init__(self, max_requests: int = 60, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window = window_seconds
        self._lock = Lock()
        self._tokens: Dict[str, tuple[int, float]] = {}

    def allow(self, key: str) -> bool:
        now = monotonic()
        with self._lock:
            count, reset = self._tokens.get(key, (0, now + self.window))
            if now > reset:
                count, reset = 0, now + self.window
            count += 1
            self._tokens[key] = (count, reset)
            return count <= self.max_requests

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

    def get(self, key: str) -> Dict[str, Any] | None:
        now = monotonic()
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            expires_at, payload = entry
            if now > expires_at:
                self._store.pop(key, None)
                return None
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


class BhriguAPIHandler(BaseHTTPRequestHandler):
    """HTTP handler serving JSON endpoints for native + partner insights."""

    routes: Dict[Tuple[str, str], str] = {
        ("GET", "/health"): "_handle_health",
        ("GET", "/feedback/quarterly"): "_handle_feedback_quarterly",
        ("POST", "/horoscope"): "_handle_horoscope",
        ("POST", "/past-life"): "_handle_past_life",
        ("POST", "/future"): "_handle_future",
        ("POST", "/matchmaking"): "_handle_matchmaking",
        ("POST", "/calendar"): "_handle_calendar",
        ("POST", "/transits"): "_handle_transits",
        ("GET", "/manuscript"): "_handle_get_manuscript",
        ("POST", "/manuscript"): "_handle_update_manuscript",
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
        if not self.rate_limiter.allow(client_id):
            self.send_error(HTTPStatus.TOO_MANY_REQUESTS, "Rate limit exceeded; try again later")
            return

        handler_name = self.routes.get((method, self.path))
        if not handler_name:
            self.send_error(HTTPStatus.NOT_FOUND, "Route not defined in Bhrigu Samhita server")
            return
        handler = getattr(self, handler_name)
        handler()

    # Individual endpoint handlers -------------------------------------------------
    def _handle_health(self) -> None:
        self._send_json({"status": "ok", "source": "Bhrigu Samhita"})

    def _handle_feedback(self) -> None:
        payload = self._read_json()
        try:
            entry = record_feedback(
                engine=payload.get("engine", ""),
                rating=int(payload.get("rating", 0)),
                seeker_name=payload.get("seeker_name"),
                notes=payload.get("notes", ""),
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
            self._send_json(cached)
            return

        try:
            response = handle_command(command, payload)
        except ValueError as exc:
            self.send_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
        except Exception as exc:  # pragma: no cover - defensive catch for telemetry
            capture_exception(exc, {"command": command, "path": self.path})
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, "Unexpected server error")
            return
        self.cache.set(cache_key, response)
        self._send_json(response)

    def _read_json(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError as exc:  # pragma: no cover - invalid client input
            self.send_error(HTTPStatus.BAD_REQUEST, f"Malformed JSON: {exc}")
            return {}

    def _send_json(self, data: Dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header(*_JSON_HEADER)
        self._add_cors_headers()
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _add_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _cache_key(self, command: str, payload: Dict[str, Any]) -> str:
        serialized = json.dumps(payload or {}, sort_keys=True, ensure_ascii=False)
        return f"{command}:{serialized}"

    def send_error(  # type: ignore[override]
        self, code: int, message: str | None = None, explain: str | None = None
    ) -> None:
        content = json.dumps({"message": message or HTTPStatus(code).phrase}, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header(*_JSON_HEADER)
        self._add_cors_headers()
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


def handle_command(command: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Process a JSON payload for the supplied command and return a response."""

    if command == "horoscope":
        report = build_prediction(_request_from_payload(payload))
        return _serialize_horoscope_report(report)
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
    try:
        return HoroscopeRequest(
            name=payload["name"],
            birth_date=payload["birth_date"],
            birth_time=payload["birth_time"],
            birth_place=payload["birth_place"],
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


def serve(host: str = "0.0.0.0", port: int = 8000) -> None:
    """Run the HTTP server until interrupted."""

    with ThreadingHTTPServer((host, port), BhriguAPIHandler) as server:
        print(f"Bhrigu API listening on http://{host}:{port}")
        try:  # pragma: no cover - manual shutdown
            server.serve_forever()
        except KeyboardInterrupt:  # pragma: no cover - manual shutdown
            print("Shutting down Bhrigu API")


__all__ = ["BhriguAPIHandler", "handle_command", "serve"]


if __name__ == "__main__":  # pragma: no cover - manual execution
    env_port = os.environ.get("RAILWAY_TCP_PORT") or os.environ.get("PORT", "8000")
    serve(host=os.environ.get("HOST", "0.0.0.0"), port=int(env_port))
