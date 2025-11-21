"""Generate Kundli charts with optional Swiss Ephemeris precision."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, List

from .astronomical_calculations import geocode_location, has_swisseph, normalize_birth_datetime
from .calculations import CelestialSnapshot

SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]

DASHA_SEQUENCE = [
    ("Ketu", 7),
    ("Venus", 20),
    ("Sun", 6),
    ("Moon", 10),
    ("Mars", 7),
    ("Rahu", 18),
    ("Jupiter", 16),
    ("Saturn", 19),
    ("Mercury", 17),
]


@dataclass
class ChartHouse:
    index: int
    sign: str
    occupants: List[str]
    bhrigu_notes: List[str]


@dataclass
class DashaPeriod:
    lord: str
    start: str
    end: str
    anchor_rule: str


def _add_years(dt: datetime, years: float) -> datetime:
    # Approximates a tropical year; good enough for display and ordering.
    return dt + timedelta(days=365.25 * years)


def _fallback_occupants(snapshot: CelestialSnapshot) -> Dict[int, List[str]]:
    mapping: Dict[int, List[str]] = {index: [] for index in range(1, 13)}
    placements = {
        "Mars": snapshot.mars_house,
        "Saturn": snapshot.saturn_house,
        "Venus": snapshot.venus_house,
        "Ketu": snapshot.ketu_house,
        "Mercury": snapshot.mercury_house,
        "Jupiter": snapshot.jupiter_house,
    }
    for planet, house in placements.items():
        if house:
            mapping.setdefault(house, []).append(planet)
    if snapshot.rahu_aspects_ascendant:
        mapping[1].append("Rahu (aspect)")
    if snapshot.saturn_retrograde:
        mapping[snapshot.saturn_house or 1].append("Saturn (retrograde)")
    return mapping


def _swisseph_occupants(snapshot: CelestialSnapshot, tz_name: str | None) -> Dict[int, List[str]]:
    try:  # pragma: no cover - depends on optional binary wheels
        import swisseph as swe
    except Exception:  # pragma: no cover - fallback when Swiss Ephemeris missing
        return _fallback_occupants(snapshot)

    birth_dt = normalize_birth_datetime(
        birth_date=snapshot.birth_date.isoformat(),
        birth_time=snapshot.birth_time.isoformat(timespec="minutes"),
        timezone_name=tz_name,
    )
    latitude, longitude, _ = geocode_location(snapshot.birth_place)
    swe.set_topo(longitude or 0.0, latitude or 0.0)
    julian_day = swe.julday(
        birth_dt.year,
        birth_dt.month,
        birth_dt.day,
        birth_dt.hour + birth_dt.minute / 60.0,
        swe.GREG_CAL,
    )

    occupants: Dict[int, List[str]] = {index: [] for index in range(1, 13)}
    planet_codes = {
        "Sun": swe.SUN,
        "Moon": swe.MOON,
        "Mars": swe.MARS,
        "Mercury": swe.MERCURY,
        "Jupiter": swe.JUPITER,
        "Venus": swe.VENUS,
        "Saturn": swe.SATURN,
        "Rahu": swe.MEAN_NODE,
        "Ketu": swe.MEAN_NODE,
    }

    ascendant = int((swe.houses_ex(julian_day, latitude or 0.0, longitude or 0.0, b"P"))[0][0] // 30) + 1
    occupants[ascendant].append("Asc")

    for planet_name, code in planet_codes.items():
        position = swe.calc_ut(julian_day, code)[0][0]
        house_number = int(position // 30) + 1
        label = planet_name
        if planet_name == "Ketu":
            ketu_house = ((house_number + 6 - 1) % 12) + 1
            occupants[ketu_house].append(label)
        else:
            occupants[house_number].append(label)

    return occupants


def _overlay_notes(weights: Dict[str, float] | None) -> List[str]:
    if not weights:
        return []
    highlights = []
    for key, value in sorted(weights.items(), key=lambda item: item[1], reverse=True):
        if value >= 0.75:
            highlights.append(f"{key.replace('_', ' ').title()} activated ({value:.2f})")
    return highlights[:3]


def generate_kundli(snapshot: CelestialSnapshot, weights: Dict[str, float] | None = None, timezone_name: str | None = None):
    """Return Rashi, Bhava, and Vimshottari dasha details for visualization."""

    occupant_map = _swisseph_occupants(snapshot, tz_name=timezone_name) if has_swisseph() else _fallback_occupants(snapshot)
    overlay = _overlay_notes(weights)

    def build_chart(offset: int = 0) -> List[ChartHouse]:
        houses: List[ChartHouse] = []
        for index in range(1, 13):
            sign_index = ((index + offset - 1) % 12)
            sign = SIGNS[sign_index]
            occupants = occupant_map.get(index, [])
            houses.append(ChartHouse(index=index, sign=sign, occupants=occupants or ["—"], bhrigu_notes=overlay))
        return houses

    rashi_chart = build_chart()
    bhava_chart = build_chart(offset=1)

    dashas = generate_vimshottari_dasha(snapshot, weights)

    return {
        "rashi_chart": rashi_chart,
        "bhava_chart": bhava_chart,
        "dashas": dashas,
    }


def generate_vimshottari_dasha(snapshot: CelestialSnapshot, weights: Dict[str, float] | None = None) -> List[DashaPeriod]:
    birth_dt = datetime.combine(snapshot.birth_date, snapshot.birth_time).replace(tzinfo=timezone.utc)
    start_index = snapshot.lunar_tithi % len(DASHA_SEQUENCE)
    ordered = DASHA_SEQUENCE[start_index:] + DASHA_SEQUENCE[:start_index]
    anchor = _overlay_notes(weights)

    dashas: List[DashaPeriod] = []
    current_start = birth_dt
    for lord, duration_years in ordered[:5]:
        end_dt = _add_years(current_start, duration_years)
        dashas.append(
            DashaPeriod(
                lord=lord,
                start=current_start.date().isoformat(),
                end=end_dt.date().isoformat(),
                anchor_rule=anchor[0] if anchor else "Aligned with natal snapshot",
            )
        )
        current_start = end_dt
    return dashas


__all__ = [
    "ChartHouse",
    "DashaPeriod",
    "generate_kundli",
    "generate_vimshottari_dasha",
]
