"""
Jaimini Chara Karakas and Chara Dasha (K.N. Rao method), from real positions.

Karakas: the seven planets Sun..Saturn ranked by degree within their sign
(highest = Atmakaraka, lowest = Darakaraka).

Chara Dasha: periods run from the Lagna sign, forward when the 9th sign from
Lagna is savya (Aries, Taurus, Gemini, Libra, Scorpio, Sagittarius), else
backward. A sign's years = signs counted from it to its lord (forward for savya
signs, backward otherwise) minus one; 12 when the lord occupies it; +1 if the
lord is exalted, -1 if debilitated. Scorpio and Aquarius take the stronger of
their two lords. The second cycle gives each sign 12 minus its first-cycle years.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Optional

SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
SAVYA = {'Aries', 'Taurus', 'Gemini', 'Libra', 'Scorpio', 'Sagittarius'}
LORDS = {'Aries': ['Mars'], 'Taurus': ['Venus'], 'Gemini': ['Mercury'], 'Cancer': ['Moon'],
         'Leo': ['Sun'], 'Virgo': ['Mercury'], 'Libra': ['Venus'], 'Scorpio': ['Mars', 'Ketu'],
         'Sagittarius': ['Jupiter'], 'Capricorn': ['Saturn'], 'Aquarius': ['Saturn', 'Rahu'],
         'Pisces': ['Jupiter']}
EXALT = {'Sun': 'Aries', 'Moon': 'Taurus', 'Mars': 'Capricorn', 'Mercury': 'Virgo',
         'Jupiter': 'Cancer', 'Venus': 'Pisces', 'Saturn': 'Libra'}
DEBIL = {'Sun': 'Libra', 'Moon': 'Scorpio', 'Mars': 'Cancer', 'Mercury': 'Pisces',
         'Jupiter': 'Capricorn', 'Venus': 'Virgo', 'Saturn': 'Aries'}
KARAKA_NAMES = ['Atmakaraka', 'Amatyakaraka', 'Bhratrukaraka', 'Matrukaraka',
                'Putrakaraka', 'Gnatikaraka', 'Darakaraka']
SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
YEAR_DAYS = 365.2425


def _lon(planets: Dict, name: str) -> Optional[float]:
    p = planets.get(name) or {}
    value = p.get('longitude')
    return float(value) % 360 if isinstance(value, (int, float)) else None


def _sign(planets: Dict, name: str) -> Optional[str]:
    lon = _lon(planets, name)
    return SIGNS[int(lon // 30)] if lon is not None else None


def chara_karakas(planets: Dict) -> Optional[Dict[str, str]]:
    degrees = {n: _lon(planets, n) for n in SEVEN}
    if any(v is None for v in degrees.values()):
        return None
    ranked = sorted(SEVEN, key=lambda n: degrees[n] % 30, reverse=True)
    return dict(zip(KARAKA_NAMES, ranked))


def _stronger(sign: str, planets: Dict) -> str:
    a, b = LORDS[sign]
    sa, sb = _sign(planets, a), _sign(planets, b)
    if sa == sign and sb != sign:
        return b
    if sb == sign and sa != sign:
        return a
    def company(s):
        return sum(1 for n in planets if _sign(planets, n) == s)
    ca, cb = company(sa), company(sb)
    if ca != cb:
        return a if ca > cb else b
    return a if ((_lon(planets, a) or 0) % 30) >= ((_lon(planets, b) or 0) % 30) else b


def sign_years(sign: str, planets: Dict) -> Optional[int]:
    lord = LORDS[sign][0] if len(LORDS[sign]) == 1 else _stronger(sign, planets)
    lord_sign = _sign(planets, lord)
    if lord_sign is None:
        return None
    i, j = SIGNS.index(sign), SIGNS.index(lord_sign)
    count = ((j - i) % 12 if sign in SAVYA else (i - j) % 12) + 1
    years = 12 if count == 1 else count - 1
    if EXALT.get(lord) == lord_sign:
        years += 1
    elif DEBIL.get(lord) == lord_sign:
        years -= 1
    return max(years, 0)


def chara_dasha(lagna_sign: str, planets: Dict, birth: datetime) -> Optional[List[Dict]]:
    """Two cycles of sign periods with start/end datetimes; None if positions are missing."""
    if lagna_sign not in SIGNS:
        return None
    start = SIGNS.index(lagna_sign)
    step = 1 if SIGNS[(start + 8) % 12] in SAVYA else -1
    order = [SIGNS[(start + step * k) % 12] for k in range(12)]
    first = {s: sign_years(s, planets) for s in order}
    if any(v is None for v in first.values()):
        return None
    periods, t = [], birth
    for cycle in (1, 2):
        for s in order:
            years = first[s] if cycle == 1 else 12 - first[s]
            if years <= 0:
                continue
            end = t + timedelta(days=years * YEAR_DAYS)
            periods.append({'sign': s, 'years': years, 'start': t, 'end': end})
            t = end
    return periods
