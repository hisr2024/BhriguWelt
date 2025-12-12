"""Unified analyser→interpreter→designer flow for core Bhrigu engines.

This module wires the existing horoscope, past-life, future, and matchmaking
builders into a single orchestrated payload. It returns analyser validation,
interpreter summaries, and designer-ready visualization specs so every request
containing the seeker’s name, date of birth, time of birth, and place of birth
produces actionable results across all pillars.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Sequence

from .bhrigu_core import bhrigu_core
from .engine_analyzers import analyze_core_engines
from .engine_interpreters import brief_alignment_pipeline, interpret_bhrigu_wisdom
from .horoscope import (
    HoroscopeRequest,
    build_future_report,
    build_matchmaking_report,
    build_past_life_report,
    build_prediction,
)


@dataclass
class FlowVisualizations:
    """Designer-ready visualization specs for the unified flow."""

    flowchart_steps: List[str]
    timelines: List[Dict[str, Any]]
    compatibility: Dict[str, Any] | None
    charts: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "flowchart_steps": list(self.flowchart_steps),
            "timelines": [dict(entry) for entry in self.timelines],
            "compatibility": dict(self.compatibility) if self.compatibility else None,
            "charts": {key: [dict(house) for house in value] for key, value in self.charts.items()},
        }


@dataclass
class UnifiedExperienceFlow:
    """End-to-end payload spanning analyzers, interpreters, and designers."""

    seeker: Dict[str, str]
    horoscope: Dict[str, Any]
    past_life: Dict[str, Any]
    future: Dict[str, Any]
    matchmaking: Dict[str, Any] | None
    analyzers: List[Dict[str, Any]]
    interpretations: List[Dict[str, Any]]
    briefings: List[Dict[str, Any]]
    visuals: FlowVisualizations

    def to_dict(self) -> Dict[str, Any]:
        return {
            "seeker": dict(self.seeker),
            "horoscope": dict(self.horoscope),
            "past_life": dict(self.past_life),
            "future": dict(self.future),
            "matchmaking": dict(self.matchmaking) if self.matchmaking else None,
            "analyzers": [dict(entry) for entry in self.analyzers],
            "interpretations": [dict(entry) for entry in self.interpretations],
            "briefings": [dict(entry) for entry in self.briefings],
            "visuals": self.visuals.to_dict(),
        }


def _timeline_from_future(future_report) -> List[Dict[str, Any]]:
    timelines: List[Dict[str, Any]] = []
    for directive in future_report.trajectories:
        timelines.append(
            {
                "label": directive.focus,
                "window": directive.window,
                "intensity": round(directive.certainty * 100, 2),
                "sutra_reference": directive.sutra_reference,
            }
        )
    for overlay in future_report.transit_directives:
        timelines.append(
            {
                "label": overlay.influence,
                "window": "current transit",
                "intensity": round(overlay.certainty * 100, 2),
                "sutra_reference": overlay.reference,
            }
        )
    for overlay in future_report.progression_directives:
        timelines.append(
            {
                "label": overlay.influence,
                "window": "progressions",
                "intensity": round(overlay.certainty * 100, 2),
                "sutra_reference": overlay.reference,
            }
        )
    return timelines


def _compatibility_blueprint(matchmaking: Dict[str, Any] | None) -> Dict[str, Any] | None:
    if not matchmaking:
        return None
    compatibility = matchmaking.get("compatibility") or {}
    return {
        "radar": compatibility.get("alignment_percentages"),
        "headline_indices": {
            "overall": compatibility.get("compatibility_index"),
            "long_term": compatibility.get("long_term_index"),
            "short_term": compatibility.get("short_term_index"),
        },
        "bar_series": [
            {"area": entry.get("criterion_id"), "score": entry.get("score"), "notes": entry.get("notes")}
            for entry in compatibility.get("breakdown", [])
        ],
    }


def _flowchart(primary_name: str) -> List[str]:
    return [
        f"{primary_name} submits birth details → analyzers validate the Bhrigu corpus",
        "Analyzers stream digital results to interpreters (precision + sutra alignment)",
        "Interpreters craft human-ready narratives with citations",
        "Designers render charts, timelines, and compatibility visuals",
        "Users explore Past Lives, Future Predictions, Matchmaking, and Horoscopes with FAQs",
    ]


def build_unified_experience_flow(
    primary_request: HoroscopeRequest,
    *,
    partner_request: HoroscopeRequest | None = None,
    modern_preferences: Sequence[str] | None = None,
    language: str = "en",
) -> UnifiedExperienceFlow:
    """Return a comprehensive, operational flow payload for all pillars."""

    tradition = (primary_request.tradition or "universal").lower()
    dataset = bhrigu_core.application_bundle(tradition)

    horoscope_report = build_prediction(primary_request)
    past_life_report = build_past_life_report(primary_request)
    future_report = build_future_report(primary_request)

    matchmaking_report = None
    if partner_request:
        matchmaking_report = build_matchmaking_report(primary_request, partner_request, modern_preferences or [])

    analyzers = [analysis.to_dict() for analysis in analyze_core_engines(tradition=tradition, core_bundle=dataset)]
    interpretations = [
        interpretation.to_dict()
        for interpretation in interpret_bhrigu_wisdom(tradition=tradition, core_bundle=dataset)
    ]
    briefings = [briefing.to_dict() for briefing in brief_alignment_pipeline(language=language)]

    horoscope_dict = asdict(horoscope_report)
    past_life_dict = asdict(past_life_report)
    future_dict = asdict(future_report)
    matchmaking_dict = asdict(matchmaking_report) if matchmaking_report else None

    visuals = FlowVisualizations(
        flowchart_steps=_flowchart(primary_request.name),
        timelines=_timeline_from_future(future_report),
        compatibility=_compatibility_blueprint(matchmaking_dict),
        charts={
            "rashi_chart": [asdict(house) for house in horoscope_report.rashi_chart],
            "bhava_chart": [asdict(house) for house in horoscope_report.bhava_chart],
        },
    )

    seeker = {
        "name": primary_request.name,
        "birth_date": primary_request.birth_date,
        "birth_time": primary_request.birth_time,
        "birth_place": primary_request.birth_place,
        "tradition": tradition,
    }

    return UnifiedExperienceFlow(
        seeker=seeker,
        horoscope=horoscope_dict,
        past_life=past_life_dict,
        future=future_dict,
        matchmaking=matchmaking_dict,
        analyzers=analyzers,
        interpretations=interpretations,
        briefings=briefings,
        visuals=visuals,
    )


__all__ = ["UnifiedExperienceFlow", "FlowVisualizations", "build_unified_experience_flow"]
