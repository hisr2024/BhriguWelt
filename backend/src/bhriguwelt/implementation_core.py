"""Implementation core that answers strictly from Bhrigu and Nadi wisdom files."""

from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Sequence

from .bhrigu_core import get_bhrigu_core
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
    """Generate a response strictly from Bhrigu Samhita and Nadi Jyotisha core files."""

    bhrigu_bundle = get_bhrigu_core().application_bundle(tradition=request.tradition)
    nadi_bundle = get_nadi_core().application_bundle(tradition="nadi")

    seed = _seed_from_request(request)

    bhrigu_principles = _select_entries(
        _filter_by_focus(bhrigu_bundle.get("principles", []), focus_areas), seed, 3
    )
    bhrigu_remedies = _select_entries(
        _filter_by_focus(bhrigu_bundle.get("remedies", []), focus_areas), seed + 1, 2
    )

    nadi_principles = _select_entries(
        _filter_by_focus(nadi_bundle.get("principles", []), focus_areas), seed + 2, 3
    )
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
