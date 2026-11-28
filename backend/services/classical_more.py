"""
Deeper classical principles, each with an exact definition in the texts.

  F-STATE-01    The state of each planet: age by degree (Baladi avastha),
                alertness by sign (Jagradadi avastha) and directional strength
                (Dig bala) — BPHS ch. 45 and ch. 27.
  F-ARUDHA-01   Arudha Lagna: the image the world holds of the person (BPHS ch. 29).
  F-ARUDHA-02   Upapada: the marriage point, and the 2nd from it (BPHS ch. 30).
  F-D10-01      Dashamsha, the tenth division, for career (BPHS ch. 6-7).
  F-D7-01       Saptamsha, the seventh division, for children (BPHS ch. 6-7).
  F-YOGA-06..12 Mahabhagya, Adhi, Amala, Vesi / Vasi / Ubhayachari, Shakata,
                Saraswati, and the Nabhasa yogas Rajju / Musala / Nala and
                Mala / Sarpa (BPHS ch. 35-36, Phaladeepika ch. 6).
  F-YOGA-13     Kala Sarpa (popular modern usage; not found in BPHS).
  F-YOGINI-01   Yogini dasha, a second, independent 36-year timing cycle.
  F-DASHA-04    How the sub-period lord is placed from the main-period lord (BPHS).
  F-MURTI-01    Murti nirnaya: the grade of a Saturn or Jupiter transit, from the
                Moon's place at the moment the planet entered the sign.
  F-INDU-01     Indu Lagna, the wealth point (Uttara Kalamrita).

Every rule is a pure function of the chart and is emitted only when its
condition is actually met.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from services import ephemeris_core as E
from services.ashtakoot import ENEMIES, FRIENDS
from services.bhrigu_nadi_rules import ALL, DEBIL, EXALT, SIGN_LORDS, SIGNS, Chart, _f, _ordinal, _span

logger = logging.getLogger(__name__)

GRAHAS = ('Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn')
BENEFICS = ('Mercury', 'Jupiter', 'Venus')
KENDRAS = (1, 4, 7, 10)


def dignity(planet: str, sign: int) -> str:
    """exalted / debilitated / own sign / friend's sign / enemy's sign / neutral sign."""
    if EXALT.get(planet) == sign:
        return 'exalted'
    if DEBIL.get(planet) == sign:
        return 'debilitated'
    lord = SIGN_LORDS[sign]
    if lord == planet:
        return 'own sign'
    if lord in FRIENDS.get(planet, ()):
        return "friend's sign"
    if lord in ENEMIES.get(planet, ()):
        return "enemy's sign"
    return 'neutral sign'


PLACED = {'exalted': 'exalted', 'debilitated': 'debilitated', 'own sign': 'in its own sign',
          "friend's sign": "in a friend's sign", "enemy's sign": "in an enemy's sign", 'neutral sign': 'in a neutral sign'}


def placed(planet: str, sign: int) -> str:
    return PLACED[dignity(planet, sign)]


# --- State of the planets ----------------------------------------------------

BALADI = [('infant', 'a quarter of its results'), ('youth', 'half of its results'), ('adult', 'its full results'),
          ('old', 'little of its results'), ('spent', 'almost none of its results')]
DIG_FULL = {'Sun': 10, 'Mars': 10, 'Moon': 4, 'Venus': 4, 'Mercury': 1, 'Jupiter': 1, 'Saturn': 7}


def baladi(lon: float) -> Tuple[str, str]:
    """Age state by degree: five parts of 6°, in order in odd signs and reversed in even signs."""
    part = min(int((lon % 30.0) // 6), 4)
    if E.sign_index(lon) % 2 == 1:  # even sign (Taurus, Cancer, ...)
        part = 4 - part
    return BALADI[part]


def jagradadi(planet: str, sign: int) -> str:
    d = dignity(planet, sign)
    if d in ('exalted', 'own sign'):
        return 'awake'
    if d in ('debilitated', "enemy's sign"):
        return 'asleep'
    return 'dreaming'


def rule_planet_state(c: Chart) -> List[Dict[str, Any]]:
    parts, strong, weak = [], [], []
    for p in GRAHAS:
        if p not in c.lon:
            continue
        age, gives = baladi(c.lon[p])
        alert = jagradadi(p, c.sign(p))
        bits = [f"{age} ({gives})", alert]
        if c.time_accuracy != 'unknown':
            h = c.house(p)
            if h == DIG_FULL[p]:
                bits.append('has directional strength')
            elif h == (DIG_FULL[p] + 5) % 12 + 1:
                bits.append('has no directional strength')
        parts.append(f"{p} {', '.join(bits)}")
        if age == 'adult' and alert == 'awake':
            strong.append(p)
        if age in ('old', 'spent') and alert == 'asleep':
            weak.append(p)
    text = 'State of each planet: ' + '; '.join(parts)
    if strong:
        text += f". Fully able to deliver: {', '.join(strong)}"
    if weak:
        text += f". Least able to deliver: {', '.join(weak)}"
    return [_f('F-STATE-01', 'classical', 'State of the planets: age by degree, alertness by sign, directional strength (BPHS ch. 45, 27)',
               text, [ALL], 0.58)]


# --- Arudha padas ------------------------------------------------------------

def arudha(c: Chart, house: int) -> int:
    """Sign index of the pada of a house (BPHS ch. 29): as far from the lord as
    the lord is from the house; if that falls in the house itself or its 7th,
    the 10th from it is taken."""
    hs = c.house_sign(house)
    ls = c.sign(c.lord_of_house(house))
    pada = (ls + (ls - hs)) % 12
    if pada in (hs, (hs + 6) % 12):
        pada = (pada + 9) % 12
    return pada


def rule_arudha(c: Chart) -> List[Dict[str, Any]]:
    if c.time_accuracy == 'unknown' or any(c.lord_of_house(h) not in c.lon for h in (1, 12)):
        return []
    out = []
    al = arudha(c, 1)
    gains = c.occupants((al + 10) % 12)
    drains = c.occupants((al + 11) % 12)
    text = (f"Arudha Lagna (the image the world holds of the person) falls in {SIGNS[al]}, the "
            f"{_ordinal((al - E.sign_index(c.asc)) % 12 + 1)} house"
            + (f", with {', '.join(c.occupants(al))}" if c.occupants(al) else '')
            + f". The 11th from it holds {', '.join(gains) if gains else 'no planet'} (sources of gain)"
            + f"; the 12th from it holds {', '.join(drains) if drains else 'no planet'} (where money and effort drain)")
    out.append(_f('F-ARUDHA-01', 'classical', 'Arudha Lagna and the 11th / 12th from it (BPHS ch. 29)',
                  text, ['present_life', 'karmic_journey', 'life_events', 'predictions'], 0.55, house_based=True))
    ul = arudha(c, 12)
    lord = SIGN_LORDS[ul]
    second = c.occupants((ul + 1) % 12)
    good = [p for p in second if p in BENEFICS]
    hard = [p for p in second if p in ('Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu')]
    verdict = ('benefics there keep a marriage steady' if good and not hard
               else 'malefics there strain a marriage and ask for effort' if hard and not good
               else 'mixed influences there: a marriage needs conscious care' if good and hard
               else 'no planet there: its lord decides')
    text = (f"Upapada (the marriage point) falls in {SIGNS[ul]}; its lord {lord} is "
            f"{placed(lord, c.sign(lord))}, in the {_ordinal(c.house(lord))} house. "
            f"The 2nd from it ({SIGNS[(ul + 1) % 12]}) holds {', '.join(second) if second else 'no planet'}: {verdict}")
    f = _f('F-ARUDHA-02', 'classical', 'Upapada and the 2nd from it (BPHS ch. 30)',
           text, ['relationships', 'present_life', 'life_events'], 0.58, house_based=True)
    f['domain'] = 'marriage'
    out.append(f)
    return out


# --- Divisional charts -------------------------------------------------------

def dashamsha_sign(lon: float) -> int:
    """D10: ten parts of 3°; from the sign itself in odd signs, from its 9th in even signs."""
    s, k = E.sign_index(lon), min(int((lon % 30.0) // 3.0), 9)
    return (s + k) % 12 if s % 2 == 0 else (s + 8 + k) % 12


def saptamsha_sign(lon: float) -> int:
    """D7: seven parts of 4°17′; from the sign itself in odd signs, from its 7th in even signs."""
    s, k = E.sign_index(lon), min(int((lon % 30.0) * 7.0 / 30.0), 6)
    return (s + k) % 12 if s % 2 == 0 else (s + 6 + k) % 12


def rule_divisions(c: Chart) -> List[Dict[str, Any]]:
    out = []
    known = c.time_accuracy != 'unknown'
    names = [p for p in dict.fromkeys(([c.lord_of_house(10)] if known else []) + ['Sun', 'Saturn']) if p in GRAHAS and p in c.lon]
    if names:
        bits = []
        for p in names:
            ds = dashamsha_sign(c.lon[p])
            role = 'the 10th lord ' if known and p == c.lord_of_house(10) else ''
            bits.append(f"{role}{p} falls in {SIGNS[ds]} ({dignity(p, ds)})")
        same = [p for p in GRAHAS if p in c.lon and dashamsha_sign(c.lon[p]) == c.sign(p)]
        text = ('Dashamsha (the tenth division, read for career): ' + '; '.join(bits)
                + (f". In the same sign in the birth chart and the tenth division, so steady for career: {', '.join(same)}" if same else ''))
        f = _f('F-D10-01', 'classical', 'Dashamsha, the tenth division, for career (BPHS ch. 6-7)',
               text, ['present_life', 'life_events', 'predictions', 'karmic_journey'], 0.55, house_based=known)
        f['domain'] = 'career'
        out.append(f)
    names = [p for p in dict.fromkeys(([c.lord_of_house(5)] if known else []) + ['Jupiter']) if p in GRAHAS and p in c.lon]
    if names:
        bits = []
        for p in names:
            ds = saptamsha_sign(c.lon[p])
            role = 'the 5th lord ' if known and p == c.lord_of_house(5) else ''
            bits.append(f"{role}{p} falls in {SIGNS[ds]} ({dignity(p, ds)})")
        f = _f('F-D7-01', 'classical', 'Saptamsha, the seventh division, for children (BPHS ch. 6-7)',
               'Saptamsha (the seventh division, read for children): ' + '; '.join(bits),
               ['life_events', 'relationships', 'present_life'], 0.5, house_based=known)
        f['domain'] = 'children'
        out.append(f)
    return out


# --- Yogas -------------------------------------------------------------------

def _from(c: Chart, a: str, b: str) -> int:
    """House of planet a counted from planet b (1..12)."""
    return (c.sign(a) - c.sign(b)) % 12 + 1


def rule_classical_yogas(c: Chart) -> List[Dict[str, Any]]:
    out = []
    have = lambda *ps: all(p in c.lon for p in ps)
    known = c.time_accuracy != 'unknown'

    # Mahabhagya (needs an exact birth time: day or night, and the Lagna)
    if c.gender and c.asc_exact and have('Sun', 'Moon'):
        day = (c.lon['Sun'] - c.asc) % 360.0 >= 180.0  # Sun above the horizon
        odd = [E.sign_index(x) % 2 == 0 for x in (c.lon['Sun'], c.lon['Moon'], c.asc)]
        male = c.gender in ('male', 'm')
        if (male and day and all(odd)) or (not male and not day and not any(odd)):
            out.append(_f('F-YOGA-06', 'classical', 'Mahabhagya yoga (Phaladeepika ch. 6)',
                          f"Mahabhagya yoga: a {'day' if day else 'night'} birth with the Sun, the Moon and the Lagna all in "
                          f"{'odd' if male else 'even'} signs. The texts name it for good fortune, generosity and a wide reputation",
                          [ALL], 0.68, house_based=True))

    if have('Moon'):
        in678 = [p for p in BENEFICS if p in c.lon and _from(c, p, 'Moon') in (6, 7, 8)]
        if len(in678) >= 2:
            out.append(_f('F-YOGA-07', 'classical', 'Adhi yoga: benefics in the 6th, 7th and 8th from the Moon (Phaladeepika ch. 6)',
                          f"Adhi yoga ({'full' if len(in678) == 3 else 'partial, two of three'}): {', '.join(in678)} in the 6th, 7th or 8th "
                          "from the Moon. It gives leadership, the support of capable people and victory over opposition",
                          ['present_life', 'karmic_journey', 'life_events', 'predictions'], 0.66 if len(in678) == 3 else 0.52))

    amala = [f"{p} in the 10th from the {ref}" for p in BENEFICS if p in c.lon for ref, ok in
             (('Lagna', known and c.house(p) == 10), ('Moon', have('Moon') and _from(c, p, 'Moon') == 10)) if ok]
    if amala:
        out.append(_f('F-YOGA-08', 'classical', 'Amala yoga: a benefic in the 10th from the Lagna or the Moon (Phaladeepika ch. 6)',
                      f"Amala yoga: {'; '.join(amala)}. It gives a clean reputation and respect earned through honest work",
                      ['present_life', 'karmic_journey', 'life_events', 'predictions'], 0.6, house_based=known))

    if have('Sun'):
        others = [p for p in ('Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn') if p in c.lon]
        ahead = [p for p in others if _from(c, p, 'Sun') == 2]
        behind = [p for p in others if _from(c, p, 'Sun') == 12]
        if ahead or behind:
            name = 'Ubhayachari' if ahead and behind else 'Vesi' if ahead else 'Vasi'
            where = ' and '.join(x for x in ((f"{', '.join(ahead)} in the 2nd" if ahead else ''),
                                             (f"{', '.join(behind)} in the 12th" if behind else '')) if x)
            good = all(p in BENEFICS for p in ahead + behind)
            result = {'Ubhayachari': 'planets flank the Sun on both sides: standing, eloquence and a balanced nature',
                      'Vesi': 'a planet goes ahead of the Sun: truthfulness, steady effort and earned standing',
                      'Vasi': 'a planet follows the Sun: skill, generosity and a good memory'}[name]
            out.append(_f('F-YOGA-09', 'classical', 'Vesi, Vasi and Ubhayachari yogas from the Sun (Phaladeepika ch. 6)',
                          f"{name} yoga: {where} from the Sun. {result[0].upper() + result[1:]}"
                          + ('' if good else '; a malefic among them makes the result come through effort'),
                          ['present_life', 'karmic_journey'], 0.5))

    if have('Moon', 'Jupiter') and _from(c, 'Moon', 'Jupiter') in (6, 8, 12):
        cancelled = known and c.house('Moon') in KENDRAS
        out.append(_f('F-YOGA-10', 'classical', 'Shakata yoga: the Moon in the 6th, 8th or 12th from Jupiter (Phaladeepika ch. 6)',
                      f"Shakata yoga: the Moon is {_ordinal(_from(c, 'Moon', 'Jupiter'))} from Jupiter, so fortune rises and falls like a wheel"
                      + ('; it is cancelled here because the Moon is in a kendra from the Lagna' if cancelled
                         else ': gains are followed by setbacks until steadiness is learned'),
                      ['present_life', 'karmic_journey', 'life_events', 'predictions'], 0.35 if cancelled else 0.56, house_based=known))

    if known and have('Jupiter', 'Venus', 'Mercury'):
        places = (1, 2, 4, 5, 7, 9, 10)
        if all(c.house(p) in places for p in BENEFICS) and dignity('Jupiter', c.sign('Jupiter')) in ('exalted', 'own sign', "friend's sign"):
            out.append(_f('F-YOGA-11', 'classical', 'Saraswati yoga (Phaladeepika ch. 6)',
                          'Saraswati yoga: Jupiter, Venus and Mercury all sit in a kendra, a trikona or the 2nd house, with Jupiter strong. '
                          'It gives learning, skill with words and the arts, and a respected name',
                          ['present_life', 'karmic_journey', 'life_events'], 0.66, house_based=True))

    seven = [p for p in GRAHAS if p in c.lon]
    if len(seven) == 7:
        kinds = {c.sign(p) % 3 for p in seven}
        if len(kinds) == 1:
            name, result = [('Rajju', 'all seven planets in movable signs: fond of travel, restless, makes a living away from the birthplace'),
                            ('Musala', 'all seven planets in fixed signs: steady, proud, firm in purpose, lasting wealth'),
                            ('Nala', 'all seven planets in dual signs: skilful and adaptable, with changing fortunes')][kinds.pop()]
            out.append(_f('F-YOGA-12', 'classical', 'Nabhasa yogas of the Ashraya group (BPHS ch. 35)',
                          f"{name} yoga: {result}", ['present_life', 'karmic_journey'], 0.6))
        if known:
            for group, name, result in ((BENEFICS, 'Mala', 'the three benefics in three kendras: comforts, vehicles and a happy life'),
                                        (('Sun', 'Mars', 'Saturn'), 'Sarpa', 'the three malefics in three kendras: a hard road that demands discipline and restraint')):
                houses = {c.house(p) for p in group}
                if len(houses) == 3 and houses <= set(KENDRAS):
                    out.append(_f('F-YOGA-12', 'classical', 'Nabhasa yogas of the Dala group (BPHS ch. 35)',
                                  f"{name} yoga: {result}", ['present_life', 'karmic_journey'], 0.6, house_based=True))

    if have('Rahu') and len(seven) == 7:
        side = {0 < (c.lon[p] - c.lon['Rahu']) % 360.0 < 180.0 for p in seven}
        if len(side) == 1:
            out.append(_f('F-YOGA-13', 'modern', 'Kala Sarpa: all planets on one side of the Rahu-Ketu axis (popular usage; not in BPHS)',
                          'Kala Sarpa: all seven planets lie on one side of the Rahu-Ketu axis. In popular practice it marks a life '
                          'driven by one strong karmic theme, with delays early and concentration of results later',
                          ['karmic_journey', 'present_life', 'karmic_debts'], 0.45))
    return out


# --- Yogini dasha ------------------------------------------------------------

YOGINIS = [('Mangala', 'Moon', 1), ('Pingala', 'Sun', 2), ('Dhanya', 'Jupiter', 3), ('Bhramari', 'Mars', 4),
           ('Bhadrika', 'Mercury', 5), ('Ulka', 'Saturn', 6), ('Siddha', 'Venus', 7), ('Sankata', 'Rahu', 8)]
YOGINI_TONE = {'Mangala': 'ease and good beginnings', 'Pingala': 'drive, with heat and strain', 'Dhanya': 'gain, learning and growth',
               'Bhramari': 'movement, travel and restlessness', 'Bhadrika': 'good relations, skill and steady progress',
               'Ulka': 'hard work, burdens and delays', 'Siddha': 'success, comfort and fulfilled wishes',
               'Sankata': 'obstacles and sudden change that ask for caution'}


def yogini_periods(birth_utc: datetime, moon_lon: float) -> List[Tuple[str, str, datetime, datetime]]:
    """(yogini, lord, start, end) for three rounds (108 years). The first yogini is
    (birth star number + 3) mod 8, and its balance follows the Moon's place in the star."""
    star = min(int((moon_lon % 360.0) / E.NAK_SPAN), 26) + 1
    first = ((star + 3) % 8 or 8) - 1
    elapsed = ((moon_lon % 360.0) % E.NAK_SPAN) / E.NAK_SPAN
    t = birth_utc - timedelta(days=elapsed * YOGINIS[first][2] * E.YEAR_DAYS)
    out = []
    for n in range(24):
        name, lord, years = YOGINIS[(first + n) % 8]
        end = t + timedelta(days=years * E.YEAR_DAYS)
        out.append((name, lord, t, end))
        t = end
    return out


def rule_yogini(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not c.birth_utc:
        return []
    periods = yogini_periods(c.birth_utc, c.lon['Moon'])
    i = next((k for k, p in enumerate(periods) if p[2] <= now < p[3]), None)
    if i is None:
        return []
    name, lord, a, b = periods[i]
    nxt = periods[i + 1] if i + 1 < len(periods) else None
    text = (f"Yogini dasha (a second timing cycle of 36 years): {name}, ruled by {lord}, runs {_span(a, b)}: {YOGINI_TONE[name]}"
            + (f". Next: {nxt[0]} ({nxt[1]}) {_span(nxt[2], nxt[3])}: {YOGINI_TONE[nxt[0]]}" if nxt else ''))
    return [_f('F-YOGINI-01', 'classical', 'Yogini dasha (36-year cycle from the birth star)',
               text, ['present_life', 'predictions', 'life_events'], 0.5, timing=_span(a, b), start=a, end=b)]


# --- Vimshottari: sub-period lord from main-period lord -----------------------

def rule_dasha_relation(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not c.birth_utc:
        return []
    maha, antar = E.current_dasha(E.vimshottari(c.birth_utc, c.lon['Moon']), now)
    if not maha or not antar or antar.antar == maha.maha or maha.maha not in c.lon or antar.antar not in c.lon:
        return []
    m, a = maha.maha, antar.antar
    n = _from(c, a, m)
    if n in (1, 4, 7, 10, 5, 9):
        verdict = 'the two work together, so this sub-period delivers smoothly'
    elif n in (6, 8, 12):
        verdict = 'the two work against each other, so this sub-period brings friction, delay or a change of course'
    else:
        verdict = 'the two are loosely connected, so results come in moderate measure through effort'
    rel = ('natural friends' if a in FRIENDS.get(m, ()) else 'natural enemies' if a in ENEMIES.get(m, ()) else '')
    text = (f"{a}, lord of the sub-period, is {_ordinal(n)} from {m}, lord of the main period: {verdict}"
            + (f". They are {rel}" if rel else ''))
    return [_f('F-DASHA-04', 'classical', 'Sub-period lord counted from the main-period lord (BPHS, antardasha chapters)',
               text, ['present_life', 'predictions', 'life_events'], 0.58,
               timing=f"{m}–{a}, {_span(antar.start, antar.end)}", start=antar.start, end=antar.end)]


# --- Murti nirnaya -----------------------------------------------------------

MURTI = {1: 'gold', 6: 'gold', 11: 'gold', 2: 'silver', 5: 'silver', 9: 'silver',
         3: 'copper', 7: 'copper', 10: 'copper', 4: 'iron', 8: 'iron', 12: 'iron'}
MURTI_RESULT = {'gold': 'the best grade: the transit gives its good results in full',
                'silver': 'a good grade: the transit is largely favourable',
                'copper': 'a middling grade: mixed results',
                'iron': 'the hardest grade: the transit gives its results with strain'}


def rule_murti(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    if not E.SWISSEPH_AVAILABLE:
        return []
    from services.period_gochara import sign_spans
    bits, start, end = [], None, None
    for planet, back, ahead in (('Saturn', 1150, 1150), ('Jupiter', 480, 480)):
        spans = sign_spans(planet, now - timedelta(days=back), now + timedelta(days=ahead))
        cur = next((s for s in spans if s[0] <= now < s[1]), None)
        if not cur or cur[0] <= now - timedelta(days=back - 1):
            continue  # entry lies before the scanned range
        moon = E.sign_index(E.planet_positions(cur[0])['Moon']['longitude'])
        n = (moon - c.sign('Moon')) % 12 + 1
        grade = MURTI[n]
        bits.append(f"{planet} entered {SIGNS[cur[2]]} on {cur[0].strftime('%d %b %Y')} with the Moon {_ordinal(n)} from the birth Moon: "
                    f"{'an' if grade == 'iron' else 'a'} {grade} transit ({MURTI_RESULT[grade]}), until {cur[1].strftime('%b %Y')}")
        if start is None:
            start, end = cur[0], cur[1]
    if not bits:
        return []
    return [_f('F-MURTI-01', 'tradition-attributed', 'Murti nirnaya: the grade of a transit from the Moon at the moment of entry',
               '; '.join(bits), ['present_life', 'predictions', 'life_events'], 0.5,
               timing=_span(start, end), start=start, end=end)]


# --- Indu Lagna --------------------------------------------------------------

INDU_KALA = {'Sun': 30, 'Moon': 16, 'Mars': 6, 'Mercury': 8, 'Jupiter': 10, 'Venus': 12, 'Saturn': 1}


def indu_lagna(c: Chart) -> int:
    """Sign index: add the kalas of the 9th lords from the Lagna and from the
    Moon, divide by 12, and count the remainder from the Moon."""
    l9 = c.lord_of_house(9)
    m9 = SIGN_LORDS[(c.sign('Moon') + 8) % 12]
    r = (INDU_KALA[l9] + INDU_KALA[m9]) % 12 or 12
    return (c.sign('Moon') + r - 1) % 12


def rule_indu(c: Chart) -> List[Dict[str, Any]]:
    if c.time_accuracy == 'unknown':
        return []
    il = indu_lagna(c)
    occ = c.occupants(il)
    lord = SIGN_LORDS[il]
    text = (f"Indu Lagna (the wealth point) falls in {SIGNS[il]}, the {_ordinal((il - E.sign_index(c.asc)) % 12 + 1)} house; "
            f"it holds {', '.join(occ) if occ else 'no planet'}; its lord {lord} is "
            f"{placed(lord, c.sign(lord))}. "
            "The periods of the planets in it, and of its lord, are the ones that favour earnings")
    f = _f('F-INDU-01', 'classical', 'Indu Lagna, the wealth point (Uttara Kalamrita)',
           text, ['present_life', 'life_events', 'predictions'], 0.5, house_based=True)
    f['domain'] = 'wealth'
    return [f]


def classical_rules(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for rule in (lambda: rule_planet_state(c), lambda: rule_arudha(c), lambda: rule_divisions(c),
                 lambda: rule_classical_yogas(c), lambda: rule_yogini(c, now), lambda: rule_dasha_relation(c, now),
                 lambda: rule_murti(c, now), lambda: rule_indu(c)):
        try:
            out.extend(rule())
        except Exception as e:  # one bad rule must not drop the rest
            logger.warning("Rule failed: %s", e)
    return out
