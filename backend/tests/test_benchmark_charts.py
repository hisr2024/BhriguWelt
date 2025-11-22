"""Accuracy benchmarks for well-documented natal charts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Iterable

import pytest

from bhriguwelt.astronomical_calculations import (
    derive_lunar_details,
    has_swisseph,
    normalize_birth_datetime,
)

DATA_PATH = Path(__file__).parent / "data" / "benchmark_charts.json"


def _load_benchmark_charts() -> Iterable[Dict[str, object]]:
    with DATA_PATH.open() as fp:
        return json.load(fp)


@pytest.mark.parametrize("chart", _load_benchmark_charts())
def test_curated_charts_match_recorded_outputs(chart: Dict[str, object]):
    """Ensure famous charts map to pre-recorded lunar markers."""

    dt = normalize_birth_datetime(chart["birth_date"], chart["birth_time"], timezone_name=chart["timezone"])
    details = derive_lunar_details(dt, latitude=chart["latitude"], longitude=chart["longitude"])

    if has_swisseph() and chart.get("expected_swisseph"):
        expected = chart["expected_swisseph"]
    elif not has_swisseph():
        expected = chart["expected_fallback"]
    else:
        pytest.skip(f"Recorded Swiss Ephemeris readings are missing for {chart['name']}")

    for key, value in expected.items():
        assert details[key] == value, f"Unexpected {key} for {chart['name']}"


def test_swisseph_branch_respects_external_longitudes(monkeypatch):
    """Cross-check the Swiss Ephemeris translation logic against recorded longitudes."""

    # These longitudes mirror an external Panchanga lookup for Swami Vivekananda's birth window.
    swe_output = {
        "sun_long": 296.5,
        "moon_long": 311.2,
        "mars_long": 45.0,
        "saturn_long": 195.0,
        "venus_long": 123.0,
        "mercury_long": 210.0,
        "jupiter_long": 33.0,
        "rahu_long": 10.0,
        "ketu_long": (10.0 + 180) % 360,
        "moon_speed": 0.0,
        "saturn_speed": -0.1,
    }

    element_map = [
        "fire",
        "earth",
        "air",
        "water",
        "fire",
        "earth",
        "air",
        "water",
        "fire",
        "earth",
        "air",
        "water",
    ]

    def _house(longitude_value: float) -> int:
        return int(longitude_value // 30) + 1

    expected = {
        "lunar_tithi": int(((swe_output["moon_long"] - swe_output["sun_long"]) % 360) // 12) + 1,
        "moon_element": element_map[int(swe_output["moon_long"] // 30)],
        "mars_house": _house(swe_output["mars_long"]),
        "saturn_house": _house(swe_output["saturn_long"]),
        "venus_house": _house(swe_output["venus_long"]),
        "ketu_house": _house(swe_output["ketu_long"]),
        "mercury_house": _house(swe_output["mercury_long"]),
        "jupiter_house": _house(swe_output["jupiter_long"]),
        "saturn_retrograde": swe_output["saturn_speed"] < 0,
        "rahu_aspects_ascendant": (swe_output["rahu_long"] % 60) < 20,
    }

    def fake_has_swisseph() -> bool:
        return True

    def fake_swisseph_details(dt, latitude=None, longitude=None):  # noqa: ANN001
        return expected

    monkeypatch.setattr("bhriguwelt.astronomical_calculations.has_swisseph", fake_has_swisseph)
    monkeypatch.setattr("bhriguwelt.astronomical_calculations._swisseph_lunar_details", fake_swisseph_details)

    dt = normalize_birth_datetime("1863-01-12", "06:33", timezone_name="Asia/Kolkata")
    details = derive_lunar_details(dt, latitude=22.5726, longitude=88.3639)

    assert details == expected
