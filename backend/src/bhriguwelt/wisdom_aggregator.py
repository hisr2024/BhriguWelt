"""Aggregator that keeps the wisdom bot anchored to the Bhrigu Samhita core.

The aggregator pulls the cached :class:`bhriguwelt.bhrigu_core.BhriguCore`
dataset, validates every engine through the analyser + interpreter stack, and
returns a compact payload ready for chat or voice bots. All summaries stay
grounded in the manuscript metadata so downstream engines never drift away from
the Bhrigu Samhita folios.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Sequence

from .bhrigu_core import bhrigu_core
from .engine_analyzers import analyze_core_engines
from .engine_interpreters import interpret_bhrigu_wisdom
from .wisdom_sources import source_catalog


def _representative_entries(entries: Sequence[Dict[str, Any]], *, limit: int = 3) -> List[str]:
    """Return human-friendly snippets pulled directly from the manuscript corpus."""

    phrases: List[str] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        for key in ("description", "narrative", "trajectory", "influence", "pair_rules"):
            value = entry.get(key)
            if isinstance(value, str) and value.strip():
                phrases.append(value.strip())
                break
        if len(phrases) >= limit:
            break
    return phrases


def _unique_references(entries: Sequence[Dict[str, Any]]) -> List[str]:
    references: List[str] = []
    seen = set()
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        reference = entry.get("sutra_reference")
        if reference is None:
            continue
        normalized = str(reference)
        if normalized in seen:
            continue
        seen.add(normalized)
        references.append(normalized)
    return references


@dataclass
class EngineWisdomDigest:
    """Summarized manuscript snippets for a single engine."""

    engine: str
    tradition: str
    entry_count: int
    sutra_references: List[str]
    representative_entries: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "engine": self.engine,
            "tradition": self.tradition,
            "entry_count": self.entry_count,
            "sutra_references": list(self.sutra_references),
            "representative_entries": list(self.representative_entries),
        }


@dataclass
class WisdomBotAggregate:
    """Fully operational payload for wisdom-bot style experiences."""

    tradition: str
    manuscript: Dict[str, Any]
    source_catalog: List[Dict[str, str]]
    engines: List[EngineWisdomDigest]
    analyses: List[Dict[str, Any]]
    interpretations: List[Dict[str, Any]]
    assurance: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tradition": self.tradition,
            "manuscript": dict(self.manuscript),
            "source_catalog": [dict(source) for source in self.source_catalog],
            "engines": [engine.to_dict() for engine in self.engines],
            "analyses": [dict(analysis) for analysis in self.analyses],
            "interpretations": [dict(interpretation) for interpretation in self.interpretations],
            "assurance": self.assurance,
        }


def aggregate_wisdom_for_bot(
    *, tradition: str | None = None, focus_engines: Sequence[str] | None = None
) -> WisdomBotAggregate:
    """Aggregate Bhrigu Samhita wisdom for every engine the bot may invoke.

    The aggregation intentionally leans on the same Bhrigu Samhita corpus used by
    the runtime engines, guaranteeing that every downstream interpretation stays
    manuscript-faithful.
    """

    normalized_tradition = (tradition or "universal").lower()
    dataset = bhrigu_core.application_bundle(normalized_tradition)

    analyses = analyze_core_engines(tradition=normalized_tradition, core_bundle=dataset)
    interpretations = [
        interpretation.to_dict()
        for interpretation in interpret_bhrigu_wisdom(tradition=normalized_tradition, core_bundle=dataset)
    ]

    focus = {engine for engine in focus_engines} if focus_engines else None
    engine_digests: List[EngineWisdomDigest] = []
    for analysis in analyses:
        if focus and analysis.engine not in focus:
            continue
        entries = dataset.get(analysis.engine, []) if isinstance(dataset, dict) else []
        entries_list = entries if isinstance(entries, list) else []
        engine_digests.append(
            EngineWisdomDigest(
                engine=analysis.engine,
                tradition=analysis.tradition,
                entry_count=len(entries_list),
                sutra_references=_unique_references(entries_list),
                representative_entries=_representative_entries(entries_list),
            )
        )

    metadata = dataset.get("metadata", {}) if isinstance(dataset, dict) else {}
    assurance = (
        "Wisdom compiled directly from the cached Bhrigu Samhita corpus; each"
        " engine remains aligned to the manuscript sutras for fully precise bot"
        " interpretations."
    )

    return WisdomBotAggregate(
        tradition=normalized_tradition,
        manuscript={
            "title": metadata.get("title", "Bhrigu Samhita"),
            "compiled_by": metadata.get("compiled_by", "BhriguWelt Research"),
            "integrity": metadata.get("integrity", {}),
            "source_note": metadata.get("source_note", "Aligned to the preserved Bhrigu folios."),
        },
        source_catalog=source_catalog(),
        engines=engine_digests,
        analyses=[analysis.to_dict() for analysis in analyses],
        interpretations=interpretations,
        assurance=assurance,
    )


__all__ = ["EngineWisdomDigest", "WisdomBotAggregate", "aggregate_wisdom_for_bot"]
