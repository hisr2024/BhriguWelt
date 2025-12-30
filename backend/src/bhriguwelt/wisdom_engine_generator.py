"""Generate de-duplicated wisdom outputs across the Bhrigu engines."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Dict, Iterable, List, Sequence

from .bhrigu_core import bhrigu_core
from .horoscope import EngineOutputs, HoroscopeRequest, build_engine_outputs
from .wisdom_sources import source_catalog


def _dedupe_by_key(items: Iterable[Dict[str, object]], key: str) -> List[Dict[str, object]]:
    seen = set()
    unique: List[Dict[str, object]] = []
    for item in items:
        value = item.get(key)
        if value is None:
            continue
        normalized = str(value).strip().lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        unique.append(item)
    return unique


def _dedupe_by_composite(items: Iterable[Dict[str, object]], keys: Sequence[str]) -> List[Dict[str, object]]:
    seen = set()
    unique: List[Dict[str, object]] = []
    for item in items:
        parts = [str(item.get(key, "")).strip().lower() for key in keys]
        signature = "|".join(parts)
        if not signature or signature in seen:
            continue
        seen.add(signature)
        unique.append(item)
    return unique


def _serialize_dataclass_list(items: Sequence[object]) -> List[Dict[str, object]]:
    return [asdict(item) for item in items]


def _unique_principles(principles: Sequence[Dict[str, object]]) -> List[Dict[str, object]]:
    return _dedupe_by_key(principles, "id")


def _unique_remedies(remedies: Sequence[Dict[str, object]]) -> List[Dict[str, object]]:
    return _dedupe_by_key(remedies, "id")


def _unique_past_life(insights: Sequence[object]) -> List[Dict[str, object]]:
    serialized = _serialize_dataclass_list(insights)
    return _dedupe_by_key(serialized, "engine_id")


def _unique_future(trajectories: Sequence[object]) -> List[Dict[str, object]]:
    serialized = _serialize_dataclass_list(trajectories)
    return _dedupe_by_key(serialized, "engine_id")


def _unique_transits(directives: Sequence[object]) -> List[Dict[str, object]]:
    serialized = _serialize_dataclass_list(directives)
    return _dedupe_by_composite(serialized, ("reference", "planet"))


@dataclass
class WisdomEngineResults:
    """De-duplicated results across Bhrigu engines with source metadata."""

    tradition: str
    sources: List[Dict[str, str]]
    manuscript: Dict[str, object]
    engines: Dict[str, object]
    analyses: List[Dict[str, object]]
    interpretation: str

    def to_dict(self) -> Dict[str, object]:
        return {
            "tradition": self.tradition,
            "sources": [dict(source) for source in self.sources],
            "manuscript": dict(self.manuscript),
            "engines": dict(self.engines),
            "analyses": [dict(analysis) for analysis in self.analyses],
            "interpretation": self.interpretation,
        }


def generate_engine_results(request: HoroscopeRequest) -> WisdomEngineResults:
    """Generate deduplicated wisdom outputs across engines for downstream services."""

    outputs: EngineOutputs = build_engine_outputs(request)
    core_bundle = bhrigu_core.application_bundle(request.tradition)
    metadata = core_bundle.get("metadata", {}) if isinstance(core_bundle, dict) else {}

    unique_principles = _unique_principles(outputs.principles)
    unique_remedies = _unique_remedies(outputs.remedies)
    unique_past_life = _unique_past_life(outputs.past_life_insights)
    unique_future = _unique_future(outputs.future_directives)
    unique_transits = _unique_transits(outputs.transit_directives)

    engines = {
        "karmic_epoch": outputs.karmic_epoch,
        "weights": dict(outputs.weights),
        "principles": unique_principles,
        "remedies": unique_remedies,
        "past_life_insights": unique_past_life,
        "future_directives": unique_future,
        "transit_directives": unique_transits,
    }

    return WisdomEngineResults(
        tradition=request.tradition,
        sources=source_catalog(),
        manuscript={
            "title": metadata.get("title", "Bhrigu Samhita"),
            "compiled_by": metadata.get("compiled_by", "BhriguWelt Research"),
            "integrity": metadata.get("integrity", {}),
            "source_note": metadata.get("source_note", "Aligned to the preserved Bhrigu folios."),
        },
        engines=engines,
        analyses=[analysis.to_dict() for analysis in outputs.engine_analyses],
        interpretation=outputs.interpretation,
    )


__all__ = ["WisdomEngineResults", "generate_engine_results"]
