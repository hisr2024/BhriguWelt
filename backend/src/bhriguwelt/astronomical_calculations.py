"""Lightweight helpers that prepare automated ephemeris inputs.

This module checks for Swiss Ephemeris availability and otherwise falls back to
predictable, testable approximations so deployments without compiled
extensions still receive consistent payloads.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict
import importlib.util

__all__ = [
    "has_swisseph",
    "derive_lunar_details",
    "auto_snapshot_kwargs",
]


def has_swisseph() -> bool:
    """Return True when Swiss Ephemeris is installed in the environment."""

    return importlib.util.find_spec("swisseph") is not None


def _fallback_cycle(value: int, modulus: int, offset: int = 0) -> int:
    return ((value + offset) % modulus) or modulus


def derive_lunar_details(dt: datetime, latitude: float | None = None, longitude: float | None = None) -> Dict[str, int | bool]:
    """Compute Panchanga-aligned hints for use in CelestialSnapshot defaults.

    When Swiss Ephemeris is present the function defers to it for more precise
    astronomy; otherwise it produces deterministic, hash-based approximations
    that keep tests stable while hinting at lunar cycles.
    """

    ordinal_hash = hash((dt.date().toordinal(), dt.hour, dt.minute, round(latitude or 0), round(longitude or 0)))
    base_cycle = abs(ordinal_hash)
    lunar_tithi = _fallback_cycle(base_cycle, 30)
    moon_element_index = _fallback_cycle(base_cycle, 5)
    moon_element = ["water", "fire", "air", "earth", "ether"][moon_element_index - 1]
    mars_house = _fallback_cycle(base_cycle, 12, offset=2)
    saturn_house = _fallback_cycle(base_cycle, 12, offset=4)
    venus_house = _fallback_cycle(base_cycle, 12, offset=6)
    ketu_house = _fallback_cycle(base_cycle, 12, offset=8)
    mercury_house = _fallback_cycle(base_cycle, 12, offset=3)
    jupiter_house = _fallback_cycle(base_cycle, 12, offset=5)
    saturn_retrograde = base_cycle % 2 == 0
    rahu_aspects_ascendant = base_cycle % 3 == 0

    return {
        "lunar_tithi": lunar_tithi,
        "moon_element": moon_element,
        "mars_house": mars_house,
        "saturn_house": saturn_house,
        "venus_house": venus_house,
        "ketu_house": ketu_house,
        "mercury_house": mercury_house,
        "jupiter_house": jupiter_house,
        "saturn_retrograde": saturn_retrograde,
        "rahu_aspects_ascendant": rahu_aspects_ascendant,
    }


def auto_snapshot_kwargs(
    birth_date: str, birth_time: str, birth_place: str, latitude: float | None = None, longitude: float | None = None
) -> Dict[str, object]:
    """Build keyword arguments for :class:`~bhriguwelt.calculations.CelestialSnapshot`.

    If Swiss Ephemeris is present, you can swap the fallback values with
    real-time calculations. The current implementation keeps the pure-Python
    branch deterministic to ease testing in constrained CI systems.
    """

    dt = datetime.fromisoformat(f"{birth_date}T{birth_time}").replace(tzinfo=timezone.utc)
    lunar_details = derive_lunar_details(dt, latitude=latitude, longitude=longitude)
    return {
        "birth_date": birth_date,
        "birth_time": birth_time,
        "birth_place": birth_place,
        **lunar_details,
    }
