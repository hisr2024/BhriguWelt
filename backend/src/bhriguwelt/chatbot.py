"""Conversational helper that keeps Bhrigu persona consistent with session memory."""
from __future__ import annotations

from typing import Any, Dict, List, Sequence

from .profiles import Profile, SessionSnapshot, upsert_session_turn, fetch_session

_SAFE_THEMES = [
    "grounded breathing for clarity",
    "gratitude journaling",
    "soft chanting of a bija mantra",
    "sun salutations for warmth and stamina",
    "moon gazing to cool emotions",
    "offering water to a plant as seva",
]


def _last_theme(history: Sequence[Dict[str, Any]]) -> str | None:
    for entry in reversed(history):
        content = entry.get("content") if isinstance(entry, dict) else None
        if isinstance(content, str) and content.strip():
            return content.strip()
    return None


def generate_chat_reply(
    *,
    profile: Profile,
    session_key: str,
    message: str,
) -> Dict[str, Any]:
    """Compose a symbolic, contextual reply while updating session state."""

    session = fetch_session(profile.id, session_key) or SessionSnapshot(session_key=session_key, transcript=[], updated_at="")
    history = session.transcript
    last_theme = _last_theme(history) or profile.metadata.get("last_theme") if profile.metadata else None

    remedies = _choose_remedies(message, history)
    greeting = profile.full_name or "seeker"
    context_line = _context_line(profile, last_theme)
    body = _body_line(message)
    closing = "This is symbolic reflection, not a fixed fate."

    reply_text = f"{greeting}, {context_line} {body} {closing}"

    updated_session = upsert_session_turn(
        profile_id=profile.id,
        session_key=session_key,
        role="user",
        content=message,
    )
    updated_session = upsert_session_turn(
        profile_id=profile.id,
        session_key=session_key,
        role="assistant",
        content=reply_text,
        remedies=remedies,
    )

    payload = {
        "reply": reply_text,
        "remedies": remedies,
        "session": updated_session.to_dict(),
    }
    return payload


def _context_line(profile: Profile, last_theme: str | None) -> str:
    anchors = []
    if profile.place_of_birth:
        anchors.append(f"rooted in the light of {profile.place_of_birth}")
    if profile.timezone:
        anchors.append(f"attuned to the {profile.timezone} rhythm")
    if profile.date_of_birth:
        anchors.append(f"shaped by the day {profile.date_of_birth}")
    if last_theme:
        anchors.append(f"still weaving {last_theme}")
    if not anchors:
        return "your karmic flow is observed with calm attention;"
    return ", ".join(anchors) + ";"


def _body_line(message: str) -> str:
    lowered = message.lower()
    if "relationship" in lowered:
        return "relationship threads invite gentle reciprocity and honest listening."
    if "career" in lowered or "work" in lowered:
        return "career dharma asks for steady tapas and service-driven goals."
    if "health" in lowered:
        return "care for the body through soft movement and sattvic rest."
    if "finance" in lowered:
        return "treat resources as prana—circulate with integrity and generosity."
    return "walk with breath-led awareness and receptive intuition."


def _choose_remedies(message: str, history: List[Dict[str, Any]]) -> List[str]:
    chosen = []
    lowered = message.lower()
    if "anx" in lowered or "stress" in lowered:
        chosen.append("alternate-nostril breathing for 3 minutes at dawn")
    if "relationship" in lowered:
        chosen.append("write a gratitude note to someone you cherish")
    if "career" in lowered:
        chosen.append("light a lamp before starting focused work")
    if not chosen:
        chosen.append(_SAFE_THEMES[len(history) % len(_SAFE_THEMES)])
    if len(chosen) < 2:
        chosen.append(_SAFE_THEMES[(len(history) + 1) % len(_SAFE_THEMES)])
    return chosen


__all__ = ["generate_chat_reply"]
