"""Interpretors that transform analyser outputs into precise manuscript verdicts.

These helpers sit atop :mod:`bhriguwelt.engine_analyzers`, ingesting its
structured analyses and re-checking them against the same Bhrigu Samhita corpus
so downstream consumers receive precise, manuscript-grounded interpretations.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Sequence

from .engine_analyzers import (
    EngineAnalysis,
    _ENGINE_REQUIREMENTS,
    _analyze_single_engine,
    analyze_core_engines,
)


@dataclass
class EngineInterpretation:
    """Interpretation of a Bhrigu engine's alignment and precision."""

    engine: str
    tradition: str
    validated: bool
    rechecked: bool
    precision_score: float
    precise_result: str
    missing_fields: List[str]
    sutra_references: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "engine": self.engine,
            "tradition": self.tradition,
            "validated": self.validated,
            "rechecked": self.rechecked,
            "precision_score": self.precision_score,
            "precise_result": self.precise_result,
            "missing_fields": list(self.missing_fields),
            "sutra_references": list(self.sutra_references),
        }


def _precision_score(total_entries: int, missing_count: int, required_fields: Sequence[str]) -> float:
    """Return a normalized precision score between 0 and 1.

    The score rewards complete manuscript coverage and gently scales down when
    required Bhrigu fields are absent. It uses the product of entry count and
    required fields to avoid inflating gaps for larger engines.
    """

    expected_fields = max(total_entries * max(len(required_fields), 1), 1)
    score = 1.0 - (missing_count / expected_fields)
    return round(max(0.0, min(score, 1.0)), 2)


def _craft_precise_result(
    *,
    analysis: EngineAnalysis,
    recheck: EngineAnalysis,
    precision: float,
) -> str:
    if recheck.aligned_to_bhrigu:
        status = "Wisdom interpreted with full Bhrigu Samhita fidelity."
    else:
        status = "Wisdom requires manuscript review before release."

    recheck_note = (
        "Check and recheck matched the analyser output; entries stay consistent."
        if analysis.missing_manuscript_fields == recheck.missing_manuscript_fields
        and analysis.aligned_to_bhrigu == recheck.aligned_to_bhrigu
        else "Recheck diverged; revisit the corpus for alignment."
    )

    missing = (
        "No missing manuscript fields."
        if not recheck.missing_manuscript_fields
        else f"Missing fields: {', '.join(recheck.missing_manuscript_fields)}."
    )

    sutra_note = (
        f"Sutra references tallied: {len(recheck.sutra_references)} across the engine."
    )

    return (
        f"{status} {recheck_note} Precision score {precision:.2f}. "
        f"{missing} {sutra_note}"
    )


def interpret_bhrigu_wisdom(
    tradition: str | None = None, core_bundle: Dict[str, Any] | None = None
) -> List[EngineInterpretation]:
    """Interpret analyser outputs, re-checking them for precise Bhrigu alignment.

    This helper runs the analyser, re-validates each engine against the corpus,
    and returns structured interpretations that highlight precision, missing
    fields, and sutra coverage. Downstream surfaces can surface these
    interpretations directly to operators or QA dashboards.
    """

    analyses = analyze_core_engines(tradition=tradition, core_bundle=core_bundle)
    dataset = core_bundle or {}

    interpretations: List[EngineInterpretation] = []
    for analysis in analyses:
        entries = dataset.get(analysis.engine, []) if isinstance(dataset, dict) else []
        required_fields = _ENGINE_REQUIREMENTS.get(analysis.engine, ())
        recheck = _analyze_single_engine(
            engine=analysis.engine,
            entries=entries if isinstance(entries, list) else [],
            required_fields=required_fields,
            tradition=analysis.tradition,
        )

        precision = _precision_score(
            total_entries=recheck.total_entries,
            missing_count=len(recheck.missing_manuscript_fields),
            required_fields=required_fields,
        )

        interpretations.append(
            EngineInterpretation(
                engine=analysis.engine,
                tradition=analysis.tradition,
                validated=recheck.aligned_to_bhrigu,
                rechecked=(
                    analysis.aligned_to_bhrigu == recheck.aligned_to_bhrigu
                    and analysis.missing_manuscript_fields == recheck.missing_manuscript_fields
                ),
                precision_score=precision,
                precise_result=_craft_precise_result(
                    analysis=analysis, recheck=recheck, precision=precision
                ),
                missing_fields=recheck.missing_manuscript_fields,
                sutra_references=recheck.sutra_references,
            )
        )

    return interpretations


__all__ = [
    "EngineInterpretation",
    "interpret_bhrigu_wisdom",
]
