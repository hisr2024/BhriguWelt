"""Lightweight helpers that prepare automated ephemeris inputs.

This module checks for Swiss Ephemeris availability and otherwise falls back to
predictable, testable approximations so deployments without compiled
extensions still receive consistent payloads.
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Dict
import importlib.util
from zoneinfo import ZoneInfo

try:  # pragma: no cover - optional dependency
    import pytz
except Exception:  # pragma: no cover - optional dependency
    pytz = None

__all__ = [
    "has_swisseph",
    "derive_lunar_details",
    "auto_snapshot_kwargs",
    "derive_transit_snapshot",
    "normalize_birth_datetime",
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
    that keep tests stable while hinting at lunar cycles. The optional latitude
    and longitude are used for house calculations and daylight adjustments when
    Swiss Ephemeris is installed.
    """

    if has_swisseph():
        return _swisseph_lunar_details(dt, latitude=latitude, longitude=longitude)

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
    birth_date: str,
    birth_time: str,
    birth_place: str,
    latitude: float | None = None,
    longitude: float | None = None,
    timezone_name: str | None = None,
) -> Dict[str, object]:
    """Build keyword arguments for :class:`~bhriguwelt.calculations.CelestialSnapshot`.

    If Swiss Ephemeris is present, you can swap the fallback values with
    real-time calculations. The current implementation keeps the pure-Python
    branch deterministic to ease testing in constrained CI systems.
    """

    dt = normalize_birth_datetime(birth_date, birth_time, timezone_name=timezone_name)
    lunar_details = derive_lunar_details(dt, latitude=latitude, longitude=longitude)
    return {
        "birth_date": dt.date().isoformat(),
        "birth_time": dt.time().isoformat(timespec="minutes"),
        "birth_place": birth_place,
        **lunar_details,
    }


def derive_transit_snapshot(
    natal_dt: datetime,
    transit_dt: datetime,
    latitude: float | None = None,
    longitude: float | None = None,
) -> Dict[str, int | bool]:
    """Return differential transit readings relative to natal date/time."""

    natal_details = derive_lunar_details(natal_dt, latitude=latitude, longitude=longitude)
    transit_details = derive_lunar_details(transit_dt, latitude=latitude, longitude=longitude)

    return {
        "tithi_delta": (transit_details["lunar_tithi"] - natal_details["lunar_tithi"]),
        "moon_element_shift": transit_details["moon_element"],
        "mars_house": transit_details["mars_house"],
        "saturn_house": transit_details["saturn_house"],
        "venus_house": transit_details["venus_house"],
        "ketu_house": transit_details["ketu_house"],
        "mercury_house": transit_details["mercury_house"],
        "jupiter_house": transit_details["jupiter_house"],
        "saturn_retrograde": transit_details["saturn_retrograde"],
        "rahu_aspects_ascendant": transit_details["rahu_aspects_ascendant"],
    }


def normalize_birth_datetime(
    birth_date: str, birth_time: str, timezone_name: str | None = None, offset_minutes: int | None = None
) -> datetime:
    """Normalize an ISO birth date/time string into an aware UTC datetime.

    Handles pre-1900 dates, DST-aware timezone strings, or manual minute offsets.
    """

    naive = datetime.fromisoformat(f"{birth_date}T{birth_time}")
    tzinfo = timezone.utc
    if timezone_name:
        try:
            tzinfo = ZoneInfo(timezone_name)
        except Exception:
            if pytz:
                tzinfo = pytz.timezone(timezone_name)
            else:
                tzinfo = timezone.utc
    elif offset_minutes is not None:
        tzinfo = timezone(timedelta(minutes=offset_minutes))
    aware = naive.replace(tzinfo=tzinfo)
    return aware.astimezone(timezone.utc)


def _swisseph_lunar_details(dt: datetime, latitude: float | None = None, longitude: float | None = None) -> Dict[str, int | bool]:
    import swisseph as swe  # type: ignore

    ut_dt = dt.astimezone(timezone.utc)
    swe.set_ephe_path(".")
    if latitude is not None and longitude is not None:
        swe.set_topo(longitude, latitude, 0)

    jd = swe.julday(ut_dt.year, ut_dt.month, ut_dt.day, ut_dt.hour + ut_dt.minute / 60.0)
    sun_long = swe.calc_ut(jd, swe.SUN)[0][0]
    moon_long, moon_speed = swe.calc_ut(jd, swe.MOON)[0][:2]
    mars_long, mars_speed = swe.calc_ut(jd, swe.MARS)[0][:2]
    saturn_long, saturn_speed = swe.calc_ut(jd, swe.SATURN)[0][:2]
    venus_long, venus_speed = swe.calc_ut(jd, swe.VENUS)[0][:2]
    mercury_long, mercury_speed = swe.calc_ut(jd, swe.MERCURY)[0][:2]
    jupiter_long, jupiter_speed = swe.calc_ut(jd, swe.JUPITER)[0][:2]
    rahu_long = swe.calc_ut(jd, swe.TRUE_NODE)[0][0]
    ketu_long = (rahu_long + 180) % 360

    lunar_tithi = int(((moon_long - sun_long) % 360) // 12) + 1
    moon_element = _element_from_longitude(moon_long)

    def _house_from_longitude(longitude_value: float) -> int:
        return int(longitude_value // 30) + 1

    mars_house = _house_from_longitude(mars_long)
    saturn_house = _house_from_longitude(saturn_long)
    venus_house = _house_from_longitude(venus_long)
    ketu_house = _house_from_longitude(ketu_long)
    mercury_house = _house_from_longitude(mercury_long)
    jupiter_house = _house_from_longitude(jupiter_long)

    saturn_retrograde = saturn_speed < 0
    rahu_aspects_ascendant = (rahu_long % 60) < 20

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


def _element_from_longitude(longitude_value: float) -> str:
    sign_index = int(longitude_value // 30)
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
    return element_map[sign_index]
