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

SPECIAL_ASPECTS = {'Mars': (4, 8), 'Jupiter': (5, 9), 'Saturn': (3, 10)}


def aspects_from(planet: str, from_sign: int, target_sign: int) -> bool:
    rel = (target_sign - from_sign) % 12 + 1
    return rel == 7 or rel in SPECIAL_ASPECTS.get(planet, ())


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


def rule_karakas(c: Chart) -> List[Dict[str, Any]]:
    cand = {p: c.lon[p] % 30 for p in GRAHAS7 if p in c.lon}
    if len(cand) < 7:
        return []
    ordered = sorted(cand, key=cand.get, reverse=True)
    ak, dk = ordered[0], ordered[-1]
    ak_h12 = (c.sign(ak) + 11) % 12
    text = (f"Atmakaraka {c.desc(ak)}; Amatyakaraka {ordered[1]}; "
            f"Darakaraka {c.desc(dk)}. 12th from Atmakaraka: {SIGNS[ak_h12]}"
            f"{' with ' + ', '.join(c.occupants(ak_h12)) if c.occupants(ak_h12) else ' (empty)'}")
    return [_f('F-KARAKA-01', 'classical', 'Jaimini chara karakas (7-karaka scheme)', text,
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
                    note = f"; neecha-bhanga: {', '.join(cancel)} in a kendra from Lagna"
            out.append(_f('F-DIGNITY-01', 'classical', 'Graha dignity', f"{c.desc(p)} — {state}{note}",
                          [ALL], 0.6))
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
        for hx in dict.fromkeys([h, hh]):
            occ = c.occupants(c.house_sign(hx))
            lord = c.lord_of_house(hx)
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
        for h in houses:
            sig.add(c.lord_of_house(h))
            sig.update(c.occupants(c.house_sign(h)))
        scored = []
        for p in periods:
            if p.end <= now or p.start >= horizon:
                continue
            score = (p.maha in sig) + (p.antar in sig)
            if score >= 2 or (score == 1 and p.antar in sig and p.antar in karakas):
                scored.append((score, p))
        scored.sort(key=lambda sp: (-sp[0], sp[1].start))
        picks = sorted((p for _s, p in scored[:3]), key=lambda p: p.start)
        if picks:
            out.append(_f('F-DASHA-03', 'classical', f'Dasha windows for {label} (BS-216/224/231/236)',
                          f"{label.capitalize()} significators {', '.join(sorted(sig))}; strongest periods: "
                          + '; '.join(f"{p.label()} {_span(max(p.start, now), p.end)}" for p in picks),
                          categories, 0.8, timing=_span(max(picks[0].start, now), picks[0].end),
                          start=max(picks[0].start, now), end=picks[0].end, house_based=True))
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
        out.append(_f('F-SADESATI-01', 'classical', 'Sade Sati — Saturn 12th/1st/2nd from Moon',
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
        out.append(_f('F-GOCHARA-01', 'classical', 'Jupiter transit from Moon (Phaladeepika ch. 26)',
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
    return [_f('F-BCP-01', 'tradition-attributed', 'Bhrigu Chakra Paddhati (one house per year from Lagna)',
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
        naks = []
        for hours in (-12, 0, 12):
            moon = E.planet_positions(c.birth_utc + timedelta(hours=hours))['Moon']['longitude']
            nak = E.nakshatra_of(moon)
            naks.append(f"{nak[0]} ({nak[2]} dasha)")
        naks = list(dict.fromkeys(naks))
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
    cand = {p: c.lon[p] % 30 for p in GRAHAS7 if p in c.lon}
    if len(cand) == 7:
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
        out.append(_f('F-YOGA-04', 'classical', 'Kemadruma — no planet 2nd/12th from Moon (Brihat Jataka, Chandra-yoga chapter)',
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
    for dom in domains[:2]:
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
    return out


def rule_moksha(c: Chart) -> List[Dict[str, Any]]:
    marks = []
    if 'Ketu' in c.lon and c.house('Ketu') == 12:
        marks.append('Ketu in the 12th')
    if 'Jupiter' in c.lon and (c.house('Jupiter') == 12 or c.aspects_sign('Jupiter', c.house_sign(12))):
        marks.append('Jupiter influences the 12th')
    l12 = c.lord_of_house(12)
    if l12 in c.lon and c.house(l12) in (1, 4, 5, 7, 9, 10, 12):
        marks.append(f"12th lord {l12} in {_ordinal(c.house(l12))}")
    cand = {p: c.lon[p] % 30 for p in GRAHAS7 if p in c.lon}
    if len(cand) == 7:
        ak = max(cand, key=cand.get)
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
    for dom in domains[:3]:
        h = DOMAINS[dom][0][0]
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
    return out


def rule_saturn_gochara(c: Chart, now: datetime) -> List[Dict[str, Any]]:
    """Saturn from the Moon: good in 3/6/11; Kantaka (4th) and Ashtama (8th) Shani (Phaladeepika ch. 26)."""
    if not E.SWISSEPH_AVAILABLE:
        return []
    ms = c.sign('Moon')
    sat = E.sign_index(E.planet_positions(now)['Saturn']['longitude'])
    rel = (sat - ms) % 12 + 1
    tone = 'supportive' if rel in (3, 6, 11) else 'demanding'
    out = [_f('F-GOCHARA-02', 'classical', 'Saturn transit from Moon (Phaladeepika ch. 26)',
              f"Saturn in {SIGNS[sat]} = {_ordinal(rel)} from the Moon — {tone} period for effort and results",
              [ALL], 0.5, start=now)]
    names = {(ms + 3) % 12: 'Kantaka Shani (4th from Moon)', (ms + 7) % 12: 'Ashtama Shani (8th from Moon)'}
    wins = [w for w in E.sign_windows('Saturn', set(names), now, now + timedelta(days=12 * 365), step_days=3) if w[1] >= now]
    if wins:
        a, b, sg = wins[0]
        out.append(_f('F-GOCHARA-03', 'classical', 'Kantaka / Ashtama Shani (Phaladeepika ch. 26)',
                      f"{names[sg]}: Saturn in {SIGNS[sg]} {_span(max(a, now), b)}" + (f"; then {names[wins[1][2]]} {_span(wins[1][0], wins[1][1])}" if len(wins) > 1 else ''),
                      ['present_life', 'predictions', 'life_events', 'karmic_remedies'], 0.6,
                      timing=_span(max(a, now), b), start=max(a, now), end=b))
    return out


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
    """Rank upcoming windows by how many dated rules overlap (F-WINDOW-01)."""
    dated = [f for f in findings if f.get('start') and f.get('end')
             and f['id'] not in ('F-DASHA-01', 'F-DASHA-02', 'F-BCP-01', 'F-WINDOW-01')]
    spans = []
    for f in dated:
        try:
            a, b = datetime.fromisoformat(f['start']), datetime.fromisoformat(f['end'])
        except ValueError:
            continue
        spans.append((a, b, f))
    scored = []
    for a, b, f in spans:
        overlap = [g for a2, b2, g in spans if g is not f and a2 <= b and b2 >= a]
        ids = sorted({f['id']} | {g['id'] for g in overlap})
        if len(ids) < 2:
            continue
        score = f['weight'] + sum(g['weight'] for g in overlap)
        scored.append((score, a, b, ids))
    if not scored:
        return []
    scored.sort(key=lambda x: (-x[0], x[1]))
    top: List[Tuple[datetime, datetime, List[str]]] = []
    for score, a, b, ids in scored:
        if any(a <= b2 and b >= a2 for a2, b2, _ in top):  # keep windows distinct
            continue
        top.append((a, b, ids))
        if len(top) == 3:
            break
    top.sort(key=lambda x: x[1])
    return [_f('F-WINDOW-01', 'modern', 'Ranked windows — overlapping dated rules',
               'Strongest windows: ' + '; '.join(f"{_span(a, b)} ({' + '.join(ids)})" for a, b, ids in top),
               categories, 0.85, timing=_span(top[0][0], top[0][1]),
               start=top[0][0], end=top[0][1])]


ACCURACY_NOTES = {
    'within_15': (0.85, ''),
    'within_hour': (0.6, ' [birth time ±1 h: house may shift]'),
    'unknown': (0.55, ' [houses from Moon]'),
}


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
                   now: Optional[datetime] = None, limit: int = 18) -> List[Dict[str, Any]]:
    """Run every rule, keep those relevant to ``category``, ranked by weight."""
    c = Chart(chart_facts, birth_data)
    if not c.ok():
        return []
    now = now or E.utcnow()
    domains = CATEGORY_DOMAINS.get(category, ['career', 'marriage'])
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
    ]
    findings: List[Dict[str, Any]] = []
    for rule in rules:
        try:
            findings.extend(rule())
        except Exception as e:  # one bad rule must not drop the rest
            logger.warning("Rule failed: %s", e)
    apply_time_accuracy(c, findings)
    relevant = [f for f in findings if ALL in f['categories'] or not category or category in f['categories']]
    try:
        relevant.extend(compose_windows(relevant, cats))
    except Exception as e:
        logger.warning("Window composer failed: %s", e)
    relevant.sort(key=lambda f: -f['weight'])
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
    return picked
