"""CLI + helpers for generating horoscopes rooted in Bhrigu Samhita sutras."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Sequence

from .astronomical_calculations import derive_progressed_snapshot, derive_transit_snapshot, normalize_birth_datetime
from .calendar_conversion import HinduCalendarContext, convert_birth_details
from .calculations import (
    CelestialSnapshot,
    FutureTrajectory,
    MatchmakingCompatibility,
    PastLifeInsight,
    TransitDirective,
    derive_karmic_epoch,
    evaluate_future_directives,
    evaluate_matchmaking,
    evaluate_past_life,
    evaluate_transits,
    score_principles,
)
from .config import load_runtime_config
from .bhrigu_core import bhrigu_core
from .kundli_generator import generate_kundli

__all__ = [
    "HoroscopeRequest",
    "HoroscopeReport",
    "PastLifeReport",
    "FutureReport",
    "MatchmakingReport",
    "CoreWisdomReading",
    "SUPPORTED_MOON_ELEMENTS",
    "build_core_wisdom_reading",
    "build_prediction",
    "build_past_life_report",
    "build_future_report",
    "build_matchmaking_report",
    "build_transit_report",
    "build_calendar_context",
    "build_cli_parser",
    "parse_cli_args",
    "main",
    "ChartHouse",
    "DashaPeriod",
    "generate_kundli",
]


SUPPORTED_MOON_ELEMENTS = {"water", "fire", "air", "earth", "ether"}


@dataclass
class HoroscopeRequest:
    name: str
    birth_date: str
    birth_time: str
    birth_place: str
    tradition: str = "universal"
    timezone: str | None = None
    consent_for_date_predictions: bool = False
    lunar_tithi: int = 0
    moon_element: str = ""
    mars_house: int = 0
    saturn_house: int = 0
    venus_house: int = 0
    rahu_aspects_ascendant: bool = False
    ketu_house: int = 0
    mercury_house: int = 0
    jupiter_house: int = 0
    saturn_retrograde: bool = False

    def __post_init__(self) -> None:
        if self.lunar_tithi == 0 and (
            self.moon_element or any(getattr(self, field) for field in ("mars_house", "saturn_house", "venus_house"))
        ):
            raise ValueError("lunar_tithi must be between 1 and 30 or omitted for auto inference")
        if self.lunar_tithi and not (1 <= self.lunar_tithi <= 30):  # pragma: no cover - validation
            raise ValueError("lunar_tithi must be between 1 and 30")
        for field in ("mars_house", "saturn_house", "venus_house"):
            value = getattr(self, field)
            if value and not (1 <= value <= 12):
                raise ValueError(f"{field} must be between 1 and 12")
        for optional_field in ("ketu_house", "mercury_house", "jupiter_house"):
            optional_value = getattr(self, optional_field, 0)
            if optional_value and not (1 <= optional_value <= 12):
                raise ValueError(f"{optional_field} must be between 1 and 12 when provided")
        normalized = self.moon_element.lower() if self.moon_element else ""
        if normalized and normalized not in SUPPORTED_MOON_ELEMENTS:
            raise ValueError(
                "moon_element must be one of water, fire, air, earth, ether"
            )
        self.moon_element = normalized or self.moon_element
        self.tradition = (self.tradition or "universal").lower()


@dataclass
class HoroscopeReport:
    """Structured output referencing Bhrigu Samhita folios."""

    name: str
    karmic_epoch: str
    weights: Dict[str, float]
    principles: List[Dict]
    remedies: List[Dict]
    past_life_insights: List[PastLifeInsight]
    future_trajectories: List[FutureTrajectory]
    interpretation: str
    rashi_chart: List[ChartHouse]
    bhava_chart: List[ChartHouse]
    dashas: List[DashaPeriod]


@dataclass
class PastLifeReport:
    """Focused report on the native's prior incarnations."""

    name: str
    insights: List[PastLifeInsight]
    interpretation: str


@dataclass
class FutureReport:
    """Forward projections sourced from the Samhita."""

    name: str
    trajectories: List[FutureTrajectory]
    transit_directives: List[TransitDirective]
    progression_directives: List[TransitDirective]
    interpretation: str


@dataclass
class MatchmakingReport:
    """Compatibility digest that blends sutra guidance with modern intents."""

    primary_name: str
    partner_name: str
    compatibility: MatchmakingCompatibility
    interpretation: str


@dataclass
class TransitReport:
    """Gochar overlay blending natal snapshot with current transits."""

    name: str
    directives: List[TransitDirective]
    interpretation: str


@dataclass
class CoreWisdomReading:
    """Eight-section Bhrigu Core Wisdom digest designed for web and mobile."""

    sections: Dict[str, str]
    charts: Dict[str, List[ChartHouse]]
    dashas: List[DashaPeriod]
    karmic_epoch: str
    remedies: List[Dict]


def build_calendar_context(
    birth_date: str, birth_time: str, birth_place: str
) -> HinduCalendarContext:
    """Return a Hindu calendar representation for the supplied birth record."""

    return convert_birth_details(birth_date=birth_date, birth_time=birth_time, birth_place=birth_place)


def build_prediction(request: HoroscopeRequest) -> HoroscopeReport:
    runtime_config = load_runtime_config()
    core_bundle = bhrigu_core.application_bundle(request.tradition)
    principles = core_bundle.get("principles", [])
    remedies = core_bundle.get("remedies", [])
    past_life_engines = core_bundle.get("past_life_engines", [])
    future_engines = core_bundle.get("future_engines", [])

    snapshot = _snapshot_from_request(request)

    weights = score_principles(snapshot, principles, runtime_config)
    karmic_epoch = derive_karmic_epoch(snapshot)
    past_life_insights = evaluate_past_life(snapshot, past_life_engines)
    future_trajectories = evaluate_future_directives(snapshot, future_engines)

    remedies = _personalize_remedies(remedies, weights, snapshot, runtime_config)

    kundli = generate_kundli(snapshot, weights, timezone_name=request.timezone)

    return HoroscopeReport(
        name=request.name,
        karmic_epoch=karmic_epoch,
        weights=weights,
        principles=principles,
        remedies=remedies,
        past_life_insights=past_life_insights,
        future_trajectories=future_trajectories,
        interpretation=_compose_horoscope_interpretation(
            karmic_epoch,
            weights,
            past_life_insights,
            future_trajectories,
            remedies,
            request.name,
            request.birth_place,
            runtime_config.get("interpretation", {}),
        ),
        rashi_chart=kundli["rashi_chart"],
        bhava_chart=kundli["bhava_chart"],
        dashas=kundli["dashas"],
    )


def build_past_life_report(request: HoroscopeRequest) -> PastLifeReport:
    runtime_config = load_runtime_config()
    snapshot = _snapshot_from_request(request)
    core_bundle = bhrigu_core.application_bundle(request.tradition)
    past_life_engines = core_bundle.get("past_life_engines", [])
    insights = evaluate_past_life(snapshot, past_life_engines)
    return PastLifeReport(
        name=request.name,
        insights=insights,
        interpretation=_compose_past_life_interpretation(
            insights, request.name, request.birth_place, runtime_config.get("interpretation", {})
        ),
    )


def build_future_report(request: HoroscopeRequest) -> FutureReport:
    if not request.consent_for_date_predictions:
        raise ValueError("User consent required for date-based predictions")

    snapshot = _snapshot_from_request(request)
    core_bundle = bhrigu_core.application_bundle(request.tradition)
    future_engines = core_bundle.get("future_engines", [])
    transit_rules = core_bundle.get("transit_rules", [])
    trajectories = evaluate_future_directives(snapshot, future_engines)
    now = datetime.utcnow()
    transit_dt = normalize_birth_datetime(
        now.date().isoformat(), now.time().isoformat(timespec="minutes"), timezone_name=request.timezone
    )
    natal_dt = normalize_birth_datetime(request.birth_date, request.birth_time, timezone_name=request.timezone)
    transit_details = derive_transit_snapshot(natal_dt, transit_dt)
    transit_directives = evaluate_transits(snapshot, transit_details, transit_rules)
    progression_details = derive_progressed_snapshot(natal_dt, transit_dt)
    progression_directives = evaluate_transits(snapshot, progression_details, transit_rules)
    return FutureReport(
        name=request.name,
        trajectories=trajectories,
        transit_directives=transit_directives,
        progression_directives=progression_directives,
        interpretation=_compose_future_interpretation(trajectories, transit_directives, progression_directives),
    )


def build_transit_report(request: HoroscopeRequest, transit_payload: Dict[str, str]) -> TransitReport:
    if not request.consent_for_date_predictions:
        raise ValueError("User consent required for date-based predictions")

    core_bundle = bhrigu_core.application_bundle(request.tradition)
    snapshot = _snapshot_from_request(request)
    transit_rules = core_bundle.get("transit_rules", [])
    transit_dt = normalize_birth_datetime(
        transit_payload["transit_date"], transit_payload["transit_time"], timezone_name=transit_payload.get("timezone")
    )
    natal_dt = normalize_birth_datetime(request.birth_date, request.birth_time, timezone_name=transit_payload.get("timezone"))
    transit_details = derive_transit_snapshot(natal_dt, transit_dt)
    directives = evaluate_transits(snapshot, transit_details, transit_rules)
    return TransitReport(
        name=request.name,
        directives=directives,
        interpretation=_compose_transit_interpretation(directives, transit_dt),
    )


def build_core_wisdom_reading(
    request: HoroscopeRequest, focus_areas: Sequence[str] | None = None
) -> CoreWisdomReading:
    """Return the 8-section Bhrigu Core Wisdom digest for web and mobile clients."""

    horoscope = build_prediction(request)
    build_calendar_context(
        birth_date=request.birth_date, birth_time=request.birth_time, birth_place=request.birth_place
    )  # ensures Gregorian → Śaka alignment for downstream consumers

    focus_summary = ", ".join(focus_areas) if focus_areas else "general life balance"

    sections = {
        "1": (
            "Restatement of User Query & Birth Data: "
            f"Name: {request.name}. Birth: {request.birth_date} at {request.birth_time} in {request.birth_place}."
            f" Focus areas: {focus_summary}."
        ),
        "2": (
            "Disclaimer & Orientation: This is a Bhrigu Samhita–inspired spiritual reading. "
            "It offers tendencies, not certainties, and is not medical, legal, or financial advice."
        ),
        "3": (
            "Birth Chart Overview: "
            f"Karmic epoch — {horoscope.karmic_epoch}. "
            f"Dominant currents include {', '.join(sorted(horoscope.weights, key=horoscope.weights.get, reverse=True)[:3])} "
            "with manuscript-backed interpretation: "
            f"{horoscope.interpretation}"
        ),
    }

    strengths = _ranked_traits(horoscope.weights, top=True)
    challenges = _ranked_traits(horoscope.weights, top=False)

    remedy_text = (
        '; '.join(remedy.get("interpretation", remedy.get("id", "Remedy")) for remedy in horoscope.remedies[:2])
        if horoscope.remedies
        else "Practice steady discipline and seva."
    )

    sections.update(
        {
            "4": (
                "Detailed Life Area Analysis: "
                f"Strengths — {', '.join(strengths) or 'resilience and curiosity'}. "
                f"Challenges — {', '.join(challenges) or 'balancing intuition with action'}. "
                f"Key remedies from the folios: {remedy_text}"
            ),
            "5": (
                "Time-Based Future Tendencies: "
                f"{_future_tendencies(horoscope.future_trajectories)}"
            ),
            "6": (
                "Consolidated Strengths, Challenges & Cautions: "
                f"Strengths — {', '.join(strengths) or 'adaptability'}. "
                f"Challenges — {', '.join(challenges) or 'guarding energy leaks'}. "
                "Cautions — honor pacing and protect focus during intense transit windows."
            ),
            "7": (
                "Bhrigu-Style Guidance & Remedies: "
                f"{_guidance_summary(horoscope.remedies, horoscope.future_trajectories)}"
            ),
            "8": (
                "Closing & Reminder of Free Will: Tendencies guide you, but choices shape outcomes. "
                "Take what resonates, leave the rest, and proceed with compassion."
            ),
        }
    )

    return CoreWisdomReading(
        sections=sections,
        charts={"rashi_chart": horoscope.rashi_chart, "bhava_chart": horoscope.bhava_chart},
        dashas=horoscope.dashas,
        karmic_epoch=horoscope.karmic_epoch,
        remedies=horoscope.remedies,
    )


def build_matchmaking_report(
    primary_request: HoroscopeRequest,
    partner_request: HoroscopeRequest,
    modern_preferences: List[str],
) -> MatchmakingReport:
    runtime_config = load_runtime_config()
    primary_snapshot = _snapshot_from_request(primary_request)
    partner_snapshot = _snapshot_from_request(partner_request)

    core_bundle = bhrigu_core.application_bundle(primary_request.tradition)

    matchmaking_criteria = core_bundle.get("matchmaking_criteria", [])

    compatibility = evaluate_matchmaking(
        primary=primary_snapshot,
        partner=partner_snapshot,
        criteria=matchmaking_criteria,
        modern_preferences=modern_preferences,
    )

    return MatchmakingReport(
        primary_name=primary_request.name,
        partner_name=partner_request.name,
        compatibility=compatibility,
        interpretation=_compose_matchmaking_interpretation(
            compatibility,
            primary_request.name,
            partner_request.name,
            runtime_config.get("interpretation", {}),
        ),
    )


def _snapshot_from_request(request: HoroscopeRequest) -> CelestialSnapshot:
    lunar_tithi = request.lunar_tithi or None
    moon_element = request.moon_element or None
    mars_house = request.mars_house or None
    saturn_house = request.saturn_house or None
    venus_house = request.venus_house or None
    ketu_house = request.ketu_house or None
    mercury_house = request.mercury_house or None
    jupiter_house = request.jupiter_house or None
    rahu_aspects_ascendant = request.rahu_aspects_ascendant or None
    saturn_retrograde = request.saturn_retrograde or None

    return CelestialSnapshot.from_strings(
        birth_date=request.birth_date,
        birth_time=request.birth_time,
        birth_place=request.birth_place,
        tradition=request.tradition,
        timezone_name=request.timezone,
        lunar_tithi=lunar_tithi,
        moon_element=moon_element,
        mars_house=mars_house,
        saturn_house=saturn_house,
        venus_house=venus_house,
        ketu_house=ketu_house,
        mercury_house=mercury_house,
        jupiter_house=jupiter_house,
        rahu_aspects_ascendant=rahu_aspects_ascendant,
        saturn_retrograde=saturn_retrograde,
    )


def _render_common_intro(name: str, birth_place: str) -> None:
    print(f"Bhrigu Samhita transmission for {name}")
    print(f"Birth locale recorded as {birth_place}")


def _dominant_epithet(weights: Dict[str, float] | None, interpretation_config: Dict[str, object]) -> str | None:
    if not weights:
        return None

    epithets = interpretation_config.get("epithets", {}) or {}
    if not epithets:
        return None

    threshold = float(interpretation_config.get("epithet_threshold", 0.65))
    candidate = max(weights.items(), key=lambda item: item[1])
    template = epithets.get(candidate[0])
    if not template or candidate[1] < threshold:
        return None

    try:
        return str(template).format(score=candidate[1])
    except (KeyError, ValueError):
        return None


def _personalization_prefix(
    name: str, birth_place: str, interpretation_config: Dict[str, object], weights: Dict[str, float] | None = None
) -> str:
    safe_name = name or interpretation_config.get("fallback_name", "the native")
    safe_place = birth_place or interpretation_config.get("fallback_birth_place", "their recorded locale")
    template = str(interpretation_config.get("personalized_prefix", "{name}, born in {birth_place},"))
    epithet = _dominant_epithet(weights, interpretation_config)
    prefix = template.format(name=safe_name, birth_place=safe_place)
    return f"{prefix} {epithet}" if epithet else prefix


def _compose_horoscope_interpretation(
    karmic_epoch: str,
    weights: Dict[str, float],
    past_life_insights: List[PastLifeInsight],
    future_trajectories: List[FutureTrajectory],
    remedies: List[Dict],
    name: str,
    birth_place: str,
    interpretation_config: Dict[str, object],
) -> str:
    """Blend the raw signals into a concise, manuscript-anchored summary."""

    phrases: List[str] = [_personalization_prefix(name, birth_place, interpretation_config, weights)]
    if weights:
        top_weights = sorted(weights.items(), key=lambda item: item[1], reverse=True)[:2]
        weight_phrase = ", ".join(f"{name.replace('_', ' ')} ({score:.2f})" for name, score in top_weights)
        phrases.append(f"Dominant Bhrigu currents: {weight_phrase}.")

    if past_life_insights:
        primary = max(past_life_insights, key=lambda insight: insight.confidence)
        phrases.append(
            f"Past-life recall per {primary.sutra_reference}: {primary.narrative} (confidence {primary.confidence:.2f})."
        )

    if future_trajectories:
        primary_future = max(future_trajectories, key=lambda directive: directive.certainty)
        window = f" in {primary_future.window}" if primary_future.window else ""
        phrases.append(
            f"Future mandate from {primary_future.sutra_reference}: {primary_future.focus}{window} with certainty {primary_future.certainty:.2f}."
        )

    if remedies:
        remedy_refs = ", ".join(remedy["id"] for remedy in remedies[:2])
        phrases.append(f"Remedy anchors: {remedy_refs} from the folios.")
        remedy_disclaimer = interpretation_config.get("remedy_disclaimer")
        if remedy_disclaimer:
            phrases.append(remedy_disclaimer)

    gratitude = interpretation_config.get("gratitude_phrase")
    if gratitude:
        phrases.append(gratitude)
    phrases.append(karmic_epoch)
    return " ".join(phrases)


def _compose_past_life_interpretation(
    insights: List[PastLifeInsight], name: str, birth_place: str, interpretation_config: Dict[str, object]
) -> str:
    if not insights:
        return (
            f"{_personalization_prefix(name, birth_place, interpretation_config, None)} "
            "Past-life folios are silent; default remedies advised."
        )

    top = max(insights, key=lambda insight: insight.confidence)
    return (
        f"{_personalization_prefix(name, birth_place, interpretation_config, None)} Primary past-life transmission ({top.sutra_reference}) "
        f"emphasizes {top.narrative} with confidence {top.confidence:.2f}."
    )


def _compose_future_interpretation(
    trajectories: List[FutureTrajectory],
    transit_directives: List[TransitDirective],
    progression_directives: List[TransitDirective],
) -> str:
    if not trajectories and not transit_directives and not progression_directives:
        return "Future directives await fuller planetary transits; continue dharmic discipline."

    phrases: List[str] = []
    if trajectories:
        top = max(trajectories, key=lambda directive: directive.certainty)
        window = f" during {top.window}" if top.window else ""
        phrases.append(
            f"Highest-certainty mandate from {top.sutra_reference}: {top.focus}{window} "
            f"(certainty {top.certainty:.2f})."
        )

    if transit_directives:
        top_transit = transit_directives[0]
        phrases.append(
            f"Current transit emphasis via {top_transit.planet}: {top_transit.influence} "
            f"(certainty {top_transit.certainty:.2f}) per {top_transit.reference}."
        )

    if progression_directives:
        top_progression = progression_directives[0]
        phrases.append(
            f"Secondary progression spotlight ({top_progression.planet}): {top_progression.influence} "
            f"(certainty {top_progression.certainty:.2f}) via {top_progression.reference}."
        )

    return " ".join(phrases)


def _compose_matchmaking_interpretation(
    compatibility: MatchmakingCompatibility, name: str, partner_name: str, interpretation_config: Dict[str, object]
) -> str:
    breakdown_sorted = sorted(compatibility.breakdown, key=lambda entry: entry.score, reverse=True)
    top_entry = breakdown_sorted[0] if breakdown_sorted else None
    highlight = compatibility.modern_highlights[0] if compatibility.modern_highlights else ""

    parts = [f"Composite compatibility index: {compatibility.compatibility_index:.2f}%."]
    parts.append(
        f"Long-term: {compatibility.long_term_index:.2f}% | Short-term: {compatibility.short_term_index:.2f}%."
    )
    if top_entry:
        parts.append(
            f"Strongest folio ({top_entry.sutra_reference}): {top_entry.description.strip()} -> score {top_entry.score:.2f}."
        )
    if highlight:
        parts.append(f"Modern alignment: {highlight}.")
    if compatibility.synastry_overlays:
        overlay = compatibility.synastry_overlays[0]
        parts.append(
            f"Synastry overlay {overlay.area}: {overlay.alignment:.0f}% harmony ({overlay.notes})."
        )
        if compatibility.alignment_percentages:
            parts.append(
                "Alignment mix E/S/C: "
                f"{compatibility.alignment_percentages.get('emotional', 0):.0f}% / "
                f"{compatibility.alignment_percentages.get('spiritual', 0):.0f}% / "
                f"{compatibility.alignment_percentages.get('communication', 0):.0f}%."
            )
        if compatibility.shared_life_paths:
            path = compatibility.shared_life_paths[0]
            resonance = f" ({path.resonance:.0f}% resonance)" if path.resonance else ""
            parts.append(f"Shared path — {path.theme}:{resonance} {path.guidance}")
        return " ".join(parts)


def _matches_remedy_rule(value, rule) -> bool:
    if isinstance(rule, dict):
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

    return value == rule


def _score_remedy_conditions(snapshot: CelestialSnapshot, conditions: Dict, base_value: float) -> float:
    if not conditions:
        return round(base_value, 2)

    matches = 0
    total = 0
    for field, rule in conditions.items():
        total += 1
        value = getattr(snapshot, field, None)
        if _matches_remedy_rule(value, rule):
            matches += 1

    ratio = matches / total if total else 1
    return round(base_value * ratio, 2)


def _personalize_remedies(
    remedies: List[Dict], weights: Dict[str, float], snapshot: CelestialSnapshot, runtime_config: Dict[str, object]
) -> List[Dict]:
    if not remedies:
        return []

    remedy_config = runtime_config.get("remedies", {}) if runtime_config else {}
    relevance_floor = float(remedy_config.get("relevance_floor", 0.45))
    target_threshold = float(remedy_config.get("target_threshold", 0.5))

    scored: List[Dict] = []
    for remedy in remedies:
        base_relevance = float(remedy.get("base_relevance", 0.5))
        condition_score = _score_remedy_conditions(snapshot, remedy.get("conditions") or {}, base_relevance)
        targets = remedy.get("personalize_for") or []
        matched_targets = [target for target in targets if weights.get(target, 0) >= target_threshold]
        target_bonus = max((weights.get(target, 0.0) for target in matched_targets), default=0.0)
        relevance = round(min(1.0, condition_score + target_bonus / 2), 2)

        if relevance < relevance_floor:
            continue

        enriched = dict(remedy)
        enriched["relevance"] = relevance
        if matched_targets:
            enriched["matched_targets"] = matched_targets
        scored.append(enriched)

    if not scored:
        return remedies

    return sorted(scored, key=lambda entry: entry.get("relevance", 0.0), reverse=True)


def _compose_transit_interpretation(directives: List[TransitDirective], transit_dt: datetime) -> str:
    if not directives:
        return "Awaiting stronger gochar signals; continue remedial discipline."

    top = directives[0]
    formatted_date = transit_dt.date().isoformat()
    return (
        f"Transit focal point on {formatted_date} via {top.planet}: {top.influence} (certainty {top.certainty:.2f}) per {top.reference}."
    )


def _ranked_traits(weights: Dict[str, float], top: bool) -> List[str]:
    if not weights:
        return []
    ordered = sorted(weights.items(), key=lambda entry: entry[1], reverse=top)
    traits = [name.replace("_", " ") for name, score in ordered[:3] if score]
    return traits


def _future_tendencies(trajectories: List[FutureTrajectory]) -> str:
    if not trajectories:
        return "Upcoming windows emphasize steady practice; specific dates need consent."
    slices: List[str] = []
    for directive in trajectories[:3]:
        window = f" during {directive.window}" if directive.window else ""
        slices.append(f"{directive.focus}{window} (certainty {directive.certainty:.2f})")
    return "; ".join(slices)


def _guidance_summary(remedies: List[Dict], trajectories: List[FutureTrajectory]) -> str:
    remedy_notes = "; ".join(remedy.get("interpretation", "Remedy per folio") for remedy in remedies[:2]) if remedies else "Light a lamp mindfully, practice seva, and journal weekly."
    future_note = "" if not trajectories else f" Upcoming focus: {trajectories[0].focus}."
    return f"{remedy_notes}.{future_note}"


def _add_common_arguments(parser: argparse.ArgumentParser, prefix: str = "") -> None:
    opt = f"{prefix}-" if prefix else ""
    dest = f"{prefix}_" if prefix else ""
    parser.add_argument(f"--{opt}name", dest=f"{dest}name", required=True, help="Native name")
    parser.add_argument(f"--{opt}birth-date", dest=f"{dest}birth_date", required=True, help="Birth date YYYY-MM-DD")
    parser.add_argument(f"--{opt}birth-time", dest=f"{dest}birth_time", required=True, help="Birth time HH:MM")
    parser.add_argument(f"--{opt}birth-place", dest=f"{dest}birth_place", required=True, help="Birth location")
    parser.add_argument(
        f"--{opt}tradition",
        dest=f"{dest}tradition",
        default="universal",
        choices=["universal", "northern", "southern-grantha", "western-grantha"],
        help="Manuscript tradition to prioritize",
    )
    parser.add_argument(
        f"--{opt}lunar-tithi",
        dest=f"{dest}lunar_tithi",
        required=True,
        type=int,
        choices=range(1, 31),
        metavar="{1..30}",
        help="Lunar tithi (1-30)",
    )
    parser.add_argument(
        f"--{opt}moon-element",
        dest=f"{dest}moon_element",
        required=True,
        choices=sorted(SUPPORTED_MOON_ELEMENTS),
        help="Element of Moon (water/fire/air/earth/ether)",
    )
    parser.add_argument(
        f"--{opt}mars-house",
        dest=f"{dest}mars_house",
        required=True,
        type=int,
        choices=range(1, 13),
        metavar="{1..12}",
        help="House position of Mars",
    )
    parser.add_argument(
        f"--{opt}saturn-house",
        dest=f"{dest}saturn_house",
        required=True,
        type=int,
        choices=range(1, 13),
        metavar="{1..12}",
        help="House position of Saturn",
    )
    parser.add_argument(
        f"--{opt}venus-house",
        dest=f"{dest}venus_house",
        required=True,
        type=int,
        choices=range(1, 13),
        metavar="{1..12}",
        help="House position of Venus",
    )
    parser.add_argument(
        f"--{opt}ketu-house",
        dest=f"{dest}ketu_house",
        type=int,
        choices=range(0, 13),
        metavar="{0..12}",
        default=0,
        help="House position of Ketu (0 to skip)",
    )
    parser.add_argument(
        f"--{opt}mercury-house",
        dest=f"{dest}mercury_house",
        type=int,
        choices=range(0, 13),
        metavar="{0..12}",
        default=0,
        help="House position of Mercury (0 to skip)",
    )
    parser.add_argument(
        f"--{opt}jupiter-house",
        dest=f"{dest}jupiter_house",
        type=int,
        choices=range(0, 13),
        metavar="{0..12}",
        default=0,
        help="House position of Jupiter (0 to skip)",
    )
    parser.add_argument(
        f"--{opt}rahu-aspects-ascendant",
        dest=f"{dest}rahu_aspects_ascendant",
        action="store_true",
        help="Flag when Rahu aspects the Ascendant",
    )
    parser.add_argument(
        f"--{opt}saturn-retrograde",
        dest=f"{dest}saturn_retrograde",
        action="store_true",
        help="Mark Saturn retrograde for resilience and restoration sutras",
    )
    parser.add_argument(
        f"--{opt}consent-date-predictions",
        dest=f"{dest}consent_for_date_predictions",
        action="store_true",
        help="Explicit consent for date-sensitive forecasts and transits",
    )


def _request_from_namespace(namespace: argparse.Namespace, prefix: str = "") -> HoroscopeRequest:
    dest = f"{prefix}_" if prefix else ""
    return HoroscopeRequest(
        name=getattr(namespace, f"{dest}name"),
        birth_date=getattr(namespace, f"{dest}birth_date"),
        birth_time=getattr(namespace, f"{dest}birth_time"),
        birth_place=getattr(namespace, f"{dest}birth_place"),
        tradition=getattr(namespace, f"{dest}tradition"),
        lunar_tithi=getattr(namespace, f"{dest}lunar_tithi"),
        moon_element=getattr(namespace, f"{dest}moon_element"),
        mars_house=getattr(namespace, f"{dest}mars_house"),
        saturn_house=getattr(namespace, f"{dest}saturn_house"),
        venus_house=getattr(namespace, f"{dest}venus_house"),
        rahu_aspects_ascendant=getattr(namespace, f"{dest}rahu_aspects_ascendant"),
        ketu_house=getattr(namespace, f"{dest}ketu_house"),
        mercury_house=getattr(namespace, f"{dest}mercury_house"),
        jupiter_house=getattr(namespace, f"{dest}jupiter_house"),
        saturn_retrograde=getattr(namespace, f"{dest}saturn_retrograde"),
        consent_for_date_predictions=getattr(namespace, f"{dest}consent_for_date_predictions"),
    )


def _render_horoscope(report: HoroscopeReport, birth_place: str) -> None:
    _render_common_intro(report.name, birth_place)
    print(f"Karmic epoch: {report.karmic_epoch}")
    print(f"Interpretation: {report.interpretation}")
    print("Weights derived from Bhrigu sutras:")
    for key, value in report.weights.items():
        print(f"  - {key}: {value}")

    print("\nPast-life engines:")
    if report.past_life_insights:
        for insight in report.past_life_insights:
            print(
                f"  [{insight.engine_id}] {insight.narrative} (Confidence {insight.confidence} from {insight.sutra_reference})"
            )
    else:
        print("  No matching folios; consult Maharishi Bhrigu's remedies.")

    print("\nFuture directives:")
    if report.future_trajectories:
        for directive in report.future_trajectories:
            print(
                f"  [{directive.engine_id}] {directive.focus} | Window {directive.window} | Certainty {directive.certainty}"
            )
    else:
        print("  Awaiting further transits as per the Samhita.")

    print("\nPrinciple references:")
    for principle in report.principles:
        print(f"  [{principle['id']}] {principle['sutra_reference']}: {principle['description'].strip()}")

    print("\nRemedies:")
    for remedy in report.remedies:
        extras: List[str] = []
        if "relevance" in remedy:
            extras.append(f"relevance {remedy['relevance']}")
        if remedy.get("matched_targets"):
            targets = ", ".join(target.replace("_", " ") for target in remedy["matched_targets"])
            extras.append(f"personalized for {targets}")
        extra_text = f" [{' | '.join(extras)}]" if extras else ""
        print(f"  [{remedy['id']}] {remedy['description'].strip()} ({remedy['sutra_reference']}){extra_text}")

    interpretation_config = load_runtime_config().get("interpretation", {})
    disclaimer = interpretation_config.get("remedy_disclaimer")
    if disclaimer:
        print(f"\nNote: {disclaimer}")


def _render_past_life(report: PastLifeReport, birth_place: str) -> None:
    _render_common_intro(report.name, birth_place)
    print(f"Interpretation: {report.interpretation}")
    if not report.insights:
        print("No past-life folios matched the provided placements.")
        return
    print("Past-life transmissions:")
    for insight in report.insights:
        print(
            f"  [{insight.engine_id}] {insight.narrative} -- confidence {insight.confidence} ({insight.sutra_reference})"
        )


def _render_future(report: FutureReport, birth_place: str) -> None:
    _render_common_intro(report.name, birth_place)
    print(f"Interpretation: {report.interpretation}")
    if not report.trajectories:
        print("Future sutras are dormant for this configuration.")
    else:
        print("Future directives:")
        for directive in report.trajectories:
            print(f"  [{directive.engine_id}] {directive.focus} | Window {directive.window} | Certainty {directive.certainty}")
    if report.transit_directives:
        print("\nTransit overlays:")
        for directive in report.transit_directives:
            print(
                f"  [{directive.reference}] {directive.planet} transit -> {directive.influence} "
                f"(Certainty {directive.certainty})"
            )
    if report.progression_directives:
        print("\nSecondary progressions:")
        for directive in report.progression_directives:
            print(
                f"  [{directive.reference}] {directive.planet} progression -> {directive.influence} "
                f"(Certainty {directive.certainty})"
            )


def _render_matchmaking(report: MatchmakingReport) -> None:
    print(
        f"Modern Bhrigu matchmaking for {report.primary_name} × {report.partner_name}: {report.compatibility.compatibility_index}%"
    )
    print(
        f"Long-term index: {report.compatibility.long_term_index}% | Short-term index: {report.compatibility.short_term_index}%"
    )
    print(f"Interpretation: {report.interpretation}")
    print("Breakdown by folio:")
    for criterion in report.compatibility.breakdown:
        print(
            f"  [{criterion.criterion_id}] {criterion.description.strip()} -> score {criterion.score} ({criterion.sutra_reference})"
        )
        print(f"     Notes: {criterion.notes}")
    if report.compatibility.modern_highlights:
        print("\nModern alignment notes:")
        for note in report.compatibility.modern_highlights:
            print(f"  - {note}")
    if report.compatibility.synastry_overlays:
        print("\nSynastry overlays:")
        for overlay in report.compatibility.synastry_overlays:
            print(
                f"  - {overlay.area}: {overlay.alignment}% ({overlay.primary_marker} ↔ {overlay.partner_marker}) — {overlay.notes}"
            )
    if report.compatibility.alignment_percentages:
        ap = report.compatibility.alignment_percentages
        print(
            "\nAlignment percentages (emotional / spiritual / communication): "
            f"{ap.get('emotional', 0)}% / {ap.get('spiritual', 0)}% / {ap.get('communication', 0)}%"
        )
    if report.compatibility.shared_life_paths:
        print("\nShared life path insights:")
        for line in report.compatibility.shared_life_paths:
            print(f"  - {line}")


def _render_calendar(context: HinduCalendarContext) -> None:
    print("Bhrigu Samhita insists on capturing exact birth particulars.")
    print(f"Gregorian record: {context.birth_date.isoformat()} {context.birth_time.isoformat(timespec='minutes')} at {context.birth_place}")
    saka = context.saka_date
    print(
        "Śaka (Hindu national) conversion:"
        f" Year {saka.year}, Month {saka.month} ({saka.month_index}), Day {saka.day},"
        f" Leap-adjusted Chaitra: {'Yes' if saka.leap_year else 'No'}"
    )
    print(f"Conversion factor (Gregorian minus Śaka): {context.conversion_factor_years} years")
    print(f"Indian Standard Time reference longitude: {context.ist_reference_longitude}°E")
    print(f"Ephemeris source: {context.ephemeris_source}")
    print("Authentic Indian sources consulted:")
    for source in context.sources:
        print(f"  - {source}")


def build_cli_parser() -> argparse.ArgumentParser:
    """Create the argparse parser so tests and embeddings can share it."""

    parser = argparse.ArgumentParser(description="Bhrigu Samhita derived prediction engines")
    subparsers = parser.add_subparsers(dest="command", required=True)

    horoscope_parser = subparsers.add_parser("horoscope", help="Generate a full horoscope report")
    _add_common_arguments(horoscope_parser)

    past_parser = subparsers.add_parser("past-life", help="Generate a past-life focused report")
    _add_common_arguments(past_parser)

    future_parser = subparsers.add_parser("future", help="Generate future directives")
    _add_common_arguments(future_parser)

    matchmaking_parser = subparsers.add_parser("matchmaking", help="Modern compatibility diagnostics")
    _add_common_arguments(matchmaking_parser, prefix="primary")
    _add_common_arguments(matchmaking_parser, prefix="partner")
    matchmaking_parser.add_argument(
        "--modern-preference",
        action="append",
        default=[],
        help="Tag matchmaking intent such as remote-first, research-partnership, startup-ops, arts-collab",
    )

    calendar_parser = subparsers.add_parser(
        "calendar",
        help="Convert Gregorian birth data to Hindu (Śaka) calendar measurements",
    )
    calendar_parser.add_argument("--birth-date", required=True, help="Birth date YYYY-MM-DD")
    calendar_parser.add_argument("--birth-time", required=True, help="Birth time HH:MM")
    calendar_parser.add_argument("--birth-place", required=True, help="Birth location per passport")

    return parser


def parse_cli_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    """Expose the CLI parser for reuse in integration tests or shells."""

    return build_cli_parser().parse_args(argv)


def main(argv: Sequence[str] | None = None) -> None:
    args = parse_cli_args(argv)

    if args.command == "horoscope":
        request = _request_from_namespace(args)
        report = build_prediction(request)
        _render_horoscope(report, args.birth_place)
    elif args.command == "past-life":
        request = _request_from_namespace(args)
        report = build_past_life_report(request)
        _render_past_life(report, args.birth_place)
    elif args.command == "future":
        request = _request_from_namespace(args)
        report = build_future_report(request)
        _render_future(report, args.birth_place)
    elif args.command == "matchmaking":
        primary_request = _request_from_namespace(args, prefix="primary")
        partner_request = _request_from_namespace(args, prefix="partner")
        report = build_matchmaking_report(primary_request, partner_request, args.modern_preference)
        _render_matchmaking(report)
    elif args.command == "calendar":
        context = build_calendar_context(args.birth_date, args.birth_time, args.birth_place)
        _render_calendar(context)
    else:  # pragma: no cover - defensive
        parser.error("Unknown command")


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()
