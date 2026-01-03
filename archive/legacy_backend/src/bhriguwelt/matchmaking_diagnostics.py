"""Matchmaking diagnostics engine tailored for compatibility insights."""

from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict, Iterable, List, Sequence

from .bhrigu_core import bhrigu_core
from .calculations import MatchmakingCompatibility, _bayesian_weight
from .config import load_runtime_config
from .horoscope import HoroscopeRequest, _ensure_bhrigu_data_available, build_matchmaking_report


def _circular_alignment(a: int, b: int) -> float:
    if not a or not b:
        return 0.5
    distance = min(abs(a - b), 12 - abs(a - b))
    return round(max(0.0, 1 - distance / 6), 2)


def _element_complementarity(first: str, second: str) -> float:
    if not first or not second:
        return 0.5
    first_norm = first.lower()
    second_norm = second.lower()
    if first_norm == second_norm:
        return 1.0
    complements = {("fire", "air"), ("air", "fire"), ("earth", "water"), ("water", "earth")}
    return 0.85 if (first_norm, second_norm) in complements else 0.55


def _normalize_preferences(preferences: Sequence[str]) -> List[str]:
    normalized = []
    for pref in preferences:
        if not pref:
            continue
        normalized.append(str(pref).strip().lower())
    return normalized


def _remedy_matches_preference(remedy: Dict[str, Any], preferences: Iterable[str]) -> bool:
    personalize_for = remedy.get("personalize_for") or []
    if not isinstance(personalize_for, (list, tuple, set)):
        return False
    normalized_tags = {str(tag).strip().lower() for tag in personalize_for}
    for pref in preferences:
        normalized_pref = pref.replace("-", "_")
        if normalized_pref in normalized_tags:
            return True
    return False


def _tradition_allows(entry: Dict[str, Any], target: str) -> bool:
    entry_tradition = entry.get("tradition")
    if not entry_tradition:
        return True
    normalized_target = target.lower()
    if isinstance(entry_tradition, (list, tuple, set)):
        normalized = {str(item).lower() for item in entry_tradition}
        return normalized_target in normalized or "universal" in normalized
    normalized_entry = str(entry_tradition).lower()
    if normalized_entry == "universal":
        return True
    if normalized_target == "universal":
        return True
    return normalized_entry == normalized_target


def _select_remedies(
    remedies: Sequence[Dict[str, Any]],
    preferences: Sequence[str],
    tradition: str,
    limit: int = 2,
) -> List[Dict[str, Any]]:
    normalized_prefs = _normalize_preferences(preferences)
    filtered = [remedy for remedy in remedies if _tradition_allows(remedy, tradition)]
    preferred = [remedy for remedy in filtered if _remedy_matches_preference(remedy, normalized_prefs)]
    selection = preferred if preferred else filtered
    selection = sorted(selection, key=lambda item: str(item.get("id", "")))
    return selection[:limit]


def _bayesian_score(score: float) -> float:
    runtime_config = load_runtime_config()
    scoring_config: Dict[str, object] = runtime_config.get("scoring", {})  # type: ignore[assignment]
    alpha = float(scoring_config.get("bayesian_alpha", 1.1))
    beta = float(scoring_config.get("bayesian_beta", 1.05))
    posterior = _bayesian_weight(score / 100, alpha, beta)
    return round(posterior * 100, 2)


def _compatibility_citations(compatibility: MatchmakingCompatibility) -> List[str]:
    citations = [entry.sutra_reference for entry in compatibility.breakdown if entry.sutra_reference]
    return sorted(set(citations))


def _karmic_lessons(compatibility: MatchmakingCompatibility) -> List[str]:
    lessons = [path.guidance for path in compatibility.shared_life_paths if path.guidance]
    alignment = compatibility.alignment_percentages or {}
    if alignment.get("emotional", 0) < 55:
        lessons.append("Emotional cadence differs; cultivate rituals that stabilize feelings before major decisions.")
    if alignment.get("communication", 0) < 55:
        lessons.append("Communication styles diverge; slow down and confirm assumptions in daily planning.")
    if alignment.get("spiritual", 0) < 55:
        lessons.append("Dharmic pace is distinct; align on purpose-driven goals to avoid drifting.")
    return lessons[:4]


def build_matchmaking_diagnostics(
    primary_request: HoroscopeRequest,
    partner_request: HoroscopeRequest,
    modern_preferences: Sequence[str] | None = None,
    *,
    use_bayesian_scoring: bool = False,
    core_bundle: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Return an API-ready diagnostics payload for two birth charts."""

    preferences = list(modern_preferences or [])
    tradition = (primary_request.tradition or "universal").lower()
    dataset = core_bundle or bhrigu_core.application_bundle(tradition)
    _ensure_bhrigu_data_available(dataset, ("matchmaking_criteria",), tradition)

    report = build_matchmaking_report(
        primary_request,
        partner_request,
        preferences,
        core_bundle=dataset,
    )
    compatibility = report.compatibility

    base_score = compatibility.compatibility_index
    final_score = _bayesian_score(base_score) if use_bayesian_scoring else base_score
    scoring_method = "bayesian" if use_bayesian_scoring else "heuristic"

    planetary_synergies = [
        {
            "marker": "Venus house alignment",
            "score": round(_circular_alignment(primary_request.venus_house, partner_request.venus_house) * 100, 2),
            "notes": "Venus house proximity signals shared aesthetics and affection cadence.",
        },
        {
            "marker": "Moon element complementarity",
            "score": round(_element_complementarity(primary_request.moon_element, partner_request.moon_element) * 100, 2),
            "notes": "Elemental pairing reflects emotional resonance and intuitive support.",
        },
        {
            "marker": "Mercury dialogue alignment",
            "score": round(_circular_alignment(primary_request.mercury_house, partner_request.mercury_house) * 100, 2),
            "notes": "Mercury closeness indicates ease in planning, research, and communication.",
        },
        {
            "marker": "Jupiter dharma alignment",
            "score": round(_circular_alignment(primary_request.jupiter_house, partner_request.jupiter_house) * 100, 2),
            "notes": "Jupiter house alignment signals shared moral compass and mentorship arcs.",
        },
    ]

    remedies = _select_remedies(
        dataset.get("remedies", []),
        preferences,
        tradition,
        limit=3,
    )
    remedial_suggestions = [
        {
            "id": remedy.get("id"),
            "sutra_reference": remedy.get("sutra_reference"),
            "description": remedy.get("description"),
        }
        for remedy in remedies
    ]

    compatibility_breakdown = [
        {
            "criterion_id": entry.criterion_id,
            "sutra_reference": entry.sutra_reference,
            "description": entry.description,
            "score": entry.score,
            "notes": entry.notes,
        }
        for entry in sorted(compatibility.breakdown, key=lambda item: item.score, reverse=True)[:5]
    ]

    return {
        "Compatibility Overview": {
            "compatibility_score": final_score,
            "base_score": base_score,
            "scoring_method": scoring_method,
            "modern_preferences": preferences,
            "planetary_synergies": planetary_synergies,
            "breakdown": compatibility_breakdown,
            "folio_citations": _compatibility_citations(compatibility),
        },
        "Shared Dharma": {
            "shared_paths": [asdict(path) for path in compatibility.shared_life_paths],
            "karmic_lessons": _karmic_lessons(compatibility),
            "alignment_percentages": compatibility.alignment_percentages,
            "folio_citations": _compatibility_citations(compatibility),
        },
        "Relationship Dynamics": {
            "synastry_overlays": [asdict(overlay) for overlay in compatibility.synastry_overlays],
            "modern_highlights": list(compatibility.modern_highlights),
            "remedial_suggestions": remedial_suggestions,
            "folio_citations": sorted(
                {
                    *(remedy.get("sutra_reference") for remedy in remedies if remedy.get("sutra_reference")),
                    *_compatibility_citations(compatibility),
                }
            ),
        },
    }


__all__ = ["build_matchmaking_diagnostics"]
