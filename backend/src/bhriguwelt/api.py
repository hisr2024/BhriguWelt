"""Minimal HTTP API exposing the Bhrigu Samhita prediction engines."""

from __future__ import annotations

import json
import os
from dataclasses import asdict
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, Tuple

from .calendar_conversion import convert_birth_details
from .horoscope import (
    HoroscopeRequest,
    build_future_report,
    build_matchmaking_report,
    build_past_life_report,
    build_prediction,
)

_JSON_HEADER = ("Content-Type", "application/json; charset=utf-8")


class BhriguAPIHandler(BaseHTTPRequestHandler):
    """HTTP handler serving JSON endpoints for native + partner insights."""

    routes: Dict[Tuple[str, str], str] = {
        ("GET", "/health"): "_handle_health",
        ("POST", "/horoscope"): "_handle_horoscope",
        ("POST", "/past-life"): "_handle_past_life",
        ("POST", "/future"): "_handle_future",
        ("POST", "/matchmaking"): "_handle_matchmaking",
        ("POST", "/calendar"): "_handle_calendar",
    }

    def do_GET(self) -> None:  # pragma: no cover - exercised via route map
        self._dispatch("GET")

    def do_POST(self) -> None:  # pragma: no cover - exercised via route map
        self._dispatch("POST")

    def log_message(self, format: str, *args: Any) -> None:  # pragma: no cover - silence
        return

    def _dispatch(self, method: str) -> None:
        handler_name = self.routes.get((method, self.path))
        if not handler_name:
            self.send_error(HTTPStatus.NOT_FOUND, "Route not defined in Bhrigu Samhita server")
            return
        handler = getattr(self, handler_name)
        handler()

    # Individual endpoint handlers -------------------------------------------------
    def _handle_health(self) -> None:
        self._send_json({"status": "ok", "source": "Bhrigu Samhita"})

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

    # Utility helpers --------------------------------------------------------------
    def _respond_with_command(self, command: str, payload: Dict[str, Any]) -> None:
        try:
            response = handle_command(command, payload)
        except ValueError as exc:
            self.send_error(HTTPStatus.BAD_REQUEST, str(exc))
            return
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
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def handle_command(command: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Process a JSON payload for the supplied command and return a response."""

    if command == "horoscope":
        report = build_prediction(_request_from_payload(payload))
        return _serialize_horoscope_report(report)
    if command == "past-life":
        report = build_past_life_report(_request_from_payload(payload))
        return {"name": report.name, "insights": [_serialize_obj(item) for item in report.insights]}
    if command == "future":
        report = build_future_report(_request_from_payload(payload))
        return {"name": report.name, "trajectories": [_serialize_obj(item) for item in report.trajectories]}
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
                "breakdown": [_serialize_obj(entry) for entry in compatibility.breakdown],
                "modern_highlights": compatibility.modern_highlights,
            },
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
    raise ValueError(f"Unsupported command: {command}")


def _request_from_payload(payload: Dict[str, Any]) -> HoroscopeRequest:
    try:
        return HoroscopeRequest(
            name=payload["name"],
            birth_date=payload["birth_date"],
            birth_time=payload["birth_time"],
            birth_place=payload["birth_place"],
            lunar_tithi=int(payload["lunar_tithi"]),
            moon_element=payload["moon_element"],
            mars_house=int(payload["mars_house"]),
            saturn_house=int(payload["saturn_house"]),
            venus_house=int(payload["venus_house"]),
            rahu_aspects_ascendant=bool(payload.get("rahu_aspects_ascendant", False)),
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
