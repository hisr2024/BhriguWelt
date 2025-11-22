"""Accuracy benchmarks for well-documented natal charts."""

from __future__ import annotations

import json
from pathlib import Path
import sys
import time
from typing import Dict, Iterable, List

import pytest

from bhriguwelt.astronomical_calculations import (
    _element_from_longitude,
    derive_lunar_details,
    has_swisseph,
    normalize_birth_datetime,
)

DATA_PATH = Path(__file__).parent / "data" / "benchmark_charts.json"
EXTERNAL_DATA_PATH = Path(__file__).parent / "data" / "external_tool_benchmarks.json"


def _load_benchmark_charts() -> Iterable[Dict[str, object]]:
    with DATA_PATH.open() as fp:
        return json.load(fp)


def _load_external_benchmarks() -> Iterable[Dict[str, object]]:
    with EXTERNAL_DATA_PATH.open() as fp:
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


def _install_fake_swisseph(monkeypatch: pytest.MonkeyPatch, chart: Dict[str, object]) -> None:
    longitudes = chart["external_longitudes"]

    class DummySwe:
        SUN = 0
        MOON = 1
        MARS = 2
        SATURN = 3
        VENUS = 4
        MERCURY = 5
        JUPITER = 6
        TRUE_NODE = 7
        GREG_CAL = 1

        @staticmethod
        def set_ephe_path(path: str) -> None:  # noqa: ARG004
            return None

        @staticmethod
        def set_topo(longitude: float, latitude: float, altitude: float) -> None:  # noqa: ARG002, ARG003, ARG004
            return None

        @staticmethod
        def julday(year: int, month: int, day: int, ut: float, calendar_flag: int) -> float:  # noqa: ARG002, ARG003, ARG004
            return float(year + month + day) + ut + calendar_flag

        @staticmethod
        def calc_ut(julian_day: float, target: int):  # noqa: ANN001
            reference: Dict[int, List[float]] = {
                DummySwe.SUN: [longitudes["sun_long"], 0.0],
                DummySwe.MOON: [longitudes["moon_long"], longitudes.get("moon_speed", 0.0)],
                DummySwe.MARS: [longitudes["mars_long"], longitudes.get("mars_speed", 0.0)],
                DummySwe.SATURN: [longitudes["saturn_long"], longitudes.get("saturn_speed", 0.0)],
                DummySwe.VENUS: [longitudes["venus_long"], longitudes.get("venus_speed", 0.0)],
                DummySwe.MERCURY: [longitudes["mercury_long"], longitudes.get("mercury_speed", 0.0)],
                DummySwe.JUPITER: [longitudes["jupiter_long"], longitudes.get("jupiter_speed", 0.0)],
                DummySwe.TRUE_NODE: [longitudes["rahu_long"], longitudes.get("rahu_speed", 0.0)],
            }

            longitude, speed = reference[target]
            return ([longitude, speed, julian_day], 0)

    monkeypatch.setitem(sys.modules, "swisseph", DummySwe)


@pytest.mark.parametrize("chart", _load_external_benchmarks())
def test_external_astrosage_alignment(monkeypatch, chart: Dict[str, object]):
    """Ensure Swiss branch aligns with pre-recorded AstroSage Panchang values."""

    monkeypatch.setattr("bhriguwelt.astronomical_calculations.has_swisseph", lambda: True)
    _install_fake_swisseph(monkeypatch, chart)

    dt = normalize_birth_datetime(chart["birth_date"], chart["birth_time"], timezone_name=chart["timezone"])
    details = derive_lunar_details(dt, latitude=chart["latitude"], longitude=chart["longitude"])

    longitudes = chart["external_longitudes"]
    ketu_long = (longitudes["rahu_long"] + 180) % 360
    expected = {
        "lunar_tithi": int(((longitudes["moon_long"] - longitudes["sun_long"]) % 360) // 12) + 1,
        "moon_element": _element_from_longitude(longitudes["moon_long"]),
        "mars_house": int(longitudes["mars_long"] // 30) + 1,
        "saturn_house": int(longitudes["saturn_long"] // 30) + 1,
        "venus_house": int(longitudes["venus_long"] // 30) + 1,
        "ketu_house": int(ketu_long // 30) + 1,
        "mercury_house": int(longitudes["mercury_long"] // 30) + 1,
        "jupiter_house": int(longitudes["jupiter_long"] // 30) + 1,
        "saturn_retrograde": longitudes.get("saturn_speed", 0.0) < 0,
        "rahu_aspects_ascendant": (longitudes["rahu_long"] % 60) < 20,
    }

    assert details == expected


def test_vectorized_element_performance():
    """Large batches of longitudes should map quickly to elements."""

    numpy = pytest.importorskip("numpy")

    longitudes = numpy.linspace(0, 360, num=20000, endpoint=False)
    expected_elements = numpy.take(
        numpy.array(
            [
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
        ),
        (longitudes // 30).astype(int),
    )

    start = time.perf_counter()
    actual_elements = numpy.vectorize(_element_from_longitude)(longitudes)
    duration = time.perf_counter() - start

    numpy.testing.assert_array_equal(actual_elements, expected_elements)
    assert duration < 1.0, f"Element mapping slowed to {duration:.3f}s for 20k entries"
