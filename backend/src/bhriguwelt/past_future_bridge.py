"""Bridge past-life and future predictions into a single AI-ready payload.

This module connects the deterministic past-life and future engines with the
Bhrigu Samhita Core Wisdom digest. It produces JSON-ready outputs (insights,
predictions, and AI summaries) so downstream consumers can stream results,
render dashboards, or hand off to Sarvam/OpenAI-compatible responders without
duplicating orchestration logic.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Sequence

from .ai_client import AIIntegrationError, ai_provider_metadata, chat_completion, is_ai_configured
from .horoscope import HoroscopeRequest, build_core_wisdom_reading, build_future_report, build_past_life_report


def _representative_text(entries: Sequence[Dict[str, Any]], *, key: str) -> List[str]:
    texts: List[str] = []
    for entry in entries:
        value = entry.get(key) if isinstance(entry, dict) else None
        if isinstance(value, str) and value.strip():
            texts.append(value.strip())
        if len(texts) >= 3:
            break
    return texts


def _ai_bridge_summary(
    *,
    request: HoroscopeRequest,
    focus_areas: List[str],
    past_life: Dict[str, Any],
    future: Dict[str, Any],
    core_wisdom: Dict[str, Any],
) -> str:
    focus_text = ", ".join(focus_areas) if focus_areas else "general life balance"

    core_sections = core_wisdom.get("sections") if isinstance(core_wisdom, dict) else {}
    section_snippets: List[str] = []
    if isinstance(core_sections, dict):
        for _, value in sorted(core_sections.items()):
            if isinstance(value, str) and value.strip():
                section_snippets.append(value.strip())
            if len(section_snippets) >= 3:
                break

    past_lines = _representative_text(past_life.get("insights", []), key="narrative")
    future_lines = _representative_text(future.get("trajectories", []), key="trajectory")

    system_prompt = (
        "You are a Sarvam-aligned Bhrigu interpreter wired into the analyzer, interpreter, and designer stack. "
        "Use the stored past-life JSON, future JSON, and Bhrigu Samhita core wisdom digest as your evidence. "
        "Blend past-life echoes with future directives. Avoid deterministic medical or financial claims and keep the tone compassionate."
    )
    user_prompt = (
        f"Seeker: {request.name}\n"
        f"Birth: {request.birth_date} {request.birth_time} at {request.birth_place}\n"
        f"Focus areas: {focus_text}\n"
        f"Past-life threads: {' | '.join(past_lines) or 'use manuscript-driven karmic echoes from stored JSON'}\n"
        f"Future windows: {' | '.join(future_lines) or 'pull from the directive set in stored JSON'}\n"
        f"Core wisdom: {' | '.join(section_snippets) or 'follow the 8-section digest scaffolding sourced from Bhrigu Samhita'}\n"
        "Provide 4-6 sentences linking past karmic influences to upcoming opportunities. Close with a free-will reminder."
    )

    if not is_ai_configured():
        return (
            f"{request.name}, your past-life echoes and future directives are ready. "
            f"Focus: {focus_text}. "
            "Sarvam/OpenAI credentials were not provided, so this summary is composed from the Bhrigu Samhita core wisdom. "
            "Use the JSON blocks to render charts, timelines, and remedies directly."
        )

    try:
        return chat_completion(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.38,
            max_tokens=360,
        )
    except AIIntegrationError:
        return (
            "AI provider unreachable; fallback to deterministic manuscript guidance. "
            "Render the past-life insights, future trajectories, and remedies from the JSON payload."
        )


@dataclass
class PastFutureSynthesis:
    """Operational payload combining past-life and future engines."""

    seeker: Dict[str, Any]
    past_life: Dict[str, Any]
    future: Dict[str, Any]
    core_wisdom: Dict[str, Any]
    predictions: List[Dict[str, Any]]
    ai_summary: str
    ai_support: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "seeker": dict(self.seeker),
            "past_life": dict(self.past_life),
            "future": dict(self.future),
            "core_wisdom": dict(self.core_wisdom),
            "predictions": [dict(entry) for entry in self.predictions],
            "ai_summary": self.ai_summary,
            "ai_support": dict(self.ai_support),
        }


def build_past_future_synthesis(
    primary_request: HoroscopeRequest,
    *,
    focus_areas: Sequence[str] | None = None,
) -> PastFutureSynthesis:
    """Connect past-life and future directives with Bhrigu core wisdom and AI."""

    past_life_report = build_past_life_report(primary_request)
    future_report = build_future_report(primary_request)
    core_reading = build_core_wisdom_reading(primary_request, focus_areas)

    past_life = asdict(past_life_report)
    future = asdict(future_report)
    core_wisdom = {
        "sections": core_reading.sections,
        "karmic_epoch": core_reading.karmic_epoch,
        "charts": {
            "rashi_chart": [asdict(house) for house in core_reading.charts.get("rashi_chart", [])],
            "bhava_chart": [asdict(house) for house in core_reading.charts.get("bhava_chart", [])],
        },
        "dashas": [asdict(dasha) for dasha in core_reading.dashas],
        "remedies": core_reading.remedies,
        "sources": core_reading.sources,
        "rule_engine": core_reading.rule_engine,
    }

    predictions: List[Dict[str, Any]] = []
    for insight in past_life_report.insights:
        predictions.append({
            "engine": "past-life",
            "engine_id": insight.engine_id,
            "narrative": insight.narrative,
            "confidence": insight.confidence,
            "sutra_reference": insight.sutra_reference,
        })
    for directive in future_report.trajectories:
        predictions.append({
            "engine": "future",
            "focus": directive.focus,
            "trajectory": directive.focus,
            "window": directive.window,
            "certainty": directive.certainty,
            "sutra_reference": directive.sutra_reference,
        })
    for directive in future_report.transit_directives:
        predictions.append({
            "engine": "future-transit",
            "influence": directive.influence,
            "window": "current transit",
            "certainty": directive.certainty,
            "sutra_reference": directive.reference,
        })
    for directive in future_report.progression_directives:
        predictions.append({
            "engine": "future-progression",
            "influence": directive.influence,
            "window": "progressions",
            "certainty": directive.certainty,
            "sutra_reference": directive.reference,
        })

    ai_support = ai_provider_metadata()
    ai_support.setdefault(
        "coverage",
        [
            "past-life",
            "future",
            "past-future",
            "core-wisdom",
        ],
    )
    ai_support["sources"] = {
        "past_life_json": bool(past_life.get("insights")),
        "future_json": bool(future.get("trajectories")),
        "core_wisdom_json": bool(core_wisdom.get("sections")),
        "bhrigu_samhita_sources": core_wisdom.get("sources"),
    }

    seeker = {
        "name": primary_request.name,
        "birth_date": primary_request.birth_date,
        "birth_time": primary_request.birth_time,
        "birth_place": primary_request.birth_place,
        "tradition": (primary_request.tradition or "universal").lower(),
    }

    ai_summary = _ai_bridge_summary(
        request=primary_request,
        focus_areas=[str(area) for area in focus_areas or [] if str(area).strip()],
        past_life=past_life,
        future=future,
        core_wisdom=core_wisdom,
    )

    return PastFutureSynthesis(
        seeker=seeker,
        past_life=past_life,
        future=future,
        core_wisdom=core_wisdom,
        predictions=predictions,
        ai_summary=ai_summary,
        ai_support=ai_support,
    )


__all__ = ["PastFutureSynthesis", "build_past_future_synthesis"]
