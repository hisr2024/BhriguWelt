"""
Nadi Jyotisha principles that have an exact definition.

All are taken from C. S. Patel, "Predicting through Navamsa and Nadi
Astrology", which quotes the Chandra Kala Nadi (Deva Keralam) and allied
texts verse by verse. Verse numbers are given as that book cites them.

  F-NADI-01  Pushkara navamsa: the 24 nourishing ninths (Chandra Kala Nadi
             vv. 77, 79; table from Vidya Madhaviyam; Patel chs. 5, 7).
  F-NADI-02  Saturn's sign and navamsa exchanged in transit: born in sign A and
             navamsa B, Saturn passing sign B in navamsa A (v. 2191; Patel ch. 9).
  F-NADI-03  Saturn or Rahu in the birth star, the 10th or the 19th star
             (vv. 3021-23; Patel ch. 6).
  F-NADI-04  Jupiter in the birth star, the 10th or the 19th star (v. 3023).
  F-NADI-05  Sub-periods named for great happiness: of the navamsa lord of the
             Lagna lord, of a planet placed with the 7th lord, and of the
             navamsa lord of the 5th lord (Deva Keralam, Book 2, v. 245).
  F-NADI-06  The running sub-period lord against the Lagna lord: friend, enemy,
             neutral, temporary friend (vv. 4853-54); and a main-period lord in
             the 8th house (Book 3, v. 3611).
  F-NADI-07  The lords of the stars holding Saturn and Mars: their periods ask
             for care (v. 3043).
  F-NADI-08  Wealth-giving planets: those that aspect, occupy or own the 2nd
             house, and their periods (Daivagnabharanam ch. 10, v. 74).
  F-NADI-09  A planet's transit counted from its own birth sign: Jupiter in the
             5th, Saturn in the 9th, retrograde Mars in the 4th
             (Jyotish Tattvam ch. 10, vv. 25-26).
  F-NADI-10  Saturn in the birth Moon's sign during a Mars or Rahu sub-period
             (v. 3806).

Left out on purpose: rules about length of life (64th navamsa, 22nd drekkana),
Saturn's results in the 2nd to 5th stars (vv. 3018-19: defeat, fear of death),
and the bereavement clause of v. 77.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from services import ephemeris_core as E
from services.ashtakoot import ENEMIES, FRIENDS
from services.bhrigu_nadi_rules import ALL, SIGN_LORDS, SIGNS, Chart, _f, _ordinal, _span, _windows, navamsa_sign

logger = logging.getLogger(__name__)

GRAHAS = ('Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn')
NAV = 10.0 / 3.0  # one navamsa, which is also one quarter of a star
# Pushkara navamsas (0-based number within the sign) by element: fire, earth, air, water.
PUSHKARA = {0: (6, 8), 1: (2, 4), 2: (5, 7), 3: (0, 2)}
TIMED = ['life_events', 'predictions', 'present_life']
SOURCE = 'as cited by C. S. Patel'
Window = Tuple[datetime, datetime, str]


def is_pushkara(lon: float) -> bool:
    """True when the longitude falls in one of the two Pushkara navamsas of its sign."""
    return min(int((lon % 30.0) // NAV), 8) in PUSHKARA[E.sign_index(lon) % 4]


def exchange_segment(natal_sign: int, natal_navamsa: int) -> Optional[Tuple[float, float]]:
    """The stretch of the zodiac that lies in the sign of the birth navamsa and in
    the navamsa of the birth sign; None when that sign has no such navamsa."""
    k = (natal_sign - natal_navamsa * 9) % 12
    if k > 8:
        return None
    start = natal_navamsa * 30.0 + k * NAV
    return start, start + NAV


def temporary_friend(c: Chart, a: str, b: str) -> bool:
    """b is a temporary friend of a when it sits in the 2nd, 3rd, 4th, 10th, 11th or 12th from a (BPHS)."""
    return (c.sign(b) - c.sign(a)) % 12 + 1 in (2, 3, 4, 10, 11, 12)


def _periods(c: Chart) -> List[E.DashaPeriod]:
    cached = getattr(c, '_vim_periods', None)
    if cached is None:
        cached = E.vimshottari(c.birth_utc, c.lon['Moon']) if c.birth_utc else []
        c._vim_periods = cached
    return cached


def antar_windows(c: Chart, planet: str, now: datetime, years: int = 15, n: int = 2) -> List[Window]:
    """The next Vimshottari sub-periods of ``planet``: (start, end, 'Main–Sub')."""
    out: List[Window] = []
    for p in _periods(c):
        if p.antar == planet and p.end > now and p.start < now + timedelta(days=years * 365):
            out.append((max(p.start, now), p.end, p.label()))
            if len(out) >= n:
                break
    return out


def _merge(wins: List[Tuple[datetime, datetime]], before: datetime, gap_days: int = 40) -> List[Tuple[datetime, datetime]]:
    """Join passes separated by a short break. Scans run past ``before`` so that the last
    window is whole; a pass that starts after it is kept only as part of the same visit."""
    out: List[Tuple[datetime, datetime]] = []
    for a, b in wins:
        if out and (a - out[-1][1]).days <= gap_days:
            out[-1] = (out[-1][0], b)
        elif a <= before or (out and (a - out[-1][1]).days <= 400):
            out.append((a, b))
    return out


def _dm(deg: float) -> str:
    whole, minutes = divmod(round(deg * 60), 60)
    return f"{whole}°{minutes:02d}′" if minutes else f"{whole}°"


def _when(wins: List[Window]) -> str:
    return ', '.join(f"{label} {_span(a, b)}" for a, b, label in wins)


def _named_periods(c: Chart, named: Dict[str, List[str]], now: datetime, years: int, n: int
                   ) -> Tuple[List[str], Optional[Window]]:
    """Text for each named planet with its next sub-periods, and the earliest of them."""
    parts: List[str] = []
    first: Optional[Window] = None
    for planet, why in named.items():
        wins = antar_windows(c, planet, now, years=years, n=n)
        if not wins:
            continue
        parts.append(f"{planet} ({', '.join(why)}): {_when(wins)}")
        if first is None or wins[0][0] < first[0]:
            first = wins[0]
    return parts, first


def rule_pushkara(c: Chart) -> List[Dict[str, Any]]:
    inside = [p for p in GRAHAS if p in c.lon and is_pushkara(c.lon[p])]
    timed = c.time_accuracy != 'unknown'
    lagna = bool(c.asc_exact and timed and is_pushkara(c.asc))
    if not inside and not lagna:
        return []
    one = len(inside) == 1
    bits: List[str] = []
    if inside:
        bits.append(f"{', '.join(inside)} {'sits' if one else 'sit'} in a Pushkara navamsa, a nourishing ninth owned by a benefic: "
                    f"{'it gives its' if one else 'they give their'} good results more readily")
        same = [p for p in inside if navamsa_sign(c.lon[p]) == c.sign(p)]
        if same:
            bits.append(f"{', '.join(same)} {'is' if len(same) == 1 else 'are'} also vargottama there, a placement singled out for very good results")
    if len(inside) == len(GRAHAS):
        bits.append('all seven planets are in Pushkara navamsas, which the Nadi names for wealth, comfort and fame')
    jupiter = 'Jupiter' in inside and timed and c.house('Jupiter') in (1, 4, 5, 7, 9, 10)
    if jupiter:
        nav_house = (navamsa_sign(c.lon['Jupiter']) - E.sign_index(c.asc)) % 12 + 1
        bits.append('Jupiter is there in a kendra or trine, which the Nadi names for good fortune and wealth'
                    + (f"; it adds that health needs care, because that navamsa sign is the {_ordinal(nav_house)} house"
                       if nav_house in (6, 8, 12) else ''))
    if lagna:
        bits.append('the rising degree is in a Pushkara navamsa, which C. S. Patel observed in people who stand out in their careers')
    weight = 0.62 if (jupiter or lagna or len(inside) >= 3) else 0.5
    return [_f('F-NADI-01', 'tradition-attributed', f"Pushkara navamsa (Chandra Kala Nadi vv. 77, 79, {SOURCE})",
               'Pushkara navamsa: ' + '; '.join(bits), [ALL], weight)]


def rule_exchange_transit(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not E.SWISSEPH_AVAILABLE or 'Saturn' not in c.lon:
        return []
    a, b = c.sign('Saturn'), navamsa_sign(c.lon['Saturn'])
    seg = exchange_segment(a, b) if a != b else None  # vargottama: nothing is exchanged
    if not seg:
        return []
    horizon = now + timedelta(days=30 * 365)
    wins = _merge(E.conjunction_windows('Saturn', (seg[0] + seg[1]) / 2.0, now, horizon + timedelta(days=500), orb=NAV / 2.0), horizon)
    if not wins:
        return []
    wins = [w for w in wins if (w[0] - wins[0][0]).days < 500]  # the passes of one visit
    s, e = wins[0][0], wins[-1][1]
    near = (s - now).days < 5 * 365
    return [_f('F-NADI-02', 'tradition-attributed', f"Saturn's sign and navamsa exchanged in transit (Chandra Kala Nadi v. 2191, {SOURCE})",
               f"Saturn was born in {SIGNS[a]} with its navamsa in {SIGNS[b]}. It passes through the exchanged place, {SIGNS[b]} in the "
               f"navamsa of {SIGNS[a]} ({_dm(seg[0] % 30)}–{_dm(seg[0] % 30 + NAV)}), in "
               + ', '.join(_span(x, y) for x, y in wins)
               + ': the Nadi names this for a rise in fortune, for the person and for a brother or sister. It comes about once in '
               '30 years; Patel notes it can instead mark a hard turning point',
               TIMED, 0.5 if near else 0.36, timing=_span(s, e), start=s, end=e)]


def _star(lon: float) -> int:
    return min(int(lon / E.NAK_SPAN), 26)


def rule_birth_star_transits(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not E.SWISSEPH_AVAILABLE:
        return []
    birth = _star(c.lon['Moon'])
    quarter = min(int((c.lon['Moon'] % E.NAK_SPAN) / NAV), 3)
    stars = {birth: 'the birth star', (birth + 9) % 27: 'the 10th star from the birth star',
             (birth + 18) % 27: 'the 19th star from the birth star'}
    out = []
    for planet, rule_id, years, result, weight in (
            ('Saturn', 'F-NADI-03', 11, 'quarrels at home and with relatives, and worry over dependants. '
                                        'Keep the peace and start no new disputes', 0.55),
            ('Rahu', 'F-NADI-03', 7, 'strain of mind. Rest more and check facts before acting', 0.42),
            ('Jupiter', 'F-NADI-04', 5, 'auspicious events come often, with help from elders', 0.5)):
        def at(day: datetime, p: str = planet) -> int:
            return _star(E.planet_positions(day)[p]['longitude'])
        horizon = now + timedelta(days=years * 365)
        wins = [w for w in _merge(_windows(lambda d: at(d) in stars, now, horizon + timedelta(days=700), step_days=4), horizon)
                if (w[1] - w[0]).days >= 12]
        if not wins:
            continue
        idx = at(wins[0][0])  # a window always starts inside one of the three stars; its middle may not (retrograde)
        same = [w for w in wins if at(w[0]) == idx and (w[0] - wins[0][0]).days < 700][:3]
        s, e = same[0][0], same[-1][1]
        sharp = _merge(E.conjunction_windows(planet, idx * E.NAK_SPAN + quarter * NAV + NAV / 2.0,
                                             s - timedelta(days=8), e + timedelta(days=8), orb=NAV / 2.0), e)
        text = (f"{planet} passes through {E.NAKSHATRAS[idx]}, {stars[idx]}, in "
                + ', '.join(_span(x, y) for x, y in same) + f": {result}")
        if sharp:
            text += ". Strongest while it crosses the Moon's own quarter of the star, " + ', '.join(_span(x, y) for x, y in sharp[:3])
        out.append(_f(rule_id, 'tradition-attributed',
                      f"{planet} in the birth star, the 10th or the 19th star (Chandra Kala Nadi vv. 3021-23, {SOURCE})",
                      text, TIMED, weight, timing=_span(s, e), start=s, end=e))
    return out


def happy_period_lords(c: Chart) -> Dict[str, List[str]]:
    """The planets whose sub-periods Deva Keralam (Book 2, v. 245) names for great happiness."""
    l1, l5, l7 = c.lord_of_house(1), c.lord_of_house(5), c.lord_of_house(7)
    named: Dict[str, List[str]] = {}
    named.setdefault(SIGN_LORDS[navamsa_sign(c.lon[l1])], []).append(f"navamsa lord of the Lagna lord {l1}")
    for p in c.occupants(c.sign(l7), exclude=[l7]):
        named.setdefault(p, []).append(f"placed with the 7th lord {l7}")
    named.setdefault(SIGN_LORDS[navamsa_sign(c.lon[l5])], []).append(f"navamsa lord of the 5th lord {l5}")
    return named


def rule_happy_periods(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if c.time_accuracy == 'unknown' or not c.birth_utc:
        return []
    parts, first = _named_periods(c, happy_period_lords(c), now, years=15, n=2)
    if not first:
        return []
    return [_f('F-NADI-05', 'tradition-attributed', f"Sub-periods named for great happiness (Deva Keralam, Book 2, v. 245, {SOURCE})",
               'The Nadi names these sub-periods for great happiness: ' + '; '.join(parts), TIMED, 0.55,
               timing=f"{first[2]}, {_span(first[0], first[1])}", start=first[0], end=first[1], house_based=True)]


def rule_period_and_lagna_lord(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if c.time_accuracy == 'unknown' or not c.birth_utc:
        return []
    maha, antar = E.current_dasha(_periods(c), now)
    if not maha or not antar or antar.antar not in c.lon:
        return []
    l1, a, m = c.lord_of_house(1), antar.antar, maha.maha
    bits: List[str] = []
    if a == l1:
        bits.append(f"{a}, lord of the running sub-period, is the Lagna lord itself: this stretch turns on the person's own effort and health")
    else:
        if a in FRIENDS.get(l1, ()):
            verdict = 'a friend of the Lagna lord: this sub-period brings gain'
        elif a in ENEMIES.get(l1, ()):
            verdict = 'an adversary of the Lagna lord: undertakings meet resistance and worry'
        elif a in GRAHAS:
            verdict = 'neutral to the Lagna lord: results are middling'
        else:
            verdict = ''
        if temporary_friend(c, l1, a):
            verdict = (verdict + '; it is also ' if verdict else '') + ('a temporary friend by its place in this chart, '
                                                                      'which the Nadi calls very favourable')
        if verdict:
            bits.append(f"{a}, lord of the running sub-period, is {verdict} (Lagna lord {l1})")
    if m in c.lon and c.house(m) == 8 and a != m:
        benefic = a in ('Jupiter', 'Venus', 'Mercury', 'Moon')
        bits.append(f"the main-period lord {m} sits in the 8th house, where the Nadi turns the usual reading round: the sub-period of "
                    + (f"a benefic such as {a} brings worry of mind" if benefic else f"a malefic such as {a} brings relief and gain"))
    if not bits:
        return []
    text = '; '.join(bits)
    return [_f('F-NADI-06', 'tradition-attributed',
               f"The sub-period lord against the Lagna lord (Deva Keralam vv. 4853-54 and 3611, {SOURCE})",
               text[0].upper() + text[1:], ['present_life', 'predictions', 'life_events'], 0.52,
               timing=f"{m}–{a}, {_span(antar.start, antar.end)}", start=antar.start, end=antar.end, house_based=True)]


def rule_star_lords_of_malefics(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not c.birth_utc:
        return []
    named: Dict[str, List[str]] = {}
    for p in ('Saturn', 'Mars'):
        if p in c.lon:
            nak, _pada, lord = E.nakshatra_of(c.lon[p])
            named.setdefault(lord, []).append(f"lord of {nak}, the star holding {p}")
    parts, first = _named_periods(c, named, now, years=10, n=1)
    if not first:
        return []
    f = _f('F-NADI-07', 'tradition-attributed', f"Lords of the stars holding Saturn and Mars (Chandra Kala Nadi v. 3043, {SOURCE})",
           'Sub-periods that ask for care with debts, theft, worry and health: ' + '; '.join(parts),
           TIMED + ['karmic_remedies'], 0.42, timing=f"{first[2]}, {_span(first[0], first[1])}", start=first[0], end=first[1])
    f['domain'] = 'health'
    return [f]


def wealth_givers(c: Chart) -> Dict[str, List[str]]:
    """Planets tied to the 2nd house, in the order Patel ranks them: aspect, occupation, lordship."""
    second = c.house_sign(2)
    roles: Dict[str, List[str]] = {}
    for p in c.aspecting(second):
        roles.setdefault(p, []).append('aspects the 2nd house')
    for p in c.occupants(second):
        roles.setdefault(p, []).append('sits in the 2nd house')
    roles.setdefault(c.lord_of_house(2), []).append('owns the 2nd house')
    return roles


def rule_wealth_givers(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if c.time_accuracy == 'unknown':
        return []
    parts, first = [], None
    for planet, why in wealth_givers(c).items():
        wins = antar_windows(c, planet, now, years=12, n=1)
        parts.append(f"{planet} ({', '.join(why)})" + (f": {_when(wins)}" if wins else ''))
        if wins and (first is None or wins[0][0] < first[0]):
            first = wins[0]
    f = _f('F-NADI-08', 'tradition-attributed', f"Wealth-giving planets and their periods (Daivagnabharanam ch. 10, v. 74, {SOURCE})",
           'Wealth-giving planets: ' + '; '.join(parts) + '. Money comes most readily in their periods, and a large gain needs two of '
           'them to meet in transit at that time', TIMED, 0.5,
           timing=f"{first[2]}, {_span(first[0], first[1])}" if first else '', start=first[0] if first else None,
           end=first[1] if first else None, house_based=True)
    f['domain'] = 'wealth'
    return [f]


def rule_own_sign_transits(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not E.SWISSEPH_AVAILABLE:
        return []
    out = []
    for planet, off, years, result, domain in (
            ('Jupiter', 4, 12, 'a time the text names for children and the birth of a child', 'children'),
            ('Saturn', 8, 12, 'a time the text names for a rise in luck', ''),
            ('Mars', 3, 17, 'a time the text names for gaining land or property', 'home')):
        if planet not in c.lon:
            continue
        target = (c.sign(planet) + off) % 12
        horizon = now + timedelta(days=years * 365)
        end = horizon + timedelta(days=3 * 365)  # scan on, so the last window is whole
        if planet == 'Mars':  # only while Mars is retrograde there
            def inside(day: datetime, t: int = target) -> bool:
                pos = E.planet_positions(day)['Mars']
                return pos['speed'] < 0 and E.sign_index(pos['longitude']) == t
            wins = [w for w in _merge(_windows(inside, now, end, step_days=5), horizon, gap_days=0) if (w[1] - w[0]).days >= 10]
            how = f"Mars turns retrograde in {SIGNS[target]}, the 4th from its own birth sign, in "
        else:
            wins = [w for w in _merge([(w[0], w[1]) for w in E.sign_windows(planet, {target}, now, end, step_days=4)],
                                      horizon, gap_days=0) if (w[1] - w[0]).days >= 20]
            how = f"{planet} passes through {SIGNS[target]}, the {_ordinal(off + 1)} from its own birth sign, in "
        if not wins:
            continue
        s, e = wins[0]
        f = _f('F-NADI-09', 'tradition-attributed',
               f"A planet's transit counted from its own birth sign (Jyotish Tattvam ch. 10, vv. 25-26, {SOURCE})",
               how + ', '.join(_span(x, y) for x, y in wins[:2]) + f": {result}", TIMED,
               0.48 if (s - now).days < 4 * 365 else 0.36, timing=_span(s, e), start=s, end=e)
        if domain:
            f['domain'] = domain
        out.append(f)
    return out


def rule_saturn_on_moon_sign(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not E.SWISSEPH_AVAILABLE or not c.birth_utc:
        return []
    moon_sign = c.sign('Moon')
    horizon = now + timedelta(days=15 * 365)
    spans = _merge([(w[0], w[1]) for w in E.sign_windows('Saturn', {moon_sign}, now, horizon + timedelta(days=3 * 365), step_days=6)],
                   horizon, gap_days=0)
    spans = [w for w in spans if (w[0] - spans[0][0]).days < 3 * 365]  # one visit
    if not spans:
        return []
    heavy: List[Window] = []
    for p in _periods(c):
        if p.antar not in ('Mars', 'Rahu'):
            continue
        for s, e in spans:
            a, b = max(p.start, s), min(p.end, e)
            if (b - a).days >= 14:
                heavy.append((a, b, p.label()))
    if not heavy:
        return []
    heavy.sort(key=lambda w: w[0])
    s, e = heavy[0][0], heavy[0][1]
    return [_f('F-NADI-10', 'tradition-attributed',
               f"Saturn in the birth Moon's sign during a Mars or Rahu sub-period (Chandra Kala Nadi v. 3806, {SOURCE})",
               f"Saturn passes through {SIGNS[moon_sign]}, the birth Moon's sign, in {_span(spans[0][0], spans[-1][1])}. The Nadi names "
               f"the Mars sub-period inside it as a heavy stretch, and the Rahu sub-period more so: {_when(heavy[:3])}. "
               'Take on less then and keep routines steady',
               TIMED + ['karmic_remedies'], 0.5, timing=f"{heavy[0][2]}, {_span(s, e)}", start=s, end=e)]


def nadi_rules(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for rule in (lambda: rule_pushkara(c), lambda: rule_exchange_transit(c, now), lambda: rule_birth_star_transits(c, now),
                 lambda: rule_happy_periods(c, now), lambda: rule_period_and_lagna_lord(c, now),
                 lambda: rule_star_lords_of_malefics(c, now), lambda: rule_wealth_givers(c, now),
                 lambda: rule_own_sign_transits(c, now), lambda: rule_saturn_on_moon_sign(c, now)):
        try:
            out.extend(rule())
        except Exception as e:  # one bad rule must not drop the rest
            logger.warning("Rule failed: %s", e)
    return out
