"""Analysers that validate Bhrigu Samhita alignment across every core engine.

These helpers introspect the cached :class:`bhriguwelt.bhrigu_core.BhriguCore`
corpus to confirm each prediction engine still carries the manuscript-backed
fields (IDs, sutra references, descriptions, and narrative/trajectory details).
They intentionally stay close to the Bhrigu Samhita folios so downstream
surfaces—CLI, HTTP, and ML layers—can trust that every engine is anchored to
the authentic wisdom.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Sequence

from .bhrigu_core import bhrigu_core


@dataclass
class EngineAnalysis:
    """Structured view of how well an engine adheres to Bhrigu manuscripts."""

    engine: str
    tradition: str
    total_entries: int
    missing_manuscript_fields: List[str]
    sutra_references: List[str]
    aligned_to_bhrigu: bool
    summary: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "engine": self.engine,
            "tradition": self.tradition,
            "total_entries": self.total_entries,
            "missing_manuscript_fields": list(self.missing_manuscript_fields),
            "sutra_references": list(self.sutra_references),
            "aligned_to_bhrigu": self.aligned_to_bhrigu,
            "summary": self.summary,
        }


_ENGINE_REQUIREMENTS: Dict[str, Sequence[str]] = {
    "principles": ("id", "description", "sutra_reference"),
    "remedies": ("id", "description", "sutra_reference"),
    "past_life_engines": ("id", "description", "narrative", "sutra_reference"),
    "future_engines": ("id", "description", "trajectory", "sutra_reference"),
    "transit_rules": ("id", "influence", "sutra_reference"),
    "matchmaking_criteria": ("id", "description", "pair_rules", "sutra_reference"),
}


def _analyze_single_engine(
    engine: str, entries: List[Dict[str, Any]], required_fields: Sequence[str], tradition: str
) -> EngineAnalysis:
    missing_fields: List[str] = []
    sutra_references: List[str] = []

    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            missing_fields.append(f"{engine}[{index}]: expected mapping")
            continue

        identifier = str(entry.get("id", f"entry-{index}"))
        for field in required_fields:
            value = entry.get(field)
            if value is None or value == "":
                missing_fields.append(f"{identifier}:{field}")
        sutra_reference = entry.get("sutra_reference")
        if sutra_reference:
            sutra_references.append(str(sutra_reference))

    aligned = bool(entries) and not missing_fields
    summary = (
        "Anchored to Bhrigu Samhita folios with complete manuscript links"
        if aligned
        else "Review manuscript alignment; required Bhrigu fields are missing"
    )

    return EngineAnalysis(
        engine=engine,
        tradition=tradition,
        total_entries=len(entries),
        missing_manuscript_fields=missing_fields,
        sutra_references=sutra_references,
        aligned_to_bhrigu=aligned,
        summary=summary,
    )


def analyze_core_engines(tradition: str | None = None, core_bundle: Dict[str, Any] | None = None) -> List[EngineAnalysis]:
    """Return Bhrigu-alignment analyses for every engine.

    The analyser respects the selected ``tradition`` (universal/northern/southern)
    and inspects the same corpus used by the runtime engines so parity is
    preserved across CLI, HTTP, and ML consumers.
    """

    normalized_tradition = (tradition or "universal").lower()
    dataset = core_bundle or bhrigu_core.application_bundle(normalized_tradition)

    analyses: List[EngineAnalysis] = []
    for engine, required_fields in _ENGINE_REQUIREMENTS.items():
        entries = dataset.get(engine, []) if isinstance(dataset, dict) else []
        analyses.append(
            _analyze_single_engine(
                engine=engine,
                entries=entries if isinstance(entries, list) else [],
                required_fields=required_fields,
                tradition=normalized_tradition,
            )
        )

    return analyses
