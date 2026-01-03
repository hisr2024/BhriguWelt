"""Generate Kundli charts with optional Swiss Ephemeris precision."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, List

from .chart_engine import ChartEngine
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

    chart_engine = ChartEngine()
    occupant_map = _fallback_occupants(snapshot)
    moon_longitude = None
    ephemeris_source = "Mean motions fallback"
    try:
        chart_result = chart_engine.compute_chart(snapshot=snapshot, timezone_name=timezone_name)
        occupant_map = chart_result.occupant_map or occupant_map
        moon_longitude = chart_result.planet_longitudes.get("Moon")
        ephemeris_source = chart_result.ephemeris_source
    except Exception:
        # Keep deterministic fallback map when chart computation fails.
        pass
    overlay = _overlay_notes(weights)
    birth_dt = datetime.combine(snapshot.birth_date, snapshot.birth_time).replace(tzinfo=timezone.utc)

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

    dashas = []
    raw_dashas = chart_engine.compute_dashas(birth_dt, moon_longitude=moon_longitude)
    for entry in raw_dashas:
        dashas.append(
            DashaPeriod(
                lord=entry.get("lord", ""),
                start=entry.get("start", ""),
                end=entry.get("end", ""),
                anchor_rule=entry.get("anchor_rule", "Aligned with natal snapshot"),
            )
        )
    if not dashas:
        dashas = generate_vimshottari_dasha(snapshot, weights)

    return {
        "rashi_chart": rashi_chart,
        "bhava_chart": bhava_chart,
        "dashas": dashas,
        "ephemeris_source": ephemeris_source,
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
