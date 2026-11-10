"""
Daily reading by the classical daily method — computed, never templated.

For one moment in time and one birth chart it works out:

  panchanga   tithi (and its class), nakshatra with pada, nitya yoga, weekday lord
  tara bala   the day's star counted from the birth star (9 taras)
  chandra bala the transit Moon counted from the natal Moon (Phaladeepika ch. 26)
  house       the transit Moon's house from the Lagna
  Nadi links  natal planets the Moon joins by sign, trine or opposition
              (Bhrigu Nandi Nadi reads a transit through the natal planets it meets)
  strength    the Moon's own Ashtakavarga bindus in the sign it transits
  dasha       running maha / antar / pratyantar lords

Everything a user reads on the Today page is a sentence built from these facts.
The day counts from the given moment; a location is needed only for clock-time
items (horas, Rahu kalam), which are returned only when one is supplied.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from services import ephemeris_core as E
from services.mantras import planet_mantra

SIGNS = E.SIGNS
NAK_SPAN = 360.0 / 27.0

TITHI_NAMES = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
               'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi']
TITHI_CLASS = ['Nanda', 'Bhadra', 'Jaya', 'Rikta', 'Purna']
TITHI_CLASS_USE = {
    'Nanda': 'good for celebrations, learning and pleasant work',
    'Bhadra': 'good for steady, lasting work: home, health, agreements',
    'Jaya': 'good for effort that needs courage: competition, negotiation, travel',
    'Rikta': 'an "empty" tithi: finish, clear and repay rather than begin',
    'Purna': 'a "full" tithi: good for completing and for all auspicious work',
}
YOGAS = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula',
         'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan',
         'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti']
HARSH_YOGAS = {'Vishkambha', 'Atiganda', 'Shula', 'Ganda', 'Vyaghata', 'Vajra', 'Vyatipata', 'Parigha', 'Vaidhriti'}

# Tara bala: count from the birth star to the day's star, divide by 9.
TARAS = [
    ('Janma', 0, 'the birth star returns: a sensitive day for body and mind; keep routines simple'),
    ('Sampat', 2, 'the star of wealth: good for money matters, purchases and beginnings'),
    ('Vipat', -2, 'the star of danger: avoid risk, new ventures and disputes'),
    ('Kshema', 2, 'the star of well-being: good for health, home and steady progress'),
    ('Pratyari', -2, 'the star of obstacles: expect opposition; do not force outcomes'),
    ('Sadhaka', 2, 'the star of accomplishment: efforts succeed; good for important work'),
    ('Vadha', -3, 'the harshest star: postpone major decisions, travel and confrontations'),
    ('Mitra', 2, 'the friendly star: good for meetings, partnerships and requests'),
    ('Ati-Mitra', 2, 'the most friendly star: support comes easily; good for all undertakings'),
]

# Moon's transit counted from the natal Moon (results per Phaladeepika ch. 26).
CHANDRA = {
    1: (1, 'comfort, good food and ease of mind'),
    2: (0, 'expenses and a need to guard speech and reputation'),
    3: (2, 'success in effort, courage and gains'),
    4: (-1, 'unease at home or in the mind; keep expectations low'),
    5: (0, 'worry and obstacles in plans; think before deciding'),
    6: (2, 'good health and the upper hand over rivals and debts'),
    7: (2, 'respect, pleasant company and gain through others'),
    8: (-3, 'Chandrashtama: mental strain and mishaps; the weakest two and a quarter days of the month'),
    9: (0, 'fatigue and delays; duties feel heavy'),
    10: (2, 'success and recognition in work'),
    11: (2, 'gains, good news and fulfilled wishes'),
    12: (-1, 'expenses, tiredness and a need for rest'),
}
HOUSE_TOPIC = {
    1: 'yourself, body and appearance', 2: 'money, food, speech and family', 3: 'effort, messages, short trips and siblings',
    4: 'home, mother, vehicle and inner peace', 5: 'children, study, advice and creative work',
    6: 'work routines, health, debts and rivals', 7: 'spouse, partners and dealings with others',
    8: 'shared money, hidden matters and sudden changes', 9: 'fortune, teachers, father and long journeys',
    10: 'career, duty and public standing', 11: 'income, friends and wishes', 12: 'expenses, sleep, retreat and foreign matters',
}
PLANET_THEME = {
    'Sun': 'authority, father and vitality', 'Moon': 'mind, mother and emotions', 'Mars': 'drive, property and siblings',
    'Mercury': 'speech, study and trade', 'Jupiter': 'wisdom, teachers, children and wealth',
    'Venus': 'love, comfort and the arts', 'Saturn': 'work, duty and patience',
    'Rahu': 'ambition and the unfamiliar', 'Ketu': 'detachment and insight',
}
WEEKDAY = ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Sun']  # Python weekday(): Monday = 0
DAY_COLOUR = {'Sun': 'Red or saffron', 'Moon': 'White', 'Mars': 'Red', 'Mercury': 'Green', 'Jupiter': 'Yellow',
              'Venus': 'White or pastel', 'Saturn': 'Dark blue or black'}
DAY_DIRECTION = {'Sun': 'East', 'Moon': 'North-west', 'Mars': 'South', 'Mercury': 'North', 'Jupiter': 'North-east',
                 'Venus': 'South-east', 'Saturn': 'West'}
RAHU_KALAM_PART = [2, 7, 5, 6, 4, 3, 8]  # Monday..Sunday: which eighth of the day


def _ordinal(n: int) -> str:
    return f"{n}{'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"


def _moon_lon(dt: datetime) -> float:
    return E.planet_positions(dt)['Moon']['longitude']


def _next_boundary(start: datetime, span: float) -> datetime:
    """When the Moon next crosses a multiple of ``span`` degrees (bisection, to the minute)."""
    lon0 = _moon_lon(start)
    target = (int(lon0 // span) + 1) * span

    def gone(dt: datetime) -> bool:
        travelled = (_moon_lon(dt) - lon0) % 360.0
        return travelled >= target - lon0

    lo, hi = start, start + timedelta(hours=6)
    while not gone(hi):
        lo, hi = hi, hi + timedelta(hours=6)
        if hi - start > timedelta(days=4):
            return hi
    while hi - lo > timedelta(minutes=1):
        mid = lo + (hi - lo) / 2
        if gone(mid):
            hi = mid
        else:
            lo = mid
    return hi


def _pratyantar(birth_utc: datetime, natal_moon: float, now: datetime) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    periods = E.vimshottari(birth_utc, natal_moon)
    maha, antar = E.current_dasha(periods, now)
    if not maha or not antar:
        return (maha.maha if maha else None), None, None
    span = (antar.end - antar.start).total_seconds()
    k = E.DASHA_SEQ.index(antar.antar)
    t = antar.start
    praty = None
    for m in range(9):
        lord = E.DASHA_SEQ[(k + m) % 9]
        end = t + timedelta(seconds=span * E.DASHA_YEARS[lord] / 120.0)
        if t <= now < end:
            praty = lord
            break
        t = end
    return maha.maha, antar.antar, praty


def _fmt_local(dt: datetime, tz) -> str:
    local = dt.astimezone(tz) if tz else dt
    return local.strftime('%a %H:%M')


def _natal(chart: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    planets = chart.get('planets') or {}
    lons = {p: float(v['longitude']) % 360.0 for p, v in planets.items()
            if isinstance(v, dict) and isinstance(v.get('longitude'), (int, float))}
    if 'Moon' not in lons:
        return None
    asc = chart.get('ascendant')
    asc_sign = None
    if isinstance(asc, dict):
        if isinstance(asc.get('degree'), (int, float)):
            asc_sign = int(float(asc['degree']) % 360 // 30)
        elif asc.get('sign') in SIGNS:
            asc_sign = SIGNS.index(asc['sign'])
    elif asc in SIGNS:
        asc_sign = SIGNS.index(asc)
    birth_utc = None
    iso = (chart.get('birth_details') or {}).get('utc')
    if iso:
        try:
            birth_utc = datetime.fromisoformat(iso)
            if birth_utc.tzinfo is None:
                birth_utc = birth_utc.replace(tzinfo=timezone.utc)
        except ValueError:
            birth_utc = None
    return {'lons': lons, 'asc_sign': asc_sign, 'birth_utc': birth_utc}


def daily_facts(chart: Dict[str, Any], when: datetime, tz=None) -> Optional[Dict[str, Any]]:
    """All computed facts for ``when`` (aware UTC datetime). None if the chart lacks positions."""
    natal = _natal(chart)
    if not natal or not E.SWISSEPH_AVAILABLE:
        return None
    lons, asc_sign = natal['lons'], natal['asc_sign']
    pos = E.planet_positions(when)
    moon, sun = pos['Moon']['longitude'], pos['Sun']['longitude']

    moon_sign = int(moon // 30)
    nak_i = min(int(moon / NAK_SPAN), 26)
    nak, pada, nak_lord = E.nakshatra_of(moon)
    nak_until = _next_boundary(when, NAK_SPAN)
    sign_until = _next_boundary(when, 30.0)

    elong = (moon - sun) % 360.0
    t = int(elong // 12)  # 0..29
    paksha = 'Shukla' if t < 15 else 'Krishna'
    in_paksha = t % 15  # 0..14
    tithi_name = ('Purnima' if t == 14 else 'Amavasya') if in_paksha == 14 else TITHI_NAMES[in_paksha]
    tithi_class = TITHI_CLASS[in_paksha % 5]
    yoga = YOGAS[min(int(((sun + moon) % 360.0) / NAK_SPAN), 26)]

    local = when.astimezone(tz) if tz else when
    day_lord = WEEKDAY[local.weekday()]

    natal_moon = lons['Moon']
    natal_nak_i = min(int(natal_moon / NAK_SPAN), 26)
    tara_i = (nak_i - natal_nak_i) % 9
    tara_name, tara_score, tara_text = TARAS[tara_i]

    from_moon = (moon_sign - int(natal_moon // 30)) % 12 + 1
    chandra_score, chandra_text = CHANDRA[from_moon]
    house = (moon_sign - asc_sign) % 12 + 1 if asc_sign is not None else None

    links: List[Tuple[str, str]] = []
    for p, lon in lons.items():
        rel = (int(lon // 30) - moon_sign) % 12
        if rel == 0:
            links.append((p, 'joins'))
        elif rel in (4, 8):
            links.append((p, 'is in trine to'))
        elif rel == 6:
            links.append((p, 'opposes'))

    bindus = None
    try:
        from services.bhrigu_nadi_rules import GRAHAS7, bhinnashtakavarga
        signs = {p: int(lons[p] // 30) for p in GRAHAS7 if p in lons}
        if len(signs) == 7 and asc_sign is not None:
            bindus = bhinnashtakavarga(signs, asc_sign)['Moon'][moon_sign]
    except Exception:
        bindus = None

    maha = antar = praty = None
    if natal['birth_utc']:
        maha, antar, praty = _pratyantar(natal['birth_utc'], natal_moon, when)

    score = tara_score + chandra_score
    if bindus is not None:
        score += 1 if bindus >= 5 else -1 if bindus <= 3 else 0
    if tithi_class == 'Rikta' or tithi_name == 'Amavasya':
        score -= 1
    if yoga in HARSH_YOGAS:
        score -= 1
    if day_lord in (antar, praty):
        score += 1

    return {
        'when': when, 'tz': tz, 'local': local,
        'moon_sign': SIGNS[moon_sign], 'nakshatra': nak, 'pada': pada, 'nakshatra_lord': nak_lord,
        'nakshatra_until': nak_until, 'sign_until': sign_until,
        'tithi': f"{paksha} {tithi_name}", 'tithi_name': tithi_name, 'tithi_class': tithi_class, 'paksha': paksha,
        'yoga': yoga, 'day_lord': day_lord,
        'tara': tara_name, 'tara_text': tara_text, 'tara_score': tara_score,
        'from_moon': from_moon, 'chandra_text': chandra_text, 'chandra_score': chandra_score,
        'house': house, 'links': links, 'bindus': bindus,
        'maha': maha, 'antar': antar, 'pratyantar': praty,
        'score': score, 'natal_lons': lons, 'asc_sign': asc_sign,
    }


def _level(score: int) -> Tuple[str, int]:
    if score >= 3:
        return 'Favourable', min(100, 70 + 6 * (score - 3))
    if score >= 0:
        return 'Mixed', 50 + 6 * score
    return 'Go gently', max(10, 44 + 8 * score)


def _rating(base: int, delta: int) -> int:
    return max(1, min(5, base + delta))


def daily_reading(chart: Dict[str, Any], when: Optional[datetime] = None, tz=None,
                  place: Optional[Tuple[float, float, str]] = None) -> Optional[Dict[str, Any]]:
    """The Today reading. ``place`` = (lat, lon, tzname) enables clock-time items."""
    when = when or E.utcnow()
    f = daily_facts(chart, when, tz)
    if not f:
        return None
    level, pct = _level(f['score'])
    base = 4 if f['score'] >= 3 else 3 if f['score'] >= 0 else 2
    house, from_moon = f['house'], f['from_moon']
    linked = {p for p, _ in f['links']}
    until_nak = _fmt_local(f['nakshatra_until'], tz)
    until_sign = _fmt_local(f['sign_until'], tz)

    headline = (f"The Moon is in {f['moon_sign']} ({f['nakshatra']}, pada {f['pada']}), "
                f"{_ordinal(from_moon)} from your natal Moon — {f['chandra_text']}.")
    tara_line = f"Tara bala is {f['tara']} — {f['tara_text']}."
    # Chandra bala and tara bala are read together; when they disagree the day is mixed.
    if from_moon == 8 and f['tara_score'] > 0:
        tara_line += ' Chandrashtama outweighs the good star: keep to routine matters.'
    elif f['chandra_score'] > 0 > f['tara_score']:
        tara_line += ' The Moon is well placed but the star is not: act, but with care.'
    elif f['tara_score'] > 0 > f['chandra_score']:
        tara_line += ' The star helps but the Moon is weak: modest goals succeed.'
    house_line = (f"From your Lagna the Moon crosses the {_ordinal(house)} house, so the day turns on "
                  f"{HOUSE_TOPIC[house]}." if house else '')

    link_line = ''
    if f['links']:
        parts = [f"{verb} your natal {p} ({PLANET_THEME[p]})" for p, verb in f['links'][:4]]
        link_line = "In Nadi reading the transit Moon " + '; '.join(parts) + ", bringing those matters forward today."

    def area(houses_good, houses_hard, karakas, good_moon, hard_moon, topic) -> Dict[str, Any]:
        delta = 0
        reasons = []
        if from_moon in good_moon:
            delta += 1
            reasons.append(f"Moon {_ordinal(from_moon)} from natal Moon supports {topic}")
        if from_moon in hard_moon:
            delta -= 1
            reasons.append(f"Moon {_ordinal(from_moon)} from natal Moon weighs on {topic}")
        if house in houses_good:
            delta += 1
            reasons.append(f"it lights your {_ordinal(house)} house")
        if house in houses_hard:
            delta -= 1
            reasons.append(f"it sits in your {_ordinal(house)} house")
        touched = [k for k in karakas if k in linked]
        if touched:
            names = touched[0] if len(touched) == 1 else ', '.join(touched[:-1]) + ' and ' + touched[-1]
            reasons.append(f"it meets natal {names}")
        rating = _rating(base, delta)
        plural = topic.endswith('s')
        tone = (('are' if plural else 'is') + ' well supported' if rating >= 4
                else ('are' if plural else 'is') + ' steady' if rating == 3
                else ('need' if plural else 'needs') + ' care')
        message = (f"{topic.capitalize()} {tone} today"
                   + (': ' + '; '.join(reasons) + '.' if reasons else ': no direct trigger from the Moon; follow the general tone of the day.'))
        return {'rating': rating, 'message': message}

    career = area((10, 6, 11, 2), (8, 12), ('Sun', 'Saturn', 'Mercury'), (3, 6, 10, 11), (4, 8, 12), 'work')
    love = area((7, 5, 11), (6, 8, 12), ('Venus', 'Jupiter'), (1, 7, 11), (4, 8, 12), 'relationships')
    health = area((1, 6), (8, 12), ('Sun', 'Mars'), (1, 6), (8, 12, 4), 'health')
    finance = area((2, 11, 5, 9), (8, 12), ('Jupiter', 'Venus'), (3, 11, 10), (2, 12, 8), 'money matters')

    good_tara = f['tara_score'] > 0
    career['advice'] = ('Take up the important task and ask for what you need.' if career['rating'] >= 4
                        else 'Clear routine and pending work; hold new proposals for a better star.' if career['rating'] <= 2
                        else 'Proceed with planned work; avoid forcing decisions.')
    love['advice'] = ('A good day to meet, talk things through and make plans together.' if love['rating'] >= 4
                      else 'Listen more than you speak; postpone sensitive conversations.' if love['rating'] <= 2
                      else 'Keep contact warm and simple.')
    health['advice'] = ('Energy is good: exercise and start health routines.' if health['rating'] >= 4
                        else 'Rest, eat light and avoid strain or risky travel.' if health['rating'] <= 2
                        else 'Keep regular meals and sleep.')
    finance['advice'] = ('Favourable for purchases, collections and planned investment.' if finance['rating'] >= 4
                         else 'Avoid lending, large purchases and speculation today.' if finance['rating'] <= 2
                         else 'Routine transactions only; check details twice.')

    tithi_line = f"{f['tithi']} tithi ({f['tithi_class']}): {TITHI_CLASS_USE[f['tithi_class']]}."
    if f['tithi_name'] == 'Ekadashi':
        tithi_line += ' Ekadashi favours fasting and worship of Vishnu.'
    elif f['tithi_name'] == 'Amavasya':
        tithi_line = "Amavasya (new Moon): honour ancestors, give in charity; do not begin new ventures."
    elif f['tithi_name'] == 'Purnima':
        tithi_line += ' Purnima favours worship, charity and gatherings.'
    spiritual = {
        'rating': 4 if f['tithi_name'] in ('Ekadashi', 'Purnima', 'Amavasya') else 3,
        'message': tithi_line,
        'mantra': planet_mantra(f['day_lord']),
        'practice': f"{f['day_lord']} rules the day: recite its mantra 108 times; nakshatra lord is {f['nakshatra_lord']}.",
    }

    do_list, dont_list = [], []
    weak_moon = from_moon == 8
    if good_tara and not weak_moon:
        do_list.append(f"Use the {f['tara']} tara for the work that matters most to you")
    elif good_tara:
        pass
    else:
        dont_list.append(f"{f['tara']} tara: avoid starting new ventures, signing or confronting; finish what is pending")
    if from_moon == 8:
        dont_list.append(f"Chandrashtama until {until_sign}: no major decisions, arguments or risky travel")
    elif f['chandra_score'] > 0:
        do_list.append(f"Act on {CHANDRA[from_moon][1].split(';')[0]} while the Moon stays in {f['moon_sign']} (until {until_sign})")
    if house:
        do_list.append(f"Give time to {HOUSE_TOPIC[house]}")
    if f['tithi_class'] == 'Rikta' or f['tithi_name'] == 'Amavasya':
        dont_list.append('Do not begin long-term undertakings on this tithi; clear, repay and complete instead')
    elif not weak_moon:
        do_list.append(f"{f['tithi_class']} tithi: {TITHI_CLASS_USE[f['tithi_class']]}")
    if f['yoga'] in HARSH_YOGAS:
        dont_list.append(f"{f['yoga']} yoga: keep important starts for another day")
    if f['bindus'] is not None and f['bindus'] <= 3:
        dont_list.append(f"The Moon has only {f['bindus']} of 8 bindus in {f['moon_sign']}: do not over-commit")
    do_list.append(f"Recite {planet_mantra(f['day_lord'])} ({f['day_lord']}'s day)")

    dasha_line = ''
    if f['maha']:
        chain = ' – '.join(x for x in (f['maha'], f['antar'], f['pratyantar']) if x)
        dasha_line = f"Running dasha: {chain}."
        if f['day_lord'] in (f['antar'], f['pratyantar']):
            dasha_line += f" Today's lord {f['day_lord']} is one of your running period lords, so the day carries extra weight."

    lucky: Dict[str, Any] = {'color': DAY_COLOUR[f['day_lord']], 'direction': DAY_DIRECTION[f['day_lord']]}
    if place:
        lat, lon, tzname = place
        times = E.sunrise_sunset(f['local'].date(), lat, lon, tzname)
        if times:
            rise, sset = times
            hora = (sset - rise) / 12
            lucky['auspicious_hours'] = [E.fmt_hora((rise + hora * k, rise + hora * (k + 1))) for k in (0, 7)]
            part = (sset - rise) / 8
            n = RAHU_KALAM_PART[f['local'].weekday()] - 1
            lucky['rahu_kalam'] = E.fmt_hora((rise + part * n, rise + part * (n + 1)))
            lucky['sunrise'] = rise.strftime('%H:%M')
            lucky['sunset'] = sset.strftime('%H:%M')

    panchanga = {
        'tithi': f['tithi'], 'tithi_class': f['tithi_class'],
        'nakshatra': f"{f['nakshatra']} (pada {f['pada']})", 'nakshatra_until': until_nak,
        'moon_sign': f['moon_sign'], 'moon_sign_until': until_sign,
        'yoga': f['yoga'], 'day_lord': f['day_lord'],
        'tara_bala': f['tara'], 'chandra_bala': f"{_ordinal(from_moon)} from natal Moon",
        'moon_house': house, 'moon_bindus': f['bindus'],
        'dasha': ' – '.join(x for x in (f['maha'], f['antar'], f['pratyantar']) if x) or None,
    }
    summary = ' '.join(x for x in (headline, tara_line, house_line) if x)
    return {
        'date': f['local'].strftime('%Y-%m-%d'),
        'day_of_week': f['local'].strftime('%A'),
        'day_ruler': {'planet': f['day_lord'], 'color': DAY_COLOUR[f['day_lord']]},
        'energy_level': {'level': level, 'score': pct, 'description': summary},
        'overall': summary,
        'nadi_note': link_line,
        'dasha_note': dasha_line,
        'categories': {'career': career, 'love': love, 'health': health, 'finance': finance, 'spiritual': spiritual},
        'do_list': do_list[:5],
        'dont_list': dont_list[:4],
        'lucky_elements': lucky,
        'panchanga': panchanga,
        'facts': {'score': f['score'], 'from_moon': from_moon, 'tara': f['tara'], 'tara_score': f['tara_score'],
                  'house': house, 'moon_sign': f['moon_sign'], 'nakshatra': f['nakshatra']},
        'method': ('Computed for this moment from the Moon\'s transit against your birth chart: tithi, nakshatra, '
                   'tara bala, chandra bala, house from Lagna, Nadi links, Ashtakavarga bindus and running dasha.'),
    }


def reading_for(chart: Dict[str, Any], target_date: Optional[datetime] = None,
                client_tz: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Resolve the moment and the user's time zone, then build the reading.

    No date: this very moment. A date: local noon of that day. Clock-time items
    (horas, Rahu kalam) are added only when the user's zone is the birth zone,
    since that is the only place whose sunrise we can compute.
    """
    import pytz
    details = chart.get('birth_details') or {}
    tz = None
    for name in (client_tz, details.get('timezone')):
        if name:
            try:
                tz = pytz.timezone(str(name))
                break
            except Exception:
                continue
    if target_date is None:
        when = E.utcnow()
    else:
        noon = datetime(target_date.year, target_date.month, target_date.day, 12, 0)
        when = (tz.localize(noon) if tz else noon.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)
    place = None
    lat, lon, birth_tz = details.get('latitude'), details.get('longitude'), details.get('timezone')
    if lat is not None and lon is not None and birth_tz and (not client_tz or client_tz == birth_tz):
        place = (float(lat), float(lon), str(birth_tz))
    return daily_reading(chart, when, tz, place)
