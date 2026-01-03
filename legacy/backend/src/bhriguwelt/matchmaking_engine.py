"""End-to-end matchmaking pipeline through the Bhrigu Samhita core.

The pipeline runs a matchmaking build, validates manuscript alignment through
the analyser layer, and prepares interpreter/design briefings so downstream
teams can share the results in human language.
"""
from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict, Sequence

from .ai_client import ai_provider_metadata, sarvam_integration_contract
from .bhrigu_core import bhrigu_core
from .engine_analyzers import analyze_core_engines
from .engine_interpreters import brief_alignment_pipeline, interpret_bhrigu_wisdom
from .horoscope import HoroscopeRequest, build_matchmaking_report


def _serialize_matchmaking_report(report) -> Dict[str, Any]:
    compatibility = report.compatibility
    return {
        "primary_name": report.primary_name,
        "partner_name": report.partner_name,
        "compatibility": {
            "compatibility_index": compatibility.compatibility_index,
            "long_term_index": compatibility.long_term_index,
            "short_term_index": compatibility.short_term_index,
            "breakdown": [asdict(entry) for entry in compatibility.breakdown],
            "modern_highlights": compatibility.modern_highlights,
            "synastry_overlays": [asdict(entry) for entry in compatibility.synastry_overlays],
            "alignment_percentages": compatibility.alignment_percentages,
            "shared_life_paths": [asdict(entry) for entry in compatibility.shared_life_paths],
        },
        "interpretation": report.interpretation,
        "sections": report.sections,
    }


def run_matchmaking_pipeline(
    primary_request: HoroscopeRequest,
    partner_request: HoroscopeRequest,
    modern_preferences: Sequence[str] | None = None,
    *,
    language: str = "en",
    core_bundle: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Build a matchmaking report plus analyser/interpreter guidance."""

    preferences = list(modern_preferences or [])
    tradition = (primary_request.tradition or "universal").lower()

    dataset = core_bundle or bhrigu_core.application_bundle(tradition)
    analyses = analyze_core_engines(tradition=tradition, core_bundle=dataset)
    interpretations = interpret_bhrigu_wisdom(tradition=tradition, core_bundle=dataset)
    report = build_matchmaking_report(
        primary_request, partner_request, preferences, core_bundle=dataset
    )
    briefings = brief_alignment_pipeline(language=language)

    ai_support = ai_provider_metadata()
    ai_support.setdefault(
        "coverage",
        [
            "core_wisdom",
            "matchmaking",
            "analyzers",
            "interpreters",
            "designers",
        ],
    )
    ai_support.setdefault("integration_contract", sarvam_integration_contract())
    ai_support.setdefault("sources", {})
    ai_support["sources"].update(
        {
            "matchmaking_json": (
                "Stored compatibility JSON (indices, overlays, alignments, shared paths) ready for AI summaries."
            ),
            "bhrigu_samhita_data": (
                "Bhrigu Samhita-derived compatibility criteria powering analyser and interpreter alignment."
            ),
        }
    )

    return {
        "tradition": tradition,
        "modern_preferences": preferences,
        "report": _serialize_matchmaking_report(report),
        "analyses": [analysis.to_dict() for analysis in analyses if analysis.engine == "matchmaking_criteria"],
        "interpretations": [
            interpretation.to_dict()
            for interpretation in interpretations
            if interpretation.engine == "matchmaking_criteria"
        ],
        "briefings": [briefing.to_dict() for briefing in briefings],
        "ai_support": ai_support,
    }


__all__ = ["run_matchmaking_pipeline"]

