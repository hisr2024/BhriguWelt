"""
Ephemeris core — Swiss Ephemeris, Lahiri ayanamsa, whole-sign houses.

Replaces the hand-rolled maths in astrology_calculator.py that produced:
  * a wrong Lagna in every tested chart (sidereal time converted to degrees
    twice, then an invented "ramc + 90 + lat/2" formula),
  * Rahu/Ketu ~58° off (Dublin-JD date minus a standard JD),
  * a dasha that ignored the birth balance and had no antardasha.

Everything here is deterministic and pure (no I/O). All datetimes are UTC.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

try:
    import swisseph as swe  # pyswisseph
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    SWISSEPH_AVAILABLE = True
except Exception:  # pragma: no cover - exercised only when the wheel is absent
    swe = None
    SWISSEPH_AVAILABLE = False

SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
              'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter']
NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
              'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
              'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
              'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati']
DASHA_SEQ = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
DASHA_YEARS = dict(zip(DASHA_SEQ, [7, 20, 6, 10, 7, 18, 16, 19, 17]))
YEAR_DAYS = 365.2425
NAK_SPAN = 360.0 / 27.0
PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

_CODES = {}
if SWISSEPH_AVAILABLE:
    _CODES = {'Sun': swe.SUN, 'Moon': swe.MOON, 'Mars': swe.MARS, 'Mercury': swe.MERCURY,
              'Jupiter': swe.JUPITER, 'Venus': swe.VENUS, 'Saturn': swe.SATURN, 'Rahu': swe.MEAN_NODE}


def sign_index(lon: float) -> int:
    return int((lon % 360.0) // 30)


def sign_of(lon: float) -> str:
    return SIGNS[sign_index(lon)]


def nakshatra_of(lon: float) -> Tuple[str, int, str]:
    lon %= 360.0
    i = min(int(lon * 27.0 / 360.0), 26)
    pada = min(int(lon * 108.0 / 360.0) % 4 + 1, 4)
    return NAKSHATRAS[i], pada, DASHA_SEQ[i % 9]


def fmt_dms(lon: float) -> str:
    d = lon % 30.0
    deg = int(d)
    minutes = int(round((d - deg) * 60))
    if minutes == 60:
        deg, minutes = deg + 1, 0
    return f"{deg}°{minutes:02d}′ {sign_of(lon)}"


def whole_sign_house(lon: float, asc_lon: float) -> int:
    return (sign_index(lon) - sign_index(asc_lon)) % 12 + 1


def julian_day(dt_utc: datetime) -> float:
    dt_utc = dt_utc.astimezone(timezone.utc) if dt_utc.tzinfo else dt_utc
    hours = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, hours)


@lru_cache(maxsize=8192)
def _positions_at_jd(jd: float) -> Tuple[Tuple[str, float, float, float], ...]:
    out = []
    for name, code in _CODES.items():
        res = swe.calc_ut(jd, code, swe.FLG_SIDEREAL | swe.FLG_SPEED)[0]
        out.append((name, res[0] % 360.0, res[1], res[3]))
    rahu = next(p for p in out if p[0] == 'Rahu')
    out.append(('Ketu', (rahu[1] + 180.0) % 360.0, -rahu[2], rahu[3]))
    return tuple(out)


def planet_positions(dt_utc: datetime) -> Dict[str, Dict[str, float]]:
    """Sidereal (Lahiri) longitude, latitude and daily speed of the 9 grahas."""
    jd = round(julian_day(dt_utc), 6)
    return {name: {'longitude': lon, 'latitude': lat, 'speed': spd}
            for name, lon, lat, spd in _positions_at_jd(jd)}


def ascendant(dt_utc: datetime, latitude: float, longitude: float) -> float:
    jd = julian_day(dt_utc)
    _cusps, ascmc = swe.houses_ex(jd, float(latitude), float(longitude), b'W', swe.FLG_SIDEREAL)
    return ascmc[0] % 360.0


def build_chart(dt_utc: datetime, latitude: float, longitude: float) -> Dict[str, object]:
    """Full sidereal chart in the shape astrology_calculator returns."""
    asc = ascendant(dt_utc, latitude, longitude)
    positions = planet_positions(dt_utc)
    planets: Dict[str, Dict[str, object]] = {}
    for name in PLANETS:
        p = positions[name]
        nak, pada, lord = nakshatra_of(p['longitude'])
        planets[name] = {
            'longitude': round(p['longitude'], 4),
            'latitude': round(p['latitude'], 4),
            'speed': round(p['speed'], 4),
            'sign': sign_of(p['longitude']),
            'degree_in_sign': round(p['longitude'] % 30.0, 4),
            'house': whole_sign_house(p['longitude'], asc),
            'nakshatra': nak,
            'pada': pada,
            'nakshatra_lord': lord,
            # Nodes are always retrograde (mean motion); flag only true grahas.
            'retrograde': bool(p['speed'] < 0 and name not in ('Rahu', 'Ketu', 'Sun', 'Moon')),
        }
    return {
        'ascendant': {'sign': sign_of(asc), 'degree': round(asc, 4), 'degree_in_sign': round(asc % 30.0, 4)},
        'planets': planets,
        'ayanamsa': round(swe.get_ayanamsa_ut(julian_day(dt_utc)), 4),
    }


# ---------------------------------------------------------------------------
# Vimshottari dasha (with birth balance and antardashas)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class DashaPeriod:
    maha: str
    antar: Optional[str]
    start: datetime
    end: datetime

    def label(self) -> str:
        return f"{self.maha}–{self.antar}" if self.antar else self.maha


def vimshottari(birth_utc: datetime, moon_lon: float) -> List[DashaPeriod]:
    """Return every antardasha for 120 years from the theoretical first MD start."""
    i = min(int((moon_lon % 360.0) * 27.0 / 360.0), 26)
    first = DASHA_SEQ[i % 9]
    elapsed_fraction = ((moon_lon % 360.0) % NAK_SPAN) / NAK_SPAN
    start = birth_utc - timedelta(days=elapsed_fraction * DASHA_YEARS[first] * YEAR_DAYS)
    periods: List[DashaPeriod] = []
    k = DASHA_SEQ.index(first)
    t = start
    for n in range(9):
        maha = DASHA_SEQ[(k + n) % 9]
        j = DASHA_SEQ.index(maha)
        a = t
        for m in range(9):
            antar = DASHA_SEQ[(j + m) % 9]
            span = DASHA_YEARS[maha] * DASHA_YEARS[antar] / 120.0 * YEAR_DAYS
            periods.append(DashaPeriod(maha, antar, a, a + timedelta(days=span)))
            a = a + timedelta(days=span)
        t = t + timedelta(days=DASHA_YEARS[maha] * YEAR_DAYS)
    return periods


def maha_periods(periods: List[DashaPeriod]) -> List[DashaPeriod]:
    out: List[DashaPeriod] = []
    for p in periods:
        if out and out[-1].maha == p.maha:
            out[-1] = DashaPeriod(p.maha, None, out[-1].start, p.end)
        else:
            out.append(DashaPeriod(p.maha, None, p.start, p.end))
    return out


def current_dasha(periods: List[DashaPeriod], at: datetime) -> Tuple[Optional[DashaPeriod], Optional[DashaPeriod]]:
    """(current maha span, current antar span)."""
    antar = next((p for p in periods if p.start <= at < p.end), None)
    maha = next((m for m in maha_periods(periods) if m.start <= at < m.end), None)
    return maha, antar


# ---------------------------------------------------------------------------
# Transit scanning
# ---------------------------------------------------------------------------

def _lon_at(planet: str, day: datetime) -> float:
    return planet_positions(day)[planet]['longitude']


def conjunction_windows(planet: str, target_lon: float, start: datetime, end: datetime,
                        orb: float = 1.0, step_days: int = 1) -> List[Tuple[datetime, datetime]]:
    """Date ranges when a transiting planet is within ``orb``° of a natal point."""
    windows: List[Tuple[datetime, datetime]] = []
    cur: Optional[List[datetime]] = None
    d = start
    while d <= end:
        diff = abs((_lon_at(planet, d) - target_lon + 180.0) % 360.0 - 180.0)
        if diff <= orb:
            if cur is None:
                cur = [d, d]
            else:
                cur[1] = d
        elif cur is not None:
            windows.append((cur[0], cur[1]))
            cur = None
        # Far from the point: skip ahead (slow planets move < 0.25°/day).
        if diff > orb + 8:
            d += timedelta(days=max(step_days, 10))
        else:
            d += timedelta(days=step_days)
    if cur is not None:
        windows.append((cur[0], cur[1]))
    return windows


def sign_windows(planet: str, signs: set, start: datetime, end: datetime,
                 step_days: int = 2) -> List[Tuple[datetime, datetime, int]]:
    """Date ranges when a transiting planet occupies any of ``signs`` (indices)."""
    windows: List[Tuple[datetime, datetime, int]] = []
    cur: Optional[list] = None
    d = start
    while d <= end:
        s = sign_index(_lon_at(planet, d))
        if s in signs:
            if cur is None or cur[2] != s:
                if cur is not None:
                    windows.append(tuple(cur))
                cur = [d, d, s]
            else:
                cur[1] = d
        elif cur is not None:
            windows.append(tuple(cur))
            cur = None
        d += timedelta(days=step_days)
    if cur is not None:
        windows.append(tuple(cur))
    return windows


def bhrigu_bindu(moon_lon: float, rahu_lon: float) -> float:
    """Midpoint measured forward from Rahu to the Moon."""
    return (rahu_lon + ((moon_lon - rahu_lon) % 360.0) / 2.0) % 360.0


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def angular_distance(a: float, b: float) -> float:
    return abs((a - b + 180.0) % 360.0 - 180.0)

