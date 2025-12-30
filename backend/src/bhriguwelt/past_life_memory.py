"""Past-life memory reconstruction engine grounded in Bhrigu Samhita folios."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Sequence, Tuple

from .bhrigu_core import get_bhrigu_core
from .calculations import CelestialSnapshot, normalize_conditions
from .horoscope import HoroscopeRequest, _ensure_bhrigu_data_available

_ELEMENT_ARCHETYPES = {
    "water": "river-keeper and memory healer",
    "fire": "torchbearer and vows of courage",
    "air": "messenger and archivist of ideas",
    "earth": "craftsman and guardian of lineage",
    "ether": "ritual mystic and contemplative witness",
}

_HOUSE_THEMES = {
    1: "identity vows and self-discipline",
    2: "lineage resources and stewardship",
    3: "learning through communication and siblings",
    4: "home, roots, and ancestral shelter",
    5: "creative offerings and children of the mind",
    6: "service, healing routines, and daily duty",
    7: "partnership karma and diplomacy",
    8: "transformation, loss, and resilience",
    9: "teachers, pilgrimage, and guiding beliefs",
    10: "public duty, vocation, and responsibility",
    11: "community networks and shared causes",
    12: "retreat, surrender, and spiritual release",
}

_SAMSKARA_THEMES = {
    "water": "deep emotional imprints, empathy, and memory tides",
    "fire": "quick ignition, courage surges, and disciplined passion",
    "air": "restless curiosity, mental agility, and detached analysis",
    "earth": "steady perseverance, grounded care, and practical patience",
    "ether": "subtle sensitivity, ritual memory, and spacious awareness",
}

_KEYWORD_ARCHETYPES = {
    "healer": "healer-scribe",
    "archiv": "archive keeper",
    "librarian": "library steward",
    "musician": "temple musician",
    "dancer": "sacred artist",
    "poet": "pilgrim-poet",
    "artisan": "restorer of sacred craft",
    "treasurer": "treasury steward",
    "scribe": "record keeper",
}


def _matches_rule(value: Any, rule: Any) -> bool:
    if isinstance(rule, dict):
        if value is None:
            return False
        equals = rule.get("equals")
        if equals is not None and value != equals:
            return False
        any_of = rule.get("any_of")
        if any_of is not None and value not in any_of:
            return False
        minimum = rule.get("min")
        if minimum is not None and value < minimum:
            return False
        maximum = rule.get("max")
        if maximum is not None and value > maximum:
            return False
        return True

    if isinstance(rule, (list, tuple, set)) and not isinstance(rule, (str, bytes)):
        return value in rule

    return value == rule


def _condition_ratio(snapshot: CelestialSnapshot, conditions: Dict[str, Any]) -> float:
    if not conditions:
        return 0.0
    results: List[bool] = []
    for field, rule in conditions.items():
        value = getattr(snapshot, field, None)
        if value is None:
            results.append(False)
            continue
        results.append(_matches_rule(value, rule))
    if not results:
        return 0.0
    matches = sum(1 for match in results if match)
    return matches / len(results)


def _rank_entries(
    snapshot: CelestialSnapshot,
    entries: Iterable[Dict[str, Any]],
    limit: int = 3,
) -> List[Tuple[float, Dict[str, Any]]]:
    ranked: List[Tuple[float, Dict[str, Any]]] = []
    for entry in entries:
        conditions = normalize_conditions(entry.get("conditions"))
        ratio = _condition_ratio(snapshot, conditions)
        if ratio <= 0:
            continue
        ranked.append((ratio, entry))
    ranked.sort(key=lambda item: (-item[0], str(item[1].get("id", ""))))
    return ranked[:limit]


def _keyword_archetype(description: str) -> str | None:
    lowered = description.lower()
    for keyword, archetype in _KEYWORD_ARCHETYPES.items():
        if keyword in lowered:
            return archetype
    return None


def _element_archetype(element: str) -> str:
    return _ELEMENT_ARCHETYPES.get(element, "lineage witness")


def _house_theme(house: int) -> str:
    return _HOUSE_THEMES.get(house, "karmic orientation")


def _samskara_theme(element: str) -> str:
    return _SAMSKARA_THEMES.get(element, "subtle memory impressions")


def _build_archetype_lines(
    snapshot: CelestialSnapshot,
    matched_engines: Sequence[Dict[str, Any]],
) -> List[str]:
    lines: List[str] = []
    element_archetype = _element_archetype(snapshot.moon_element)
    for engine in matched_engines:
        description = str(engine.get("description", "")).strip()
        archetype = _keyword_archetype(description) or element_archetype
        lines.append(
            f"{engine.get('sutra_reference', 'Bhrigu folio')}: {archetype} archetype. "
            f"Manuscript cue reflects {description.lower()}"
        )
    if not lines:
        lines.append(
            "Bhrigu folios emphasize symbolic archetypes over literal stories; "
            "the chart points to reflective lineage work rather than deterministic claims."
        )
    return lines


def _select_remedies(
    snapshot: CelestialSnapshot,
    remedies: Iterable[Dict[str, Any]],
    limit: int = 3,
) -> List[Tuple[float, Dict[str, Any]]]:
    ranked: List[Tuple[float, Dict[str, Any]]] = []
    for remedy in remedies:
        conditions = normalize_conditions(remedy.get("conditions"))
        ratio = _condition_ratio(snapshot, conditions)
        base = float(remedy.get("base_relevance", 0.5))
        score = base if not conditions else base * ratio
        if score <= 0:
            continue
        ranked.append((score, remedy))
    ranked.sort(key=lambda item: (-item[0], str(item[1].get("id", ""))))
    return ranked[:limit]


def build_past_life_memory_reconstruction(
    request: HoroscopeRequest,
    core_bundle: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Return a structured, deterministic past-life reconstruction payload."""

    core_bundle = core_bundle or get_bhrigu_core().application_bundle(request.tradition)
    _ensure_bhrigu_data_available(core_bundle, ("past_life_engines", "remedies"), request.tradition)

    snapshot = CelestialSnapshot.from_strings(
        birth_date=request.birth_date,
        birth_time=request.birth_time,
        birth_place=request.birth_place,
        lunar_tithi=request.lunar_tithi,
        moon_element=request.moon_element,
        moon_house=request.choices.get("moon_house") if request.choices else None,
        mars_house=request.mars_house,
        saturn_house=request.saturn_house,
        venus_house=request.venus_house,
        rahu_house=request.choices.get("rahu_house") if request.choices else None,
        ketu_house=request.ketu_house,
        mercury_house=request.mercury_house,
        jupiter_house=request.jupiter_house,
        rahu_aspects_ascendant=request.rahu_aspects_ascendant,
        saturn_retrograde=request.saturn_retrograde,
        tradition=request.tradition,
    )

    past_life_engines = core_bundle.get("past_life_engines", [])
    remedies = core_bundle.get("remedies", [])

    matched_engines = [entry for _, entry in _rank_entries(snapshot, past_life_engines, limit=3)]
    ranked_remedies = _select_remedies(snapshot, remedies, limit=3)

    karmic_folios = [engine.get("sutra_reference", "Bhrigu folio") for engine in matched_engines]
    remedial_folios = [remedy.get("sutra_reference", "Bhrigu folio") for _, remedy in ranked_remedies]

    saturn_theme = _house_theme(snapshot.saturn_house)
    ketu_theme = _house_theme(snapshot.ketu_house)
    samskara_theme = _samskara_theme(snapshot.moon_element)

    karmic_carryover = {
        "summary": (
            "Manuscript cues highlight unfinished karma as symbolic archetypes rather than literal memories. "
            f"Saturn in house {snapshot.saturn_house} centers {saturn_theme}. "
            f"Ketu in house {snapshot.ketu_house} points to release around {ketu_theme}."
        ),
        "unfinished_karma": [
            f"Discipline themes of {saturn_theme} remain in focus without implying fixed outcomes.",
            f"Letting-go lessons tied to {ketu_theme} signal what is ready for closure.",
        ],
        "lessons_carried": [
            f"Moon element {snapshot.moon_element or 'unspecified'} echoes {samskara_theme}.",
            f"Rahu-aspect flag is {'present' if snapshot.rahu_aspects_ascendant else 'absent'}, "
            "so the chart leans on inner memory work rather than outward validation.",
        ],
        "folios": karmic_folios,
    }

    past_patterns = {
        "summary": (
            "Past patterns are framed as symbolic archetypes anchored in folio cues, "
            "inviting reflection rather than prediction."
        ),
        "archetypes": _build_archetype_lines(snapshot, matched_engines),
        "emotional_samskaras": [
            f"Emotional samskaras reflect {samskara_theme}.",
            "These impressions are descriptive, not predictive, and are offered for contemplative use.",
        ],
        "folios": karmic_folios,
    }

    remedial_insights = {
        "summary": (
            "Remedial insights draw from Bhrigu folios to support reflection and gentle release, "
            "without forecasting outcomes."
        ),
        "suggestions": [
            f"{remedy.get('description', '').strip()}"
            for _, remedy in ranked_remedies
            if remedy.get("description")
        ]
        or [
            "Bhrigu folios emphasize prayer, journaling, and mindful service when explicit remedies are absent."
        ],
        "folios": remedial_folios or ["Bhrigu Samhita remedies"],
    }

    return {
        "Karmic Carryover": karmic_carryover,
        "Past Patterns": past_patterns,
        "Remedial Insights": remedial_insights,
    }


__all__ = ["build_past_life_memory_reconstruction"]
