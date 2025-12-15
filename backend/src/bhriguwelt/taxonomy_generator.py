"""Taxonomy assembly and generation helpers for the BhriguWelt datasets."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List

from .schemas import DATASET_SEGMENTS


def _id_range(prefix: str, start: int, end: int) -> List[str]:
    return [f"{prefix}-{i}" for i in range(start, end + 1)]


def generate_past_life_taxonomy() -> List[Dict[str, Any]]:
    """PL-1..PL-108 — valid engine entries with safe placeholders."""

    engines: List[Dict[str, Any]] = []
    for _id in _id_range("PL", 1, 108):
        engines.append(
            {
                "id": _id,
                "tradition": "universal",
                "sutra_reference": "TBD manuscript folio",
                "description": "TBD — fill with verified manuscript distilled description.",
                "narrative": "TBD — fill with verified past-life narrative.",
                "confidence": 0.65,
                "conditions": {
                    # minimal valid condition stub
                    "lunar_tithi": {"min": 1, "max": 30},
                },
            }
        )
    return engines


def generate_future_taxonomy() -> List[Dict[str, Any]]:
    """FU-1..FU-84 — valid engine entries with safe placeholders."""

    engines: List[Dict[str, Any]] = []
    for _id in _id_range("FU", 1, 84):
        engines.append(
            {
                "id": _id,
                "tradition": "universal",
                "sutra_reference": "TBD manuscript folio",
                "description": "TBD — fill with verified manuscript distilled description.",
                "trajectory": "TBD — fill with verified future mandate/trajectory.",
                "window": "TBD",
                "certainty": 0.65,
                "conditions": {
                    "lunar_tithi": {"min": 1, "max": 30},
                },
            }
        )
    return engines


def merge_taxonomy_into_dataset(dataset: Dict[str, Any], *, overwrite_placeholders: bool = False) -> Dict[str, Any]:
    """Adds missing PL/FU ids while preserving any already authored entries."""

    existing_pl = {e.get("id") for e in (dataset.get("past_life_engines") or []) if isinstance(e, dict)}
    existing_fu = {e.get("id") for e in (dataset.get("future_engines") or []) if isinstance(e, dict)}

    pl_full = generate_past_life_taxonomy()
    fu_full = generate_future_taxonomy()

    def _is_placeholder(entry: Dict[str, Any]) -> bool:
        return "TBD" in str(entry.get("sutra_reference", "")) or "TBD" in str(entry.get("description", ""))

    dataset.setdefault("past_life_engines", [])
    dataset.setdefault("future_engines", [])

    # Add missing PL
    for e in pl_full:
        if e["id"] not in existing_pl:
            dataset["past_life_engines"].append(e)

    # Add missing FU
    for e in fu_full:
        if e["id"] not in existing_fu:
            dataset["future_engines"].append(e)

    if overwrite_placeholders:
        # optional: re-normalize existing placeholders to latest templates (rarely needed)
        for _, e in enumerate(list(dataset["past_life_engines"])):
            if isinstance(e, dict) and e.get("id") in existing_pl and _is_placeholder(e):
                # keep as-is unless you want to hard reset
                pass

    return dataset


def build_taxonomy(dataset: Dict[str, Any]) -> Dict[str, List[str]]:
    """Return a simple taxonomy keyed by dataset section.

    Each taxonomy entry lists the identifiers discovered in that portion of the
    dataset, which is helpful for linting and quick developer introspection.
    """

    taxonomy: Dict[str, List[str]] = {}
    for section in DATASET_SEGMENTS:
        entries = dataset.get(section) or []
        if not isinstance(entries, Iterable):
            continue
        taxonomy[section] = [entry.get("id", "") for entry in entries if isinstance(entry, dict)]
    return taxonomy
