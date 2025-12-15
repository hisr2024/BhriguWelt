"""CLI + helpers for generating horoscopes rooted in Bhrigu Samhita sutras."""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Sequence

from .astronomical_calculations import derive_progressed_snapshot, derive_transit_snapshot, normalize_birth_datetime
from .calendar_conversion import HinduCalendarContext, convert_birth_details
from .chart_engine import ChartEngine, PersonalizationContext
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
from .core_wisdom_rules import core_wisdom_assets
from .engine_analyzers import EngineAnalysis, analyze_core_engines
from .runtime_rule_generator import RuntimeRuleGenerator
from .kundli_generator import generate_kundli

__all__ = [
    "HoroscopeRequest",
    "HoroscopeReport",
    "PastLifeReport",
    "FutureReport",
    "MatchmakingReport",
    "KarmicDashboard",
    "VarshaphalReport",
    "YearSegment",
    "CoreWisdomReading",
    "SUPPORTED_MOON_ELEMENTS",
    "build_core_wisdom_reading",
    "build_varshaphal_report",
    "build_karmic_dashboard",
    "build_prediction",
    "build_past_life_report",
    "build_future_report",
    "build_matchmaking_report",
    "build_timeline_report",
    "build_transit_report",
    "build_engine_outputs",
    "build_calendar_context",
    "build_cli_parser",
    "parse_cli_args",
    "main",
    "ChartHouse",
    "DashaPeriod",
    "generate_kundli",
    "EngineAnalysis",
    "analyze_core_engines",
]


SUPPORTED_MOON_ELEMENTS = {"water", "fire", "air", "earth", "ether"}


def _ensure_bhrigu_data_available(core_bundle: Dict[str, object], required_keys: Sequence[str], tradition: str) -> None:
    """Ensure core engines have manuscript-backed data before running calculations."""

    missing = [key for key in required_keys if not core_bundle.get(key)]
    if missing:
        joined = ", ".join(sorted(missing))
        raise ValueError(
            "Bhrigu Samhita dataset is required for precise calculations; "
            f"missing manuscript entries for: {joined} (tradition='{tradition or 'universal'}')"
        )


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
    ephemeris_preference: str | None = None
    choices: Dict[str, str] | None = None
    mitigation_flags: List[str] | None = None
    effort_level: str | None = None
    reflection_prompts: List[str] | None = None

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
        self.choices = self.choices or {}
        self.mitigation_flags = list(self.mitigation_flags or [])
        self.reflection_prompts = list(self.reflection_prompts or [])


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
    runtime_rules: Dict[str, object]
    ephemeris_source: str


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
    sections: Dict[str, str]


@dataclass
class TimelinePhase:
    """Single life-phase entry for the Bhrigu-inspired roadmap."""

    phase: str
    age_range: str
    theme: str
    dominant_influence: str
    main_experiences: List[str]
    karmic_lessons: List[str]
    turning_points: List[str]
    practical_guidance: List[str]


@dataclass
class TimelineReport:
    """Five-phase karmic roadmap aligned to the Bhrigu brief."""

    name: str
    summary: str
    disclaimer: str
    phases: List[TimelinePhase]


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
    sources: List[str]
    rule_engine: Dict[str, object] = field(default_factory=dict)


@dataclass
class KarmicDashboard:
    """Dashboard-style karmic overview with hotspots, gifts, and assignments."""

    sections: Dict[str, str]
    hotspots: List[Dict[str, str]]
    gifts: List[Dict[str, str]]
    active_themes: List[str]
    assignments: List[str]
    charts: Dict[str, List[ChartHouse]]
    dashas: List[DashaPeriod]
    karmic_epoch: str


@dataclass
class EngineOutputs:
    """Precise multi-engine digest grounded in the Bhrigu corpus."""

    name: str
    karmic_epoch: str
    weights: Dict[str, float]
    principles: List[Dict]
    remedies: List[Dict]
    past_life_insights: List[PastLifeInsight]
    future_directives: List[FutureTrajectory]
    transit_directives: List[TransitDirective]
    interpretation: str
    engine_analyses: List[EngineAnalysis]


@dataclass
class YearSegment:
    """Quarterly or monthly block for the Varshaphal roadmap."""

    label: str
    months: List[str]
    energies: str
    cautions: str
    opportunities: str


@dataclass
class VarshaphalReport:
    """Twelve-month Bhrigu-style yearly karmic report."""

    name: str
    target_year: str
    year_theme: str
    year_mantra: str
    sections: Dict[str, str]
    segments: List[YearSegment]
    gateways: List[str]
    focus_areas: Dict[str, str]
    practices: List[str]
    intentions: List[str]


def build_calendar_context(
    birth_date: str, birth_time: str, birth_place: str
) -> HinduCalendarContext:
    """Return a Hindu calendar representation for the supplied birth record."""

    return convert_birth_details(birth_date=birth_date, birth_time=birth_time, birth_place=birth_place)


def _build_personalization_context(request: HoroscopeRequest) -> PersonalizationContext:
    return PersonalizationContext(
        choices=request.choices or {},
        mitigation_flags=request.mitigation_flags or [],
        effort_level=request.effort_level or "balanced",
        reflection_prompts=request.reflection_prompts or [
            "Pause before key decisions",
            "Seek counsel from trusted mentors",
        ],
    )


def build_prediction(request: HoroscopeRequest) -> HoroscopeReport:
    runtime_config = load_runtime_config()
    chart_engine = ChartEngine(ephemeris_preference=request.ephemeris_preference)
    core_bundle = bhrigu_core.application_bundle(request.tradition)
    _ensure_bhrigu_data_available(core_bundle, ("principles", "past_life_engines", "future_engines"), request.tradition)
    principles = core_bundle.get("principles", [])
    remedies = core_bundle.get("remedies", [])
    past_life_engines = core_bundle.get("past_life_engines", [])
    future_engines = core_bundle.get("future_engines", [])

    snapshot = _snapshot_from_request(request)
    chart_result = chart_engine.compute_chart(snapshot=snapshot, timezone_name=request.timezone)
    dashas_for_rules = chart_engine.compute_dashas(
        datetime.combine(snapshot.birth_date, snapshot.birth_time).replace(tzinfo=timezone.utc),
        moon_longitude=chart_result.planet_longitudes.get("Moon"),
    )
    personalization = _build_personalization_context(request)
    runtime_rules = RuntimeRuleGenerator().generate(
        snapshot=snapshot,
        chart=chart_result,
        dashas=dashas_for_rules,
        personalization=personalization,
    )

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
        runtime_rules=runtime_rules,
        ephemeris_source=chart_result.ephemeris_source,
    )


def build_past_life_report(request: HoroscopeRequest) -> PastLifeReport:
    runtime_config = load_runtime_config()
    snapshot = _snapshot_from_request(request)
    core_bundle = bhrigu_core.application_bundle(request.tradition)
    _ensure_bhrigu_data_available(core_bundle, ("past_life_engines",), request.tradition)
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
    _ensure_bhrigu_data_available(core_bundle, ("future_engines", "transit_rules"), request.tradition)
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
    _ensure_bhrigu_data_available(core_bundle, ("transit_rules",), request.tradition)
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


def build_engine_outputs(request: HoroscopeRequest) -> EngineOutputs:
    """Return a consolidated view across every Bhrigu Samhita engine."""

    runtime_config = load_runtime_config()
    core_bundle = bhrigu_core.application_bundle(request.tradition)
    _ensure_bhrigu_data_available(
        core_bundle,
        ("principles", "past_life_engines", "future_engines", "transit_rules", "remedies"),
        request.tradition,
    )

    principles = core_bundle.get("principles", [])
    remedies = core_bundle.get("remedies", [])
    past_life_engines = core_bundle.get("past_life_engines", [])
    future_engines = core_bundle.get("future_engines", [])
    transit_rules = core_bundle.get("transit_rules", [])

    snapshot = _snapshot_from_request(request)
    weights = score_principles(snapshot, principles, runtime_config)
    karmic_epoch = derive_karmic_epoch(snapshot)
    past_life_insights = evaluate_past_life(snapshot, past_life_engines)
    future_directives = evaluate_future_directives(snapshot, future_engines)

    now = datetime.utcnow()
    transit_dt = normalize_birth_datetime(
        now.date().isoformat(), now.time().isoformat(timespec="minutes"), timezone_name=request.timezone
    )
    natal_dt = normalize_birth_datetime(request.birth_date, request.birth_time, timezone_name=request.timezone)
    transit_details = derive_transit_snapshot(natal_dt, transit_dt)
    transit_directives = evaluate_transits(snapshot, transit_details, transit_rules)

    personalized_remedies = _personalize_remedies(remedies, weights, snapshot, runtime_config)
    engine_analyses = analyze_core_engines(request.tradition, core_bundle)

    return EngineOutputs(
        name=request.name,
        karmic_epoch=karmic_epoch,
        weights=weights,
        principles=principles,
        remedies=personalized_remedies,
        past_life_insights=past_life_insights,
        future_directives=future_directives,
        transit_directives=transit_directives,
        interpretation=_compose_horoscope_interpretation(
            karmic_epoch,
            weights,
            past_life_insights,
            future_directives,
            personalized_remedies,
            request.name,
            request.birth_place,
            runtime_config.get("interpretation", {}),
        ),
        engine_analyses=engine_analyses,
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

    rule_engine_bundle = core_wisdom_assets()

    return CoreWisdomReading(
        sections=sections,
        charts={"rashi_chart": horoscope.rashi_chart, "bhava_chart": horoscope.bhava_chart},
        dashas=horoscope.dashas,
        karmic_epoch=horoscope.karmic_epoch,
        remedies=horoscope.remedies,
        sources=_collect_bhrigu_texts(horoscope, request.tradition),
        rule_engine=rule_engine_bundle,
    )


def _collect_bhrigu_texts(horoscope: HoroscopeReport, tradition: str) -> List[str]:
    """Return manuscript excerpts spanning all available Bhrigu Samhita sources."""

    texts: List[str] = []
    normalized_tradition = (tradition or "universal").replace("-", " ").title()
    texts.append(f"Tradition focus: {normalized_tradition} recension")

    try:
        dataset = bhrigu_core.dataset()
        note = dataset.get("metadata", {}).get("source_note")
        if note:
            texts.append(f"Corpus note: {note}")
    except Exception:  # pragma: no cover - defensive fallback
        pass

    def _append(entry: str | None) -> None:
        if entry and entry not in texts:
            texts.append(entry)

    for principle in horoscope.principles[:4] if horoscope.principles else []:
        description = principle.get("description")
        reference = principle.get("sutra_reference") or principle.get("id")
        integrity_sources = principle.get("integrity", {}).get("sources")
        source_note = f" (sources: {', '.join(integrity_sources)})" if integrity_sources else ""
        _append(f"{reference}: {description}{source_note}")

    for insight in horoscope.past_life_insights[:3]:
        _append(f"{insight.sutra_reference}: {insight.narrative}")

    for trajectory in horoscope.future_trajectories[:3]:
        window = f" ({trajectory.window})" if trajectory.window else ""
        _append(f"{trajectory.sutra_reference}: {trajectory.focus}{window}")

    for remedy in horoscope.remedies[:3]:
        description = remedy.get("description")
        reference = remedy.get("sutra_reference") or remedy.get("id", "Remedy")
        _append(f"{reference}: {description}")

    if not texts:
        _append("Bhrigu Samhita manuscripts available; awaiting aligned extracts.")

    return texts


def build_karmic_dashboard(
    request: HoroscopeRequest,
    *,
    focus_areas: Sequence[str] | None = None,
    issues: Sequence[str] | None = None,
    current_phase: str | None = None,
) -> KarmicDashboard:
    """Return the 8-section Karmic Dashboard with hotspots, gifts, and micro-steps."""

    horoscope = build_prediction(request)
    focus_summary = ", ".join(focus_areas) if focus_areas else "general balance"
    issue_summary = ", ".join(issues) if issues else ""

    strengths = _ranked_traits(horoscope.weights, top=True)
    challenges = _ranked_traits(horoscope.weights, top=False)

    hotspots = _dashboard_hotspots(horoscope.weights, challenges)
    gifts = _dashboard_gifts(horoscope.weights, strengths)

    active_themes = _dashboard_active_themes(horoscope.karmic_epoch, horoscope.future_trajectories, current_phase)
    assignments = _dashboard_assignments(horoscope.remedies, hotspots, gifts)

    sections = {
        "1": (
            "Restatement of Data & Focus: "
            f"Name {request.name}. Birth {request.birth_date} at {request.birth_time} in {request.birth_place}. "
            f"Focus: {focus_summary}."
            f" Issues flagged: {issue_summary or 'none supplied'}."
        ),
        "2": (
            "Disclaimer & Orientation: Reflective spiritual dashboard, not medical/legal/financial advice."
            " Use as prompts and adjust freely."
        ),
        "3": (
            "Karmic Overview Summary: "
            f"Epoch — {horoscope.karmic_epoch}. "
            f"Strength lanes: {', '.join(strengths) or 'adaptability and steady practice'}. "
            f"Pressure lanes: {', '.join(challenges) or 'balancing intuition with action'}. "
            f"Interpretation: {horoscope.interpretation}"
        ),
        "4": (
            "Karma Hotspots (Pressure Zones): "
            + "; ".join(f"{item['label']} — {item['description']}" for item in hotspots)
        ),
        "5": (
            "Karmic Gifts (Supportive Zones): "
            + "; ".join(f"{item['label']} — {item['how_to_use']}" for item in gifts)
        ),
        "6": (
            "Current Active Themes (Right Now): "
            + "; ".join(active_themes)
        ),
        "7": (
            "Suggested Karmic Assignments (Next 30–90 Days): "
            + "; ".join(assignments)
        ),
        "8": (
            "Closing & Free Will: These notes are experiments. Keep what resonates, revise what doesn't,"
            " and steer with conscious choice."
        ),
    }

    return KarmicDashboard(
        sections=sections,
        hotspots=hotspots,
        gifts=gifts,
        active_themes=active_themes,
        assignments=assignments,
        charts={"rashi_chart": horoscope.rashi_chart, "bhava_chart": horoscope.bhava_chart},
        dashas=horoscope.dashas,
        karmic_epoch=horoscope.karmic_epoch,
    )


def build_varshaphal_report(
    request: HoroscopeRequest, target_year: str, main_focus: str | None = None
) -> VarshaphalReport:
    """Return a 12-month Bhrigu Varshaphal digest with gateways and practices."""

    target_label = (target_year or "next 12 months").strip() or "next 12 months"
    focus = (main_focus or "").strip()

    horoscope = build_prediction(request)
    snapshot = _snapshot_from_request(request)
    influences = _rank_influences(snapshot)

    year_theme, mantra = _derive_year_theme(horoscope.karmic_epoch, influences, focus)
    segments = _build_year_segments(horoscope, influences, target_label, focus)
    gateways = _gateway_windows(horoscope.future_trajectories, segments)
    focus_areas = _focus_area_summaries(horoscope.weights, influences, focus)
    practices = _year_practices(focus, influences, horoscope.remedies)
    intentions = _year_intentions(focus, influences)

    sections = _compose_varshaphal_sections(
        request,
        target_label,
        focus,
        year_theme,
        mantra,
        segments,
        gateways,
        focus_areas,
        practices,
        intentions,
    )

    return VarshaphalReport(
        name=request.name,
        target_year=target_label,
        year_theme=year_theme,
        year_mantra=mantra,
        sections=sections,
        segments=segments,
        gateways=gateways,
        focus_areas=focus_areas,
        practices=practices,
        intentions=intentions,
    )


def build_matchmaking_report(
    primary_request: HoroscopeRequest,
    partner_request: HoroscopeRequest,
    modern_preferences: List[str],
    core_bundle: Dict[str, object] | None = None,
) -> MatchmakingReport:
    runtime_config = load_runtime_config()
    primary_snapshot = _snapshot_from_request(primary_request)
    partner_snapshot = _snapshot_from_request(partner_request)

    dataset = core_bundle or bhrigu_core.application_bundle(primary_request.tradition)
    _ensure_bhrigu_data_available(dataset, ("matchmaking_criteria",), primary_request.tradition)

    matchmaking_criteria = dataset.get("matchmaking_criteria", [])

    compatibility = evaluate_matchmaking(
        primary=primary_snapshot,
        partner=partner_snapshot,
        criteria=matchmaking_criteria,
        modern_preferences=modern_preferences,
    )

    sections = _compose_matchmaking_sections(
        compatibility=compatibility,
        primary_request=primary_request,
        partner_request=partner_request,
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
        sections=sections,
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


def _compose_matchmaking_sections(
    compatibility: MatchmakingCompatibility,
    primary_request: HoroscopeRequest,
    partner_request: HoroscopeRequest,
    modern_preferences: List[str],
) -> Dict[str, str]:
    """Return an 8-section compatibility digest aligned with the Bhrigu brief."""

    name_a = primary_request.name or "Person A"
    name_b = partner_request.name or "Person B"
    prefs = ", ".join(modern_preferences) if modern_preferences else "none provided"
    time_notice_a = "(approximate)" if not primary_request.birth_time else ""
    time_notice_b = "(approximate)" if not partner_request.birth_time else ""

    comp_index = compatibility.compatibility_index
    long_term = compatibility.long_term_index
    alignment = compatibility.alignment_percentages or {}

    varna_note = "balanced temperament blend" if comp_index >= 70 else "differing spiritual pacing"
    nadi_note = "strong vitality sync" if long_term >= 70 else "needs mindful health rhythms"
    bhakoot_note = "steady emotional bonding" if alignment.get("emotional", 0) >= 60 else "emotions differ in cadence"
    graha_note = "friendlike rapport" if alignment.get("communication", 0) >= 60 else "communication styles diverge"

    overlay = compatibility.synastry_overlays[0] if compatibility.synastry_overlays else None
    overlay_text = (
        f"Synastry focus on {overlay.area}: {overlay.alignment:.0f}% harmony — {overlay.notes}"
        if overlay
        else "Synastry overlays will refine as more chart details are supplied."
    )

    shared_path = compatibility.shared_life_paths[0] if compatibility.shared_life_paths else None
    shared_text = (
        f"Shared path {shared_path.theme} ({shared_path.resonance:.0f}% resonance): {shared_path.guidance}"
        if shared_path
        else "Record shared milestones to refine dharmic overlap."
    )

    breakdown = sorted(compatibility.breakdown, key=lambda entry: entry.score, reverse=True)[:3]
    breakdown_text = "; ".join(f"{entry.description.strip()} ({entry.sutra_reference})" for entry in breakdown)
    modern_highlight = compatibility.modern_highlights[0] if compatibility.modern_highlights else "Emphasize empathy and consent."

    sections: Dict[str, str] = {}
    sections["1"] = (
        f"Couple data — {name_a} (DOB {primary_request.birth_date} {primary_request.birth_time or 'unknown'} {time_notice_a}) "
        f"from {primary_request.birth_place}; {name_b} (DOB {partner_request.birth_date} {partner_request.birth_time or 'unknown'} {time_notice_b}) "
        f"from {partner_request.birth_place}. Query: modern Bhrigu-style compatibility with preferences: {prefs}."
    )
    sections["2"] = (
        "Bhrigu Samhita–inspired, symbolic guidance. Not medical, legal, or financial advice. "
        "Use for reflection and conversation; honour consent and safety."
    )
    sections["3"] = (
        f"Individual snapshots — {name_a}: emotional tone shaped by {primary_request.moon_element or 'balancing elements'}, "
        f"relationship energy via Mars house {primary_request.mars_house or 'n/a'}, Venus house {primary_request.venus_house or 'n/a'}. "
        f"{name_b}: emotional tone shaped by {partner_request.moon_element or 'balancing elements'}, "
        f"relationship energy via Mars house {partner_request.mars_house or 'n/a'}, Venus house {partner_request.venus_house or 'n/a'}."
    )
    sections["4"] = (
        "Ashta Koota synthesis — Varna: "
        f"{varna_note}; Vashya: cooperation improves when pacing is acknowledged; Tara: nurture wellbeing rituals together; "
        f"Yoni: respect boundaries while keeping warmth alive; Graha Maitri: {graha_note}; Gana: blend moods with humour; "
        f"Bhakoot: {bhakoot_note}; Nadi: {nadi_note}. Total harmony tilt ≈ {comp_index:.1f}/100 (conceptually ~{comp_index*0.36:.1f}/36)."
    )
    sections["5"] = (
        f"Dimensional compatibility — Emotional {alignment.get('emotional', 0):.0f}% • Spiritual {alignment.get('spiritual', 0):.0f}% • "
        f"Communication {alignment.get('communication', 0):.0f}%. {overlay_text} {shared_text}"
    )
    sections["6"] = (
        "Risk & balance — Watch for differing communication cadence and expectations around tradition vs flexibility. "
        f"Balancing factors: {breakdown_text or 'shared curiosity and goodwill'}, plus modern note: {modern_highlight}."
    )
    sections["7"] = (
        f"Guidance — Set weekly check-ins, alternate decision leadership, and align finances with shared priorities. "
        f"{name_a} can practice steady listening; {name_b} can share needs early. Joint remedy: short gratitude ritual and service together."
    )
    sections["8"] = (
        "Closing — Charts show patterns, not verdicts. Free will, consent, and mutual respect lead. Take what resonates and adapt together."
    )

    return sections


def _derive_year_theme(karmic_epoch: str, influences: Sequence[str], focus: str) -> tuple[str, str]:
    primary = (influences[0] if influences else "Saturn").title()
    supportive = ", ".join(influence.title() for influence in influences[1:3]) or "steady practice"
    theme_map = {
        "Saturn": "Consolidation & Responsibility",
        "Jupiter": "Expansion & Grace",
        "Mars": "Courage & Initiative",
        "Venus": "Harmony & Creative Bonds",
        "Rahu": "Innovation & Recalibration",
        "Ketu": "Detachment & Insight",
    }
    mantra_map = {
        "Saturn": "Discipline",
        "Jupiter": "Trust",
        "Mars": "Courage",
        "Venus": "Harmony",
        "Rahu": "Reinvent",
        "Ketu": "Surrender",
    }

    base_theme = theme_map.get(primary, "Integration & Steady Rhythm")
    focus_clause = f" Main focus: {focus}." if focus else " Focus: balanced dharma across life areas."
    theme = f"{base_theme}. Karmic epoch: {karmic_epoch}. Support from {supportive}." + focus_clause
    return theme, mantra_map.get(primary, "Integration")


def _build_year_segments(
    horoscope: HoroscopeReport, influences: Sequence[str], target_year: str, focus: str
) -> List[YearSegment]:
    quarters = [
        ("Q1", ["Jan", "Feb", "Mar"]),
        ("Q2", ["Apr", "May", "Jun"]),
        ("Q3", ["Jul", "Aug", "Sep"]),
        ("Q4", ["Oct", "Nov", "Dec"]),
    ]

    directives = horoscope.future_trajectories or []
    remedies = horoscope.remedies or []

    segments: List[YearSegment] = []
    for index, (label, months) in enumerate(quarters):
        anchor = influences[index % len(influences)] if influences else "Integration"
        directive = directives[index] if index < len(directives) else None
        remedy_hint = None
        if remedies:
            remedy = remedies[index % len(remedies)]
            remedy_hint = remedy.get("interpretation") or remedy.get("description") or remedy.get("id")

        energies = f"{anchor.title()} tone with {focus or 'balanced growth'} as the anchor."
        if directive:
            window = directive.window or f"{label} {target_year}"
            energies += f" Highlight: {directive.focus} ({window}) per folio {directive.sutra_reference}."

        caution = (
            f"Guard energy during {months[1]}–{months[2]} by pacing decisions; "
            f"{anchor.lower()} patterns may tempt over-commitment."
        )
        opportunities = (
            f"Use {anchor.lower()} discipline to schedule check-ins each month. "
            f"Remedy focus: {remedy_hint or 'keep weekly seva and breath practice'}."
        )

        segments.append(
            YearSegment(
                label=f"{label} {target_year}",
                months=months,
                energies=energies,
                cautions=caution,
                opportunities=opportunities,
            )
        )

    return segments


def _gateway_windows(trajectories: List[FutureTrajectory], segments: Sequence[YearSegment]) -> List[str]:
    gateways: List[str] = []
    for directive in trajectories[:4]:
        window = directive.window or "mid-year"
        gateways.append(f"{window}: {directive.focus} (certainty {directive.certainty:.2f})")

    if len(gateways) < 2:
        for segment in segments:
            gateways.append(f"{segment.label}: {segment.energies}")
            if len(gateways) >= 2:
                break

    return gateways[:4]


def _focus_area_summaries(weights: Dict[str, float], influences: Sequence[str], focus: str) -> Dict[str, str]:
    strengths = _ranked_traits(weights, top=True)
    challenges = _ranked_traits(weights, top=False)
    primary = (influences[0] if influences else "Saturn").lower()
    focus_clause = f" Priority: {focus}." if focus else ""

    return {
        "career_finances": (
            f"{primary.title()} tone favors structured planning and transparent numbers. "
            f"Strengths: {', '.join(strengths) or 'resilience'}. "
            f"Cautions: {', '.join(challenges) or 'overcommitting without rest'}.{focus_clause}"
        ),
        "relationships_family": (
            "Practice honest pacing in bonds. Blend duty with warmth; schedule family councils so expectations surface early. "
            f"Watch reactive moments when {primary} pressure rises."
        ),
        "inner_life_health": (
            "Anchor routines: rest, hydration, movement, breath. Track emotional weather weekly to notice patterns between mood "
            "and decisions."
        ),
        "spiritual_growth": (
            f"Karmic epoch suggests contemplative study with {primary} discipline. Daily gratitude + mantra keeps humility alive."
        ),
    }


def _year_practices(focus: str, influences: Sequence[str], remedies: List[Dict]) -> List[str]:
    primary = (influences[0] if influences else "Saturn").lower()
    practices = [
        "Weekly planning ritual with a short gratitude ledger.",
        "Monthly financial/energy review aligned to lunar dates.",
        "Daily 7-minute grounding: breath, stretch, mantra.",
        "Quarterly declutter + seva to keep karma light.",
    ]
    if focus:
        practices.append(f"Dedicated focus block each week for {focus} without distractions.")
    if remedies:
        remedy_text = remedies[0].get("interpretation") or remedies[0].get("description") or remedies[0].get("id")
        if remedy_text:
            practices.append(f"Primary remedy: {remedy_text}.")
    if primary in {"saturn", "mars"}:
        practices.append("Alternate intense weeks with gentler pacing to avoid burnout.")
    else:
        practices.append("Invite creativity (journaling, music) to process insights each weekend.")
    return practices[:7]


def _year_intentions(focus: str, influences: Sequence[str]) -> List[str]:
    primary = (influences[0] if influences else "Saturn").title()
    intentions = [
        "I will revisit this report each quarter and adjust consciously.",
        "I will speak honestly and kindly, even when pacing shifts.",
        "I will protect rest so the body integrates effort.",
    ]
    if focus:
        intentions.append(f"I will move {focus} forward with patient {primary.lower()} steadiness.")
    intentions.append("I will treat gateways as invitations, not verdicts, and choose with free will.")
    return intentions[:5]


def _compose_varshaphal_sections(
    request: HoroscopeRequest,
    target_year: str,
    focus: str,
    year_theme: str,
    year_mantra: str,
    segments: Sequence[YearSegment],
    gateways: Sequence[str],
    focus_areas: Dict[str, str],
    practices: Sequence[str],
    intentions: Sequence[str],
) -> Dict[str, str]:
    restatement = (
        "Restatement of Data & Target Year: "
        f"Name {request.name}. Birth {request.birth_date} at {request.birth_time} in {request.birth_place}. "
        f"Target window: {target_year}. Focus: {focus or 'holistic balance'}."
    )
    disclaimer = (
        "Disclaimer & Orientation: Bhrigu Samhita–inspired reflective guide. "
        "Not medical, legal, or financial advice. Timings are tendencies; free will leads."
    )
    theme_section = f"Overall Year Theme: {year_theme} | Year Mantra: {year_mantra}."
    breakdown = "; ".join(
        (
            f"{segment.label} ({', '.join(segment.months)}): Energies — {segment.energies} | "
            f"Cautions — {segment.cautions} | Opportunities — {segment.opportunities}"
        )
        for segment in segments
    )
    gateways_section = "Key Gateways: " + ("; ".join(gateways) or "Track monthly check-ins for shifts.")
    focus_section = (
        "Focus Areas — Career/Finances: "
        f"{focus_areas.get('career_finances', '')} "
        f"Relationships/Family: {focus_areas.get('relationships_family', '')} "
        f"Inner life/Health: {focus_areas.get('inner_life_health', '')} "
        f"Spiritual growth: {focus_areas.get('spiritual_growth', '')}"
    )
    practices_section = (
        "Recommended Practices: " + "; ".join(practices) + ". " + "Intentions: " + "; ".join(intentions)
    )
    closing = (
        "Closing & Free Will: Revisit each quarter. Choices + awareness reshape outcomes; carry gratitude and adjust freely."
    )

    return {
        "1": restatement,
        "2": disclaimer,
        "3": theme_section,
        "4": "Quarterly / Monthly Breakdown: " + breakdown,
        "5": gateways_section,
        "6": focus_section,
        "7": practices_section,
        "8": closing,
    }


def _rank_influences(snapshot: CelestialSnapshot) -> List[str]:
    """Return a ranked list of dominant planetary-style influences."""

    influence_weights: Dict[str, float] = {
        "Saturn": 0.35 + (0.08 if snapshot.saturn_retrograde else 0.0),
        "Jupiter": 0.32,
        "Mars": 0.28,
        "Venus": 0.28,
        "Rahu": 0.2 if snapshot.rahu_aspects_ascendant else 0.08,
        "Ketu": 0.18 if snapshot.ketu_house in {8, 12} else 0.1,
    }

    if snapshot.saturn_house in {1, 4, 7, 10}:
        influence_weights["Saturn"] += 0.08
    if snapshot.jupiter_house in {1, 5, 9}:
        influence_weights["Jupiter"] += 0.06
    if snapshot.mars_house in {3, 6, 10, 11}:
        influence_weights["Mars"] += 0.06
    if snapshot.venus_house in {2, 7, 11}:
        influence_weights["Venus"] += 0.06
    if snapshot.moon_element in {"water", "ether"}:
        influence_weights["Jupiter"] += 0.04
        influence_weights["Venus"] += 0.04
    if snapshot.moon_element == "fire":
        influence_weights["Mars"] += 0.05
    if snapshot.moon_element == "air":
        influence_weights["Rahu"] += 0.04

    return [name for name, _ in sorted(influence_weights.items(), key=lambda item: item[1], reverse=True)]


def build_timeline_report(request: HoroscopeRequest, focus_areas: Sequence[str] | None = None) -> TimelineReport:
    """Construct the five-phase karmic roadmap for a native."""

    snapshot = _snapshot_from_request(request)
    influences = _rank_influences(snapshot)
    phases = _compose_timeline(snapshot, influences, focus_areas)
    focus_summary = ", ".join(focus_areas) if focus_areas else "general life balance"
    summary = (
        f"Five-phase roadmap shaped by {', '.join(influences[:2]) or 'Saturn discipline'}; "
        f"focus on {focus_summary}."
    )
    disclaimer = (
        "Symbolic Bhrigu timeline; not medical, legal, or financial advice. "
        "Treat timings as tendencies and steer with conscious choice."
    )

    return TimelineReport(name=request.name, summary=summary, disclaimer=disclaimer, phases=phases)


def _compose_timeline(
    snapshot: CelestialSnapshot, influences: Sequence[str], focus_areas: Sequence[str] | None = None
) -> List[TimelinePhase]:
    """Assemble five life phases with Bhrigu-style tones."""

    focus_set = {area.lower() for area in focus_areas or []}
    dominant = influences[0] if influences else "Saturn"
    supportive = influences[1:3]

    base_phases = [
        ("Childhood", "0–12", "Foundations & Family Imprint"),
        ("Adolescence", "13–18", "Search for Identity & Independence"),
        ("Early Adulthood", "19–28", "Skill-Building & First Commitments"),
        ("Consolidation", "29–40", "Building Work & Relationship Structures"),
        ("Mature Years", "41+", "Integration, Mentorship & Spiritual Ripening"),
    ]

    phases: List[TimelinePhase] = []
    for idx, (phase, age_range, theme) in enumerate(base_phases):
        phases.append(
            _phase_block(
                phase=phase,
                age_range=age_range,
                theme=theme,
                dominant=dominant,
                supportive=supportive,
                snapshot=snapshot,
                focus_set=focus_set,
                index=idx,
            )
        )
    return phases


def _phase_block(
    phase: str,
    age_range: str,
    theme: str,
    dominant: str,
    supportive: Sequence[str],
    snapshot: CelestialSnapshot,
    focus_set: set[str],
    index: int,
) -> TimelinePhase:
    """Craft a single timeline phase with lessons and turning points."""

    influence_phrase = f"{dominant}-like with {', '.join(supportive) if supportive else 'subtle allies'}"
    experiences = [
        f"Emotional tone shaped by Moon in the {snapshot.moon_element or 'balanced'} element.",
        f"Family/cultural imprint carries {dominant} discipline and {supportive[0] if supportive else 'intuitive'} creativity.",
    ]

    if snapshot.rahu_aspects_ascendant:
        experiences.append("Unconventional mentors or sudden relocations open perspective early.")
    if snapshot.venus_house in {2, 7, 11}:
        experiences.append("Relationship openings arrive through community circles or artistic groups.")
    if snapshot.mars_house in {3, 6, 10}:
        experiences.append("Competitive streak pushes toward skill drills and practical leadership.")
    if snapshot.saturn_retrograde:
        experiences.append("Inner sense of responsibility matures ahead of peers, inviting patience.")

    lessons = [
        "Balance duty with play; treat every challenge as a craft lesson.",
        "Honor lineage while defining your own vows of integrity.",
    ]
    if dominant == "Saturn":
        lessons.append("Practice steady routines to transmute delays into mastery.")
    if dominant == "Jupiter":
        lessons.append("Guard humility as wisdom and teaching roles expand.")
    if "career" in focus_set:
        lessons.append("Link each study or job to a service-driven intention.")
    if "relationships" in focus_set:
        lessons.append("Cultivate honest dialogue; shared dharma outweighs surface attraction.")

    turning_points = [
        "Around phase midpoint, a mentor or exam redirects priorities.",
        "Near the phase end, relocation or training invites a fresh identity layer.",
    ]
    if index == 2:
        turning_points.append("Ages 24–26 favor first leadership trials or partnership talks.")
    if index == 3:
        turning_points.append("Ages 28–32 highlight career/home restructuring under Bhrigu's gaze.")
    if index == 4:
        turning_points.append("Ages 44–48 encourage teaching, writing, or mentoring younger seekers.")

    guidance = [
        "Keep journals of insights; track patterns between inner mood and external results.",
        "Offer seva or volunteer time during each phase shift to anchor blessings.",
    ]
    if "spiritual" in focus_set:
        guidance.append("Schedule spiritual pauses on lunar return days to harmonize karmic memory.")
    if "health" in focus_set:
        guidance.append("Choose gentle, rhythmic movement to match the dominant influence's pace.")
    if "finances" in focus_set:
        guidance.append("Use Saturn-style budgeting: simple, transparent, and consistent.")

    return TimelinePhase(
        phase=phase,
        age_range=age_range,
        theme=theme,
        dominant_influence=influence_phrase,
        main_experiences=experiences,
        karmic_lessons=lessons,
        turning_points=turning_points,
        practical_guidance=guidance,
    )


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


def _format_trait_label(trait: str) -> str:
    return trait.replace("_", " ").strip().title()


def _dashboard_hotspots(weights: Dict[str, float], traits: List[str]) -> List[Dict[str, str]]:
    anchors = traits or ["boundaries", "self regulation", "consistency"]
    hotspots: List[Dict[str, str]] = []
    for trait in anchors:
        key = trait.replace(" ", "_")
        score = weights.get(key, 0.0)
        label = _format_trait_label(trait)
        hotspots.append(
            {
                "label": label,
                "description": f"Score {score:.2f} suggests retests around {label.lower()}; pace agreements and rest.",
                "shows_up": f"Notice it when {label.lower()} feels stretched or when you overextend without clarity.",
            }
        )
    return hotspots


def _dashboard_gifts(weights: Dict[str, float], traits: List[str]) -> List[Dict[str, str]]:
    anchors = traits or ["adaptability", "empathy", "focus"]
    gifts: List[Dict[str, str]] = []
    for trait in anchors:
        key = trait.replace(" ", "_")
        score = weights.get(key, 0.0)
        label = _format_trait_label(trait)
        gifts.append(
            {
                "label": label,
                "how_to_use": f"Lean on {label.lower()} (score {score:.2f}) to stabilize routines and conversations.",
            }
        )
    return gifts


def _dashboard_active_themes(
    karmic_epoch: str, trajectories: List[FutureTrajectory], current_phase: str | None
) -> List[str]:
    themes = [f"Karmic epoch: {karmic_epoch}"]
    if current_phase:
        themes.append(f"Current phase: {current_phase}")
    if trajectories:
        for directive in trajectories[:2]:
            window = f" during {directive.window}" if directive.window else ""
            themes.append(f"{directive.focus}{window} (certainty {directive.certainty:.2f})")
    else:
        themes.append("Emphasis on steady practice until sharper transit signals arrive.")
    return themes


def _dashboard_assignments(remedies: List[Dict], hotspots: List[Dict[str, str]], gifts: List[Dict[str, str]]) -> List[str]:
    assignments: List[str] = []

    for remedy in remedies[:3]:
        interpretation = remedy.get("interpretation") or remedy.get("id") or "Apply a light remedy"
        assignments.append(f"Weekly remedy focus: {interpretation}.")

    if hotspots:
        primary = hotspots[0]["label"].lower()
        assignments.append(f"Daily 5-minute check on {primary}: name one clear yes/no and honor it.")

    if gifts:
        gift = gifts[0]["label"].lower()
        assignments.append(f"Leverage {gift}: use it to schedule one protected focus block twice a week.")

    if len(assignments) < 5:
        assignments.extend(
            [
                "Track one trigger for two weeks; write one alternate response each time.",
                "Add a 10-minute grounding ritual (breath, stretch, journal) at the same time daily.",
            ][: 5 - len(assignments)]
        )

    return assignments[:8]


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


def _render_timeline(report: TimelineReport, birth_place: str) -> None:
    _render_common_intro(report.name, birth_place)
    print(f"Summary: {report.summary}")
    print(f"Disclaimer: {report.disclaimer}")
    for phase in report.phases:
        print(f"\n{phase.phase} ({phase.age_range}) — {phase.theme}")
        print(f"  Dominant influence: {phase.dominant_influence}")
        print("  Main experiences:")
        for item in phase.main_experiences:
            print(f"    - {item}")
        print("  Karmic lessons:")
        for lesson in phase.karmic_lessons:
            print(f"    - {lesson}")
        print("  Turning points:")
        for tp in phase.turning_points:
            print(f"    - {tp}")
        print("  Practical guidance:")
        for tip in phase.practical_guidance:
            print(f"    - {tip}")


def _render_varshaphal(report: VarshaphalReport, birth_place: str) -> None:
    _render_common_intro(report.name, birth_place)
    print(f"Target year: {report.target_year}")
    print(f"Year theme: {report.year_theme}")
    print(f"Year mantra: {report.year_mantra}")
    print("\nKey gateways:")
    for gateway in report.gateways:
        print(f"  - {gateway}")

    print("\nQuarterly overview:")
    for segment in report.segments:
        months = ", ".join(segment.months)
        print(f"  {segment.label} [{months}]")
        print(f"    Energies: {segment.energies}")
        print(f"    Cautions: {segment.cautions}")
        print(f"    Opportunities: {segment.opportunities}")

    print("\nPractices:")
    for practice in report.practices:
        print(f"  - {practice}")
    print("Intentions:")
    for intention in report.intentions:
        print(f"  - {intention}")

    print("\n8-section digest:")
    for key in map(str, range(1, 9)):
        print(f"  {key}: {report.sections.get(key, '')}")


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

    varshaphal_parser = subparsers.add_parser("varshaphal", help="12-month Bhrigu Varshaphal karmic report")
    _add_common_arguments(varshaphal_parser)
    varshaphal_parser.add_argument("--target-year", required=True, help="Target year label (e.g., 2026 or next 12 months)")
    varshaphal_parser.add_argument(
        "--focus-area",
        action="append",
        dest="focus_areas",
        default=[],
        help="Optional focus areas such as career, relationships, health, finances, spiritual",
    )

    timeline_parser = subparsers.add_parser("timeline", help="Five-phase karmic roadmap")
    _add_common_arguments(timeline_parser)
    timeline_parser.add_argument(
        "--focus-area",
        action="append",
        dest="focus_areas",
        default=[],
        help="Optional focus areas such as career, relationships, health, finances, spiritual",
    )

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
    elif args.command == "varshaphal":
        request = _request_from_namespace(args)
        main_focus = ", ".join(args.focus_areas) if args.focus_areas else None
        report = build_varshaphal_report(request, target_year=args.target_year, main_focus=main_focus)
        _render_varshaphal(report, args.birth_place)
    elif args.command == "timeline":
        request = _request_from_namespace(args)
        report = build_timeline_report(request, focus_areas=args.focus_areas or None)
        _render_timeline(report, args.birth_place)
    else:  # pragma: no cover - defensive
        parser.error("Unknown command")


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()
