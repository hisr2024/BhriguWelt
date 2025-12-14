"""Runtime ephemeris and chart computation utilities.

This module centralizes the chart computation layer demanded by the product
roadmap: planetary longitudes, house cusps, Rahu–Ketu, dashas, and transit
snapshots. It automatically prefers Swiss Ephemeris when available, can load
Jagannatha Hora style JSON payloads, and always falls back to deterministic
mean-motion maths so CI stays reproducible.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Mapping, MutableMapping, Tuple

from .astronomical_calculations import (
    _mean_longitude,
    derive_transit_snapshot,
    geocode_location,
    has_swisseph,
    normalize_birth_datetime,
)
from .calculations import CelestialSnapshot

logger = logging.getLogger("bhriguwelt.chart_engine")

# Mean motion (deg/day) and base longitude reference points used when Swiss
# Ephemeris or Jagannatha Hora data are unavailable. These values mirror the
# deterministic fallbacks already used inside ``astronomical_calculations`` so
# both test fixtures and offline deployments remain stable.
_FALLBACK_MEAN_MOTIONS: Mapping[str, Tuple[float, float]] = {
    "Sun": (280.460, 0.98564736),
    "Moon": (218.316, 13.176396),
    "Mars": (355.433, 0.524039),
    "Mercury": (252.250, 4.092334),
    "Jupiter": (34.351, 0.083092),
    "Venus": (181.979, 1.602130),
    "Saturn": (50.077, 0.033459),
    "Rahu": (204.000, -0.0529538),
}


@dataclass
class ChartComputationResult:
    """Normalized chart outputs shared across the app surface."""

    ephemeris_source: str
    planet_longitudes: Dict[str, float]
    house_cusps: List[float]
    house_assignments: Dict[str, int]
    occupant_map: Dict[int, List[str]]

    def for_narrative(self) -> Dict[str, object]:
        return {
            "ephemeris_source": self.ephemeris_source,
            "planet_longitudes": self.planet_longitudes,
            "house_cusps": self.house_cusps,
            "house_assignments": self.house_assignments,
        }


@dataclass
class PersonalizationContext:
    """Inputs that keep readings non-fatalist and user-aware."""

    choices: Dict[str, str]
    mitigation_flags: List[str]
    effort_level: str
    reflection_prompts: List[str]


class ChartEngine:
    """Compute chart elements with pluggable ephemeris sources."""

    def __init__(self, ephemeris_preference: str | None = None, data_root: str | Path | None = None) -> None:
        normalized = (ephemeris_preference or "auto").lower()
        self.ephemeris_preference = normalized
        self.data_root = Path(data_root) if data_root else Path(__file__).resolve().parent.parent / "data"

    # --- Public surface -------------------------------------------------
    def compute_chart(
        self,
        *,
        snapshot: CelestialSnapshot,
        timezone_name: str | None = None,
    ) -> ChartComputationResult:
        """Return longitudes, cusps, and house assignments for a snapshot."""

        birth_dt = normalize_birth_datetime(
            birth_date=snapshot.birth_date.isoformat(),
            birth_time=snapshot.birth_time.isoformat(timespec="minutes"),
            timezone_name=timezone_name,
        )
        latitude, longitude, _ = geocode_location(snapshot.birth_place)

        if self._should_use_swisseph():
            try:
                result = self._compute_with_swisseph(birth_dt, latitude, longitude)
                if result:
                    return result
            except Exception as exc:  # pragma: no cover - defensive around optional dep
                logger.warning("Swiss Ephemeris failed, falling back to mean motions: %s", exc)

        jagannatha = self._compute_from_jagannatha(birth_dt)
        if jagannatha:
            return jagannatha

        return self._compute_from_fallbacks(birth_dt)

    def compute_dashas(self, birth_dt: datetime, moon_longitude: float | None = None) -> List[Dict[str, str]]:
        """Generate Vimshottari-like dashas anchored to the Moon's longitude."""

        seq = [
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
        # If we have the Moon's longitude, start with the current nakshatra
        start_index = 0
        balance_fraction = 1.0
        if moon_longitude is not None:
            nakshatra_size = 360.0 / 27
            nakshatra_index = int((moon_longitude % 360) // nakshatra_size)
            start_index = nakshatra_index % len(seq)
            remainder = (moon_longitude % nakshatra_size) / nakshatra_size
            balance_fraction = max(0.05, 1.0 - remainder)

        ordered = seq[start_index:] + seq[:start_index]
        dashas: List[Dict[str, str]] = []
        current_start = birth_dt.astimezone(timezone.utc)
        for lord, duration_years in ordered[:5]:
            actual_years = duration_years * balance_fraction if not dashas else duration_years
            end_dt = current_start + timedelta(days=365.25 * actual_years)
            dashas.append(
                {
                    "lord": lord,
                    "start": current_start.date().isoformat(),
                    "end": end_dt.date().isoformat(),
                    "anchor_rule": "Calculated from lunar nakshatra" if moon_longitude else "Approximate from lunar tithi",
                }
            )
            current_start = end_dt
            balance_fraction = 1.0
        return dashas

    def compute_transits(self, snapshot: CelestialSnapshot, target_dt: datetime) -> Dict[str, int | bool]:
        """Compute transit differentials against the natal snapshot."""

        natal_dt = normalize_birth_datetime(
            birth_date=snapshot.birth_date.isoformat(),
            birth_time=snapshot.birth_time.isoformat(timespec="minutes"),
            timezone_name=None,
        )
        return derive_transit_snapshot(natal_dt, target_dt)

    # --- Internal helpers ----------------------------------------------
    def _should_use_swisseph(self) -> bool:
        if self.ephemeris_preference == "swiss":
            return has_swisseph()
        if self.ephemeris_preference == "auto":
            return has_swisseph()
        return False

    def _compute_with_swisseph(
        self, birth_dt: datetime, latitude: float | None, longitude: float | None
    ) -> ChartComputationResult | None:
        import swisseph as swe  # type: ignore

        swe.set_ephe_path(".")
        if latitude is not None and longitude is not None:
            swe.set_topo(longitude, latitude, 0)

        jd = swe.julday(
            birth_dt.year,
            birth_dt.month,
            birth_dt.day,
            birth_dt.hour + birth_dt.minute / 60.0,
            swe.GREG_CAL,
        )

        planet_codes = {
            "Sun": swe.SUN,
            "Moon": swe.MOON,
            "Mars": swe.MARS,
            "Mercury": swe.MERCURY,
            "Jupiter": swe.JUPITER,
            "Venus": swe.VENUS,
            "Saturn": swe.SATURN,
            "Rahu": swe.TRUE_NODE,
            "Ketu": swe.TRUE_NODE,
        }

        planet_longitudes: Dict[str, float] = {}
        for planet, code in planet_codes.items():
            pos, speed = swe.calc_ut(jd, code)[0][:2]
            planet_longitudes[planet] = pos
            if planet == "Ketu":
                planet_longitudes[planet] = (planet_longitudes["Rahu"] + 180) % 360
        house_cusps, _, ascmc = swe.houses_ex(jd, latitude or 0.0, longitude or 0.0, b"P")
        asc_house = int(ascmc[0] // 30) + 1
        house_assignments = {planet: int(lon // 30) + 1 for planet, lon in planet_longitudes.items()}
        occupant_map = self._build_occupant_map(house_assignments, asc_house)

        return ChartComputationResult(
            ephemeris_source="Swiss Ephemeris",
            planet_longitudes=planet_longitudes,
            house_cusps=list(house_cusps),
            house_assignments=house_assignments,
            occupant_map=occupant_map,
        )

    def _compute_from_fallbacks(self, birth_dt: datetime) -> ChartComputationResult:
        delta_days = (birth_dt.astimezone(timezone.utc) - datetime(2000, 1, 1, 12, tzinfo=timezone.utc)).total_seconds() / 86400
        planet_longitudes = {
            planet: _mean_longitude(base, motion, delta_days)
            for planet, (base, motion) in _FALLBACK_MEAN_MOTIONS.items()
        }
        planet_longitudes["Ketu"] = (planet_longitudes["Rahu"] + 180) % 360
        house_cusps = [i * 30.0 for i in range(12)]
        house_assignments = {planet: int(lon // 30) + 1 for planet, lon in planet_longitudes.items()}
        occupant_map = self._build_occupant_map(house_assignments, ascendant=1)
        return ChartComputationResult(
            ephemeris_source="Mean motions fallback",
            planet_longitudes=planet_longitudes,
            house_cusps=house_cusps,
            house_assignments=house_assignments,
            occupant_map=occupant_map,
        )

    def _compute_from_jagannatha(self, birth_dt: datetime) -> ChartComputationResult | None:
        dataset = self.data_root / "jagannatha_hora_sample.json"
        if not dataset.exists():
            return None
        try:
            payload = json.loads(dataset.read_text())
        except Exception:
            return None
        key = birth_dt.astimezone(timezone.utc).date().isoformat()
        entry = payload.get(key)
        if not isinstance(entry, MutableMapping):
            return None
        planet_longitudes = {k: float(v) for k, v in entry.get("planet_longitudes", {}).items()}
        if not planet_longitudes:
            return None
        house_cusps = [float(val) for val in entry.get("house_cusps", [])] or [i * 30.0 for i in range(12)]
        house_assignments = {planet: int(lon // 30) + 1 for planet, lon in planet_longitudes.items()}
        occupant_map = self._build_occupant_map(house_assignments, ascendant=entry.get("ascendant", 1))
        return ChartComputationResult(
            ephemeris_source="Jagannatha Hora sample",
            planet_longitudes=planet_longitudes,
            house_cusps=house_cusps,
            house_assignments=house_assignments,
            occupant_map=occupant_map,
        )

    @staticmethod
    def _build_occupant_map(house_assignments: Mapping[str, int], ascendant: int) -> Dict[int, List[str]]:
        occupant_map: Dict[int, List[str]] = {index: [] for index in range(1, 13)}
        occupant_map[ascendant].append("Asc")
        for planet, house in house_assignments.items():
            if planet == "Ketu":
                ketu_house = ((house + 6 - 1) % 12) + 1
                occupant_map[ketu_house].append(planet)
            else:
                occupant_map[house].append(planet)
        return occupant_map


__all__ = [
    "ChartEngine",
    "ChartComputationResult",
    "PersonalizationContext",
]
