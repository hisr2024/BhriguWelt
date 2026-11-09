"""
Deterministic Bhrigu / Nadi rule findings ("chart facts layer").

Each rule is a pure function of the computed chart that yields a concrete,
checkable statement — placements with degrees, houses, nakshatras, and DATED
windows from Vimshottari dasha and slow-planet transits. The LLM is then
asked only to phrase these findings, so it no longer invents placements,
"7-12 incarnations", percentages or folio numbers.

Provenance (shown in the astrologer view):
  classical            — BPHS / Phaladeepika / Jaimini / standard gochara
  tradition-attributed — practised under the Bhrigu / Nadi name, known mainly
                         from 20th-century publications (Bhrigu Bindu, Bhrigu
                         Chakra Paddhati, Bhrigu Nandi Nadi sign links)
  modern               — modern synthesis (e.g. double transit, window ranking)

Weights are ranking priors (0-1), never probabilities; they are not shown as %.
See docs/bhrigu_nadi_rules.md for the catalogue and sources.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from services import ephemeris_core as E

logger = logging.getLogger(__name__)

SIGNS = E.SIGNS
SIGN_LORDS = E.SIGN_LORDS
GRAHAS7 = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
EXALT = {'Sun': 0, 'Moon': 1, 'Mars': 9, 'Mercury': 5, 'Jupiter': 3, 'Venus': 11, 'Saturn': 6}
DEBIL = {p: (s + 6) % 12 for p, s in EXALT.items()}

# Domain → (houses, natural karakas). Used by bhavat-bhavam and dasha windows.
DOMAINS: Dict[str, Tuple[List[int], List[str], str]] = {
    'marriage': ([7], ['Venus', 'Jupiter'], 'partnership / marriage'),
    'career': ([10], ['Sun', 'Saturn', 'Mercury'], 'career / public role'),
    'wealth': ([2, 11], ['Jupiter', 'Venus'], 'income / wealth'),
    'children': ([5], ['Jupiter'], 'children / creativity'),
    'home': ([4], ['Moon', 'Mars'], 'home / property'),
    'health': ([1, 6], ['Sun', 'Mars'], 'health / vitality'),
    'spiritual': ([9, 12], ['Jupiter', 'Ketu'], 'dharma / spiritual life'),
    'education': ([4, 5], ['Mercury', 'Jupiter'], 'education / learning'),
    'relocation': ([12, 4], ['Rahu', 'Moon'], 'relocation / foreign lands'),
    'friends': ([11], ['Mercury'], 'friends / networks'),
    'communication': ([3], ['Mercury'], 'communication / own effort'),
    'purva_punya': ([5, 9], ['Jupiter', 'Ketu'], 'past-life merit (purva punya)'),
}
KARAKA_FROM = {'marriage': ('Venus', 7), 'career': ('Sun', 10), 'children': ('Jupiter', 5),
               'home': ('Moon', 4), 'spiritual': ('Jupiter', 9)}

CATEGORY_DOMAINS: Dict[str, List[str]] = {
    'karmic_journey': ['spiritual', 'career'],
    'past_lives': ['spiritual'],
    'future_lives': ['spiritual'],
    'present_life': ['career', 'wealth', 'health', 'marriage'],
    'life_events': ['marriage', 'career', 'wealth', 'children', 'home', 'health'],
    'karmic_remedies': ['health', 'spiritual'],
    'karma_reset': ['spiritual'],
    'relationships': ['marriage', 'children'],
    'predictions': ['career', 'wealth', 'marriage', 'health'],
}

ALL = 'all'


class _Full(list):
    """Domain list for full (per-section) evaluation: rules do not truncate it."""


def _take(domains: List[str], n: int) -> List[str]:
    return list(domains) if isinstance(domains, _Full) else list(domains)[:n]

SPECIAL_ASPECTS = {'Mars': (4, 8), 'Jupiter': (5, 9), 'Saturn': (3, 10)}


def aspects_from(planet: str, from_sign: int, target_sign: int) -> bool:
    rel = (target_sign - from_sign) % 12 + 1
    return rel == 7 or rel in SPECIAL_ASPECTS.get(planet, ())


# ---------------------------------------------------------------------------
# Ashtakavarga — BPHS ch. 66 (Santhanam ed.). Houses, counted from each
# contributor, in which it gives a bindu to the planet's Bhinnashtakavarga.
# Contributor order: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna.
# Totals 48/49/39/54/56/52/39 (SAV 337). PyJHora/Jagannatha Hora follow a
# variant reading for 4 rows (Moon-from-Moon/Mars/Jupiter, Venus-from-Mars);
# see core_wisdom/techniques/ashtakavarga.md.
# ---------------------------------------------------------------------------
AV_CONTRIBUTORS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna']
ASHTAKAVARGA: Dict[str, List[List[int]]] = {
    'Sun':     [[1, 2, 4, 7, 8, 9, 10, 11], [3, 6, 10, 11], [1, 2, 4, 7, 8, 9, 10, 11], [3, 5, 6, 9, 10, 11, 12],
                [5, 6, 9, 11], [6, 7, 12], [1, 2, 4, 7, 8, 9, 10, 11], [3, 4, 6, 10, 11, 12]],
    'Moon':    [[3, 6, 7, 8, 10, 11], [1, 3, 6, 7, 10, 11], [2, 3, 5, 6, 9, 10, 11], [1, 3, 4, 5, 7, 8, 10, 11],
                [1, 4, 7, 8, 10, 11, 12], [3, 4, 5, 7, 9, 10, 11], [3, 5, 6, 11], [3, 6, 10, 11]],
    'Mars':    [[3, 5, 6, 10, 11], [3, 6, 11], [1, 2, 4, 7, 8, 10, 11], [3, 5, 6, 11],
                [6, 10, 11, 12], [6, 8, 11, 12], [1, 4, 7, 8, 9, 10, 11], [1, 3, 6, 10, 11]],
    'Mercury': [[5, 6, 9, 11, 12], [2, 4, 6, 8, 10, 11], [1, 2, 4, 7, 8, 9, 10, 11], [1, 3, 5, 6, 9, 10, 11, 12],
                [6, 8, 11, 12], [1, 2, 3, 4, 5, 8, 9, 11], [1, 2, 4, 7, 8, 9, 10, 11], [1, 2, 4, 6, 8, 10, 11]],
    'Jupiter': [[1, 2, 3, 4, 7, 8, 9, 10, 11], [2, 5, 7, 9, 11], [1, 2, 4, 7, 8, 10, 11], [1, 2, 4, 5, 6, 9, 10, 11],
                [1, 2, 3, 4, 7, 8, 10, 11], [2, 5, 6, 9, 10, 11], [3, 5, 6, 12], [1, 2, 4, 5, 6, 7, 9, 10, 11]],
    'Venus':   [[8, 11, 12], [1, 2, 3, 4, 5, 8, 9, 11, 12], [3, 5, 6, 9, 11, 12], [3, 5, 6, 9, 11],
                [5, 8, 9, 10, 11], [1, 2, 3, 4, 5, 8, 9, 10, 11], [3, 4, 5, 8, 9, 10, 11], [1, 2, 3, 4, 5, 8, 9, 11]],
    'Saturn':  [[1, 2, 4, 7, 8, 10, 11], [3, 6, 11], [3, 5, 6, 10, 11, 12], [6, 8, 9, 10, 11, 12],
                [5, 6, 11, 12], [6, 11, 12], [3, 5, 6, 11], [1, 3, 4, 6, 10, 11]],
}


def bhinnashtakavarga(planet_signs: Dict[str, int], lagna_sign: int) -> Dict[str, List[int]]:
    """Bindus per sign (index 0 = Aries) for each of the seven grahas."""
    positions = dict(planet_signs)
    positions['Lagna'] = lagna_sign
    bav: Dict[str, List[int]] = {}
    for planet, rows in ASHTAKAVARGA.items():
        counts = [0] * 12
        for contributor, houses in zip(AV_CONTRIBUTORS, rows):
            base = positions.get(contributor)
            if base is None:
                continue
            for h in houses:
                counts[(base + h - 1) % 12] += 1
        bav[planet] = counts
    return bav


def sarvashtakavarga(bav: Dict[str, List[int]]) -> List[int]:
    return [sum(bav[p][i] for p in bav) for i in range(12)]


def prastara(planet: str, planet_signs: Dict[str, int], lagna_sign: int) -> List[List[str]]:
    """For each sign, which contributors gave ``planet`` a bindu (prastara chart)."""
    positions = dict(planet_signs)
    positions['Lagna'] = lagna_sign
    givers: List[List[str]] = [[] for _ in range(12)]
    for contributor, houses in zip(AV_CONTRIBUTORS, ASHTAKAVARGA[planet]):
        base = positions.get(contributor)
        if base is None:
            continue
        for h in houses:
            givers[(base + h - 1) % 12].append(contributor)
    return givers


def trikona_shodhana(row: List[int]) -> List[int]:
    """BPHS trikona reduction on one BAV row (index 0 = Aries).
    Per trine group (1-5-9 signs): any zero -> unchanged; all equal -> all 0;
    otherwise subtract the minimum from each."""
    out = list(row)
    for start in range(4):
        idx = (start, start + 4, start + 8)
        vals = [out[i] for i in idx]
        if 0 in vals:
            continue
        if vals[0] == vals[1] == vals[2]:
            for i in idx:
                out[i] = 0
        else:
            m = min(vals)
            for i in idx:
                out[i] -= m
    return out


# Signs owned by the same planet (Sun and Moon own one sign each: no reduction).
EKADHIPATYA_PAIRS = [(0, 7), (1, 6), (2, 5), (8, 11), (9, 10)]


def ekadhipatya_shodhana(row: List[int], occupied: set) -> List[int]:
    """BPHS ekadhipatya reduction, applied after trikona shodhana.
    ``occupied``: sign indices holding any of the seven grahas.
      - either value 0, or both signs occupied -> unchanged
      - both empty: equal -> both 0; unequal -> both become the smaller
      - one occupied: if the empty sign is lower -> it becomes 0,
        otherwise it is reduced to the occupied sign's value."""
    out = list(row)
    for a, b in EKADHIPATYA_PAIRS:
        if out[a] == 0 or out[b] == 0 or (a in occupied and b in occupied):
            continue
        if a not in occupied and b not in occupied:
            if out[a] == out[b]:
                out[a] = out[b] = 0
            else:
                out[a] = out[b] = min(out[a], out[b])
        else:
            full, empty = (a, b) if a in occupied else (b, a)
            out[empty] = 0 if out[empty] < out[full] else out[full]
    return out


# Kakshya: each sign split into 8 parts of 3°45'; lords in this order.
KAKSHYA_LORDS = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Lagna']


def kakshya_of(lon: float) -> Tuple[int, str]:
    i = min(int((lon % 30.0) / 3.75), 7)
    return i, KAKSHYA_LORDS[i]


# ---------------------------------------------------------------------------
# Vedha — Phaladeepika ch. 26, vv. 3–8 (Subrahmanya Sastri tr.).
# favourable house from Moon -> vedha house; a transit in the vedha house
# cancels the good result. Exemptions: Sun and Saturn never obstruct each
# other; Moon and Mercury never obstruct each other. Nodes are not used as
# obstructers. Rahu/Ketu results follow the Sun's (v. 2).
# ---------------------------------------------------------------------------
VEDHA: Dict[str, Dict[int, int]] = {
    'Sun':     {3: 9, 6: 12, 10: 4, 11: 5},
    'Moon':    {1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8},
    'Mars':    {3: 12, 6: 9, 11: 5},
    'Mercury': {2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12},
    'Jupiter': {2: 12, 5: 4, 7: 3, 9: 10, 11: 8},
    'Venus':   {1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3},
    'Saturn':  {3: 12, 6: 9, 11: 5},
}
VEDHA_EXEMPT = {('Sun', 'Saturn'), ('Saturn', 'Sun'), ('Moon', 'Mercury'), ('Mercury', 'Moon')}


def vedha_obstructers(planet: str, moon_sign: int, transit_signs: Dict[str, int]) -> Tuple[bool, List[str]]:
    """(is_favourable_house, obstructing planets) for a transiting planet."""
    house = (transit_signs[planet] - moon_sign) % 12 + 1
    table = VEDHA.get(planet, {})
    if house not in table:
        return False, []
    vedha_sign = (moon_sign + table[house] - 1) % 12
    # The transiting Moon changes sign every ~2.5 days, so it is too brief to
    # obstruct a slow planet's months-long transit; nodes are not used.
    blockers = [q for q, s in transit_signs.items()
                if q != planet and s == vedha_sign and q not in ('Rahu', 'Ketu', 'Moon')
                and (planet, q) not in VEDHA_EXEMPT]
    return True, blockers


def navamsa_sign(lon: float) -> int:
    """D9 sign: each 3°20' pada maps continuously from Aries (BPHS navamsa rule)."""
    return int((lon % 360.0) * 9.0 / 30.0) % 12


def _f(rule_id: str, provenance: str, principle: str, finding: str, categories: Iterable[str],
       weight: float, timing: str = '', start: Optional[datetime] = None,
       end: Optional[datetime] = None, house_based: bool = False) -> Dict[str, Any]:
    return {
        'id': rule_id, 'provenance': provenance, 'principle': principle,
        'finding': finding, 'timing': timing, 'weight': round(weight, 2),
        'categories': list(categories), 'start': start.date().isoformat() if start else None,
        'end': end.date().isoformat() if end else None, 'house_based': house_based,
    }


def _d(dt: datetime) -> str:
    return dt.strftime('%b %Y')


def _dspan(a: datetime, b: datetime, ref_year: Optional[int] = None) -> str:
    """Day-precision span for fast planets, e.g. '3–16 Nov' or '28 Nov–9 Dec 2027'.
    The year is shown whenever the span ends outside ``ref_year``."""
    ref_year = ref_year or a.year
    year = f" {b.year}" if b.year != ref_year or a.year != b.year else ''
    if (a.year, a.month) == (b.year, b.month):
        days = f"{a.day}–{b.day}" if a.day != b.day else f"{a.day}"
        return f"{days} {a.strftime('%b')}{year}"
    return f"{a.day} {a.strftime('%b')}–{b.day} {b.strftime('%b')}{year}"


def _span(a: datetime, b: datetime) -> str:
    return f"{_d(a)}–{_d(b)}" if _d(a) != _d(b) else _d(a)


def _ordinal(n: int) -> str:
    return f"{n}{'th' if 11 <= n % 100 <= 13 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"


# ---------------------------------------------------------------------------
# Chart normalisation
# ---------------------------------------------------------------------------

class Chart:
    """Light wrapper giving sign indices, houses and lords for rule code."""

    def __init__(self, chart_facts: Dict[str, Any], birth_data: Dict[str, Any]):
        raw = birth_data.get('planets') or {}
        self.lon: Dict[str, float] = {}
        self.speed: Dict[str, float] = {}
        for p in E.PLANETS:
            entry = raw.get(p) or {}
            lon = entry.get('longitude')
            if lon is None:
                lon = (chart_facts.get('planets', {}).get(p) or {}).get('longitude')
            if isinstance(lon, (int, float)):
                self.lon[p] = float(lon) % 360.0
                self.speed[p] = float(entry.get('speed') or 0.0)
        asc = birth_data.get('ascendant')
        asc_deg = asc.get('degree') if isinstance(asc, dict) else None
        self.asc_exact = isinstance(asc_deg, (int, float))
        if not self.asc_exact:
            # Sign known, degree not: houses are valid, degree-based rules are not.
            lagna_sign = chart_facts.get('lagna')
            asc_deg = SIGNS.index(lagna_sign) * 30 + 15 if lagna_sign in SIGNS else None
        self.asc: Optional[float] = float(asc_deg) % 360.0 if asc_deg is not None else None
        accuracy = str(birth_data.get('birth_time_accuracy') or '').strip().lower()
        self.time_accuracy = accuracy if accuracy in ('exact', 'within_15', 'within_hour', 'unknown') else ''
        self.reference = 'Lagna'
        if self.time_accuracy == 'within_hour':
            self.asc_exact = False  # sign is the best estimate; degree is not reliable
        if self.time_accuracy == 'unknown' and 'Moon' in self.lon:
            # Classical fallback when the birth time is not known: read the
            # houses from the Moon (Chandra Lagna) instead of the Ascendant.
            self.asc = self.lon['Moon']
            self.asc_exact = False
            self.reference = 'Moon'
        self.birth_utc = _birth_utc(birth_data)
        gender = str(birth_data.get('gender') or '').strip().lower()
        self.gender = gender if gender in ('male', 'female', 'm', 'f') else ''
        self.lat = birth_data.get('latitude') or (birth_data.get('birth_details') or {}).get('latitude')
        self.lng = birth_data.get('longitude') or (birth_data.get('birth_details') or {}).get('longitude')

    def ok(self) -> bool:
        return 'Moon' in self.lon and self.asc is not None

    def sign(self, p: str) -> int:
        return E.sign_index(self.lon[p])

    def house(self, p: str) -> int:
        return (self.sign(p) - E.sign_index(self.asc)) % 12 + 1

    def house_sign(self, h: int) -> int:
        return (E.sign_index(self.asc) + h - 1) % 12

    def lord_of_house(self, h: int) -> str:
        return SIGN_LORDS[self.house_sign(h)]

    def owned_houses(self, p: str) -> List[int]:
        return [h for h in range(1, 13) if self.lord_of_house(h) == p]

    def occupants(self, sign_idx: int, exclude: Iterable[str] = ()) -> List[str]:
        return [p for p in E.PLANETS if p in self.lon and self.sign(p) == sign_idx and p not in exclude]

    def aspects_sign(self, p: str, target_sign: int) -> bool:
        """Graha drishti by sign (BPHS): all aspect the 7th; Mars also 4th/8th,
        Jupiter 5th/9th, Saturn 3rd/10th. Nodes: 7th only (5/9 is disputed)."""
        return aspects_from(p, self.sign(p), target_sign)

    def aspecting(self, target_sign: int) -> List[str]:
        return [p for p in E.PLANETS if p in self.lon and self.aspects_sign(p, target_sign)]

    def strong(self, p: str) -> bool:
        return p in EXALT and (EXALT[p] == self.sign(p) or SIGN_LORDS[self.sign(p)] == p)

    def retro(self, p: str) -> bool:
        return p not in ('Rahu', 'Ketu', 'Sun', 'Moon') and self.speed.get(p, 0) < 0

    def desc(self, p: str) -> str:
        nak, pada, lord = E.nakshatra_of(self.lon[p])
        r = ' (R)' if self.retro(p) else ''
        return f"{p}{r} {E.fmt_dms(self.lon[p])}, {_ordinal(self.house(p))} house, {nak}-{pada}"


def _birth_utc(birth_data: Dict[str, Any]) -> Optional[datetime]:
    details = birth_data.get('birth_details') or {}
    iso = details.get('utc') or birth_data.get('birth_utc')
    if iso:
        try:
            dt = datetime.fromisoformat(str(iso))
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    dob, tob = birth_data.get('date_of_birth'), birth_data.get('time_of_birth')
    tz = details.get('timezone') or birth_data.get('timezone')
    if not (dob and tob):
        return None
    try:
        local = datetime.strptime(f"{dob} {str(tob)[:5]}", '%Y-%m-%d %H:%M')
        if tz:
            import pytz
            return pytz.timezone(tz).localize(local).astimezone(timezone.utc)
        return local.replace(tzinfo=timezone.utc)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Structural rules (undated)
# ---------------------------------------------------------------------------

def rule_lagna(c: Chart) -> List[Dict[str, Any]]:
    lord = c.lord_of_house(1)
    lord_text = c.desc(lord) if lord in c.lon else lord
    if c.asc_exact:
        nak, pada, _ = E.nakshatra_of(c.asc)
        text = f"Lagna {E.fmt_dms(c.asc)} ({nak}-{pada}); Lagna lord {lord_text}"
    else:
        text = f"Lagna {E.sign_of(c.asc)}; Lagna lord {lord_text}"
    occ = c.occupants(E.sign_index(c.asc))
    if occ:
        text += f"; in Lagna: {', '.join(occ)}"
    if c.reference == 'Moon':
        text = (f"Birth time unknown — houses are read from the Moon (Chandra Lagna, {E.sign_of(c.asc)}); "
                f"its lord {lord_text}")
    return [_f('F-LAGNA-01', 'classical', 'Lagna & Lagna lord (BPHS)', text, [ALL], 0.9, house_based=True)]


def rule_nodes(c: Chart) -> List[Dict[str, Any]]:
    if 'Rahu' not in c.lon:
        return []
    with_r = c.occupants(c.sign('Rahu'), exclude=('Rahu',))
    with_k = c.occupants(c.sign('Ketu'), exclude=('Ketu',))
    text = (f"Rahu {E.fmt_dms(c.lon['Rahu'])} in {_ordinal(c.house('Rahu'))} house"
            f"{' with ' + ', '.join(with_r) if with_r else ''} (desire / growth axis); "
            f"Ketu {E.fmt_dms(c.lon['Ketu'])} in {_ordinal(c.house('Ketu'))} house"
            f"{' with ' + ', '.join(with_k) if with_k else ''} (carried-over skill / detachment). "
            f"Axis {c.house('Rahu')}/{c.house('Ketu')}")
    return [_f('F-NODES-01', 'classical', 'Rahu–Ketu karmic axis (BS-009/010)', text,
               ['karmic_journey', 'past_lives', 'future_lives', 'karma_reset', 'karmic_remedies'], 0.85, house_based=True)]


def karaka_candidates(c: Chart) -> Dict[str, float]:
    """Degrees used to rank chara karakas. Default: 7-karaka scheme (Sun–Saturn).
    BHRIGU_KARAKA_SCHEME=8 adds Rahu measured as 30° minus its degree (BPHS)."""
    cand = {p: c.lon[p] % 30 for p in GRAHAS7 if p in c.lon}
    if len(cand) == 7 and os.getenv('BHRIGU_KARAKA_SCHEME', '7').strip() == '8' and 'Rahu' in c.lon:
        cand['Rahu'] = 30.0 - (c.lon['Rahu'] % 30)
    return cand if len(cand) >= 7 else {}


def rule_karakas(c: Chart) -> List[Dict[str, Any]]:
    cand = karaka_candidates(c)
    if not cand:
        return []
    ordered = sorted(cand, key=cand.get, reverse=True)
    ak, dk = ordered[0], ordered[-1]
    ak_h12 = (c.sign(ak) + 11) % 12
    text = (f"Atmakaraka {c.desc(ak)}; Amatyakaraka {ordered[1]}; "
            f"Darakaraka {c.desc(dk)}. 12th from Atmakaraka: {SIGNS[ak_h12]}"
            f"{' with ' + ', '.join(c.occupants(ak_h12)) if c.occupants(ak_h12) else ' (empty)'}")
    return [_f('F-KARAKA-01', 'classical', f"Jaimini chara karakas ({'8' if 'Rahu' in cand else '7'}-karaka scheme)", text,
               ['karmic_journey', 'past_lives', 'future_lives', 'relationships', 'present_life'], 0.75, house_based=True)]


def rule_dignity(c: Chart) -> List[Dict[str, Any]]:
    out = []
    for p in GRAHAS7:
        if p not in c.lon:
            continue
        s = c.sign(p)
        state = ('exalted' if EXALT[p] == s else 'debilitated' if DEBIL[p] == s
                 else 'own sign' if SIGN_LORDS[s] == p else '')
        if state:
            note = ''
            if state == 'debilitated':
                cancel = [q for q in (SIGN_LORDS[s], next(k for k, v in EXALT.items() if v == s) if s in EXALT.values() else None)
                          if q and q in c.lon and c.house(q) in (1, 4, 7, 10)]
                if cancel:
                    note = f"; neecha-bhanga: {', '.join(cancel)} in a kendra from the {c.reference}"
            # Rank so the per-rule cap keeps the strongest placements:
            # exalted > uncancelled debilitation > cancelled > own sign.
            weight = {'exalted': 0.7, 'debilitated': 0.6 if note else 0.66, 'own sign': 0.55}[state]
            out.append(_f('F-DIGNITY-01', 'classical', 'Graha dignity', f"{c.desc(p)} — {state}{note}",
                          [ALL], weight))
    return out


def rule_retro(c: Chart) -> List[Dict[str, Any]]:
    rs = [p for p in GRAHAS7 if p in c.lon and c.retro(p)]
    if not rs:
        return []
    return [_f('F-RETRO-01', 'modern', 'Retrograde = unfinished business (BS-161..165, interpretive)',
               'Retrograde at birth: ' + '; '.join(c.desc(p) for p in rs),
               ['past_lives', 'karmic_journey', 'karma_reset'], 0.45)]


def rule_parivartana(c: Chart) -> List[Dict[str, Any]]:
    out = []
    for i, p in enumerate(GRAHAS7):
        for q in GRAHAS7[i + 1:]:
            if p in c.lon and q in c.lon and SIGN_LORDS[c.sign(p)] == q and SIGN_LORDS[c.sign(q)] == p:
                hs = {c.house(p), c.house(q)}
                kind = 'Dainya' if hs & {6, 8, 12} else 'Khala' if 3 in hs else 'Maha'
                out.append(_f('F-PARIVARTANA-01', 'classical', 'Parivartana yoga (Phaladeepika)',
                              f"{kind} parivartana: {p} ({_ordinal(c.house(p))}) ↔ {q} ({_ordinal(c.house(q))}) — "
                              f"houses {sorted(hs)} act as one", [ALL], 0.8, house_based=True))
    return out


def rule_yogas(c: Chart) -> List[Dict[str, Any]]:
    out = []
    if 'Jupiter' in c.lon:
        rel = (c.sign('Jupiter') - c.sign('Moon')) % 12 + 1
        if rel in (1, 4, 7, 10):
            out.append(_f('F-YOGA-01', 'classical', 'Gajakesari yoga',
                          f"Gajakesari: Jupiter {_ordinal(rel)} from the Moon ({c.desc('Jupiter')})", [ALL], 0.65))
    names = {'Mars': 'Ruchaka', 'Mercury': 'Bhadra', 'Jupiter': 'Hamsa', 'Venus': 'Malavya', 'Saturn': 'Shasha'}
    for p, n in names.items():
        if p in c.lon and c.house(p) in (1, 4, 7, 10) and (EXALT[p] == c.sign(p) or SIGN_LORDS[c.sign(p)] == p):
            out.append(_f('F-YOGA-01', 'classical', 'Pancha Mahapurusha yoga',
                          f"{n} yoga: {c.desc(p)} in a kendra in own/exaltation sign", [ALL], 0.7, house_based=True))
    return out


def rule_bhavat(c: Chart, domains: List[str], categories: List[str]) -> List[Dict[str, Any]]:
    out = []
    for dom in domains:
        houses, _karakas, label = DOMAINS[dom]
        h = houses[0]
        hh = (2 * h - 2) % 12 + 1
        parts = []
        for hx in dict.fromkeys([*houses, hh]):
            occ = c.occupants(c.house_sign(hx))
            lord = c.lord_of_house(hx)
            if lord not in c.lon:
                continue
            asp = c.aspecting(c.house_sign(hx))
            parts.append(f"{_ordinal(hx)} {SIGNS[c.house_sign(hx)]}"
                         f"{' (' + ', '.join(occ) + ')' if occ else ' (empty)'}, lord {lord} in {_ordinal(c.house(lord))}"
                         f"{', aspected by ' + ', '.join(asp) if asp else ''}")
        if dom in KARAKA_FROM:
            k, n = KARAKA_FROM[dom]
            if k in c.lon:
                s = (c.sign(k) + n - 1) % 12
                occ = c.occupants(s)
                parts.append(f"{_ordinal(n)} from {k} = {SIGNS[s]}{' (' + ', '.join(occ) + ')' if occ else ' (empty)'}")
        out.append(_f('F-BHAVAT-01', 'classical', 'Bhavat-bhavam & karaka-from-karaka',
                      f"{label.capitalize()}: " + '; '.join(parts), categories, 0.7, house_based=True))
        out[-1]['domain'] = dom
    return out


def rule_bnn_links(c: Chart) -> List[Dict[str, Any]]:
    """Bhrigu Nandi Nadi: links of a planet to planets in trine, 2nd, 12th, 7th signs."""
    def links(p: str) -> str:
        groups = []
        bases = [(c.sign(p), '')] + ([((c.sign(p) - 1) % 12, f"from {SIGNS[(c.sign(p) - 1) % 12]} (retrograde)")] if c.retro(p) else [])
        for b, tag in bases:
            found = []
            for label, off in (('with', 0), ('trine', 4), ('trine', 8), ('2nd', 1), ('12th', 11), ('7th', 6)):
                for q in c.occupants((b + off) % 12, exclude=(p,)):
                    found.append(f"{label} {q}")
            if found:
                groups.append((tag + ': ' if tag else '') + ', '.join(dict.fromkeys(found)))
        return '; '.join(groups) or 'no links'
    out = []
    if 'Saturn' in c.lon:
        out.append(_f('F-BNN-03', 'tradition-attributed', 'Saturn as karma karaka (Bhrigu Nandi Nadi)',
                      f"Saturn {E.fmt_dms(c.lon['Saturn'])}{' (R)' if c.retro('Saturn') else ''} — "
                      f"{links('Saturn')} — these planets colour the work/karma pattern",
                      ['present_life', 'karmic_journey', 'life_events', 'predictions'], 0.55))
    jiva = 'Jupiter' if c.gender in ('male', 'm') else 'Venus' if c.gender in ('female', 'f') else ''
    if jiva and jiva in c.lon:
        out.append(_f('F-BNN-02', 'tradition-attributed', f'{jiva} as jiva karaka (Bhrigu Nandi Nadi)',
                      f"{jiva} {E.fmt_dms(c.lon[jiva])}: {links(jiva)}",
                      ['karmic_journey', 'relationships', 'present_life'], 0.6))
    return out


# ---------------------------------------------------------------------------
# Dated rules
# ---------------------------------------------------------------------------

def rule_dasha(c: Chart, now: datetime, domains: List[str], categories: List[str]) -> List[Dict[str, Any]]:
    if not c.birth_utc:
        return []
    periods = E.vimshottari(c.birth_utc, c.lon['Moon'])
    maha, antar = E.current_dasha(periods, now)
    if not maha or not antar:
        return []
    out = []
    upcoming = [p for p in periods if p.start >= antar.end][:2]
    nxt = '; next ' + '; '.join(f"{p.label()} {_span(p.start, p.end)}" for p in upcoming) if upcoming else ''
    out.append(_f('F-DASHA-01', 'classical', 'Vimshottari dasha (with birth balance)',
                  f"Running {maha.maha} mahadasha ({_span(maha.start, maha.end)}), {antar.antar} antardasha{nxt}",
                  [ALL], 1.0, timing=f"{antar.label()} {_span(antar.start, antar.end)}", start=antar.start))
    for lord, span in ((antar.antar, antar), (maha.maha, maha)):
        if lord not in c.lon:
            continue
        owned = c.owned_houses(lord)
        nak, _pada, star_lord = E.nakshatra_of(c.lon[lord])
        star_h = c.house(star_lord) if star_lord in c.lon else None
        text = (f"{lord} period: {lord} sits in {_ordinal(c.house(lord))} house"
                f"{', owns ' + '/'.join(_ordinal(h) for h in owned) if owned else ''}; "
                f"in {nak}, star lord {star_lord}{' in ' + _ordinal(star_h) if star_h else ''} "
                f"→ houses {sorted(set([c.house(lord)] + owned + ([star_h] if star_h else [])))} are activated")
        out.append(_f('F-DASHA-02', 'classical', 'Dasha lord activation (natal house + lordship + star lord)',
                      text, [ALL], 0.9 if lord == antar.antar else 0.8,
                      timing=_span(span.start, span.end), start=span.start, house_based=True))
        if lord == maha.maha:
            break
    # Domain windows: antardashas in next 12 years where both lords signify the domain.
    horizon = now + timedelta(days=12 * E.YEAR_DAYS)
    for dom in domains:
        houses, karakas, label = DOMAINS[dom]
        sig = set(karakas)
        lords = {c.lord_of_house(h) for h in houses}
        for h in houses:
            sig.add(c.lord_of_house(h))
            sig.update(c.occupants(c.house_sign(h)))
        scored = []
        for p in periods:
            if p.end <= now or p.start >= horizon:
                continue
            score = (p.maha in sig) + (p.antar in sig)
            # The sub-period of the house lord or karaka carries the house's results.
            if score >= 2 or (score == 1 and p.antar in sig and (p.antar in karakas or p.antar in lords)):
                scored.append((score, p))
        scored.sort(key=lambda sp: (-sp[0], sp[1].start))
        picks = sorted((p for _s, p in scored[:3]), key=lambda p: p.start)
        if picks:
            out.append(_f('F-DASHA-03', 'classical', f'Dasha windows for {label} (BS-216/224/231/236)',
                          f"{label.capitalize()} significators {', '.join(sorted(sig))}; dasha periods that activate it: "
                          + '; '.join(f"{p.label()} {_span(max(p.start, now), p.end)}" for p in picks),
                          categories, 0.8, timing=_span(max(picks[0].start, now), picks[0].end),
                          start=max(picks[0].start, now), end=picks[0].end, house_based=True))
            out[-1]['domain'] = dom
    return out


def rule_transits(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not E.SWISSEPH_AVAILABLE:
        return []
    out = []
    end5 = now + timedelta(days=5 * 365)
    points = {'natal Moon': c.lon['Moon']}
    if c.asc_exact:
        points['Lagna degree'] = c.asc
    if 'Sun' in c.lon:
        points['natal Sun'] = c.lon['Sun']
    for planet in ('Saturn', 'Jupiter'):
        for name, lon in points.items():
            wins = E.conjunction_windows(planet, lon, now, end5, orb=1.0)
            if wins:
                out.append(_f('F-TRANSIT-01', 'classical', 'Slow-planet transit over natal point (gochara)',
                              f"{planet} crosses {name} ({E.fmt_dms(lon)}) within 1°: "
                              + ', '.join(_span(a, b) for a, b in wins[:3]),
                              [ALL], 0.7 if planet == 'Saturn' else 0.65,
                              timing=_span(wins[0][0], wins[0][1]), start=wins[0][0], end=wins[0][1]))
    # Sade Sati: Saturn in 12th, 1st, 2nd from Moon
    ms = c.sign('Moon')
    phases = {(ms - 1) % 12: 'rising', ms: 'peak', (ms + 1) % 12: 'setting'}
    wins = E.sign_windows('Saturn', set(phases), now - timedelta(days=60), now + timedelta(days=12 * 365), step_days=3)
    wins = [w for w in wins if w[1] >= now - timedelta(days=3)]  # drop phases already over
    if wins:
        first = wins[0]
        desc = '; '.join(f"{phases[s]} ({SIGNS[s]}) {_span(max(a, now), b)}" for a, b, s in wins[:4])
        active = first[0] <= now <= first[1] + timedelta(days=3)
        out.append(_f('F-SADESATI-01', 'classical', 'Saturn 12th/1st/2nd from Moon (popularly "Sade Sati"; results per Phaladeepika ch. 26)',
                      f"{'Sade Sati running now' if active else 'Next Sade Sati'} (Moon in {SIGNS[ms]}): {desc}",
                      [ALL], 0.75 if active else 0.55, timing=_span(max(first[0], now), first[1]),
                      start=max(first[0], now), end=wins[min(len(wins), 3) - 1][1]))
    # Jupiter gochara from Moon
    if 'Moon' in c.lon:
        j = E.sign_index(E.planet_positions(now)['Jupiter']['longitude'])
        rel = (j - ms) % 12 + 1
        jw = E.sign_windows('Jupiter', {j}, now, now + timedelta(days=500), step_days=3)
        until = jw[0][1] if jw else now
        tone = 'favourable' if rel in (2, 5, 7, 9, 11) else 'testing'
        transit_signs = {p: E.sign_index(v['longitude']) for p, v in E.planet_positions(now).items()}
        good, blockers = vedha_obstructers('Jupiter', ms, transit_signs)
        if good and blockers:
            tone = (f"favourable house, but as of {_d(now)} obstructed by {', '.join(blockers)} "
                    f"in the vedha house (Phaladeepika ch. 26) — the obstruction lifts when they move on")
        out.append(_f('F-GOCHARA-01', 'classical', 'Jupiter transit from Moon with vedha (Phaladeepika ch. 26)',
                      f"Jupiter in {SIGNS[j]} = {_ordinal(rel)} from the Moon — {tone} for growth/support",
                      [ALL], 0.5, timing=f"until ~{_d(until)}", start=now))
    return out


def rule_bhrigu_bindu(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if 'Rahu' not in c.lon:
        return []
    bb = E.bhrigu_bindu(c.lon['Moon'], c.lon['Rahu'])
    nak, pada, lord = E.nakshatra_of(bb)
    h = (E.sign_index(bb) - E.sign_index(c.asc)) % 12 + 1
    text = f"Bhrigu Bindu {E.fmt_dms(bb)} in {_ordinal(h)} house ({nak}-{pada}, sign lord {SIGN_LORDS[E.sign_index(bb)]})"
    timing, start, end_bb = '', None, None
    if E.SWISSEPH_AVAILABLE:
        hits = []
        for planet in ('Saturn', 'Jupiter'):
            for a, b in E.conjunction_windows(planet, bb, now, now + timedelta(days=10 * 365), orb=1.0)[:3]:
                hits.append((a, b, planet))
        hits.sort()
        if hits:
            text += '; activated by ' + ', '.join(f"{p} {_span(a, b)}" for a, b, p in hits[:4])
            timing, start = f"{hits[0][2]} {_span(hits[0][0], hits[0][1])}", hits[0][0]
            end_bb = hits[0][1]
    return [_f('F-BB-01', 'tradition-attributed', 'Bhrigu Bindu (Rahu–Moon midpoint) and its transits',
               text, [ALL], 0.6, timing=timing, start=start, end=end_bb if start else None)]


def rule_bcp(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not c.birth_utc:
        return []
    age = (now - c.birth_utc).days / E.YEAR_DAYS
    running = int(age) + 1
    h = (running - 1) % 12 + 1
    occ = c.occupants(c.house_sign(h))
    lord = c.lord_of_house(h)
    try:
        start = c.birth_utc.replace(year=c.birth_utc.year + int(age))
    except ValueError:  # 29 Feb
        start = c.birth_utc.replace(year=c.birth_utc.year + int(age), day=28)
    end = start.replace(year=start.year + 1) if not (start.month == 2 and start.day == 29) else start + timedelta(days=365)
    return [_f('F-BCP-01', 'tradition-attributed', f'Bhrigu Chakra Paddhati (one house per year from the {c.reference})',
               f"Running year {running} activates the {_ordinal(h)} house ({SIGNS[c.house_sign(h)]}"
               f"{': ' + ', '.join(occ) if occ else ', empty'}); its lord {lord} sits in {_ordinal(c.house(lord))}",
               ['present_life', 'predictions', 'life_events', 'karmic_journey'], 0.5,
               timing=_span(start, end), start=start, end=end, house_based=True)]


def rule_bnn_progression(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not c.birth_utc or 'Jupiter' not in c.lon:
        return []
    age = int((now - c.birth_utc).days / E.YEAR_DAYS)
    ps = (c.sign('Jupiter') + age) % 12
    linked = []
    for label, off in (('in', 0), ('trine', 4), ('trine', 8), ('7th', 6), ('2nd', 1), ('12th', 11)):
        for q in c.occupants((ps + off) % 12):
            linked.append(f"{label} natal {q}")
    return [_f('F-BNN-01', 'tradition-attributed', 'Jupiter progression one sign per year (Bhrigu Nandi Nadi)',
               f"Age {age}: progressed Jupiter in {SIGNS[ps]} — {', '.join(dict.fromkeys(linked)) or 'activates no natal planet'}",
               ['present_life', 'predictions', 'life_events'], 0.45, timing=f"age {age}–{age + 1}")]


def rule_sensitivity(c: Chart, birth_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    if c.time_accuracy == 'unknown' and E.SWISSEPH_AVAILABLE and c.birth_utc:
        # Moon moves ~13° a day: check whether its nakshatra (and so the
        # whole dasha sequence) is even stable across the birth date.
        naks, moon_signs = [], []
        for hours in (-12, 0, 12):
            moon = E.planet_positions(c.birth_utc + timedelta(hours=hours))['Moon']['longitude']
            nak = E.nakshatra_of(moon)
            naks.append(f"{nak[0]} ({nak[2]} dasha)")
            moon_signs.append(E.sign_of(moon))
        naks = list(dict.fromkeys(naks))
        moon_signs = list(dict.fromkeys(moon_signs))
        if len(moon_signs) > 1:
            return [_f('F-SENS-01', 'modern', 'Birth-time sensitivity check',
                       'Birth time unknown and the Moon changes sign that day (' + ' → '.join(moon_signs) +
                       ') — the Chandra Lagna itself is uncertain' +
                       ('; dasha dates are uncertain too' if len(naks) > 1 else ''), [ALL], 0.95)]
        if len(naks) > 1:
            return [_f('F-SENS-01', 'modern', 'Birth-time sensitivity check',
                       'Birth time unknown and the Moon changes nakshatra that day (' + ' → '.join(naks) +
                       ') — dasha dates are uncertain; houses are read from the Moon', [ALL], 0.95)]
        return [_f('F-SENS-01', 'modern', 'Birth-time sensitivity check',
                   f"Birth time unknown — Moon stays in {naks[0]} all day, so the dasha sequence holds; "
                   'houses are read from the Moon (Chandra Lagna)', [ALL], 0.8)]
    if not (E.SWISSEPH_AVAILABLE and c.birth_utc and c.asc_exact and c.lat is not None and c.lng is not None):
        return []
    flagged = []
    tight = False
    base_asc, base_moon = E.sign_index(c.asc), c.sign('Moon')
    offsets = (-15, 15, -30, 30, -60, 60) if c.time_accuracy == 'within_hour' else (-15, 15, -30, 30)
    for minutes in offsets:
        t = c.birth_utc + timedelta(minutes=minutes)
        try:
            asc = E.ascendant(t, float(c.lat), float(c.lng))
        except Exception:
            return []
        moon = E.planet_positions(t)['Moon']['longitude']
        changed = []
        if E.sign_index(asc) != base_asc:
            changed.append(f"Lagna becomes {E.sign_of(asc)} at {minutes:+d} min")
        if E.sign_index(moon) != base_moon:
            changed.append(f"Moon sign becomes {E.sign_of(moon)} at {minutes:+d} min")
        if changed and (abs(minutes) == 15 or c.time_accuracy == 'within_hour'):
            tight = True
        flagged.extend(c_ for c_ in changed if c_.split(' at ')[0] not in ' '.join(flagged))
    if not flagged:
        span = '±1 h' if c.time_accuracy == 'within_hour' else '±30 min'
        return [_f('F-SENS-01', 'modern', 'Birth-time sensitivity check',
                   f'Lagna and Moon sign stable for {span} of birth time', [ALL], 0.3)]
    return [_f('F-SENS-01', 'modern', 'Birth-time sensitivity check',
               'Time-sensitive chart: ' + '; '.join(flagged) +
               ' — statements based on that sign/house need an accurate birth time',
               [ALL], 0.95 if tight else 0.7)]


# ---------------------------------------------------------------------------
# Additional classical rules (navamsa, yogas, gochara, moksha) and composers
# ---------------------------------------------------------------------------

def rule_navamsa(c: Chart) -> List[Dict[str, Any]]:
    """Navamsa (D9) placements, vargottama, karakamsha and 12th from it."""
    out = []
    d9 = {p: navamsa_sign(c.lon[p]) for p in E.PLANETS if p in c.lon}
    moon_uncertain = c.time_accuracy in ('within_hour', 'unknown')
    varg = [p for p in d9 if d9[p] == c.sign(p) and not (p == 'Moon' and moon_uncertain)]
    if varg:
        out.append(_f('F-D9-01', 'classical', 'Vargottama — same sign in Rashi and Navamsa (BPHS, Shodashavarga)',
                      'Vargottama: ' + ', '.join(f"{p} ({SIGNS[c.sign(p)]})" for p in varg) + ' — these planets give steady, reliable results',
                      [ALL], 0.55))
    cand = karaka_candidates(c)
    if cand:
        ak = max(cand, key=cand.get)
        if ak == 'Moon' and moon_uncertain:
            return out
        km = d9[ak]
        in_km = [p for p in d9 if d9[p] == km and p != ak]
        km12 = (km + 11) % 12
        in_12 = [p for p in d9 if d9[p] == km12]
        out.append(_f('F-KARAKAMSHA-01', 'classical', 'Karakamsha — Atmakaraka\'s navamsa sign (Jaimini Upadesa Sutras, adhyaya 1)',
                      f"Karakamsha {SIGNS[km]} (Atmakaraka {ak} in navamsa){': with ' + ', '.join(in_km) if in_km else ''}; "
                      f"12th from Karakamsha {SIGNS[km12]}{': ' + ', '.join(in_12) if in_12 else ' (empty)'}",
                      ['karmic_journey', 'past_lives', 'future_lives', 'karma_reset', 'present_life'], 0.7))
    for label, planets in (('Spouse indicators', ['Venus', c.lord_of_house(7)]),):
        parts = [f"{p} in navamsa {SIGNS[d9[p]]}{' (exalted in D9)' if EXALT.get(p) == d9[p] else ' (debilitated in D9)' if DEBIL.get(p) == d9[p] else ''}"
                 for p in dict.fromkeys(planets) if p in d9]
        if parts and c.time_accuracy != 'unknown':
            out.append(_f('F-D9-02', 'classical', 'Navamsa of Venus and 7th lord — marriage quality (BPHS)',
                          f"{label}: " + '; '.join(parts), ['relationships', 'life_events'], 0.6, house_based=True))
    return out


def rule_more_yogas(c: Chart) -> List[Dict[str, Any]]:
    out = []
    def joined(a: str, b: str) -> str:
        if a == b or a not in c.lon or b not in c.lon:
            return ''
        if c.sign(a) == c.sign(b):
            return 'conjunct'
        if SIGN_LORDS[c.sign(a)] == b and SIGN_LORDS[c.sign(b)] == a:
            return 'in exchange'
        if (c.sign(a) - c.sign(b)) % 12 == 6:
            return 'in mutual aspect'
        return ''
    l9, l10 = c.lord_of_house(9), c.lord_of_house(10)
    rel = joined(l9, l10)
    if rel:
        out.append(_f('F-YOGA-02', 'classical', 'Dharma-Karmadhipati raja yoga (BPHS, Rajayoga)',
                      f"9th lord {l9} and 10th lord {l10} {rel} — dharma and career reinforce each other",
                      ['present_life', 'karmic_journey', 'predictions', 'life_events'], 0.75, house_based=True))
    dusthana = {6, 8, 12}
    vip = [c.lord_of_house(h) for h in dusthana if c.lord_of_house(h) in c.lon and c.house(c.lord_of_house(h)) in dusthana]
    if vip:
        out.append(_f('F-YOGA-03', 'classical', 'Viparita raja yoga — dusthana lords in dusthanas (Uttara Kalamrita / BPHS)',
                      'Viparita raja yoga: ' + ', '.join(f"{p} (lord of {'/'.join(_ordinal(h) for h in c.owned_houses(p) if h in dusthana)}) in {_ordinal(c.house(p))}" for p in dict.fromkeys(vip))
                      + ' — gains that come after setbacks', [ALL], 0.6, house_based=True))
    ms = c.sign('Moon')
    neighbours = [p for p in ('Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn') if p in c.lon and c.sign(p) in ((ms + 1) % 12, (ms - 1) % 12)]
    if not neighbours and not [p for p in ('Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn') if p in c.lon and c.sign(p) == ms]:
        kendra_from_moon = [p for p in ('Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn') if p in c.lon and (c.sign(p) - ms) % 3 == 0]
        out.append(_f('F-YOGA-04', 'classical', 'Kemadruma — no planet 2nd/12th from Moon (Brihat Jataka; cancellation per later texts)',
                      'Kemadruma: no planet in the 2nd or 12th from the Moon'
                      + (f"; cancelled by {', '.join(kendra_from_moon)} in a kendra from the Moon" if kendra_from_moon else ' — emotional self-reliance is a theme'),
                      ['present_life', 'karmic_journey', 'karmic_remedies'], 0.5 if kendra_from_moon else 0.6))
    else:
        second = [p for p in neighbours if c.sign(p) == (ms + 1) % 12]
        twelfth = [p for p in neighbours if c.sign(p) == (ms - 1) % 12]
        name = 'Durudhara' if second and twelfth else 'Sunapha' if second else 'Anapha' if twelfth else ''
        if name:
            parts = ([f"{', '.join(second)} 2nd from the Moon"] if second else []) + ([f"{', '.join(twelfth)} 12th from the Moon"] if twelfth else [])
            out.append(_f('F-YOGA-04', 'classical', f'{name} yoga (Brihat Jataka, Chandra-yoga chapter)',
                          f"{name} yoga: " + '; '.join(parts),
                          ['present_life', 'karmic_journey'], 0.45))
    wealth_lords = {c.lord_of_house(2), c.lord_of_house(11)}
    trine_lords = {c.lord_of_house(5), c.lord_of_house(9), c.lord_of_house(1)}
    pairs = sorted({f"{a}+{b}" for a in wealth_lords for b in trine_lords if a != b and joined(a, b) == 'conjunct'})
    if pairs:
        out.append(_f('F-YOGA-05', 'classical', 'Dhana yoga — 2nd/11th lord with Lagna/5th/9th lord (BPHS, Dhanayoga)',
                      'Dhana yoga: ' + ', '.join(pairs) + ' conjunct', ['present_life', 'predictions', 'life_events'], 0.6, house_based=True))
    return out


def rule_star_chain(c: Chart, domains: List[str], categories: List[str]) -> List[Dict[str, Any]]:
    """Planet delivers results of its nakshatra lord (Nadi star-lord principle)."""
    out = []
    for dom in _take(domains, 2):
        h = DOMAINS[dom][0][0]
        lord = c.lord_of_house(h)
        if lord not in c.lon:
            continue
        nak, _pada, sl = E.nakshatra_of(c.lon[lord])
        if sl not in c.lon:
            continue
        houses = sorted(set([c.house(sl)] + c.owned_houses(sl)))
        out.append(_f('F-STAR-01', 'modern', 'Star-lord chain (Nadi / 20th-century stellar method)',
                      f"{_ordinal(h)} lord {lord} sits in {nak} (star lord {sl}); {sl} occupies {_ordinal(c.house(sl))} and owns "
                      f"{'/'.join(_ordinal(x) for x in c.owned_houses(sl)) or 'no house'} → {DOMAINS[dom][2]} results route through houses {houses}",
                      categories, 0.5, house_based=True))
        out[-1]['domain'] = dom
    return out


def rule_moksha(c: Chart) -> List[Dict[str, Any]]:
    marks = []
    if 'Ketu' in c.lon and c.house('Ketu') == 12:
        marks.append('Ketu in the 12th')
    if 'Jupiter' in c.lon and (c.house('Jupiter') == 12 or c.aspects_sign('Jupiter', c.house_sign(12))):
        marks.append('Jupiter influences the 12th')
    cand = karaka_candidates(c)
    ak = max(cand, key=cand.get) if cand else None
    if ak and not (ak == 'Moon' and c.time_accuracy in ('within_hour', 'unknown')):
        km12 = (navamsa_sign(c.lon[ak]) + 11) % 12
        benefic = [p for p in ('Jupiter', 'Venus', 'Ketu', 'Mercury') if p in c.lon and navamsa_sign(c.lon[p]) == km12]
        if benefic:
            marks.append(f"{', '.join(benefic)} in 12th from Karakamsha")
    if not marks:
        return []
    return [_f('F-MOKSHA-01', 'classical', 'Moksha indicators (12th house, Ketu, 12th from Karakamsha — BPHS / Jaimini)',
               'Liberation indicators present: ' + '; '.join(marks),
               ['future_lives', 'karmic_journey', 'karma_reset'], 0.5, house_based=True)]


def rule_lessons(c: Chart) -> List[Dict[str, Any]]:
    """Soul-journey lesson triggers from data/bhrigu_karmic_soul_journey_model.json."""
    h = c.house
    conj = lambda a, b: a in c.lon and b in c.lon and c.sign(a) == c.sign(b)
    venus_afflicted = 'Venus' in c.lon and (DEBIL['Venus'] == c.sign('Venus') or any(conj('Venus', x) for x in ('Saturn', 'Rahu', 'Ketu', 'Mars')))
    mars_8_12 = 'Mars' in c.lon and (h('Mars') in (8, 12) or any(c.aspects_sign('Mars', c.house_sign(x)) for x in (8, 12)))
    triggers = [
        ('L-DISCIPLINE', 'Discipline & responsibility', 'Saturn' in c.lon and (c.strong('Saturn') or conj('Saturn', 'Ketu')), 'Saturn strong or with Ketu'),
        ('L-DISCIPLINE', 'Discipline & responsibility', 'Rahu' in c.lon and h('Rahu') in (6, 10), 'Rahu in 6th/10th'),
        ('L-RELATIONSHIP', 'Relationship balance', 'Rahu' in c.lon and {h('Rahu'), h('Ketu')} == {1, 7}, 'Rahu–Ketu on 1/7 axis'),
        ('L-RELATIONSHIP', 'Relationship balance', venus_afflicted, 'Venus afflicted'),
        ('L-TRUTH', 'Truth & guidance', 'Jupiter' in c.lon and c.strong('Jupiter') and h('Jupiter') in (5, 9), 'Jupiter strong in 5th/9th'),
        ('L-TRUTH', 'Truth & guidance', 'Ketu' in c.lon and h('Ketu') in (9, 12), 'Ketu in 9th/12th'),
        ('L-COURAGE', 'Courage & right action', 'Mars' in c.lon and (c.strong('Mars') or conj('Mars', 'Rahu') or conj('Mars', 'Ketu')), 'Mars strong or with a node'),
        ('L-COURAGE', 'Courage & right action', mars_8_12, 'Mars influences 8th/12th'),
        ('L-DETACHMENT', 'Detachment', len(c.occupants(c.house_sign(12))) >= 2, '12th-house emphasis'),
        ('L-DETACHMENT', 'Detachment', 'Rahu' in c.lon and h('Rahu') in (2, 11), 'Rahu in 2nd/11th'),
    ]
    fired: Dict[str, List[str]] = {}
    labels: Dict[str, str] = {}
    for lid, label, ok, why in triggers:
        if ok:
            fired.setdefault(lid, []).append(why)
            labels[lid] = label
    if not fired:
        return []
    return [_f('F-LESSON-01', 'modern', 'Soul-journey lesson triggers (interpretive model, repo data file)',
               'Lessons triggered: ' + '; '.join(f"{labels[k]} ({', '.join(v)})" for k, v in fired.items()),
               ['karmic_journey', 'past_lives', 'karma_reset', 'karmic_remedies'], 0.4, house_based=True)]


def _windows(pred, start: datetime, end: datetime, step_days: int = 5) -> List[Tuple[datetime, datetime]]:
    wins: List[Tuple[datetime, datetime]] = []
    cur: Optional[List[datetime]] = None
    d = start
    while d <= end:
        if pred(d):
            cur = [d, d] if cur is None else [cur[0], d]
        elif cur is not None:
            wins.append((cur[0], cur[1]))
            cur = None
        d += timedelta(days=step_days)
    if cur is not None:
        wins.append((cur[0], cur[1]))
    return wins


def rule_double_transit(c: Chart, now: datetime, domains: List[str], categories: List[str]) -> List[Dict[str, Any]]:
    """Jupiter AND Saturn both occupy/aspect a house or its lord's sign (modern 'double transit')."""
    if not E.SWISSEPH_AVAILABLE:
        return []
    out = []
    end = now + timedelta(days=4 * 365)
    seen_houses = set()
    for dom in _take(domains, 3):
        h = DOMAINS[dom][0][0]
        if h in seen_houses:  # two themes on one house would repeat the same window
            continue
        seen_houses.add(h)
        targets = {c.house_sign(h)}
        lord = c.lord_of_house(h)
        if lord in c.lon:
            targets.add(c.sign(lord))

        def hit(day: datetime) -> bool:
            pos = E.planet_positions(day)
            js, ss = E.sign_index(pos['Jupiter']['longitude']), E.sign_index(pos['Saturn']['longitude'])
            return (any(js == t or aspects_from('Jupiter', js, t) for t in targets)
                    and any(ss == t or aspects_from('Saturn', ss, t) for t in targets))
        wins = [w for w in _windows(hit, now, end) if (w[1] - w[0]).days >= 20]
        if wins:
            out.append(_f('F-TRANSIT-02', 'modern', 'Double transit of Jupiter and Saturn (modern synthesis on classical drishti; repo BS-218)',
                          f"Jupiter and Saturn both activate the {_ordinal(h)} ({SIGNS[c.house_sign(h)]}) or its lord {lord}: "
                          + ', '.join(_span(a, b) for a, b in wins[:3]) + f" — supports {DOMAINS[dom][2]} events if the dasha agrees",
                          categories, 0.65, timing=_span(wins[0][0], wins[0][1]), start=wins[0][0], end=wins[0][1], house_based=True))
            out[-1]['domain'] = dom
    return out


def rule_saturn_gochara(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    """Saturn from the Moon: good in 3/6/11; Kantaka (4th) and Ashtama (8th) Shani (Phaladeepika ch. 26)."""
    if not E.SWISSEPH_AVAILABLE:
        return []
    ms = c.sign('Moon')
    transit_signs = {p: E.sign_index(v['longitude']) for p, v in E.planet_positions(now).items()}
    sat = transit_signs['Saturn']
    rel = (sat - ms) % 12 + 1
    tone = 'supportive' if rel in (3, 6, 11) else 'demanding'
    good, blockers = vedha_obstructers('Saturn', ms, transit_signs)
    if good and blockers:
        tone = (f"supportive house, but as of {_d(now)} obstructed by {', '.join(blockers)} in the vedha house "
                "— the obstruction lifts when they move on")
    out = [_f('F-GOCHARA-02', 'classical', 'Saturn transit results by house from Moon (Phaladeepika ch. 26)',
              f"Saturn in {SIGNS[sat]} = {_ordinal(rel)} from the Moon — {tone} period for effort and results",
              [ALL], 0.5, start=now)]
    names = {(ms + 3) % 12: 'Kantaka Shani (4th from Moon)', (ms + 7) % 12: 'Ashtama Shani (8th from Moon)'}
    wins = [w for w in E.sign_windows('Saturn', set(names), now, now + timedelta(days=12 * 365), step_days=3) if w[1] >= now]
    if wins:
        a, b, sg = wins[0]
        out.append(_f('F-GOCHARA-03', 'classical', 'Saturn 4th/8th from Moon — results per Phaladeepika ch. 26 (names "Kantaka/Ashtama Shani" are later usage)',
                      f"{names[sg]}: Saturn in {SIGNS[sg]} {_span(max(a, now), b)}" + (f"; then {names[wins[1][2]]} {_span(wins[1][0], wins[1][1])}" if len(wins) > 1 else ''),
                      ['present_life', 'predictions', 'life_events', 'karmic_remedies'], 0.6,
                      timing=_span(max(a, now), b), start=max(a, now), end=b))
    return out


def rule_ashtakavarga(c: Chart, now: datetime, domains: List[str], categories: List[str]) -> List[Dict[str, Any]]:
    """Sarvashtakavarga house strength and transit bindus (BPHS ch. 66)."""
    signs = {p: c.sign(p) for p in GRAHAS7 if p in c.lon}
    if len(signs) < 7:
        return []
    bav = bhinnashtakavarga(signs, E.sign_index(c.asc))
    sav = sarvashtakavarga(bav)
    approx = '' if c.time_accuracy not in ('within_hour', 'unknown') else (
        ' (houses and the Lagna contribution counted from the Moon)' if c.reference == 'Moon'
        else ' (birth time ±1 h: the Lagna sign, and so these house numbers, may shift)')
    by_house = {h: sav[c.house_sign(h)] for h in range(1, 13)}
    strong = sorted(by_house, key=lambda h: -by_house[h])[:3]
    weak = sorted(by_house, key=lambda h: by_house[h])[:2]
    dom_txt = []
    for dom in _take(domains, 3):
        h = DOMAINS[dom][0][0]
        v = by_house[h]
        dom_txt.append(f"{DOMAINS[dom][2]} ({_ordinal(h)}): {v} — {'strong' if v >= 28 else 'weak' if v < 25 else 'average'}")
    per_domain = []
    if isinstance(domains, _Full):
        for dom in domains:
            hs = DOMAINS[dom][0]
            txt = ', '.join(f"{_ordinal(h)} house {by_house[h]} bindus ("
                            f"{'strong' if by_house[h] >= 28 else 'weak' if by_house[h] < 25 else 'average'})" for h in hs)
            per_domain.append(_f('F-AV-01', 'classical', 'Sarvashtakavarga house strength (BPHS, Ashtakavarga chapters)',
                                 f"Ashtakavarga strength for {DOMAINS[dom][2]}: {txt}; 28 is the average{approx}",
                                 categories, 0.55, house_based=True))
            per_domain[-1]['domain'] = dom
        dom_txt = dom_txt[:3]
    out = per_domain + [_f('F-AV-01', 'classical', 'Sarvashtakavarga house strength (BPHS, Ashtakavarga chapters)',
              'SAV ' + '; '.join(dom_txt) + f". Strongest houses {', '.join(f'{_ordinal(h)} ({by_house[h]})' for h in strong)}; "
              f"weakest {', '.join(f'{_ordinal(h)} ({by_house[h]})' for h in weak)}{approx}",
              categories, 0.6, house_based=True)]
    if E.SWISSEPH_AVAILABLE:
        pos = E.planet_positions(now)
        parts = []
        for p in ('Saturn', 'Jupiter'):
            sg = E.sign_index(pos[p]['longitude'])
            b = bav[p][sg]
            parts.append(f"{p} transits {SIGNS[sg]} with {b} of 8 bindus in its own Ashtakavarga ("
                         f"{'gives good results' if b >= 4 else 'gives weak results'}) and SAV {sav[sg]}")
        nxt = [w for w in E.sign_windows('Saturn', set(range(12)) - {E.sign_index(pos['Saturn']['longitude'])},
                                          now, now + timedelta(days=4 * 365), step_days=5)]
        if nxt:
            a, _b, sg = nxt[0]
            parts.append(f"next Saturn sign {SIGNS[sg]} from ~{_d(a)}: {bav['Saturn'][sg]} bindus")
        out.append(_f('F-AV-02', 'classical', 'Transit strength by Ashtakavarga bindus (BPHS; 4+ of 8 is favourable)',
                      '; '.join(parts) + approx, [ALL], 0.6, start=now))

        # Reduced (shodhita) bindus for the transit sign
        occupied = set(signs.values())
        red = []
        for p in ('Saturn', 'Jupiter'):
            sg = E.sign_index(pos[p]['longitude'])
            reduced = ekadhipatya_shodhana(trikona_shodhana(bav[p]), occupied)
            red.append(f"{p} in {SIGNS[sg]}: {bav[p][sg]} → {reduced[sg]} after trikona and ekadhipatya shodhana")
        out.append(_f('F-AV-03', 'classical', 'Shodhita Ashtakavarga — trikona and ekadhipatya reductions (BPHS)',
                      '; '.join(red) + approx, ['predictions', 'present_life', 'life_events', 'karmic_remedies'], 0.45))

        # Kakshya timing: a slow planet gives results while crossing a kakshya
        # whose lord contributed a bindu to its BAV in that sign.
        kakshya_wanted = ALL in categories or bool(set(categories) & {'predictions', 'present_life', 'life_events'})
        for p in (('Saturn', 'Jupiter') if kakshya_wanted else ()):
            givers = prastara(p, signs, E.sign_index(c.asc))
            def good(day: datetime, p=p, givers=givers) -> bool:
                lon = E.planet_positions(day)['Saturn' if p == 'Saturn' else 'Jupiter']['longitude']
                return kakshya_of(lon)[1] in givers[E.sign_index(lon)]
            wins = [w for w in _windows(good, now, now + timedelta(days=2 * 365), step_days=3) if (w[1] - w[0]).days >= 9]
            if wins:
                lon0 = E.planet_positions(wins[0][0])[p]['longitude']
                k0 = kakshya_of(lon0)[1]
                out.append(_f('F-AV-04', 'classical', 'Kakshya timing — transit through a bindu-giving kakshya (BPHS / Phaladeepika)',
                              f"{p}'s most productive sub-periods (kakshyas whose lord gave it a bindu): "
                              + ', '.join(_span(a, b) for a, b in wins[:3])
                              + f" (first: {k0}'s kakshya in {E.sign_of(lon0)})" + approx,
                              ['predictions', 'present_life', 'life_events'], 0.5,
                              timing=_span(wins[0][0], wins[0][1]), start=wins[0][0], end=wins[0][1]))
    return out


GOOD_FROM_MOON = {p: set(t) for p, t in VEDHA.items()}
GOOD_FROM_MOON['Rahu'] = GOOD_FROM_MOON['Ketu'] = set(VEDHA['Sun'])  # Phaladeepika 26 v. 2: nodes as the Sun


def rule_fast_transits(c: Chart, now: datetime, categories: List[str]) -> List[Dict[str, Any]]:
    """Sun, Mars, Mercury, Venus (stays beginning in the next 60 days) and the
    nodes: results by house from the Moon, vedha-obstructed days, and own-BAV
    bindus (Phaladeepika ch. 26)."""
    if not E.SWISSEPH_AVAILABLE:
        return []
    ms = c.sign('Moon')
    signs = {p: c.sign(p) for p in GRAHAS7 if p in c.lon}
    bav = bhinnashtakavarga(signs, E.sign_index(c.asc)) if len(signs) == 7 else {}
    approx = ' (bindus use the Moon in place of the Lagna)' if c.reference == 'Moon' else ''
    # Sample at local-noon-ish UTC midday so day boundaries are stable.
    start = now.replace(hour=12, minute=0, second=0, microsecond=0)
    horizon = start + timedelta(days=60)
    lines = []
    good_spans: List[Tuple[datetime, datetime]] = []
    for p in ('Sun', 'Mars', 'Mercury', 'Venus'):
        # Scan past the horizon so a stay in progress at day 60 shows its real exit
        # (Mars can stay in a sign ~6 months when retrograde).
        stays = [w for w in E.sign_windows(p, set(range(12)), start, horizon + timedelta(days=200), step_days=1)
                 if w[1] >= start and w[0] <= horizon]
        parts = []
        for a_, b_, sg in stays:
            a_ = max(a_, start)
            house = (sg - ms) % 12 + 1
            label = f"{SIGNS[sg]} ({_ordinal(house)} from Moon) {_dspan(a_, b_, start.year)}"
            bindu = f", {bav[p][sg]}/8 bindus" if p in bav else ''
            if house in GOOD_FROM_MOON[p]:
                blocked = total = 0
                d = a_
                while d <= b_:
                    total += 1
                    ts = {q: E.sign_index(v['longitude']) for q, v in E.planet_positions(d).items()}
                    if vedha_obstructers(p, ms, ts)[1]:
                        blocked += 1
                    d += timedelta(days=1)
                share = blocked / max(total, 1)
                if not blocked:
                    verdict = 'favourable'
                elif share > 0.5:
                    verdict = f"favourable house, mostly obstructed by vedha ({blocked} of {total} days)"
                else:
                    verdict = f"favourable ({blocked} of {total} days obstructed by vedha)"
                if share <= 0.5:
                    good_spans.append((a_, b_))
            else:
                verdict = 'challenging'
            parts.append(f"{label}: {verdict}{bindu}")
        if parts:
            lines.append(f"{p} — " + '; '.join(parts))
    pos = E.planet_positions(start)
    for p in ('Rahu', 'Ketu'):
        sg = E.sign_index(pos[p]['longitude'])
        house = (sg - ms) % 12 + 1
        lines.append(f"{p} in {SIGNS[sg]} ({_ordinal(house)} from Moon): {'favourable' if house in GOOD_FROM_MOON[p] else 'challenging'}")
    if not lines:
        return []
    first_good = min(good_spans, key=lambda w: w[0]) if good_spans else None
    return [_f('F-GOCHARA-04', 'classical', 'Transits of Sun, Mars, Mercury, Venus and the nodes from Moon, with vedha (Phaladeepika ch. 26)',
               'Sign stays starting within 60 days: ' + ' | '.join(lines) + approx, categories, 0.5,
               timing=_dspan(*first_good, start.year) if first_good else '',
               start=first_good[0] if first_good else None, end=first_good[1] if first_good else None)]


def rule_nodal_return(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not (E.SWISSEPH_AVAILABLE and 'Rahu' in c.lon):
        return []
    wins = E.conjunction_windows('Rahu', c.lon['Rahu'], now, now + timedelta(days=20 * 365), orb=1.0)
    if not wins:
        return []
    a, b = wins[0]
    return [_f('F-NODES-02', 'modern', 'Nodal return (~18.6-year Rahu cycle over its natal degree)',
               f"Transit Rahu returns to natal Rahu ({E.fmt_dms(c.lon['Rahu'])}) {_span(a, b)} — the desire axis resets",
               ['karmic_journey', 'past_lives', 'future_lives', 'karma_reset'], 0.5, timing=_span(a, b), start=a, end=b)]


def compose_windows(findings: List[Dict[str, Any]], categories: List[str]) -> List[Dict[str, Any]]:
    """Rank upcoming windows where dated rules for the SAME theme truly overlap (F-WINDOW-01).

    A window needs a domain dasha period (F-DASHA-03) plus at least one
    supporting dated rule.

    The window reported is the intersection of the contributing ranges, and
    findings for different domains (e.g. career vs. 9th house) never combine.
    General findings (no domain) may combine with any domain.
    """
    spans = []
    for f in findings:
        if not (f.get('start') and f.get('end')) or f['id'] in ('F-DASHA-01', 'F-DASHA-02', 'F-BCP-01', 'F-WINDOW-01'):
            continue
        try:
            a, b = datetime.fromisoformat(str(f['start'])), datetime.fromisoformat(str(f['end']))
        except (TypeError, ValueError):
            continue
        if b > a:
            spans.append((a, b, f))
    candidates = []
    for a, b, f in spans:
        lo, hi, members = a, b, [f]
        for a2, b2, g in sorted(spans, key=lambda x: -x[2]['weight']):
            if g is f:
                continue
            dom_f, dom_g = f.get('domain'), g.get('domain')
            if dom_f and dom_g and dom_f != dom_g:
                continue
            nlo, nhi = max(lo, a2), min(hi, b2)
            if (nhi - nlo).days >= 14:
                lo, hi = nlo, nhi
                members.append(g)
        ids = sorted({m['id'] for m in members})
        # Transits only deliver what the dasha promises: a window must
        # include a domain dasha period (F-DASHA-03) plus a transit/rule.
        if len(ids) >= 2 and 'F-DASHA-03' in ids:
            candidates.append((sum(m['weight'] for m in members), lo, hi, ids,
                               next((m.get('domain') for m in members if m.get('domain')), None)))
    if not candidates:
        return []
    candidates.sort(key=lambda x: (-x[0], x[1]))
    top: List[Tuple[datetime, datetime, List[str], Optional[str]]] = []
    for _score, lo, hi, ids, dom in candidates:
        if any(lo <= h2 and hi >= l2 for l2, h2, _i, _d in top):
            continue
        top.append((lo, hi, ids, dom))
        if len(top) == 3:
            break
    top.sort(key=lambda x: x[0])
    label = lambda dom: f"{DOMAINS[dom][2]}: " if dom in DOMAINS else ''
    return [_f('F-WINDOW-01', 'modern', 'Ranked windows — overlapping dated rules for the same theme',
               'Strongest windows: ' + '; '.join(f"{label(dom)}{_span(lo, hi)} ({' + '.join(ids)})" for lo, hi, ids, dom in top),
               categories, 0.85, timing=_span(top[0][0], top[0][1]), start=top[0][0], end=top[0][1])]


ACCURACY_NOTES = {
    'within_15': (0.85, ''),
    'within_hour': (0.6, ' [birth time ±1 h: house may shift]'),
    'unknown': (0.55, ' [houses from Moon]'),
}


# Results of two-planet conjunctions: the blend of the two karakas (Bhrigu Nandi
# Nadi reads a combination as one statement), with the classical yoga name where
# one exists.
CONJUNCTION_RESULTS: Dict[frozenset, str] = {frozenset(k): v for k, v in {
    ('Sun', 'Moon'): "born near the new Moon: will and mind act as one, giving strong inner drive but emotional reserve and a need for rest",
    ('Sun', 'Mars'): "courage, command and executive or technical ability; a quick temper; forceful father or authority figures",
    ('Sun', 'Mercury'): "Budha-Aditya yoga: sharp intellect and skill in analysis, writing and advice; the closer Mercury is to the Sun, the more speech runs ahead of listening",
    ('Sun', 'Jupiter'): "dharma joined to status: respect from teachers and authorities, advisory or teaching roles, a principled nature",
    ('Sun', 'Venus'): "refinement, artistic taste and public charm; Venus near the Sun strains ease in marriage and asks for humility in love",
    ('Sun', 'Saturn'): "duty against authority: slow, hard-won recognition, friction with father or superiors, strength built through persistence",
    ('Sun', 'Rahu'): "eclipse pattern on the Sun: hunger for visibility, an unconventional career, tests of reputation and of the father's role",
    ('Sun', 'Ketu'): "eclipse pattern on the Sun: detachment from status and spiritual insight; confidence in authority has to be built from within",
    ('Moon', 'Mars'): "Chandra-Mangala yoga: enterprise and earning power, emotional intensity, impulsive reactions; a strong-willed mother",
    ('Moon', 'Mercury'): "a quick, adaptable mind with skill in words, trade and learning; restlessness and changeable moods",
    ('Moon', 'Jupiter'): "Gaja-Kesari yoga: sound judgement, good reputation, supportive elders and a generous nature",
    ('Moon', 'Venus'): "love of comfort, beauty and the arts, charm and popularity; attachment to pleasure",
    ('Moon', 'Saturn'): "Vish yoga: seriousness and emotional restraint; delays that mature into endurance; duty toward the mother",
    ('Moon', 'Rahu'): "eclipse pattern on the Moon: strong imagination and desire, over-thinking and anxiety; foreign or unusual surroundings",
    ('Moon', 'Ketu'): "eclipse pattern on the Moon: intuition and inwardness, emotional detachment, periods of withdrawal",
    ('Mars', 'Mercury'): "a sharp, argumentative intellect with technical, analytical and commercial skill; hasty speech",
    ('Mars', 'Jupiter'): "Guru-Mangala yoga: principled action, leadership and success through initiative guided by good counsel",
    ('Mars', 'Venus'): "strong passion and attraction, artistic drive; impulsiveness in relationships",
    ('Mars', 'Saturn'): "drive against restraint: stop-start effort, technical stamina, frustration that needs a disciplined outlet",
    ('Mars', 'Rahu'): "Angaraka pattern: bold, risk-taking energy; anger, conflict and accidents need watching",
    ('Mars', 'Ketu'): "sudden, piercing energy: precision in technical work and courage; abrupt actions and injuries need care",
    ('Mercury', 'Jupiter'): "learning joined to wisdom: teaching, writing, counsel and sound judgement",
    ('Mercury', 'Venus'): "Lakshmi-Narayana pattern: grace in speech, artistic and commercial talent, prosperity through skill",
    ('Mercury', 'Saturn'): "methodical, deep and cautious thinking; skill in research, accounts and structure; gains from study come late but last",
    ('Mercury', 'Rahu'): "clever, unconventional thinking and skill with technology and persuasion; exaggeration and nervousness need checking",
    ('Mercury', 'Ketu'): "intuitive, incisive but scattered thinking; aptitude for codes, languages, mathematics or spiritual study",
    ('Jupiter', 'Venus'): "the two teachers joined: learning, wealth and comforts; a pull between ideals and pleasure",
    ('Jupiter', 'Saturn'): "dharma joined to karma (in Nadi reading, the self meets its work): a steady rise through responsibility and respected professional standing",
    ('Jupiter', 'Rahu'): "Guru-Chandala pattern: unorthodox beliefs and teachers, large ambitions; judgement must be guarded against shortcuts",
    ('Jupiter', 'Ketu'): "a strong spiritual inclination, guidance from a lineage or guru, insight; detachment from conventional goals",
    ('Venus', 'Saturn'): "loyal, durable but delayed relationships; taste for craft, design and structure; marriage matures with age",
    ('Venus', 'Rahu'): "strong desire for luxury and unconventional relationships; glamour, foreign or inter-cultural ties",
    ('Venus', 'Ketu'): "detachment within relationships, refined or spiritual aesthetics; contentment comes when love is unselfish",
    ('Saturn', 'Rahu'): "Shrapit pattern: a heavy karmic workload, delays and persistent obstacles that yield to patient, honest effort",
    ('Saturn', 'Ketu'): "renunciate discipline: detachment from worldly reward, technical or occult depth, breaks in career direction",
}.items()}


def rule_conjunctions(c: Chart) -> List[Dict[str, Any]]:
    """Every pair of planets sharing a sign: orb, house, lordships joined and the classical result."""
    pairs = []
    planets = [p for p in E.PLANETS if p in c.lon]
    for i, a in enumerate(planets):
        for b in planets[i + 1:]:
            if c.sign(a) != c.sign(b) or frozenset((a, b)) not in CONJUNCTION_RESULTS:
                continue
            pairs.append((abs(c.lon[a] - c.lon[b]), a, b))
    pairs.sort()
    out = []
    for orb, a, b in pairs[:5]:
        grade = 'tight, acts strongly' if orb <= 5 else 'close' if orb <= 10 else 'wide, acts mildly'
        sign, house = SIGNS[c.sign(a)], c.house(a)
        owned = []
        for p in (a, b):
            hs = c.owned_houses(p)
            if hs:
                owned.append(f"{p} rules the {'/'.join(_ordinal(h) for h in hs)}")
        notes = []
        if 'Sun' in (a, b):
            other = b if a == 'Sun' else a
            if other in COMBUST_ORB and orb <= COMBUST_ORB[other]:
                notes.append(f"{other} is combust")
        if orb <= 1 and {a, b} <= {'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'}:
            notes.append('planetary war (within 1°)')
        out.append(_f('F-CONJ-01', 'tradition-attributed',
                      'Conjunction read as one combined statement (Bhrigu Nandi Nadi; yoga names per classical usage)',
                      f"{a} + {b} conjunct in {sign}, {_ordinal(house)} house, {orb:.0f}° apart ({grade}): "
                      f"{CONJUNCTION_RESULTS[frozenset((a, b))]}. It acts through the {_ordinal(house)} house"
                      + (f" and joins the houses its planets rule ({'; '.join(owned)})" if owned else '')
                      + (f". Note: {', '.join(notes)}" if notes else ''),
                      [ALL], 0.75 if orb <= 5 else 0.65 if orb <= 10 else 0.55, house_based=True))
    by_sign: Dict[int, List[str]] = {}
    for p in planets:
        by_sign.setdefault(c.sign(p), []).append(p)
    for sg, group in by_sign.items():
        if len(group) >= 3:
            h = (sg - E.sign_index(c.asc)) % 12 + 1
            out.append(_f('F-CONJ-02', 'classical', 'Three or more planets in one sign',
                          f"{len(group)} planets together in {SIGNS[sg]}, {_ordinal(h)} house ({', '.join(group)}): "
                          f"the {_ordinal(h)} house is the busiest area of the chart and its matters dominate the life story",
                          [ALL], 0.7, house_based=True))
    return out


# Traditional Navagraha upayas (popular North-Indian practice; mantra = short nama mantra).
UPAYA = {
    'Sun': ('Sunday', 'Om Suryaya Namaha', 'wheat, jaggery or copper', 'Surya (Aditya Hridayam)', 'ruby'),
    'Moon': ('Monday', 'Om Chandraya Namaha', 'rice, milk or white cloth', 'Shiva / Parvati', 'pearl'),
    'Mars': ('Tuesday', 'Om Mangalaya Namaha', 'red lentils (masoor) or jaggery', 'Hanuman / Kartikeya', 'red coral'),
    'Mercury': ('Wednesday', 'Om Budhaya Namaha', 'green moong or green cloth', 'Vishnu', 'emerald'),
    'Jupiter': ('Thursday', 'Om Gurave Namaha', 'chana dal, turmeric or yellow cloth', 'Vishnu / Brihaspati', 'yellow sapphire'),
    'Venus': ('Friday', 'Om Shukraya Namaha', 'white rice, sugar or white cloth', 'Lakshmi', 'diamond or white sapphire'),
    'Saturn': ('Saturday', 'Om Shanaischaraya Namaha', 'black sesame, mustard oil or iron', 'Shani / Hanuman', 'blue sapphire'),
    'Rahu': ('Saturday', 'Om Rahave Namaha', 'black gram (urad) or a coconut', 'Durga', 'hessonite (gomed)'),
    'Ketu': ('Tuesday', 'Om Ketave Namaha', 'sesame or a blanket', 'Ganesha', "cat's eye"),
}
COMBUST_ORB = {'Moon': 12, 'Mars': 17, 'Mercury': 14, 'Jupiter': 11, 'Venus': 10, 'Saturn': 15}


def rule_remedies(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    """Which grahas need support, with the traditional upaya for each; gemstones by lordship."""
    cats = ['karmic_remedies', 'karma_reset', 'relationships', 'present_life']
    needs: List[Tuple[int, str, List[str]]] = []
    dasha_lords: List[str] = []
    try:
        periods = E.vimshottari(c.birth_utc, c.lon['Moon']) if c.birth_utc else []
        maha, antar = E.current_dasha(periods, now)
        dasha_lords = [x for x in (maha.maha if maha else None, antar.antar if antar else None) if x]
    except Exception:
        dasha_lords = []
    sade_sati = False
    if E.SWISSEPH_AVAILABLE:
        sat = E.sign_index(E.planet_positions(now)['Saturn']['longitude'])
        sade_sati = (sat - c.sign('Moon')) % 12 in (11, 0, 1)
    for p in E.PLANETS:
        if p not in c.lon:
            continue
        why: List[str] = []
        score = 0
        if p in DEBIL and DEBIL[p] == c.sign(p):
            why.append(f"debilitated in {SIGNS[c.sign(p)]}"); score += 3
        if p in COMBUST_ORB and 'Sun' in c.lon:
            sep = abs((c.lon[p] - c.lon['Sun'] + 180) % 360 - 180)
            if sep <= COMBUST_ORB[p]:
                why.append(f"combust ({sep:.0f}° from the Sun)"); score += 2
        h = c.house(p)
        owned = c.owned_houses(p)
        if h in (6, 8, 12) and not (set(owned) & {6, 8, 12}):
            why.append(f"placed in the {_ordinal(h)} house"); score += 2
        if p in GRAHAS7:
            nodes = [n for n in ('Rahu', 'Ketu') if n in c.lon and c.sign(n) == c.sign(p)]
            if nodes:
                why.append(f"conjunct {' and '.join(nodes)}"); score += 2
        if p == 'Saturn' and sade_sati:
            why.append('Sade Sati is running'); score += 2
        if why and p in dasha_lords:
            why.append('and it rules the running dasha'); score += 2
        if why:
            needs.append((score, p, why))
    needs.sort(key=lambda x: -x[0])
    out = []
    yantra = {'Sun': 'Surya', 'Moon': 'Chandra', 'Mars': 'Mangal', 'Mercury': 'Budh', 'Jupiter': 'Guru',
              'Venus': 'Shukra', 'Saturn': 'Shani', 'Rahu': 'Rahu', 'Ketu': 'Ketu'}
    for score, p, why in needs[:4]:
        day, mantra, charity, deity, _gem = UPAYA[p]
        out.append(_f('F-REMEDY-01', 'tradition-attributed', 'Graha shanti for an afflicted planet (traditional upaya)',
                      f"{c.desc(p)} needs support: {', '.join(why)}. Upaya: {mantra}, 108 times on {day}s; "
                      f"give {charity} on {day}s; worship {deity}; yantra: {yantra[p]} yantra; fast or eat once on {day}s if health allows",
                      cats, min(0.9, 0.55 + 0.05 * score)))
    if not out:
        out.append(_f('F-REMEDY-01', 'tradition-attributed', 'Graha shanti (traditional upaya)',
                      'No planet is debilitated, combust, eclipsed by a node or lost in a dusthana: no corrective '
                      'upaya is indicated; keep the lagna lord strong with its mantra', cats, 0.5))
    # Gemstones: only for lords of the lagna and trines; never for pure 6th/8th/12th lords.
    good, avoid = [], []
    for p in GRAHAS7:
        if p not in c.lon:
            continue
        owned = set(c.owned_houses(p))
        if owned & {1, 5, 9}:
            roles = '/'.join(_ordinal(x) for x in sorted(owned))
            caution = ' (debilitated: strengthen by mantra first)' if DEBIL[p] == c.sign(p) else ''
            good.append(f"{UPAYA[p][4]} for {p}, lord of the {roles}{caution}")
        elif owned & {6, 8, 12}:
            avoid.append(f"{UPAYA[p][4]} ({p}, lord of the {'/'.join(_ordinal(x) for x in sorted(owned))})")
    if good:
        out.append(_f('F-REMEDY-02', 'tradition-attributed', 'Gemstones by lordship (lagna and trine lords only)',
                      'Gemstones that suit this lagna: ' + '; '.join(good)
                      + ('. Not advised: ' + '; '.join(avoid) if avoid else '')
                      + '. A stone is worn only after a competent astrologer confirms it against the full chart',
                      cats, 0.6, house_based=True))
    return out



def apply_time_accuracy(c: Chart, findings: List[Dict[str, Any]]) -> None:
    factor, note = ACCURACY_NOTES.get(c.time_accuracy, (1.0, ''))
    if factor == 1.0:
        return
    for f in findings:
        if f.get('house_based') and f['id'] != 'F-LAGNA-01':
            f['weight'] = round(f['weight'] * factor, 2)
            if note and note not in f['finding']:
                f['finding'] += note


# ---------------------------------------------------------------------------

def evaluate_rules(chart_facts: Dict[str, Any], birth_data: Dict[str, Any], category: str = '',
                   now: Optional[datetime] = None, limit: int = 18, full: bool = False) -> List[Dict[str, Any]]:
    """Run every rule, keep those relevant to ``category``, ranked by weight.

    ``full=True`` evaluates every life theme and returns every finding (no
    per-rule cap), so each reading section can be given its own facts.
    """
    c = Chart(chart_facts, birth_data)
    if not c.ok():
        return []
    now = now or E.utcnow()
    domains = _Full(DOMAINS) if full else CATEGORY_DOMAINS.get(category, ['career', 'marriage'])
    cats = [category] if category else [ALL]
    rules = [
        lambda: rule_lagna(c), lambda: rule_nodes(c), lambda: rule_karakas(c), lambda: rule_dignity(c),
        lambda: rule_retro(c), lambda: rule_parivartana(c), lambda: rule_yogas(c),
        lambda: rule_bhavat(c, domains, cats), lambda: rule_bnn_links(c),
        lambda: rule_dasha(c, now, domains, cats), lambda: rule_transits(c, now),
        lambda: rule_bhrigu_bindu(c, now), lambda: rule_bcp(c, now), lambda: rule_bnn_progression(c, now),
        lambda: rule_sensitivity(c, birth_data),
        lambda: rule_navamsa(c), lambda: rule_more_yogas(c), lambda: rule_star_chain(c, domains, cats),
        lambda: rule_moksha(c), lambda: rule_lessons(c), lambda: rule_double_transit(c, now, domains, cats),
        lambda: rule_saturn_gochara(c, now), lambda: rule_nodal_return(c, now),
        lambda: rule_ashtakavarga(c, now, domains, cats),
        lambda: rule_remedies(c, now), lambda: rule_conjunctions(c),
    ]
    timing_categories = ('predictions', 'present_life', 'life_events')
    if not category or category in timing_categories:
        rules.append(lambda: rule_fast_transits(c, now, [category] if category else ['predictions']))
    findings: List[Dict[str, Any]] = []
    for rule in rules:
        try:
            findings.extend(rule())
        except Exception as e:  # one bad rule must not drop the rest
            logger.warning("Rule failed: %s", e)
    apply_time_accuracy(c, findings)
    relevant = [f for f in findings
                if full or ALL in f['categories'] or not category or category in f['categories']]
    relevant.sort(key=lambda f: -f['weight'])
    if full:
        try:
            relevant.extend(compose_windows(relevant, cats)[:4])
        except Exception as e:
            logger.warning("Window composer failed: %s", e)
        return sorted(relevant, key=lambda f: -f['weight'])
    # Diversity: at most two findings per rule so dated Bhrigu/Nadi techniques
    # are not crowded out by several dignity/yoga lines.
    picked: List[Dict[str, Any]] = []
    per_rule: Dict[str, int] = {}
    for f in relevant:
        if per_rule.get(f['id'], 0) >= 2:
            continue
        per_rule[f['id']] = per_rule.get(f['id'], 0) + 1
        picked.append(f)
        if len(picked) >= limit:
            break
    # Windows are composed only from findings the model will actually see,
    # so every window's member rules are citable.
    try:
        windows = compose_windows(picked, cats)[:2]
    except Exception as e:
        logger.warning("Window composer failed: %s", e)
        windows = []
    if windows:
        picked = sorted(picked + windows, key=lambda f: -f['weight'])[:limit + len(windows)]
    return picked
