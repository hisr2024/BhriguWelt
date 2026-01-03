"""UX language layer that turns structured payloads into human-friendly narratives."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Sequence


@dataclass
class LanguageLayer:
    """Human-friendly narrative composed from structured engine outputs."""

    language: str
    tone: str
    cultural_sensitivity: str
    introduction: str
    summary: str
    sections: List[Dict[str, str]]
    disclaimer: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "language": self.language,
            "tone": self.tone,
            "cultural_sensitivity": self.cultural_sensitivity,
            "introduction": self.introduction,
            "summary": self.summary,
            "sections": [dict(section) for section in self.sections],
            "disclaimer": self.disclaimer,
        }


_ENGLISH_STRINGS = {
    "intro": "{tone_prefix} {name}, here is a Bhrigu-inspired reading in {language_label}.",
    "summary": "Epoch: {epoch}. Future focus: {future_focus}. Past echo: {past_echo}.",
    "section_titles": {
        "epoch": "Current arc",
        "future": "Future tendencies",
        "past": "Past-life reflection",
        "timeline": "Timeline guidance",
        "matchmaking": "Compatibility snapshot",
    },
    "cultural": {
        "balanced": "Guidance is symbolic and respects personal agency.",
        "diaspora": "Language stays gentle for global audiences; spiritual cues are translated rather than implied.",
        "traditional": "Heritage terms are preserved with reverence for the Bhrigu Samhita lineage.",
    },
    "language_label": "English",
}


_HINDI_STRINGS = {
    "intro": "{tone_prefix} {name}, यह पाठ {language_label} में सरल शब्दों में साझा किया गया है।",
    "summary": "वर्तमान चरण: {epoch}. आने वाले फोकस: {future_focus}. पूर्व जन्म संकेत: {past_echo}.",
    "section_titles": {
        "epoch": "वर्तमान धारा",
        "future": "आगामी प्रवृत्तियाँ",
        "past": "पूर्व जन्म दृष्टि",
        "timeline": "जीवन रेखा मार्गदर्शन",
        "matchmaking": "संबंध संगतता",
    },
    "cultural": {
        "balanced": "मार्गदर्शन प्रतीकात्मक है और स्वतंत्र इच्छा का सम्मान करता है।",
        "diaspora": "वैश्विक पाठकों के लिए भाषा को कोमल रखा गया है; आध्यात्मिक संकेत स्पष्ट रूप से समझाए गए हैं।",
        "traditional": "भ्रिगु संहिता की परंपरा के प्रति श्रद्धा बनाए रखी गई है।",
    },
    "language_label": "हिंदी",
}


_TONE_STYLES = {
    "neutral": {
        "en": "Hello",
        "hi": "नमस्ते",
        "connector": {
            "en": "The reading observes",
            "hi": "पाठ संकेत करता है",
        },
    },
    "spiritual": {
        "en": "Namaste",
        "hi": "प्रणाम",
        "connector": {
            "en": "The Samhita reminds",
            "hi": "संहिता स्मरण कराती है",
        },
    },
    "practical": {
        "en": "Quick brief",
        "hi": "संक्षिप्त मार्गदर्शन",
        "connector": {
            "en": "Action to consider",
            "hi": "अगला कदम",
        },
    },
}


def _normalize_language(language: str) -> str:
    normalized = (language or "en").lower()
    return "hi" if normalized.startswith("hi") else "en"


def _strings_for_language(language: str) -> Dict[str, Any]:
    return _HINDI_STRINGS if language == "hi" else _ENGLISH_STRINGS


def _tone_prefix(language: str, tone: str) -> str:
    tone_style = _TONE_STYLES.get(tone, _TONE_STYLES["neutral"])
    return tone_style.get(language, _TONE_STYLES["neutral"].get(language, "Hello"))


def _tone_connector(language: str, tone: str) -> str:
    tone_style = _TONE_STYLES.get(tone, _TONE_STYLES["neutral"])
    connectors = tone_style.get("connector", {})
    return connectors.get(language, _TONE_STYLES["neutral"]["connector"]["en"])


def _safe_first_value(entries: Sequence[Dict[str, Any]], keys: Sequence[str]) -> str | None:
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        for key in keys:
            value = entry.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return None


def _future_focus(future: Dict[str, Any]) -> str:
    interpretation = future.get("interpretation") if isinstance(future, dict) else None
    if isinstance(interpretation, str) and interpretation.strip():
        return interpretation.strip()

    trajectories = future.get("trajectories") if isinstance(future, dict) else None
    focus = _safe_first_value(trajectories or [], ["focus", "influence", "theme"])
    if focus:
        window = _safe_first_value(trajectories or [], ["window", "period"])
        if window:
            return f"{focus} ({window})"
        return focus

    return "Future guidance will be summarized once data arrives."


def _past_echo(past_life: Dict[str, Any]) -> str:
    interpretation = past_life.get("interpretation") if isinstance(past_life, dict) else None
    if isinstance(interpretation, str) and interpretation.strip():
        return interpretation.strip()

    insights = past_life.get("insights") if isinstance(past_life, dict) else None
    narrative = _safe_first_value(insights or [], ["narrative", "description"])
    if narrative:
        return narrative

    return "Past-life context will be added after alignment."


def _timeline_focus(timeline: Dict[str, Any]) -> str:
    summary = timeline.get("summary") if isinstance(timeline, dict) else None
    if isinstance(summary, str) and summary.strip():
        return summary.strip()

    phases = timeline.get("phases") if isinstance(timeline, dict) else None
    if isinstance(phases, list):
        theme = _safe_first_value(phases, ["theme", "dominant_influence"])
        if theme:
            phase_name = _safe_first_value(phases, ["phase"]) or "Current phase"
            return f"{phase_name}: {theme}"

    return "Timeline will be charted after validation."


def _compatibility_focus(matchmaking: Dict[str, Any] | None) -> str | None:
    if not matchmaking:
        return None
    interpretation = matchmaking.get("interpretation") if isinstance(matchmaking, dict) else None
    if isinstance(interpretation, str) and interpretation.strip():
        return interpretation.strip()

    compatibility = matchmaking.get("compatibility") if isinstance(matchmaking, dict) else None
    if isinstance(compatibility, dict):
        index = compatibility.get("compatibility_index")
        if index is not None:
            return f"Compatibility score: {index}"
    return None


def _cultural_disclaimer(language: str, setting: str) -> str:
    strings = _strings_for_language(language)
    cultural_map = strings.get("cultural", {})
    note = cultural_map.get(setting) or cultural_map.get("balanced")
    if language == "hi":
        return f"{note} कृपया इस मार्गदर्शन को सहायक संकेत के रूप में लें, न कि निश्चित भविष्यवाणी के रूप में।"
    return f"{note} Treat this as supportive guidance, not a fixed prediction."


def compose_language_layer(
    *,
    seeker: Dict[str, Any],
    horoscope: Dict[str, Any],
    past_life: Dict[str, Any],
    future: Dict[str, Any],
    timeline: Dict[str, Any],
    matchmaking: Dict[str, Any] | None,
    language: str = "en",
    tone: str = "neutral",
    cultural_sensitivity: str = "balanced",
) -> LanguageLayer:
    """Compose human-friendly narratives in the requested language and tone."""

    normalized_language = _normalize_language(language)
    strings = _strings_for_language(normalized_language)
    tone_prefix = _tone_prefix(normalized_language, tone)
    connector = _tone_connector(normalized_language, tone)

    name = seeker.get("name") if isinstance(seeker, dict) else None
    epoch = horoscope.get("karmic_epoch") if isinstance(horoscope, dict) else None

    intro = strings["intro"].format(
        tone_prefix=tone_prefix,
        name=name or "Seeker",
        language_label=strings["language_label"],
    )

    summary = strings["summary"].format(
        epoch=epoch or ("Flow" if normalized_language == "en" else "धारा"),
        future_focus=_future_focus(future),
        past_echo=_past_echo(past_life),
    )

    sections: List[Dict[str, str]] = [
        {
            "title": strings["section_titles"]["epoch"],
            "body": f"{connector}: {epoch or 'Karmic arc is being charted.'}",
        },
        {
            "title": strings["section_titles"]["future"],
            "body": _future_focus(future),
        },
        {
            "title": strings["section_titles"]["past"],
            "body": _past_echo(past_life),
        },
        {
            "title": strings["section_titles"]["timeline"],
            "body": _timeline_focus(timeline),
        },
    ]

    compatibility = _compatibility_focus(matchmaking)
    if compatibility:
        sections.append({"title": strings["section_titles"]["matchmaking"], "body": compatibility})

    disclaimer = _cultural_disclaimer(normalized_language, cultural_sensitivity)

    return LanguageLayer(
        language=normalized_language,
        tone=tone if tone in _TONE_STYLES else "neutral",
        cultural_sensitivity=cultural_sensitivity,
        introduction=intro,
        summary=summary,
        sections=sections,
        disclaimer=disclaimer,
    )


__all__ = ["LanguageLayer", "compose_language_layer"]
