"""
Wisdom Core precision pipeline — prefilter and postfilter around LLM generation.

Prefilter:  assemble the COMPLETE computed chart (every planet with sign,
            degree, nakshatra and pada, whole-sign house from lagna, dasha)
            into a grounded context block, and refuse to generate when the
            chart facts are missing (no vague generation from thin data).

Postfilter: verify the generated text against the computed chart (placement
            grounding), reject generic filler and hedging, and split each
            section into a sharp user view and a detailed astrologer view.

This module is dependency-free (stdlib only) so it can be imported by both
the OpenAI service and the predictions service without cycles.
"""
import os
import re
from typing import Any, Dict, List, Optional, Tuple


class InsufficientChartDataError(Exception):
    """Raised when the computed chart lacks the facts required for a precise reading."""


class PredictionUnavailableError(Exception):
    """Raised in strict precision mode instead of serving a generalised fallback."""

    def __init__(self, reason: str = "generation_failed"):
        self.reason = reason
        super().__init__(
            "AI prediction generation is temporarily unavailable. "
            "No generalised fallback was served because precise, chart-grounded "
            f"predictions are required (reason: {reason}). Please retry shortly."
        )


def strict_precision_enabled() -> bool:
    """Strict mode: never serve generalised fallback text (default ON)."""
    return os.getenv('BHRIGU_STRICT_PRECISION', 'true').strip().lower() in ('1', 'true', 'yes', 'on')


# ---------------------------------------------------------------------------
# Chart fact assembly (PREFILTER)
# ---------------------------------------------------------------------------

SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
    'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha',
    'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
    'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada',
    'Revati'
]

# Vimshottari lords repeat in cycles of 9 across the 27 nakshatras
NAKSHATRA_LORD_CYCLE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']

PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

_NAKSHATRA_SPAN = 360.0 / 27.0  # 13°20'


def nakshatra_for_longitude(longitude: float) -> Tuple[str, int, str]:
    """Return (nakshatra, pada 1-4, vimshottari lord) for a sidereal longitude."""
    lon = longitude % 360.0
    # Multiply-first keeps exact boundaries (e.g. 120.0° = Magha) numerically stable
    index = min(int(lon * 27.0 / 360.0), 26)
    pada = min(int(lon * 108.0 / 360.0) % 4 + 1, 4)
    lord = NAKSHATRA_LORD_CYCLE[index % 9]
    return NAKSHATRAS[index], pada, lord


def _sign_index(sign: Optional[str]) -> Optional[int]:
    if not sign:
        return None
    try:
        return SIGNS.index(str(sign).strip().title())
    except ValueError:
        return None


def _ascendant_sign(birth_data: Dict[str, Any]) -> Optional[str]:
    asc = birth_data.get('ascendant')
    if isinstance(asc, dict):
        return asc.get('sign')
    if isinstance(asc, str) and asc.strip():
        return asc.strip()
    return None


def build_chart_facts(birth_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract every usable computed fact from the chart into a normalized dict.

    Raises InsufficientChartDataError when planetary positions are absent —
    precise predictions must never be generated from an empty chart.
    """
    planets_raw = birth_data.get('planets')
    if not isinstance(planets_raw, dict) or not planets_raw:
        raise InsufficientChartDataError(
            "Planetary positions are missing from the computed chart; "
            "cannot build a grounded prediction context."
        )

    lagna_sign = _ascendant_sign(birth_data)
    accuracy = str(birth_data.get('birth_time_accuracy') or '').lower()
    house_reference = 'Lagna'
    if accuracy == 'unknown':
        # Birth time unknown: count houses from the Moon (Chandra Lagna) so the
        # prompt and the rule findings use ONE house system.
        moon = (planets_raw.get('Moon') or {}) if isinstance(planets_raw, dict) else {}
        moon_sign = moon.get('sign') or birth_data.get('moon_sign')
        if not moon_sign and isinstance(moon.get('longitude'), (int, float)):
            moon_sign = SIGNS[int(float(moon['longitude']) % 360 // 30)]
        if moon_sign:
            lagna_sign = moon_sign
            house_reference = 'Moon'
    lagna_index = _sign_index(lagna_sign)

    planets: Dict[str, Dict[str, Any]] = {}
    for name in PLANET_NAMES:
        entry = planets_raw.get(name)
        if not isinstance(entry, dict):
            continue
        longitude = entry.get('longitude')
        sign = entry.get('sign')
        fact: Dict[str, Any] = {'sign': sign}
        if entry.get('retrograde'):
            fact['retrograde'] = True
        if isinstance(longitude, (int, float)):
            fact['longitude'] = round(float(longitude), 2)
            fact['degree_in_sign'] = round(float(longitude) % 30.0, 2)
            nak, pada, lord = nakshatra_for_longitude(float(longitude))
            fact['nakshatra'] = nak
            fact['pada'] = pada
            fact['nakshatra_lord'] = lord
        sign_idx = _sign_index(sign)
        if lagna_index is not None and sign_idx is not None:
            fact['house'] = ((sign_idx - lagna_index) % 12) + 1  # whole-sign house
        planets[name] = fact

    if not planets:
        raise InsufficientChartDataError(
            "No recognizable planetary entries found in the computed chart."
        )

    dasha = birth_data.get('dasha_period')
    dasha_fact: Optional[Dict[str, Any]] = None
    if isinstance(dasha, dict):
        dasha_fact = {
            'maha_dasha': dasha.get('maha_dasha'),
            'years_remaining': dasha.get('years_remaining'),
            'maha_end': dasha.get('maha_end'),
            'antar_dasha': dasha.get('antar_dasha'),
            'antar_start': dasha.get('antar_start'),
            'antar_end': dasha.get('antar_end'),
        }
    elif isinstance(dasha, str) and dasha.strip():
        dasha_fact = {'maha_dasha': dasha.strip(), 'years_remaining': None}

    return {
        'lagna': lagna_sign,
        'house_reference': house_reference,
        'birth_time_accuracy': accuracy or None,
        'moon_sign': birth_data.get('moon_sign'),
        'sun_sign': birth_data.get('zodiac_sign'),
        'nakshatra': birth_data.get('nakshatra'),
        'nakshatra_pada': birth_data.get('nakshatra_pada'),
        'nakshatra_lord': birth_data.get('nakshatra_lord'),
        'planets': planets,
        'dasha': dasha_fact,
    }


def format_chart_context(facts: Dict[str, Any]) -> str:
    """Render chart facts as the precise, grounded block injected into prompts."""
    lines: List[str] = []
    if facts.get('house_reference') == 'Moon':
        lines.append(f"- Birth time unknown: houses counted from the Moon (Chandra Lagna {facts['lagna']}); no Ascendant is used")
    elif facts.get('lagna'):
        approx = ' (birth time approximate — house placements may shift)' if facts.get('birth_time_accuracy') == 'within_hour' else ''
        lines.append(f"- Lagna (Ascendant): {facts['lagna']}{approx}")
    if facts.get('moon_sign'):
        moon_line = f"- Moon Sign (Rashi): {facts['moon_sign']}"
        if facts.get('nakshatra'):
            moon_line += f" — Janma Nakshatra: {facts['nakshatra']}"
            if facts.get('nakshatra_pada'):
                moon_line += f" (Pada {facts['nakshatra_pada']})"
            if facts.get('nakshatra_lord'):
                moon_line += f", lord {facts['nakshatra_lord']}"
        lines.append(moon_line)
    if facts.get('sun_sign'):
        lines.append(f"- Sun Sign: {facts['sun_sign']}")

    dasha = facts.get('dasha')
    if dasha and dasha.get('maha_dasha'):
        dasha_line = f"- Current Vimshottari Mahadasha: {dasha['maha_dasha']}"
        if dasha.get('maha_end'):
            dasha_line += f" (until {dasha['maha_end']})"
        elif dasha.get('years_remaining') is not None:
            dasha_line += f" ({dasha['years_remaining']} years remaining)"
        if dasha.get('antar_dasha'):
            dasha_line += f"; Antardasha {dasha['antar_dasha']}"
            if dasha.get('antar_start') and dasha.get('antar_end'):
                dasha_line += f" {dasha['antar_start']} → {dasha['antar_end']}"
        lines.append(dasha_line)

    planet_lines: List[str] = []
    for name in PLANET_NAMES:
        fact = facts.get('planets', {}).get(name)
        if not fact:
            continue
        parts = []
        if fact.get('sign'):
            parts.append(str(fact['sign']) + (' (R)' if fact.get('retrograde') else ''))
        if fact.get('degree_in_sign') is not None:
            parts.append(f"{fact['degree_in_sign']}°")
        if fact.get('house'):
            parts.append(f"house {fact['house']}")
        if fact.get('nakshatra'):
            nak = fact['nakshatra']
            if fact.get('pada'):
                nak += f" pada {fact['pada']}"
            parts.append(nak)
        if parts:
            planet_lines.append(f"  - {name}: " + ", ".join(parts))

    if planet_lines:
        ref = 'the Moon' if facts.get('house_reference') == 'Moon' else 'Lagna'
        lines.append(f"- Planetary Positions (sidereal, whole-sign houses from {ref}):")
        lines.extend(planet_lines)

    return "\n".join(lines) if lines else "- Birth details unavailable"


def prefilter(birth_data: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
    """
    PREFILTER: validate the chart carries real computed facts and return
    (facts, context_text) for grounded prompt assembly.
    """
    facts = build_chart_facts(birth_data)
    return facts, format_chart_context(facts)


# ---------------------------------------------------------------------------
# Postfilter: grounding + specificity verification
# ---------------------------------------------------------------------------

# Phrases that mark generalised horoscope filler — rejected in strict mode.
GENERIC_PHRASES = [
    'every soul', 'all souls', 'each of us', 'everyone experiences',
    'trust the universe', 'the universe has a plan', 'everything happens for a reason',
    'in general,', 'generally speaking', 'as with all signs',
    'regardless of your chart', 'no matter your birth details',
    'this applies to everyone', 'like most people',
]

# Hedging that destroys precision.
HEDGE_PATTERNS = [
    r'\bmay or may not\b',
    r'\bit is possible that perhaps\b',
    r'\bsome ?time in the future\b',
    r'\bat some point\b',
    r'\bcould potentially maybe\b',
]

_PLANET_RE = '|'.join(PLANET_NAMES)
_SIGN_RE = '|'.join(SIGNS)

# "Jupiter in Taurus", "Saturn placed in Libra", "Mars is in Aries"
_PLACEMENT_CLAIM_RE = re.compile(
    rf'\b({_PLANET_RE})\b(?:\s+(?:is|was|being|sits?|placed|positioned|located))?\s+in\s+(?:the\s+sign\s+of\s+)?({_SIGN_RE})\b',
    re.IGNORECASE,
)

# "Jupiter in the 5th house", "Saturn in your 7th house"
_HOUSE_CLAIM_RE = re.compile(
    rf'\b({_PLANET_RE})\b(?:\s+(?:is|was|being|sits?|placed|positioned|located))?\s+in\s+(?:the\s+|your\s+)?(\d{{1,2}})(?:st|nd|rd|th)\s+house\b',
    re.IGNORECASE,
)


def _specific_reference_count(text: str, facts: Dict[str, Any]) -> int:
    """Count concrete astrological references: planets, signs, nakshatras, dasha, ages/years."""
    count = 0
    lowered = text.lower()
    for token in PLANET_NAMES + SIGNS + NAKSHATRAS:
        count += lowered.count(token.lower())
    count += len(re.findall(r'\b(?:age|ages)\s+\d{1,2}\b', lowered))
    count += len(re.findall(r'\b(?:19|20)\d{2}\b', text))
    count += lowered.count('dasha') + lowered.count('bhukti') + lowered.count('antardasha')
    return count


def postfilter_report(text: str, facts: Dict[str, Any]) -> Dict[str, Any]:
    """
    POSTFILTER: verify a generated section against the computed chart.

    Returns a report dict:
      ok                 — passes grounding + specificity gates
      mismatched_claims  — placement claims contradicting the computed chart
      generic_hits       — generalised filler phrases found
      hedge_hits         — hedging patterns found
      specific_refs      — count of concrete astrological references
    """
    text = text or ""
    planets = facts.get('planets', {})

    mismatched: List[str] = []
    for match in _PLACEMENT_CLAIM_RE.finditer(text):
        planet = match.group(1).title()
        claimed_sign = match.group(2).title()
        fact = planets.get(planet)
        actual_sign = (fact or {}).get('sign')
        if actual_sign and claimed_sign != str(actual_sign).title():
            mismatched.append(f"{planet} claimed in {claimed_sign}, chart shows {actual_sign}")

    for match in _HOUSE_CLAIM_RE.finditer(text):
        planet = match.group(1).title()
        claimed_house = int(match.group(2))
        fact = planets.get(planet)
        actual_house = (fact or {}).get('house')
        if actual_house and 1 <= claimed_house <= 12 and claimed_house != actual_house:
            mismatched.append(
                f"{planet} claimed in house {claimed_house}, chart shows house {actual_house}"
            )

    for _, explanation in find_false_claims(text, facts):
        if explanation not in mismatched:
            mismatched.append(explanation)

    lowered = text.lower()
    generic_hits = [p for p in GENERIC_PHRASES if p in lowered]
    hedge_hits = [p for p in HEDGE_PATTERNS if re.search(p, lowered)]
    specific_refs = _specific_reference_count(text, facts)

    min_refs = int(os.getenv('BHRIGU_MIN_SPECIFIC_REFS', '3'))
    ok = not mismatched and not generic_hits and not hedge_hits and specific_refs >= min_refs

    return {
        'ok': ok,
        'mismatched_claims': mismatched,
        'generic_hits': generic_hits,
        'hedge_hits': hedge_hits,
        'specific_refs': specific_refs,
    }


def correction_instructions(report: Dict[str, Any], chart_context: str) -> str:
    """Build the corrective feedback appended to a regeneration prompt."""
    problems: List[str] = []
    if report.get('mismatched_claims'):
        problems.append(
            "You cited placements that CONTRADICT the computed chart: "
            + "; ".join(report['mismatched_claims'])
            + ". Cite ONLY the placements listed in the Birth Details."
        )
    if report.get('generic_hits'):
        problems.append(
            "Remove generalised filler phrases: " + "; ".join(report['generic_hits'])
        )
    if report.get('hedge_hits'):
        problems.append("Remove hedging language — commit to chart-based statements.")
    if report.get('specific_refs', 0) < int(os.getenv('BHRIGU_MIN_SPECIFIC_REFS', '3')):
        problems.append(
            "Your previous draft lacked concrete astrological references. Anchor every claim "
            "to a specific planet, sign, nakshatra, house, or dasha period from this chart:\n"
            + chart_context
        )
    return (
        "## CORRECTION REQUIRED — your previous draft failed precision verification:\n- "
        + "\n- ".join(problems)
    )


# ---------------------------------------------------------------------------
# Dual views: sharp user view vs detailed astrologer view
# ---------------------------------------------------------------------------

_VIEW_MARKERS = {
    'key_insight': re.compile(r'\*\*Key Insight:?\*\*:?', re.IGNORECASE),
    'timing': re.compile(r'\*\*Timing:?\*\*:?', re.IGNORECASE),
    'technical': re.compile(r'\*\*Technical Analysis:?\*\*:?', re.IGNORECASE),
    'guidance': re.compile(r'(?:\*\*)?Actionable Guidance:?(?:\*\*)?:?', re.IGNORECASE),
}


def _split_marked_blocks(text: str) -> Dict[str, str]:
    """Split a section into its marked blocks; unmarked leading text goes to 'lead'."""
    positions: List[Tuple[int, str, int]] = []
    for name, pattern in _VIEW_MARKERS.items():
        match = pattern.search(text)
        if match:
            positions.append((match.start(), name, match.end()))
    positions.sort()

    blocks: Dict[str, str] = {}
    if not positions:
        blocks['lead'] = text.strip()
        return blocks

    lead = text[: positions[0][0]].strip()
    if lead:
        blocks['lead'] = lead
    for i, (start, name, content_start) in enumerate(positions):
        end = positions[i + 1][0] if i + 1 < len(positions) else len(text)
        blocks[name] = text[content_start:end].strip()
    return blocks


def split_views(section_text: str) -> Dict[str, str]:
    """
    Derive the two audience views from one generated section (no extra LLM call).

    user view       — Key Insight + Timing + Actionable Guidance (sharp, no
                      technical walkthrough, no unnecessary detail)
    astrologer view — the full section including Technical Analysis
    """
    text = (section_text or "").strip()
    if not text:
        return {'user': '', 'astrologer': ''}

    blocks = _split_marked_blocks(text)
    if 'key_insight' not in blocks and 'technical' not in blocks:
        # No structural markers — keep full text for both audiences.
        return {'user': text, 'astrologer': text}

    user_parts: List[str] = []
    if blocks.get('key_insight'):
        user_parts.append(blocks['key_insight'])
    if blocks.get('timing'):
        user_parts.append(f"**Timing:** {blocks['timing']}")
    if blocks.get('guidance'):
        user_parts.append(f"**Actionable Guidance:**\n{blocks['guidance']}")
    if not user_parts and blocks.get('lead'):
        user_parts.append(blocks['lead'])

    return {'user': "\n\n".join(user_parts).strip() or text, 'astrologer': text}


# ---------------------------------------------------------------------------
# Strict claim verification: every checkable statement must match the chart.
# ---------------------------------------------------------------------------

SIGN_RULERS = {
    'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
    'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
    'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter',
}
EXALTATION = {'Sun': 'Aries', 'Moon': 'Taurus', 'Mars': 'Capricorn', 'Mercury': 'Virgo',
              'Jupiter': 'Cancer', 'Venus': 'Pisces', 'Saturn': 'Libra'}
DEBILITATION = {'Sun': 'Libra', 'Moon': 'Scorpio', 'Mars': 'Cancer', 'Mercury': 'Pisces',
                'Jupiter': 'Capricorn', 'Venus': 'Virgo', 'Saturn': 'Aries'}
OWN_SIGNS = {'Sun': ['Leo'], 'Moon': ['Cancer'], 'Mars': ['Aries', 'Scorpio'],
             'Mercury': ['Gemini', 'Virgo'], 'Jupiter': ['Sagittarius', 'Pisces'],
             'Venus': ['Taurus', 'Libra'], 'Saturn': ['Capricorn', 'Aquarius']}

_ORD = r'(\d{1,2})(?:st|nd|rd|th)'
_NAK_RE = '|'.join(sorted((re.escape(n) for n in NAKSHATRAS), key=len, reverse=True))
# Span between a planet and its claim that names no other planet and no
# aspect/transit/dasha context ("Mars aspects Saturn in the 7th" is about
# Saturn; "Saturn transits the 10th" is not a natal placement).
_GAP = rf"(?:(?!\b(?:{_PLANET_RE})\b|\baspect|\btransit|\bperiod\b|\bdasha|\bbhukti|\bantardasha|\bfrom\b)[^.;:]){{0,40}}?"
_NOT_A_HOUSE = r"(?!\s*(?:lord|year|month|day|week|decade|century|dasha|from|sign|pada|nakshatra|navamsa|amsa|of)\b)"
_CLAIM_PATTERNS = [
    # "the 7th house Rahu", "7th-house Saturn"
    ('house', re.compile(rf'\b{_ORD}[\s-]+house\s+({_PLANET_RE})\b', re.I), (1, 2)),
    # "Rahu in Taurus in the 9th house", "Saturn occupies the 7th", "Moon sits in the 11th"
    ('house', re.compile(
        rf'\b({_PLANET_RE})\b{_GAP}\b(?:in|occupies|occupying|placed\s+in|sits\s+in|resides\s+in)\s+'
        rf'(?:the\s+|your\s+|its\s+)?{_ORD}(?:\s+house\b|{_NOT_A_HOUSE}(?![\s-]*house)\b)', re.I), (2, 1)),
    # "the 9th lord Venus", "9th-lord Venus", "9th house lord Venus"
    ('lord', re.compile(rf'\b{_ORD}[\s-]+(?:house[\s-]+)?lord(?:,)?\s+({_PLANET_RE})\b', re.I), (1, 2)),
    # "lord of the 9th (house) is Venus", "lord of the 9th, Venus"
    ('lord', re.compile(rf'\blord\s+of\s+(?:the\s+|your\s+)?{_ORD}(?:\s+house)?(?:,|\s+is|\s+being)?\s+({_PLANET_RE})\b', re.I), (1, 2)),
    # "Venus, the 9th lord" / "Venus as 9th lord" / "Venus, lord of the 9th"
    ('lord', re.compile(rf'\b({_PLANET_RE}),?\s+(?:the|as(?:\s+the)?|is\s+the)\s+{_ORD}[\s-]+(?:house[\s-]+)?lord\b', re.I), (2, 1)),
    ('lord', re.compile(rf'\b({_PLANET_RE}),?\s+(?:as\s+|is\s+|being\s+)?(?:the\s+)?lord\s+of\s+(?:the\s+|your\s+)?{_ORD}\b', re.I), (2, 1)),
    # "debilitated Mars", "Mars is debilitated"
    ('debilitated', re.compile(rf'\bdebilitated\s+({_PLANET_RE})\b', re.I), (1,)),
    ('debilitated', re.compile(rf'\b({_PLANET_RE})\s+(?:is\s+)?debilitated\b', re.I), (1,)),
    ('exalted', re.compile(rf'\bexalted\s+({_PLANET_RE})\b', re.I), (1,)),
    ('exalted', re.compile(rf'\b({_PLANET_RE})\s+(?:is\s+)?exalted\b', re.I), (1,)),
    ('own', re.compile(rf'\b({_PLANET_RE})\b{_GAP}\bin\s+its\s+own\s+sign\b', re.I), (1,)),
    # "Ketu in Scorpio conjuncts Jupiter", "Venus and Mercury are conjunct"
    ('conjunct', re.compile(rf'\b({_PLANET_RE})\b{_GAP}\bconjunct(?:s|ion\s+with|ed\s+with|\s+with)?\s+({_PLANET_RE})\b', re.I), (1, 2)),
    ('conjunct', re.compile(rf'\b({_PLANET_RE})\s+and\s+({_PLANET_RE})\s+(?:are\s+)?conjunct\b', re.I), (1, 2)),
    # "Moon in Ashlesha-3", "Mercury in Purva Phalguni"
    ('nakshatra', re.compile(rf'\b({_PLANET_RE})\b{_GAP}\bin\s+({_NAK_RE})(?:[\s-]+(\d))?\b', re.I), (1, 2, 3)),
]


def _house_lord(facts: Dict[str, Any], house: int) -> Optional[str]:
    lagna_idx = _sign_index(facts.get('lagna'))
    if lagna_idx is None or not 1 <= house <= 12:
        return None
    return SIGN_RULERS.get(SIGNS[(lagna_idx + house - 1) % 12])


def find_false_claims(text: str, facts: Dict[str, Any]) -> List[Tuple[str, str]]:
    """
    Return (matched_text, explanation) for every statement in `text` that
    contradicts the computed chart: sign, house, lordship, dignity,
    conjunction (same sign) and nakshatra/pada claims.
    """
    planets = facts.get('planets') or {}
    found: List[Tuple[str, str]] = []
    if not text:
        return found
    for kind, pattern, groups in _CLAIM_PATTERNS:
        for m in pattern.finditer(text):
            vals = [m.group(g) for g in groups]
            if kind == 'house':
                house, planet = int(vals[0]), vals[1]
                actual = (planets.get(planet.title()) or {}).get('house')
                if actual and 1 <= house <= 12 and house != actual:
                    found.append((m.group(0), f"{planet.title()} is in house {actual}, not {house}"))
            elif kind == 'lord':
                house, planet = int(vals[0]), vals[1]
                lord = _house_lord(facts, house)
                if lord and planet.title() != lord:
                    found.append((m.group(0), f"the {house}th lord is {lord}, not {planet.title()}"))
            elif kind in ('debilitated', 'exalted', 'own'):
                planet = vals[0].title()
                sign = (planets.get(planet) or {}).get('sign')
                table = {'debilitated': DEBILITATION, 'exalted': EXALTATION}.get(kind)
                if planet in ('Rahu', 'Ketu') or not sign:
                    continue
                ok = sign in OWN_SIGNS.get(planet, []) if kind == 'own' else table.get(planet) == sign
                if not ok:
                    found.append((m.group(0), f"{planet} in {sign} is not {kind if kind != 'own' else 'in its own sign'}"))
            elif kind == 'conjunct':
                a, b = vals[0].title(), vals[1].title()
                sa, sb = (planets.get(a) or {}).get('sign'), (planets.get(b) or {}).get('sign')
                if a != b and sa and sb and sa != sb:
                    found.append((m.group(0), f"{a} ({sa}) and {b} ({sb}) are not conjunct"))
            elif kind == 'nakshatra':
                planet, nak, pada = vals[0].title(), vals[1], vals[2]
                fact = planets.get(planet) or {}
                if fact.get('nakshatra') and nak.lower() != str(fact['nakshatra']).lower():
                    found.append((m.group(0), f"{planet} is in {fact['nakshatra']}, not {nak}"))
                elif pada and fact.get('pada') and int(pada) != int(fact['pada']):
                    found.append((m.group(0), f"{planet} is in pada {fact['pada']}, not {pada}"))
    for match in _PLACEMENT_CLAIM_RE.finditer(text):
        planet, claimed = match.group(1).title(), match.group(2).title()
        actual = (planets.get(planet) or {}).get('sign')
        if actual and claimed != str(actual).title():
            found.append((match.group(0), f"{planet} is in {actual}, not {claimed}"))
    return found


# English sentence ends, plus the Devanagari danda (Hindi readings).
_SENTENCE_SPLIT_RE = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9"“(\u0900-\u097F])|(?<=[।॥])\s*')


def remove_false_sentences(text: str, facts: Dict[str, Any]) -> Tuple[str, List[str]]:
    """Drop every sentence that makes a claim contradicting the chart."""
    if not text:
        return text, []
    kept: List[str] = []
    removed: List[str] = []
    for sentence in _SENTENCE_SPLIT_RE.split(text.strip()):
        problems = find_false_claims(sentence, facts)
        if problems:
            removed.extend(p[1] for p in problems)
        else:
            kept.append(sentence)
    return " ".join(kept).strip(), removed


HOUSE_SIGNIFICATIONS = (
    "1 self/body, 2 wealth/speech/family, 3 effort/courage/siblings, 4 home/mother/peace, "
    "5 intellect/children/purva-punya, 6 service/debt/disease/rivals, 7 spouse/partnerships, "
    "8 transformation/longevity/hidden, 9 dharma/fortune/guru/father, 10 karma/career/status, "
    "11 gains/networks/elder siblings, 12 loss/expense/foreign lands/moksha"
)


def lordship_line(facts: Dict[str, Any]) -> str:
    """'1st Mercury (Virgo), 2nd Venus (Libra), …' computed from the lagna."""
    lagna_idx = _sign_index(facts.get('lagna'))
    if lagna_idx is None:
        return ''
    suffix = lambda n: 'st' if n == 1 else 'nd' if n == 2 else 'rd' if n == 3 else 'th'
    parts = []
    for house in range(1, 13):
        sign = SIGNS[(lagna_idx + house - 1) % 12]
        parts.append(f"{house}{suffix(house)} {SIGN_RULERS[sign]} ({sign})")
    return ", ".join(parts)
