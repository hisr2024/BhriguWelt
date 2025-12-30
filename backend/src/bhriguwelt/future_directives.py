"""Future directives engine for symbolic Bhrigu Samhita guidance."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from .astronomical_calculations import derive_transit_snapshot, normalize_birth_datetime
from .bhrigu_core import bhrigu_core
from .calculations import FutureTrajectory, TransitDirective, evaluate_future_directives, evaluate_transits
from .horoscope import HoroscopeRequest, _ensure_bhrigu_data_available, _snapshot_from_request

_HOUSE_DHARMA_MAP = {
    1: "self-mastery and courageous leadership",
    2: "resource stewardship and lineage responsibility",
    3: "communication, learning, and sibling duties",
    4: "home protection and emotional anchoring",
    5: "education, teaching, and creative lineage",
    6: "service, healing, and disciplined work",
    7: "alliances, partnership harmony, and reciprocity",
    8: "transformation, research, and occult stewardship",
    9: "pilgrimage, dharma study, and spiritual mentorship",
    10: "public responsibility and legacy work",
    11: "community networks and collaborative gains",
    12: "liberation practices and compassionate release",
}

_ELEMENT_EVOLUTION = {
    "water": "emotional alchemy through healing, compassion, and adaptive flow.",
    "earth": "grounded refinement, stewardship of land, and material stability.",
    "fire": "initiatory courage, transformative leadership, and catalytic change.",
    "air": "intellectual expansion, messaging, and social bridge-building.",
    "ether": "subtle awareness, contemplative study, and ancestral remembrance.",
}

_CHALLENGE_KEYWORDS = {
    "pressure",
    "shadow",
    "pause",
    "rebuild",
    "detachment",
    "discipline",
    "boundary",
    "restoration",
    "retrograde",
    "restitution",
}

_OPPORTUNITY_KEYWORDS = {
    "grant",
    "invitation",
    "lead",
    "leadership",
    "innovation",
    "funding",
    "opportunity",
    "residency",
    "expansion",
    "growth",
    "prosperity",
    "accumulation",
    "chance",
}


def _milestone_from_window(window: str) -> str:
    if window:
        return f"Potential milestone during {window}."
    return "Potential milestone across the next unfolding cycle."


def _categorize_text(text: str) -> str:
    lowered = text.lower()
    if any(keyword in lowered for keyword in _CHALLENGE_KEYWORDS):
        return "Potential Challenges"
    if any(keyword in lowered for keyword in _OPPORTUNITY_KEYWORDS):
        return "Opportunities"
    return "Future Directions"


def _entry_from_trajectory(trajectory: FutureTrajectory) -> Dict[str, Any]:
    window = trajectory.window or "Ongoing cycles"
    return {
        "theme": "Dharma trajectory",
        "guidance": trajectory.focus,
        "window": window,
        "confidence": trajectory.certainty,
        "citation": trajectory.sutra_reference,
        "milestone": _milestone_from_window(window),
        "source": "natal",
    }


def _entry_from_transit(directive: TransitDirective) -> Dict[str, Any]:
    window = "Active transit window"
    return {
        "theme": f"{directive.planet} transit",
        "guidance": directive.influence,
        "window": window,
        "confidence": directive.certainty,
        "citation": directive.reference,
        "milestone": _milestone_from_window(window),
        "source": "transit",
    }


def _dharma_path_entry(snapshot) -> Dict[str, Any]:
    theme = _HOUSE_DHARMA_MAP.get(snapshot.jupiter_house, "balanced study and service")
    return {
        "theme": "Dharma path",
        "guidance": f"Jupiter emphasis points toward {theme}. Align choices to uphold this mandate.",
        "window": "Multi-year arc",
        "confidence": 0.62,
        "citation": "Bhrigu Samhita dharma house compendium",
        "milestone": "Potential milestone with a mentor or teaching role emerging.",
        "source": "natal",
    }


def _energetic_evolution_entry(snapshot) -> Dict[str, Any]:
    evolution = _ELEMENT_EVOLUTION.get(snapshot.moon_element.lower(), "balanced elemental harmonization.")
    return {
        "theme": "Energetic evolution",
        "guidance": f"Moon element indicates {evolution}",
        "window": "Ongoing refinement",
        "confidence": 0.6,
        "citation": "Bhrigu Samhita elemental concordance",
        "milestone": "Potential milestone via ritual practice or contemplative training.",
        "source": "natal",
    }


def build_future_directives_engine(request: HoroscopeRequest) -> Dict[str, Any]:
    """Generate symbolic future guidance for dharma, evolution, and milestones."""

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

    sections: Dict[str, List[Dict[str, Any]]] = {
        "Future Directions": [],
        "Potential Challenges": [],
        "Opportunities": [],
    }

    for trajectory in trajectories:
        entry = _entry_from_trajectory(trajectory)
        section = _categorize_text(entry["guidance"])
        sections[section].append(entry)

    for directive in transit_directives:
        entry = _entry_from_transit(directive)
        if directive.planet.lower() in {"saturn", "ketu", "rahu"}:
            section = "Potential Challenges"
        else:
            section = _categorize_text(entry["guidance"])
        sections[section].append(entry)

    sections["Future Directions"].insert(0, _dharma_path_entry(snapshot))
    sections["Future Directions"].insert(1, _energetic_evolution_entry(snapshot))

    disclaimers = [
        "These directives are symbolic tendencies drawn from Bhrigu Samhita folios and transit heuristics.",
        "Outcomes are non-deterministic; individual choice, context, and guidance from trusted mentors matter most.",
        "Timing windows are approximate and intended for reflective planning rather than fixed prediction.",
    ]

    return {
        "Future Directions": sections["Future Directions"],
        "Potential Challenges": sections["Potential Challenges"],
        "Opportunities": sections["Opportunities"],
        "Disclaimer": disclaimers,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
