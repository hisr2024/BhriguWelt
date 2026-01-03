"""Implementation core that answers strictly from Bhrigu and Nadi wisdom files."""

from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, List, Sequence

from .bhrigu_core import get_bhrigu_core
from .calendar_conversion import convert_birth_details
from .horoscope import HoroscopeRequest
from .nadi_core import get_nadi_core
from .wisdom_sources import source_catalog


@dataclass
class ImplementationCoreResponse:
    input_summary: Dict[str, str]
    bhrigu_samhita: Dict[str, Any]
    nadi_jyotisha: Dict[str, Any]
    sources: List[Dict[str, str]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "input_summary": dict(self.input_summary),
            "bhrigu_samhita": dict(self.bhrigu_samhita),
            "nadi_jyotisha": dict(self.nadi_jyotisha),
            "sources": list(self.sources),
        }


def _seed_from_request(request: HoroscopeRequest) -> int:
    material = f"{request.name}|{request.birth_date}|{request.birth_time}|{request.birth_place}".encode("utf-8")
    return int(hashlib.sha256(material).hexdigest(), 16)


def _calculate_nakshatra_compatibility(nakshatra_index: int, entry: Dict[str, Any]) -> float:
    """Calculate how well a Nadi principle aligns with the birth nakshatra.

    This implements the traditional Nadi Jyotisha approach where certain nakshatras
    resonate more strongly with specific principles based on their ruling deities
    and characteristics.
    """
    # Check if entry has nakshatra preferences
    preferred_nakshatras = entry.get("preferred_nakshatras", [])
    if not preferred_nakshatras:
        return 1.0  # Neutral compatibility if no preference specified

    # Convert to list of indices if they're names
    if isinstance(preferred_nakshatras[0], str):
        # Map nakshatra names to indices (1-27)
        nakshatra_names = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra",
            "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
            "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
            "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
            "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        ]
        preferred_indices = [
            i + 1 for i, name in enumerate(nakshatra_names)
            if name.lower() in [n.lower() for n in preferred_nakshatras]
        ]
    else:
        preferred_indices = preferred_nakshatras

    # Check for exact match
    if nakshatra_index in preferred_indices:
        return 2.0  # Strong compatibility

    # Check for trine (120 degrees / 9 nakshatras apart)
    for preferred in preferred_indices:
        distance = abs(nakshatra_index - preferred)
        if distance in [9, 18]:  # Trine relationship
            return 1.5

    # Check for harmonious relationships (compatible lords)
    # Nakshatras ruled by same planet or friendly planets get bonus
    nakshatra_lords = [
        "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
    ] * 3  # Repeats 3 times for 27 nakshatras

    birth_lord = nakshatra_lords[nakshatra_index - 1]
    for preferred in preferred_indices:
        preferred_lord = nakshatra_lords[preferred - 1]
        if birth_lord == preferred_lord:
            return 1.3

    return 0.8  # Slightly lower compatibility


def _filter_by_focus(entries: Iterable[Dict[str, Any]], focus_areas: Sequence[str] | None) -> List[Dict[str, Any]]:
    if not focus_areas:
        return list(entries)

    focus_set = {item.strip().lower() for item in focus_areas if item}
    filtered: List[Dict[str, Any]] = []
    for entry in entries:
        tags = entry.get("focus_tags") or entry.get("tags") or []
        normalized_tags = {str(tag).lower() for tag in tags}
        if focus_set & normalized_tags:
            filtered.append(entry)
    return filtered or list(entries)


def _select_entries(
    entries: List[Dict[str, Any]],
    seed: int,
    limit: int,
) -> List[Dict[str, Any]]:
    if not entries:
        return []
    rng = random.Random(seed)
    if len(entries) <= limit:
        return list(entries)
    return rng.sample(entries, limit)


def _format_entries(entries: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    formatted: List[Dict[str, Any]] = []
    for entry in entries:
        formatted.append(
            {
                "id": entry.get("id"),
                "sutra_reference": entry.get("sutra_reference"),
                "description": entry.get("description"),
                "focus_tags": list(entry.get("focus_tags") or entry.get("tags") or []),
            }
        )
    return formatted


def build_implementation_core_response(
    request: HoroscopeRequest,
    focus_areas: Sequence[str] | None = None,
) -> ImplementationCoreResponse:
    """Generate a response strictly from Bhrigu Samhita and Nadi Jyotisha core files.

    This implementation now includes nakshatra-based weighting for Nadi Jyotisha
    principles to ensure more accurate predictions aligned with traditional practices.
    """

    bhrigu_bundle = get_bhrigu_core().application_bundle(tradition=request.tradition)
    nadi_bundle = get_nadi_core().application_bundle(tradition="nadi")

    seed = _seed_from_request(request)

    # Calculate nakshatra for Nadi Jyotisha accuracy
    nakshatra_index = 1  # Default
    try:
        hindu_context = convert_birth_details(
            request.birth_date,
            request.birth_time,
            request.birth_place
        )
        nakshatra_index = hindu_context.nakshatra_index
    except Exception:
        # Fallback to seed-based selection if calculation fails
        pass

    bhrigu_principles = _select_entries(
        _filter_by_focus(bhrigu_bundle.get("principles", []), focus_areas), seed, 3
    )
    bhrigu_remedies = _select_entries(
        _filter_by_focus(bhrigu_bundle.get("remedies", []), focus_areas), seed + 1, 2
    )

    # For Nadi Jyotisha, weight entries by nakshatra compatibility
    nadi_principles_filtered = _filter_by_focus(nadi_bundle.get("principles", []), focus_areas)
    nadi_principles_weighted = [
        (entry, _calculate_nakshatra_compatibility(nakshatra_index, entry))
        for entry in nadi_principles_filtered
    ]
    # Sort by compatibility score and select top entries
    nadi_principles_weighted.sort(key=lambda x: x[1], reverse=True)
    nadi_principles = [entry for entry, _ in nadi_principles_weighted[:3]]
    if len(nadi_principles) < 3 and len(nadi_principles_filtered) >= 3:
        # Fallback to random selection if not enough weighted entries
        nadi_principles = _select_entries(nadi_principles_filtered, seed + 2, 3)

    nadi_remedies = _select_entries(
        _filter_by_focus(nadi_bundle.get("remedies", []), focus_areas), seed + 3, 2
    )
    nadi_observances = _select_entries(
        _filter_by_focus(nadi_bundle.get("observances", []), focus_areas), seed + 4, 2
    )

    bhrigu_metadata = bhrigu_bundle.get("metadata", {})
    nadi_metadata = nadi_bundle.get("metadata", {})

    response = ImplementationCoreResponse(
        input_summary={
            "name": request.name,
            "birth_date": request.birth_date,
            "birth_time": request.birth_time,
            "birth_place": request.birth_place,
        },
        bhrigu_samhita={
            "metadata": {
                "title": bhrigu_metadata.get("title"),
                "source_note": bhrigu_metadata.get("source_note"),
                "regulations": list(bhrigu_metadata.get("regulations") or []),
            },
            "principles": _format_entries(bhrigu_principles),
            "remedies": _format_entries(bhrigu_remedies),
        },
        nadi_jyotisha={
            "metadata": {
                "title": nadi_metadata.get("title"),
                "source_note": nadi_metadata.get("source_note"),
                "regulations": list(nadi_metadata.get("regulations") or []),
            },
            "principles": _format_entries(nadi_principles),
            "remedies": _format_entries(nadi_remedies),
            "observances": _format_entries(nadi_observances),
        },
        sources=[
            source
            for source in source_catalog()
            if source.get("tradition") in {"bhrigu", "nadi"}
        ],
    )

    return response


__all__ = ["ImplementationCoreResponse", "build_implementation_core_response"]
