"""AI bot surface stitching Bhrigu Samhita cores, analysers, and interpreters."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Sequence

from .experience_flow import build_unified_experience_flow
from .horoscope import HoroscopeRequest, build_core_wisdom_reading
from .ai_client import AIIntegrationError, chat_completion, is_ai_configured


@dataclass
class WisdomBotDownload:
    """Shareable export describing the bot's assembled response."""

    filename: str
    markdown: str

    def to_dict(self) -> Dict[str, str]:
        return {"filename": self.filename, "markdown": self.markdown}


@dataclass
class WisdomBotResponse:
    """Rich AI bot payload rooted in the Bhrigu Samhita corpus."""

    query: str
    ai_reply: str
    focus_areas: List[str]
    core_wisdom: Dict[str, Any]
    flow: Dict[str, Any]
    download: WisdomBotDownload

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "ai_reply": self.ai_reply,
            "focus_areas": list(self.focus_areas),
            "core_wisdom": dict(self.core_wisdom),
            "flow": dict(self.flow),
            "download": self.download.to_dict(),
        }


def _normalize_focus_areas(focus_areas: Sequence[str] | None) -> List[str]:
    return [str(area).strip() for area in focus_areas or [] if str(area).strip()]


def _summarize_alignment(flow: Dict[str, Any]) -> str:
    analyzers = flow.get("analyzers") or []
    if not isinstance(analyzers, list) or not analyzers:
        return "Analyser alignment pending corpus scan"

    aligned = [entry for entry in analyzers if isinstance(entry, dict) and entry.get("aligned_to_bhrigu")]
    return f"{len(aligned)}/{len(analyzers)} engines verified against Bhrigu folios"


def _designer_hint(flow: Dict[str, Any]) -> str:
    briefings = flow.get("briefings") or []
    if not isinstance(briefings, list) or not briefings:
        return "Design interpreters will render charts and timelines for sharing."

    briefing = briefings[0]
    audience = briefing.get("audience", "designers") if isinstance(briefing, dict) else "designers"
    summary = briefing.get("summary") if isinstance(briefing, dict) else "Shareable design brief ready."
    return f"{summary} (audience: {audience})."


def _compose_ai_reply(
    *,
    request: HoroscopeRequest,
    query: str,
    core_wisdom_sections: Dict[str, Any],
    flow: Dict[str, Any],
    focus_areas: List[str],
) -> str:
    ai_reply = _ai_wisdom_reply(
        request=request,
        query=query,
        core_wisdom_sections=core_wisdom_sections,
        flow=flow,
        focus_areas=focus_areas,
    )
    if ai_reply:
        return ai_reply

    focus_text = ", ".join(focus_areas) if focus_areas else "general life balance"
    epoch = core_wisdom_sections.get("karmic_epoch") or core_wisdom_sections.get("sections", {}).get("3", "karmic flow")
    alignment = _summarize_alignment(flow)
    design_line = _designer_hint(flow)

    return (
        f"{request.name}, your query '{query}' is processed through the Bhrigu Samhita core. "
        f"Focus: {focus_text}. Karmic epoch: {epoch}. "
        f"Analyser + interpreter stack: {alignment}. {design_line}"
    )


def _ai_wisdom_reply(
    *,
    request: HoroscopeRequest,
    query: str,
    core_wisdom_sections: Dict[str, Any],
    flow: Dict[str, Any],
    focus_areas: List[str],
) -> str | None:
    if not is_ai_configured():
        return None

    focus_text = ", ".join(focus_areas) if focus_areas else "general life balance"
    sections = core_wisdom_sections.get("sections") if isinstance(core_wisdom_sections, dict) else {}
    snippets = []
    if isinstance(sections, dict):
        for _, value in sorted(sections.items()):
            if isinstance(value, str) and value.strip():
                snippets.append(value.strip())
            if len(snippets) >= 3:
                break

    analyzers = flow.get("analyzers") or []
    interpreter_notes = flow.get("interpretations") or []
    analyzer_summary = "; ".join(
        str(entry.get("summary")) for entry in analyzers if isinstance(entry, dict) and entry.get("summary")
    )
    interpretation_summary = "; ".join(
        str(entry.get("insight")) for entry in interpreter_notes if isinstance(entry, dict) and entry.get("insight")
    )

    system_prompt = (
        "You are the Bhrigu Wisdom Bot. Offer concise, calm guidance rooted in the Bhrigu Samhita. "
        "Avoid deterministic predictions and sensitive health/finance claims. Keep responses friendly and symbolic."
    )
    user_prompt = (
        f"Name: {request.name}\n"
        f"Birth: {request.birth_date} {request.birth_time} at {request.birth_place}\n"
        f"Query: {query}\n"
        f"Focus areas: {focus_text}\n"
        f"Core wisdom snippets: {' | '.join(snippets) or 'not available'}\n"
        f"Analyser highlights: {analyzer_summary or 'pending scan'}\n"
        f"Interpreter highlights: {interpretation_summary or 'pending briefings'}.\n"
        "Respond with 3-5 sentences and end with a symbolism disclaimer."
    )

    try:
        return chat_completion(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=320,
            temperature=0.35,
        )
    except AIIntegrationError:
        return None


def _shareable_markdown(
    *,
    request: HoroscopeRequest,
    query: str,
    core_wisdom_sections: Dict[str, Any],
    flow: Dict[str, Any],
    focus_areas: List[str],
) -> str:
    lines: List[str] = [
        f"# Bhrigu Wisdom Bot — {request.name}",
        "", f"**Query:** {query}",
        f"**Focus areas:** {', '.join(focus_areas) if focus_areas else 'general life balance'}",
        "",
        "## Core Wisdom Digest",
    ]

    sections = core_wisdom_sections.get("sections") if isinstance(core_wisdom_sections, dict) else None
    if isinstance(sections, dict):
        for key, value in sorted(sections.items()):
            lines.append(f"### Section {key}")
            lines.append(str(value))
            lines.append("")

    lines.extend([
        "## Analyser and Interpreter Alignment",
    ])
    for analysis in flow.get("analyzers", []):
        if not isinstance(analysis, dict):
            continue
        lines.append(
            f"- {analysis.get('engine', 'engine')} — {analysis.get('summary', 'Manuscript alignment pending')}"
        )
    if not flow.get("analyzers"):
        lines.append("- Analyser scan pending")

    lines.append("")
    lines.append("### Interpreter + Designer Briefings")
    for brief in flow.get("briefings", []):
        if not isinstance(brief, dict):
            continue
        lines.append(
            f"- {brief.get('audience', 'team')}: {brief.get('summary', 'Briefing ready')}"
        )
    if not flow.get("briefings"):
        lines.append("- Designer and interpreter briefs will be attached automatically.")

    lines.extend([
        "",
        "## Share & Download",
        "This markdown can be shared or exported as PDF so seekers can revisit the guidance.",
    ])

    return "\n".join(lines)


def build_wisdom_bot_response(
    *,
    primary_request: HoroscopeRequest,
    query: str,
    focus_areas: Sequence[str] | None = None,
    partner_request: HoroscopeRequest | None = None,
    modern_preferences: Sequence[str] | None = None,
    language: str = "en",
) -> WisdomBotResponse:
    """Assemble the super-intelligent bot payload through the Bhrigu core layers."""

    focus_list = _normalize_focus_areas(focus_areas)
    core_reading = build_core_wisdom_reading(primary_request, focus_list)
    flow = build_unified_experience_flow(
        primary_request,
        partner_request=partner_request,
        modern_preferences=modern_preferences or [],
        language=language,
    ).to_dict()

    core_payload: Dict[str, Any] = {
        "sections": core_reading.sections,
        "rashi_chart": [asdict(item) for item in core_reading.charts.get("rashi_chart", [])],
        "bhava_chart": [asdict(item) for item in core_reading.charts.get("bhava_chart", [])],
        "dashas": [asdict(item) for item in core_reading.dashas],
        "karmic_epoch": core_reading.karmic_epoch,
        "remedies": core_reading.remedies,
    }

    ai_reply = _compose_ai_reply(
        request=primary_request,
        query=query,
        core_wisdom_sections=core_payload,
        flow=flow,
        focus_areas=focus_list,
    )

    markdown = _shareable_markdown(
        request=primary_request,
        query=query,
        core_wisdom_sections=core_payload,
        flow=flow,
        focus_areas=focus_list,
    )
    filename = f"bhrigu-wisdom-{primary_request.name.replace(' ', '-').lower() or 'seeker'}.md"

    return WisdomBotResponse(
        query=query,
        ai_reply=ai_reply,
        focus_areas=focus_list,
        core_wisdom=core_payload,
        flow=flow,
        download=WisdomBotDownload(filename=filename, markdown=markdown),
    )


__all__ = ["WisdomBotResponse", "WisdomBotDownload", "build_wisdom_bot_response"]
