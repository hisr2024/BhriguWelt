"""
Further Bhrigu / Nadi rules, each tied to a named source.

  F-BSUTRA-01  Bhrigu Sutram: the year of life in which a planet's house
               result is said to show (planet-in-house sutras that state an age).
  F-BNN-04     Bhrigu Nandi Nadi: the planets connected with Saturn (karma
               karaka) point to the field of work.
  F-BNN-05     Bhrigu Nandi Nadi timing: transiting Jupiter and Saturn
               connecting with a natal karaka by direction.
  F-MATURITY-01 Maturity ages of the planets.

Sources
  * Bhrigu Sutram (traditional text attributed to Maharshi Bhrigu; the ages
    below were read from an English rendering of the sutras and counter-checked
    in a second pass). Statements about length of life and the two sutras on
    illicit relations (Moon in the 6th and 10th) are deliberately left out,
    and death of a relative is worded as "a testing year".
  * R. G. Rao's Bhrigu Nandi Nadi "Nadi aspects": signs of one direction
    (the trines) act together; East connects with West and North with South;
    a retrograde planet also acts from the previous sign. Jupiter is the jiva
    karaka and Saturn the karma karaka; Venus signifies the house and Mercury
    land (as summarised in Saptarishis Astrology, "Nadi principles to own a
    house", 2009).
  * Planetary maturity ages: widely taught in the Nadi / Bhrigu tradition;
    not found in BPHS.

Nothing here is random or templated: every finding is a function of the chart.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from services import ephemeris_core as E
from services.bhrigu_nadi_rules import (
    ALL, DEBIL, EXALT, SIGN_LORDS, SIGNS, Chart, _f, _ordinal, _span, _windows,
)

logger = logging.getLogger(__name__)

MALEFICS = ('Mars', 'Saturn', 'Rahu', 'Ketu')
DIRECTIONS = ['East', 'South', 'West', 'North']  # Aries, Taurus, Gemini, Cancer ... repeating


def direction(sign: int) -> str:
    return DIRECTIONS[sign % 4]


def _birthday(c: Chart, n: int) -> datetime:
    """The nth birthday (n = 0 is birth)."""
    b = c.birth_utc
    try:
        return b.replace(year=b.year + n)
    except ValueError:  # 29 February
        return b.replace(year=b.year + n, day=28)


def _benefics(c: Chart) -> List[str]:
    """Natural benefics in this chart: Jupiter, Venus, Mercury unless joined
    by a malefic, and the waxing Moon (BPHS)."""
    out = [p for p in ('Jupiter', 'Venus') if p in c.lon]
    if 'Mercury' in c.lon and not any(q in MALEFICS + ('Sun',) for q in c.occupants(c.sign('Mercury'), exclude=('Mercury',))):
        out.append('Mercury')
    if 'Moon' in c.lon and 'Sun' in c.lon and 0 < (c.lon['Moon'] - c.lon['Sun']) % 360.0 < 180:
        out.append('Moon')
    return out


def _benefic_touch(c: Chart, planet: str) -> bool:
    """A benefic joins or aspects the planet."""
    s = c.sign(planet)
    return any(b != planet and (c.sign(b) == s or c.aspects_sign(b, s)) for b in _benefics(c))


def _malefic_touch(c: Chart, planet: str) -> bool:
    s = c.sign(planet)
    return any(m in c.lon and m != planet and (c.sign(m) == s or c.aspects_sign(m, s)) for m in MALEFICS)


SUN_ENEMY_SIGNS = {1, 6, 9, 10}  # signs of Venus and Saturn


def _cond(c: Chart, planet: str, key: str) -> bool:
    if key == '':
        return True
    s = c.sign(planet)
    if key == 'afflicted_no_benefic':   # Sun in the 1st
        afflicted = (any(m in c.lon and c.sign(m) == s for m in MALEFICS)
                     or s in SUN_ENEMY_SIGNS or DEBIL.get(planet) == s)
        return afflicted and not _benefic_touch(c, planet)
    if key == 'not_own_exalted':
        return not (EXALT.get(planet) == s or SIGN_LORDS[s] == planet)
    if key == 'no_benefic_aspect':
        return not _benefic_touch(c, planet)
    if key == 'malefic_influence':
        return _malefic_touch(c, planet)
    if key == 'benefic_association':
        return _benefic_touch(c, planet) or SIGN_LORDS[s] in ('Jupiter', 'Venus', 'Mercury', 'Moon')
    if key == 'exalted':
        return EXALT.get(planet) == s
    return False


COND_TEXT = {
    'afflicted_no_benefic': 'applies because the Sun is afflicted and no benefic aspects it',
    'not_own_exalted': 'applies because the Sun is not in Aries or Leo',
    'no_benefic_aspect': 'applies because no benefic aspects the planet',
    'benefic_association': 'applies because Mars has benefic association',
    'exalted': 'applies because Jupiter is exalted',
}

# (planet, house) -> [(years of life, result, condition key, themes)]
# "Nth year" is the running year: from the (N-1)th to the Nth birthday.
BHRIGU_SUTRAM_AGES: Dict[Tuple[str, int], List[Tuple[Tuple[int, ...], str, str, Tuple[str, ...]]]] = {
    ('Sun', 1): [((3,), 'a fever or spell of ill health', 'afflicted_no_benefic', ('health',))],
    ('Sun', 2): [((25,), 'loss of money through authority or officialdom', 'not_own_exalted', ('wealth',))],
    ('Sun', 3): [((4, 5, 8, 12), 'bodily troubles', '', ('health',))],
    ('Sun', 4): [((32,), 'congenial surroundings, respect and success', '', ('career', 'home'))],
    ('Sun', 5): [((7,), 'a testing year for the father (health or fortune)', '', ('home',))],
    ('Sun', 6): [((20,), 'eye trouble', 'no_benefic_aspect', ('health',))],
    ('Sun', 7): [((25,), 'travel to a distant place', '', ('relocation',))],
    ('Sun', 8): [((10,), 'a head injury or fall', 'no_benefic_aspect', ('health',))],
    ('Sun', 10): [((18,), 'distinction in education (by this year)', '', ('education',))],
    ('Sun', 11): [((25,), 'acquiring a vehicle', '', ('wealth',))],
    ('Sun', 12): [((36,), 'abdominal trouble', '', ('health',))],
    ('Moon', 1): [((15,), 'much travel', '', ('relocation',))],
    ('Moon', 2): [((18,), 'a position of command or responsibility', '', ('career',))],
    ('Moon', 3): [((24,), 'a penalty from authority with loss of money', '', ('wealth',))],
    ('Moon', 7): [((32,), 'marriage or a settled partnership', '', ('marriage',))],
    ('Moon', 11): [((50,), 'gains and standing through children', '', ('children', 'wealth'))],
    ('Mars', 4): [((8,), 'a testing year for the father (health or fortune)', '', ('home',))],
    ('Mars', 5): [((6,), 'cuts or wounds', '', ('health',))],
    ('Mars', 6): [((27,), 'marriage and acquiring a vehicle', '', ('marriage', 'wealth'))],
    ('Mars', 10): [((18,), 'beginning to earn', 'benefic_association', ('career', 'wealth'))],
    ('Mercury', 1): [((27,), 'pilgrimage and a gain of wealth', '', ('spiritual', 'wealth'))],
    ('Mercury', 2): [((15,), 'distinction in studies and financial gain', '', ('education', 'wealth'))],
    ('Mercury', 3): [((15,), 'gain of land or property', '', ('home', 'wealth'))],
    ('Mercury', 4): [((16,), 'gain of money and vehicles (the sutra warns: keep the means fair)', '', ('wealth',))],
    ('Mercury', 6): [((30,), 'great favour from authority', '', ('career',))],
    ('Mercury', 8): [((25,), 'respect, honour and wide fame', '', ('career',))],
    ('Mercury', 10): [((28,), 'eye trouble', '', ('health',))],
    ('Jupiter', 1): [((16,), 'the results of a great raja yoga', 'exalted', ('career',))],
    ('Jupiter', 2): [((16,), 'financial gain and prosperity from land', '', ('wealth',))],
    ('Jupiter', 3): [((38,), 'travels', '', ('relocation',))],
    ('Jupiter', 5): [((18,), 'a post of responsibility through the favour of authority', '', ('career',))],
    ('Jupiter', 7): [((34,), 'happiness and great respect', '', ('marriage', 'career'))],
    ('Jupiter', 9): [((35,), 'performing religious ceremonies', '', ('spiritual',))],
    ('Jupiter', 11): [((32,), 'acquiring a vehicle', '', ('wealth',))],
    ('Venus', 2): [((32,), 'marriage to a good-looking partner', '', ('marriage',))],
    ('Venus', 4): [((30,), 'acquiring a vehicle', '', ('wealth', 'home'))],
    ('Venus', 8): [((4,), 'throat trouble for the mother', '', ('home',))],
    ('Saturn', 9): [((39,), 'charitable or public works', '', ('spiritual',))],
    ('Saturn', 10): [((25,), 'a pilgrimage', '', ('spiritual',))],
}


def rule_bhrigu_sutram(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    """Dated results from the Bhrigu Sutram age statements for this chart's placements."""
    if not c.birth_utc or c.time_accuracy == 'unknown':
        return []  # the sutras count houses from the Lagna; without a birth time they are not applied
    upcoming, past = [], []
    for p in E.PLANETS:
        if p not in c.lon:
            continue
        h = c.house(p)
        for years, result, cond, themes in BHRIGU_SUTRAM_AGES.get((p, h), []):
            if not _cond(c, p, cond):
                continue
            for n in years:
                a, b = _birthday(c, n - 1), _birthday(c, n)
                row = (a, b, p, h, n, result, cond, themes)
                (past if b <= now else upcoming).append(row)
    out = []
    for a, b, p, h, n, result, cond, themes in sorted(upcoming)[:4]:
        running = a <= now < b
        text = (f"{p} in the {_ordinal(h)} house: the {_ordinal(n)} year of life ({_span(a, b)}) is named for {result}"
                + (f" ({COND_TEXT[cond]})" if cond else '')
                + ('. This year is running now' if running else ''))
        f = _f('F-BSUTRA-01', 'tradition-attributed',
               'Bhrigu Sutram: the year of life in which a planet\'s house result shows',
               text, ['life_events', 'predictions', 'present_life'], 0.62 if running else 0.55,
               timing=_span(a, b), start=a, end=b, house_based=True)
        f['domain'] = themes[0]
        out.append(f)
    if past:
        past.sort()
        text = ('Years already passed, useful to check the birth time: '
                + '; '.join(f"{_ordinal(n)} year ({a.year}–{b.year}): {result} ({p} in the {_ordinal(h)})"
                            for a, b, p, h, n, result, _cond_key, _t in past[-6:]))
        out.append(_f('F-BSUTRA-01', 'tradition-attributed',
                      'Bhrigu Sutram: the year of life in which a planet\'s house result shows',
                      text, ['life_events'], 0.35, house_based=True))
    return out


# What each planet adds to the field of work when connected with Saturn.
# Planet meanings are the classical karakatvas (Phaladeepika ch. 5, BPHS).
WORK_FIELD = {
    'Sun': 'government, administration or work under authority',
    'Moon': 'work with the public, travel, liquids, food or the arts; a changeable career',
    'Mars': 'technical, engineering, land, machinery or uniformed work',
    'Mercury': 'trade, accounts, writing, communication or analysis',
    'Jupiter': 'advisory, teaching, legal, financial or managerial work with respect',
    'Venus': 'finance, arts, design, luxury goods, vehicles or work connected with women',
    'Rahu': 'foreign, large-scale, technological or unconventional work',
    'Ketu': 'breaks and changes of direction; research, spiritual, legal or fine technical work',
}


def nadi_connections(c: Chart, planet: str) -> List[Tuple[str, str]]:
    """(other planet, relation) per R. G. Rao's Nadi aspects, strongest first.
    A retrograde planet is also read from the previous sign."""
    bases = [c.sign(planet)] + ([(c.sign(planet) - 1) % 12] if c.retro(planet) else [])
    found: Dict[str, str] = {}
    order = (('same sign', (0,)), ('same direction (trine)', (4, 8)), ('opposite (7th)', (6,)),
             ('opposite direction (3rd/11th)', (2, 10)), ('2nd', (1,)), ('12th', (11,)))
    for label, offsets in order:
        for i, base in enumerate(bases):
            for off in offsets:
                for q in c.occupants((base + off) % 12, exclude=(planet,)):
                    found.setdefault(q, label + (f', counted from the previous sign because {planet} is retrograde' if i else ''))
    return list(found.items())


def rule_bnn_work(c: Chart) -> List[Dict[str, Any]]:
    if 'Saturn' not in c.lon:
        return []
    strong = [(q, rel) for q, rel in nadi_connections(c, 'Saturn')
              if rel.startswith(('same sign', 'same direction', 'opposite (7th)'))]
    if not strong:
        return [_f('F-BNN-04', 'tradition-attributed', 'Field of work from Saturn\'s connections (Bhrigu Nandi Nadi)',
                   f"Saturn in {SIGNS[c.sign('Saturn')]} ({direction(c.sign('Saturn'))}) stands alone in its direction: "
                   "work is built by one's own steady effort, without a strong second influence",
                   ['present_life', 'karmic_journey', 'predictions'], 0.45)]
    parts = [f"{q} ({rel}): {WORK_FIELD[q]}" for q, rel in strong if q in WORK_FIELD]
    return [_f('F-BNN-04', 'tradition-attributed', 'Field of work from Saturn\'s connections (Bhrigu Nandi Nadi)',
               f"Saturn in {SIGNS[c.sign('Saturn')]} ({direction(c.sign('Saturn'))}) is connected with "
               + '; '.join(parts[:4]),
               ['present_life', 'karmic_journey', 'predictions', 'life_events'], 0.58)]


def rule_bnn_transits(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    """Transit Jupiter / Saturn connecting with natal karakas (same or opposite direction)."""
    if not E.SWISSEPH_AVAILABLE:
        return []
    karakas: List[Tuple[str, str, str]] = [
        ('Saturn', 'work and profession', 'career'),
        ('Venus', 'home, vehicles and comforts' + (' and marriage' if c.gender in ('male', 'm') else ''),
         'marriage' if c.gender in ('male', 'm') else 'wealth'),
        ('Mercury', 'land, study and trade', 'education'),
    ]
    if c.gender in ('female', 'f'):
        karakas.append(('Mars', 'marriage (Mars signifies the husband in a woman\'s chart)', 'marriage'))
    end = now + timedelta(days=4 * 365)
    out = []
    for k, meaning, domain in karakas:
        if k not in c.lon:
            continue
        s = c.sign(k)
        same = {s, (s + 4) % 12, (s + 8) % 12}
        if c.retro(k):  # a retrograde planet also stands for the direction of the previous sign
            same |= {(s - 1) % 12, (s + 3) % 12, (s + 7) % 12}
        linked = same | {(x + 2) % 12 for x in same}
        firm = ('same sign', 'same direction', 'opposite')
        promise = [q for q in ('Jupiter', 'Saturn') if q != k and q in c.lon
                   and (dict(nadi_connections(c, k)).get(q, '').startswith(firm)
                        or dict(nadi_connections(c, q)).get(k, '').startswith(firm))]
        others = ' nor '.join(q for q in ('Jupiter', 'Saturn') if q != k)

        def both(day: datetime) -> bool:
            pos = E.planet_positions(day)
            return (E.sign_index(pos['Jupiter']['longitude']) in linked
                    and E.sign_index(pos['Saturn']['longitude']) in linked)
        wins = [w for w in _windows(both, now, end, step_days=6) if (w[1] - w[0]).days >= 30]
        jup = [w for w in E.sign_windows('Jupiter', same, now, end, step_days=4) if (w[1] - w[0]).days >= 20]
        if not wins and not jup:
            continue
        bits = []
        if wins:
            bits.append('Jupiter and Saturn both connect with it ' + ', '.join(_span(a, b) for a, b in wins[:2]))
        if jup:
            bits.append(f"Jupiter joins its direction ({direction(s)}) " + ', '.join(_span(w[0], w[1]) for w in jup[:2]))
        first = wins[0] if wins else (jup[0][0], jup[0][1])
        text = (f"{k} in {SIGNS[s]} signifies {meaning}. " + '; '.join(bits) + '. '
                + (f"The birth chart supports this: {' and '.join(promise)} {'is' if len(promise) == 1 else 'are'} connected with {k}"
                   if promise else f"The birth chart gives weaker support: {'neither ' if ' nor ' in others else ''}{others} is {'' if ' nor ' in others else 'not '}connected with {k}"))
        f = _f('F-BNN-05', 'tradition-attributed',
               'Transit Jupiter and Saturn connecting with a natal karaka (Bhrigu Nandi Nadi timing)',
               text, ['life_events', 'predictions', 'present_life'], 0.6 if (wins and promise) else 0.5 if promise else 0.42,
               timing=_span(first[0], first[1]), start=first[0], end=first[1])
        f['domain'] = domain
        out.append(f)
    return out


MATURITY = [('Jupiter', 16), ('Sun', 22), ('Moon', 24), ('Venus', 25), ('Mars', 28),
            ('Mercury', 32), ('Saturn', 36), ('Rahu', 42), ('Ketu', 48)]


def rule_maturity(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    """The planet maturing now or next, with the house it occupies."""
    if not c.birth_utc:
        return []
    age = (now - c.birth_utc).days / E.YEAR_DAYS
    for p, n in MATURITY:
        if p not in c.lon or age >= n + 1:
            continue
        a, b = _birthday(c, n), _birthday(c, n + 1)
        if a > now + timedelta(days=5 * 365):
            return []
        state = 'matures now' if a <= now else f"matures at {n}"
        return [_f('F-MATURITY-01', 'tradition-attributed', 'Maturity age of the planets (Nadi / Bhrigu tradition)',
                   f"{p} {state}: from {_span(a, b)} the matters of the {_ordinal(c.house(p))} house, where it sits, "
                   f"and of the house(s) it rules ({', '.join(_ordinal(h) for h in c.owned_houses(p)) or 'none'}) settle and give their steady results",
                   ['life_events', 'predictions', 'present_life'], 0.42,
                   timing=_span(a, b), start=a, end=b, house_based=True)]
    return []


def more_rules(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for rule in (lambda: rule_bhrigu_sutram(c, now), lambda: rule_bnn_work(c),
                 lambda: rule_bnn_transits(c, now), lambda: rule_maturity(c, now)):
        try:
            out.extend(rule())
        except Exception as e:  # one bad rule must not drop the rest
            logger.warning("Rule failed: %s", e)
    return out


__all__ = ['more_rules', 'rule_bhrigu_sutram', 'rule_bnn_work', 'rule_bnn_transits', 'rule_maturity',
           'nadi_connections', 'direction', 'BHRIGU_SUTRAM_AGES', 'MATURITY', 'ALL']
