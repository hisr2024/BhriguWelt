"""Integration-style tests that exercise the HTTP handler end to end."""

from __future__ import annotations

import json
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from typing import Dict

from bhriguwelt import api


def _start_server() -> tuple[ThreadingHTTPServer, int]:
    server = ThreadingHTTPServer(("127.0.0.1", 0), api.BhriguAPIHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, port


def _post(port: int, path: str, payload: Dict) -> tuple[int, Dict]:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=5) as response:  # type: ignore[call-arg]
        return response.getcode(), json.loads(response.read().decode("utf-8"))


def _get(port: int, path: str) -> tuple[int, Dict]:
    with urllib.request.urlopen(f"http://127.0.0.1:{port}{path}", timeout=5) as response:  # type: ignore[call-arg]
        return response.getcode(), json.loads(response.read().decode("utf-8"))


def _payload(**overrides):
    base = dict(
        name="Asha",
        birth_date="1995-05-18",
        birth_time="14:45",
        birth_place="Varanasi",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return base


def test_http_health_and_calendar_endpoints():
    server, port = _start_server()
    try:
        status, body = _get(port, "/health")
        assert status == 200
        assert body["status"] == "ok"

        calendar_status, calendar_body = _post(
            port, "/calendar", {"birth_date": "2024-03-21", "birth_time": "05:30", "birth_place": "Prayagraj"}
        )
        assert calendar_status == 200
        assert calendar_body["saka_date"]["year"] == 1946
    finally:
        server.shutdown()
        server.server_close()


def test_http_horoscope_validates_inputs():
    server, port = _start_server()
    try:
        try:
            _post(port, "/horoscope", _payload(lunar_tithi=99))
            assert False, "Expected validation error"
        except urllib.error.HTTPError as exc:
            assert exc.code == 400
    finally:
        server.shutdown()
        server.server_close()
