"""
Weekly, monthly and yearly readings by classical gochara — computed, never templated.

Transits are judged the way the texts give them:

  from the natal Moon   each planet has its favourable houses (Phaladeepika ch. 26),
                        cancelled when another planet sits in the vedha house
  from the Lagna        the house a planet crosses names the area of life it acts on
  Ashtakavarga          the planet's own bindus in the sign it transits grade the result
  aspects               Jupiter's aspect supports a house, Saturn's delays it
  dasha                 the running maha / antar / pratyantar lords and the dates they change
  Bhrigu Chakra Paddhati the house activated by the running year of life

Every date is found by bisection on Swiss Ephemeris positions, to the minute:
sign ingresses, retrograde and direct stations, new and full Moons, and the
Chandrashtama span. The week is built from seven daily readings (services.daily_gochara).
"""
from __future__ import annotations

import calendar
from datetime import date, datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional, Tuple

from services import daily_gochara as D
from services import ephemeris_core as E
from services.bhrigu_nadi_rules import (GOOD_FROM_MOON, GRAHAS7, aspects_from, bhinnashtakavarga,
                                        vedha_obstructers)
from services.mantras import planet_mantra

SIGNS = E.SIGNS
_ord = D._ordinal
HOUSE_SHORT = {1: 'Self', 2: 'Money and family', 3: 'Effort and messages', 4: 'Home', 5: 'Children and study',
               6: 'Work and health', 7: 'Partners', 8: 'Hidden matters', 9: 'Fortune', 10: 'Career',
               11: 'Gains', 12: 'Rest and expenses'}
GOOD = {
    'Sun': 'recognition, health and support from authority', 'Mars': 'energy, courage and the upper hand over rivals',
    'Mercury': 'trade, study and clear communication', 'Jupiter': 'growth, wealth, children and good counsel',
    'Venus': 'comfort, affection and enjoyment', 'Saturn': 'steady effort that pays and gains through discipline',
    'Rahu': 'ambition and gains by unusual routes', 'Ketu': 'insight and release from old burdens',
}
HARD = {
    'Sun': 'strain with authority, fatigue and wounded pride', 'Mars': 'haste, quarrels and risk of injury',
    'Mercury': 'misunderstandings and errors in documents', 'Jupiter': 'slower growth; check advice and funds',
    'Venus': 'friction in relationships and overspending', 'Saturn': 'delay, heavy duty and the need for patience',
    'Rahu': 'restlessness and misleading shortcuts', 'Ketu': 'loss of interest and sudden breaks',
}
BENEFICS = ('Jupiter', 'Venus', 'Mercury')
AREAS = {  # label, verb, primary houses from the Lagna
    'career': ('Work', 'is', (10,)), 'love': ('Relationships', 'are', (7,)),
    'health': ('Health', 'is', (1,)), 'finance': ('Money matters', 'are', (2, 11)),
}
SLOW = ('Jupiter', 'Saturn', 'Rahu', 'Ketu')
MONTHLY = ('Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu')


# ---------------------------------------------------------------------------
# Time helpers
# ---------------------------------------------------------------------------

def _zone(chart: Dict[str, Any], client_tz: Optional[str]):
    import pytz
    for name in (client_tz, (chart.get('birth_details') or {}).get('timezone')):
        if name:
            try:
                return pytz.timezone(str(name))
            except Exception:
                continue
    return pytz.utc


def _utc(tz, d: date, hour: int = 12) -> datetime:
    return tz.localize(datetime(d.year, d.month, d.day, hour, 0)).astimezone(timezone.utc)


def _day(dt: datetime, tz) -> str:
    return dt.astimezone(tz).strftime('%Y-%m-%d')


def _nice(dt: datetime, tz, clock: bool = True) -> str:
    local = dt.astimezone(tz)
    return f"{local.day} {local.strftime('%b')}" + (f" {local.strftime('%H:%M')}" if clock else '')


def _signs_at(when: datetime) -> Dict[str, int]:
    return {p: E.sign_index(v['longitude']) for p, v in E.planet_positions(when).items()}


def _changes(key: Callable[[datetime], Any], start: datetime, end: datetime,
             step: timedelta) -> List[Tuple[datetime, Any, Any]]:
    """Every moment in [start, end] at which ``key`` changes value, to the minute."""
    out: List[Tuple[datetime, Any, Any]] = []
    a, ka = start, key(start)
    while a < end:
        b = min(a + step, end)
        kb = key(b)
        if kb != ka:
            lo, hi = a, b
            while hi - lo > timedelta(minutes=1):
                mid = lo + (hi - lo) / 2
                if key(mid) == ka:
                    lo = mid
                else:
                    hi = mid
            out.append((hi, ka, kb))
        a, ka = b, kb
    return out


def ingresses(planet: str, start: datetime, end: datetime) -> List[Tuple[datetime, int, int]]:
    step = timedelta(hours=12) if planet == 'Moon' else timedelta(days=1)
    return _changes(lambda t: E.sign_index(E.planet_positions(t)[planet]['longitude']), start, end, step)


def stations(planet: str, start: datetime, end: datetime) -> List[Tuple[datetime, str]]:
    found = _changes(lambda t: E.planet_positions(t)[planet]['speed'] < 0, start, end, timedelta(days=1))
    return [(t, 'turns retrograde' if now_retro else 'turns direct') for t, _was, now_retro in found]


def lunations(start: datetime, end: datetime) -> List[Tuple[datetime, str]]:
    def half(t: datetime) -> int:
        pos = E.planet_positions(t)
        return int(((pos['Moon']['longitude'] - pos['Sun']['longitude']) % 360.0) // 180)
    return [(t, 'Purnima (full Moon)' if after == 1 else 'Amavasya (new Moon)')
            for t, _before, after in _changes(half, start, end, timedelta(hours=12))]


def sign_spans(planet: str, start: datetime, end: datetime) -> List[Tuple[datetime, datetime, int]]:
    """(from, to, sign) for each stay of ``planet`` in a sign within [start, end]."""
    spans, a = [], start
    sign = E.sign_index(E.planet_positions(start)[planet]['longitude'])
    for t, _old, new in ingresses(planet, start, end):
        spans.append((a, t, sign))
        a, sign = t, new
    spans.append((a, end, sign))
    return spans


# ---------------------------------------------------------------------------
# Judging a transit
# ---------------------------------------------------------------------------

def _bav(natal: Dict[str, Any]) -> Optional[Dict[str, List[int]]]:
    lons, asc = natal['lons'], natal['asc_sign']
    signs = {p: int(lons[p] // 30) for p in GRAHAS7 if p in lons}
    if len(signs) != 7 or asc is None:
        return None
    try:
        return bhinnashtakavarga(signs, asc)
    except Exception:
        return None


def transit_state(planet: str, natal: Dict[str, Any], tsigns: Dict[str, int],
                  bav: Optional[Dict[str, List[int]]], slow_only: bool = False) -> Dict[str, Any]:
    """``slow_only``: over a span of months only Jupiter and Saturn stay long enough to obstruct."""
    moon_sign = int(natal['lons']['Moon'] // 30)
    sign = tsigns[planet]
    from_moon = (sign - moon_sign) % 12 + 1
    good = from_moon in GOOD_FROM_MOON[planet]
    blockers = vedha_obstructers(planet, moon_sign, tsigns)[1] if good and planet not in ('Rahu', 'Ketu') else []
    if slow_only:
        blockers = [b for b in blockers if b in ('Jupiter', 'Saturn')]
    asc = natal['asc_sign']
    return {
        'planet': planet, 'sign': sign, 'from_moon': from_moon, 'good': good, 'blockers': blockers,
        'house': (sign - asc) % 12 + 1 if asc is not None else None,
        'bindus': bav[planet][sign] if bav and planet in bav else None,
    }


def transit_line(st: Dict[str, Any], span: str = '') -> str:
    p = st['planet']
    if st['good'] and st['blockers']:
        verdict = (f"a favourable house, but obstructed by {' and '.join(st['blockers'])} in the vedha house, "
                   f"so the good result waits")
    elif st['good']:
        verdict = f"a favourable house: {GOOD[p]}"
    else:
        verdict = f"not a favourable house: {HARD[p]}"
    line = f"{p} in {SIGNS[st['sign']]}{' ' + span if span else ''} is {_ord(st['from_moon'])} from your Moon, {verdict}."
    if st['bindus'] is not None:
        grade = 'strong' if st['bindus'] >= 5 else 'weak' if st['bindus'] <= 3 else 'average'
        line += f" It holds {st['bindus']} of 8 bindus there ({grade})."
    if st['house']:
        line += f" From your Lagna it crosses the {_ord(st['house'])} house: {D.HOUSE_TOPIC[st['house']]}."
    return line


def area_section(key: str, natal: Dict[str, Any], tsigns: Dict[str, int], planets: Tuple[str, ...],
                 bav, period: str, use_lord: bool = True) -> Optional[Dict[str, Any]]:
    """One life area judged from the planets touching its house(s) from the Lagna."""
    asc = natal['asc_sign']
    if asc is None:
        return None
    label, verb, houses = AREAS[key]
    plus: List[str] = []
    minus: List[str] = []
    for h in houses:
        hs = (asc + h - 1) % 12
        for p in planets:
            if tsigns[p] == hs:
                if p in BENEFICS:
                    plus.append(f"{p} transits your {_ord(h)} house")
                elif h in (10, 11):
                    plus.append(f"{p} in your {_ord(h)} house rewards hard work with results")
                else:
                    minus.append(f"{p} transits your {_ord(h)} house")
        if tsigns['Jupiter'] != hs and aspects_from('Jupiter', tsigns['Jupiter'], hs):
            plus.append(f"Jupiter aspects your {_ord(h)} house from {SIGNS[tsigns['Jupiter']]}")
        if tsigns['Saturn'] != hs and aspects_from('Saturn', tsigns['Saturn'], hs):
            minus.append(f"Saturn aspects your {_ord(h)} house from {SIGNS[tsigns['Saturn']]}, asking for patience")
        lord = E.SIGN_LORDS[hs]
        if use_lord or lord in SLOW:
            st = transit_state(lord, natal, tsigns, bav, slow_only=not use_lord)
            if st['good'] and not st['blockers']:
                plus.append(f"your {_ord(h)} lord {lord} is well placed, {_ord(st['from_moon'])} from the Moon")
            elif st['from_moon'] in (8, 12):
                minus.append(f"your {_ord(h)} lord {lord} is {_ord(st['from_moon'])} from the Moon")
    score = len(plus) - len(minus)
    tone = ('well supported' if score >= 1 else 'under pressure' if score <= -1
            else 'mixed' if plus else 'steady')
    if plus or minus:
        summary = f"{label} {verb} {tone} {period}."
        if plus:
            summary += ' In favour: ' + '; '.join(plus) + '.'
        if minus:
            summary += ' Against: ' + '; '.join(minus) + '.'
    else:
        names = ' and '.join(_ord(h) for h in houses)
        summary = (f"{label} {verb} steady {period}: no slow planet touches your {names} house, "
                   "so results follow the running dasha.")
    return {'summary': summary, 'rating': max(1, min(5, 3 + score)), 'basis': (tuple(plus), tuple(minus))}


# ---------------------------------------------------------------------------
# Dasha and Bhrigu Chakra Paddhati
# ---------------------------------------------------------------------------

def _pratyantars(antar) -> List[Tuple[str, datetime, datetime]]:
    span = (antar.end - antar.start).total_seconds()
    k = E.DASHA_SEQ.index(antar.antar)
    out, t = [], antar.start
    for m in range(9):
        lord = E.DASHA_SEQ[(k + m) % 9]
        end = t + timedelta(seconds=span * E.DASHA_YEARS[lord] / 120.0)
        out.append((lord, t, end))
        t = end
    return out


def dasha_in(natal: Dict[str, Any], start: datetime, end: datetime, pratyantar: bool) -> Dict[str, Any]:
    """Running period at ``start`` and every change of lord inside the span."""
    if not natal['birth_utc']:
        return {'running': None, 'changes': [], 'maha': None, 'antar': None}
    periods = E.vimshottari(natal['birth_utc'], natal['lons']['Moon'])
    maha, antar = E.current_dasha(periods, start)
    changes: List[Tuple[datetime, str]] = []
    for p in periods:
        if start < p.start <= end:
            changes.append((p.start, f"{p.maha}–{p.antar} antardasha begins"))
        if pratyantar and p.end > start and p.start <= end:
            for lord, a, _b in _pratyantars(p):
                if start < a <= end and a != p.start:
                    changes.append((a, f"{p.maha}–{p.antar}–{lord} pratyantar begins"))
    praty = None
    if antar:
        praty = next((lord for lord, a, b in _pratyantars(antar) if a <= start < b), None)
    chain = [x for x in (maha.maha if maha else None, antar.antar if antar else None, praty if pratyantar else None) if x]
    return {'running': ' – '.join(chain) or None, 'changes': sorted(changes),
            'maha': maha.maha if maha else None, 'antar': antar.antar if antar else None,
            'antar_end': antar.end if antar else None}


def bcp(natal: Dict[str, Any], when: datetime) -> Optional[Dict[str, Any]]:
    """Bhrigu Chakra Paddhati: one house per year of life, counted from the Lagna."""
    if not natal['birth_utc'] or natal['asc_sign'] is None or when < natal['birth_utc']:
        return None
    running = int((when - natal['birth_utc']).days / E.YEAR_DAYS) + 1
    h = (running - 1) % 12 + 1
    sign = (natal['asc_sign'] + h - 1) % 12
    occupants = [p for p, lon in natal['lons'].items() if int(lon // 30) == sign]
    lord = E.SIGN_LORDS[sign]
    lord_house = (int(natal['lons'][lord] // 30) - natal['asc_sign']) % 12 + 1 if lord in natal['lons'] else None
    text = (f"year {running} of life activates your {_ord(h)} house ({SIGNS[sign]}: "
            f"{', '.join(occupants) if occupants else 'no planets'}), so {D.HOUSE_TOPIC[h]} lead"
            + (f"; its lord {lord} sits in your {_ord(lord_house)} house" if lord_house else ''))
    return {'running': running, 'house': h, 'text': text}


def _events(tz, start: datetime, end: datetime, natal, planets: Tuple[str, ...], pratyantar: bool,
            moon_phases: bool) -> List[Dict[str, str]]:
    asc, moon_sign = natal['asc_sign'], int(natal['lons']['Moon'] // 30)
    rows: List[Tuple[datetime, str]] = []
    for p in planets:
        if p == 'Ketu':
            continue
        for t, _old, new in ingresses(p, start, end):
            name = 'Rahu' if p == 'Rahu' else p
            where = f"{_ord((new - moon_sign) % 12 + 1)} from your Moon"
            if asc is not None:
                where += f", your {_ord((new - asc) % 12 + 1)} house"
            extra = f" (Ketu enters {SIGNS[(new + 6) % 12]})" if p == 'Rahu' else ''
            rows.append((t, f"{name} enters {SIGNS[new]}{extra}: {where}"))
        if p not in ('Sun', 'Rahu'):
            rows += [(t, f"{p} {what}") for t, what in stations(p, start, end)]
    if moon_phases:
        rows += lunations(start, end)
    rows += dasha_in(natal, start, end, pratyantar)['changes']
    return [{'date': _day(t, tz), 'event': f"{text} ({t.astimezone(tz).strftime('%H:%M')})"} for t, text in sorted(rows)]


def _meta(chart: Dict[str, Any], extra: Dict[str, Any]) -> Dict[str, Any]:
    asc = chart.get('ascendant')
    meta = {'zodiac_sign': chart.get('zodiac_sign'), 'moon_sign': chart.get('moon_sign'),
            'nakshatra': chart.get('nakshatra'), 'ascendant': asc.get('sign') if isinstance(asc, dict) else asc,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisha', 'computed': True,
            'ephemeris': E.ephemeris_source(), 'generated_at': E.utcnow().isoformat()}
    meta.update(extra)
    return meta


def _join(names: List[str]) -> str:
    return names[0] if len(names) == 1 else ', '.join(names[:-1]) + ' and ' + names[-1]


# ---------------------------------------------------------------------------
# Week
# ---------------------------------------------------------------------------

def weekly_reading(chart: Dict[str, Any], start_date: Optional[datetime] = None,
                   client_tz: Optional[str] = None) -> Optional[Dict[str, Any]]:
    natal = D._natal(chart)
    if not natal or not E.SWISSEPH_AVAILABLE:
        return None
    tz = _zone(chart, client_tz)
    today = (start_date.date() if start_date else E.utcnow().astimezone(tz).date())
    monday = today - timedelta(days=today.weekday())
    days = []
    for i in range(7):
        d = monday + timedelta(days=i)
        r = D.daily_reading(chart, _utc(tz, d), tz)
        if not r:
            return None
        days.append((d, r))
    start, end = _utc(tz, monday, 0), _utc(tz, monday + timedelta(days=7), 0)
    bav = _bav(natal)
    tsigns = _signs_at(_utc(tz, monday + timedelta(days=3)))

    def tag(r: Dict[str, Any]) -> str:
        f = r['facts']
        lead = 'Chandrashtama' if f['from_moon'] == 8 else f"{f['tara']} tara"
        return f"{lead} · {HOUSE_SHORT[f['house']]}" if f['house'] else lead

    summaries = [{'date': d.isoformat(), 'day': d.strftime('%A'), 'energy': r['energy_level']['level'],
                  'focus': tag(r), 'moon': f"{r['facts']['moon_sign']}, {r['facts']['nakshatra']}",
                  'score': r['facts']['score']} for d, r in days]
    ranked = sorted(days, key=lambda x: x[1]['facts']['score'])
    worst, best = ranked[0], ranked[-1]
    even = worst[1]['facts']['score'] == best[1]['facts']['score']

    def why(r: Dict[str, Any]) -> str:
        f = r['facts']
        return f"Moon is {_ord(f['from_moon'])} from your natal Moon ({f['tara']} tara)"

    sections: Dict[str, Any] = {}
    for key, (label, verb, _houses) in AREAS.items():
        by = sorted(days, key=lambda x: x[1]['categories'][key]['rating'])
        lo, hi = by[0], by[-1]
        lo_r, hi_r = lo[1]['categories'][key]['rating'], hi[1]['categories'][key]['rating']
        if lo_r == hi_r:
            summary = f"{label} {verb} even through the week ({hi_r} of 5 each day); no single day stands out."
        else:
            good_days = [d.strftime('%A') for d, r in days if r['categories'][key]['rating'] == hi_r]
            hard_days = [d.strftime('%A') for d, r in days if r['categories'][key]['rating'] == lo_r]
            hi = next(x for x in days if x[1]['categories'][key]['rating'] == hi_r)
            lo = next(x for x in days if x[1]['categories'][key]['rating'] == lo_r)
            summary = (f"Best on {_join(good_days)} ({hi_r} of 5): on {good_days[0]} the {why(hi[1])}. "
                       f"Go gently on {_join(hard_days)} ({lo_r} of 5): on {hard_days[0]} the {why(lo[1])}.")
        sections[key] = {'summary': summary, 'key_day': None if lo_r == hi_r else hi[0].strftime('%A'),
                         'rating': round(sum(r['categories'][key]['rating'] for _d, r in days) / 7)}

    first, last = days[0][1]['facts'], days[-1][1]['facts']
    route = f"The Moon travels from {first['moon_sign']} to {last['moon_sign']}"
    if first['house'] and last['house']:
        route += f", your {_ord(first['house'])} to your {_ord(last['house'])} house"
    ashtama = [d.strftime('%A') for d, r in days if r['facts']['from_moon'] == 8]
    summary = route + '.'
    if ashtama:
        summary += f" Chandrashtama falls on {_join(ashtama)}: keep those days for routine work."
    dasha = dasha_in(natal, start, end, True)
    guidance = [transit_line(transit_state(p, natal, tsigns, bav)) for p in ('Jupiter', 'Saturn')]
    if dasha['running']:
        guidance.insert(0, f"Running dasha: {dasha['running']}.")
    title = 'An even week' if even else f"Strongest on {best[0].strftime('%A')}; go gently on {worst[0].strftime('%A')}"
    return {
        'week_start': monday.isoformat(), 'week_end': (monday + timedelta(days=6)).isoformat(),
        'zodiac_sign': chart.get('zodiac_sign'),
        'weekly_theme': {'title': title, 'summary': summary},
        'sections': sections, 'daily_summaries': summaries,
        'best_day': best[0].strftime('%A'), 'challenging_day': worst[0].strftime('%A'),
        'important_dates': _events(tz, start, end, natal, MONTHLY, True, True),
        'weekly_mantra': planet_mantra(dasha['antar']) if dasha['antar'] else days[0][1]['categories']['spiritual']['mantra'],
        'bhrigu_guidance': ' '.join(guidance),
        'method': 'Seven daily readings, each taken at local noon; dates found on Swiss Ephemeris positions.',
        'metadata': _meta(chart, {'dasha': dasha['running']}),
    }


# ---------------------------------------------------------------------------
# Month
# ---------------------------------------------------------------------------

def monthly_reading(chart: Dict[str, Any], year: Optional[int] = None, month: Optional[int] = None,
                    client_tz: Optional[str] = None) -> Optional[Dict[str, Any]]:
    natal = D._natal(chart)
    if not natal or not E.SWISSEPH_AVAILABLE:
        return None
    tz = _zone(chart, client_tz)
    now = E.utcnow().astimezone(tz)
    year, month = year or now.year, month or now.month
    n_days = calendar.monthrange(year, month)[1]
    first = date(year, month, 1)
    start, end = _utc(tz, first, 0), _utc(tz, first + timedelta(days=n_days), 0)
    mid = _utc(tz, date(year, month, 15))
    bav = _bav(natal)
    tsigns = _signs_at(mid)
    moon_sign = int(natal['lons']['Moon'] // 30)

    states = {p: transit_state(p, natal, tsigns, bav) for p in MONTHLY}
    transits = [transit_line(states[p]) for p in ('Sun', 'Jupiter', 'Saturn', 'Mars', 'Venus', 'Mercury', 'Rahu')]
    sections = {k: v for k in AREAS if (v := area_section(k, natal, tsigns, MONTHLY, bav, 'this month'))}
    for sec in sections.values():
        sec.pop('basis', None)

    scored = []
    for i in range(n_days):
        d = first + timedelta(days=i)
        f = D.daily_facts(chart, _utc(tz, d), tz)
        if f:
            scored.append((d, f))
    power = [{'date': d.isoformat(), 'reason': f"{f['tara']} tara, Moon {_ord(f['from_moon'])} from your natal Moon"}
             for d, f in scored if f['score'] >= 4 and f['from_moon'] != 8][:8]
    eighth = (moon_sign + 7) % 12
    caution = [{'date': _day(a, tz), 'until': _day(b - timedelta(minutes=1), tz),
                'reason': f"Chandrashtama: Moon in {SIGNS[eighth]} "
                          + (f"until {_nice(b, tz)}" if a <= start else f"from {_nice(a, tz)}" if b >= end
                             else f"from {_nice(a, tz)} to {_nice(b, tz)}")}
               for a, b, s in sign_spans('Moon', start, end) if s == eighth]

    sun = states['Sun']
    dasha = dasha_in(natal, start, end, True)
    title = (f"Sun {_ord(sun['from_moon'])} from your Moon: "
             + ('a month that favours effort and recognition' if sun['good'] and not sun['blockers']
                else 'a month for steady work rather than display'))
    summary = transits[0]
    guidance = []
    if dasha['running']:
        guidance.append(f"Running dasha: {dasha['running']}.")
        if dasha['antar'] and states.get(dasha['antar']):
            st = states[dasha['antar']]
            guidance.append(f"Your antardasha lord {dasha['antar']} transits {SIGNS[st['sign']]}, "
                            f"{_ord(st['from_moon'])} from your Moon, "
                            + ('which helps its period deliver.' if st['good'] and not st['blockers']
                               else 'so its period works through effort this month.'))
    year_house = bcp(natal, mid)
    if year_house:
        guidance.append(f"By Bhrigu Chakra Paddhati, {year_house['text']}.")
    return {
        'month': month, 'year': year, 'month_name': calendar.month_name[month], 'zodiac_sign': chart.get('zodiac_sign'),
        'monthly_theme': {'title': title, 'summary': summary},
        'sections': sections, 'transits': transits[1:],
        'important_dates': _events(tz, start, end, natal, MONTHLY, True, True),
        'power_days': power, 'caution_days': caution,
        'monthly_mantra': planet_mantra(dasha['antar']) if dasha['antar'] else planet_mantra('Sun'),
        'monthly_ritual': None,
        'bhrigu_guidance': ' '.join(guidance),
        'method': 'Planets judged at mid-month from your natal Moon and Lagna; every date found on Swiss Ephemeris positions.',
        'metadata': _meta(chart, {'dasha': dasha['running']}),
    }


# ---------------------------------------------------------------------------
# Year
# ---------------------------------------------------------------------------

def yearly_reading(chart: Dict[str, Any], year: Optional[int] = None,
                   client_tz: Optional[str] = None) -> Optional[Dict[str, Any]]:
    natal = D._natal(chart)
    if not natal or not E.SWISSEPH_AVAILABLE:
        return None
    tz = _zone(chart, client_tz)
    year = year or E.utcnow().astimezone(tz).year
    start, end = _utc(tz, date(year, 1, 1), 0), _utc(tz, date(year + 1, 1, 1), 0)
    bav = _bav(natal)
    moon_sign = int(natal['lons']['Moon'] // 30)

    def span_text(a: datetime, b: datetime) -> str:
        if a <= start and b >= end:
            return 'all year'
        if a <= start:
            return f"until {_nice(b, tz, False)}"
        if b >= end:
            return f"from {_nice(a, tz, False)}"
        return f"{_nice(a, tz, False)} to {_nice(b, tz, False)}"

    jup_spans = sign_spans('Jupiter', start, end)
    transits: List[str] = []
    sade: List[str] = []
    for p in ('Jupiter', 'Saturn', 'Rahu'):
        for a, b, _sign in (jup_spans if p == 'Jupiter' else sign_spans(p, start, end)):
            tsigns = _signs_at(a + (b - a) / 2)
            st = transit_state(p, natal, tsigns, bav, slow_only=True)
            transits.append(transit_line(st, span_text(a, b)))
            if p == 'Rahu':
                transits.append(transit_line(transit_state('Ketu', natal, tsigns, bav), span_text(a, b)))
            if p == 'Saturn' and st['from_moon'] in (12, 1, 2):
                phase = {12: 'first phase (12th from the Moon)', 1: 'peak phase (over the Moon)',
                         2: 'last phase (2nd from the Moon)'}[st['from_moon']]
                sade.append(f"Sade Sati, {phase}, {span_text(a, b)}")
            elif p == 'Saturn' and st['from_moon'] in (4, 8):
                name = 'Kantaka Shani (4th from the Moon)' if st['from_moon'] == 4 else 'Ashtama Shani (8th from the Moon)'
                sade.append(f"{name} {span_text(a, b)}")

    mid = _utc(tz, date(year, 7, 1))
    mid_signs = _signs_at(mid)
    # Jupiter changes sign within most years, so each area is judged once per stay.
    sections: Dict[str, Any] = {}
    for k in AREAS:
        groups: List[list] = []  # [from, to, signs, basis]; consecutive stays that read the same are merged
        for a, b, _sign in jup_spans:
            ts = _signs_at(a + (b - a) / 2)
            sec = area_section(k, natal, ts, SLOW, bav, '', use_lord=False)
            if not sec:
                break
            if groups and groups[-1][3] == sec['basis']:
                groups[-1][1] = b
            else:
                groups.append([a, b, ts, sec['basis']])
        done = [area_section(k, natal, ts, SLOW, bav, span_text(a, b), use_lord=False) for a, b, ts, _basis in groups]
        if done:
            sections[k] = {'summary': ' '.join(d['summary'] for d in done),
                           'rating': round(sum(d['rating'] for d in done) / len(done))}

    key_months = []
    for a, b, sign in sign_spans('Sun', start, end):
        from_moon = (sign - moon_sign) % 12 + 1
        kind = 'favourable' if from_moon in GOOD_FROM_MOON['Sun'] else 'caution' if from_moon in (8, 12) else None
        if kind:
            key_months.append({'period': f"{_nice(a, tz, False)} to {_nice(b, tz, False)}", 'kind': kind,
                               'note': f"Sun in {SIGNS[sign]}, {_ord(from_moon)} from your Moon: "
                                       + (GOOD['Sun'] if kind == 'favourable' else HARD['Sun'])})

    quarters = []
    for q in range(4):
        qa = _utc(tz, date(year, 3 * q + 1, 1), 0)
        qb = _utc(tz, date(year + (q == 3), (3 * q + 4 - 1) % 12 + 1, 1), 0)
        qmid = qa + (qb - qa) / 2
        qs = _signs_at(qmid)
        dq = dasha_in(natal, qmid, qmid, False)
        bits = []
        if dq['running']:
            bits.append(f"{dq['running']} period runs")
        for p in ('Jupiter', 'Saturn'):
            st = transit_state(p, natal, qs, bav, slow_only=True)
            bits.append(f"{p} in {SIGNS[st['sign']]} is {_ord(st['from_moon'])} from your Moon"
                        + (' (favourable)' if st['good'] and not st['blockers']
                           else ' (favourable house, obstructed)' if st['good'] else ''))
        quarters.append({'quarter': f"Q{q + 1}", 'label': f"{calendar.month_abbr[3 * q + 1]} to {calendar.month_abbr[3 * q + 3]}",
                         'summary': '; '.join(bits) + '.'})

    dasha = dasha_in(natal, start, end, False)
    guidance = []
    if dasha['running']:
        guidance.append(f"The year opens in the {dasha['running']} period.")
    y0, y1 = bcp(natal, start), bcp(natal, end - timedelta(days=1))
    if y0 and y1 and y0['running'] != y1['running']:
        birthday = natal['birth_utc'].astimezone(tz)
        turn = f"{birthday.day} {birthday.strftime('%b')}"
        guidance.append(f"By Bhrigu Chakra Paddhati, until your birthday on {turn}, {y0['text']}. From {turn}, {y1['text']}.")
    elif y1:
        guidance.append(f"By Bhrigu Chakra Paddhati, {y1['text']}.")
    guidance += [s + '.' for s in sade]

    jup = transit_state('Jupiter', natal, mid_signs, bav, slow_only=True)
    sat = transit_state('Saturn', natal, mid_signs, bav, slow_only=True)
    def route(planet: str) -> str:
        names = []
        for _a, _b, sg in sign_spans(planet, start, end):
            if not names or names[-1] != SIGNS[sg]:
                names.append(SIGNS[sg])
        return f"{planet} in {', then '.join(names)}"

    title = f"{route('Jupiter')}; {route('Saturn')}"
    tone = (f"At mid-year Jupiter is {_ord(jup['from_moon'])} and Saturn {_ord(sat['from_moon'])} from your Moon. ")
    tone += ('Both slow planets favour you.' if jup['good'] and sat['good']
            else 'Jupiter supports growth while Saturn asks for patience.' if jup['good']
            else 'Saturn rewards discipline while Jupiter gives less than usual.' if sat['good']
            else 'Neither is in a favourable house: build steadily and rely on the dasha lords.')
    return {
        'year': year, 'zodiac_sign': chart.get('zodiac_sign'),
        'yearly_theme': {'title': title, 'summary': tone},
        'sections': sections, 'transits': transits, 'quarters': quarters, 'key_months': key_months,
        'important_dates': _events(tz, start, end, natal, ('Jupiter', 'Saturn', 'Rahu', 'Mars'), False, False),
        'yearly_mantra': planet_mantra(dasha['maha']) if dasha['maha'] else planet_mantra('Jupiter'),
        'annual_ritual': None,
        'bhrigu_guidance': ' '.join(guidance),
        'method': 'Slow planets judged from your natal Moon and Lagna for each stay in a sign; every date found on Swiss Ephemeris positions.',
        'metadata': _meta(chart, {'dasha': dasha['running']}),
    }
