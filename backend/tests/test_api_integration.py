"""End-to-end HTTP tests against the threaded API server."""

from __future__ import annotations

import http.client
import json
import threading
from contextlib import contextmanager
from http.server import ThreadingHTTPServer

from bhriguwelt.api import BhriguAPIHandler


@contextmanager
def running_server():
    server = ThreadingHTTPServer(("127.0.0.1", 0), BhriguAPIHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_address
    finally:
        server.shutdown()
        thread.join()


def _post(path: str, payload: dict, address) -> tuple[int, dict, dict]:
    connection = http.client.HTTPConnection(*address)
    body = json.dumps(payload).encode()
    connection.request(
        "POST",
        path,
        body,
        {"Content-Type": "application/json", "Content-Length": str(len(body))},
    )
    response = connection.getresponse()
    content = response.read().decode()
    headers = dict(response.getheaders())
    connection.close()
    try:
        data = json.loads(content) if content else {}
    except json.JSONDecodeError:
        data = {"raw": content}
    return response.status, data, headers


def _options(path: str, address) -> tuple[int, dict]:
    connection = http.client.HTTPConnection(*address)
    connection.request(
        "OPTIONS",
        path,
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    response = connection.getresponse()
    headers = dict(response.getheaders())
    connection.close()
    return response.status, headers


def _payload(**overrides):
    base = dict(
        name="Asha",
        birth_date="1995-05-18",
        birth_time="14:45",
        birth_place="Varanasi",
        consent_for_date_predictions=True,
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return base


def test_http_horoscope_round_trip():
    with running_server() as address:
        status, data, headers = _post("/horoscope", _payload(), address)
        assert status == 200
        assert data.get("principles"), "Horoscope response missing principles"
        assert data.get("past_life_insights"), "Horoscope response missing past-life insights"
        assert headers.get("Access-Control-Allow-Origin") == "*"


def test_http_future_round_trip():
    with running_server() as address:
        status, data, _ = _post("/future", _payload(), address)
        assert status == 200
        assert data.get("trajectories"), "Future response missing trajectories"


def test_http_past_life_round_trip():
    with running_server() as address:
        status, data, _ = _post("/past-life", _payload(), address)
        assert status == 200
        assert data.get("insights"), "Past-life response missing insights"


def test_http_matchmaking_round_trip():
    with running_server() as address:
        status, data, _ = _post(
            "/matchmaking",
            dict(
                primary=_payload(),
                partner=_payload(
                    name="Arjun",
                    birth_date="1992-09-09",
                    lunar_tithi=4,
                    moon_element="earth",
                    mars_house=8,
                    venus_house=3,
                    rahu_aspects_ascendant=False,
                ),
                modern_preferences=["remote-first", "arts-collab"],
            ),
            address,
        )
        assert status == 200
        assert data.get("compatibility", {}).get("breakdown"), "Compatibility breakdown missing"
        assert data.get("compatibility", {}).get("modern_highlights"), "Modern highlights missing"


def test_http_validation_rejects_out_of_range_tithi():
    with running_server() as address:
        status, data, _ = _post("/horoscope", _payload(lunar_tithi=31), address)
        assert status == 400
        assert "tithi" in (data.get("message") or "") or "tithi" in (data.get("raw") or "")


def test_http_cors_preflight_allows_json_posts():
    with running_server() as address:
        status, headers = _options("/future", address)
        assert status == 204
        assert headers.get("Access-Control-Allow-Origin") == "*"
        assert "POST" in headers.get("Access-Control-Allow-Methods", "")
        assert "Content-Type" in headers.get("Access-Control-Allow-Headers", "")
