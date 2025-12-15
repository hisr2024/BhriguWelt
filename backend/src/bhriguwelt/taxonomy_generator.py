"""Taxonomy assembly and deterministic generation helpers."""

from __future__ import annotations

from dataclasses import fields
from typing import Any, Dict, Iterable, List, Sequence

from .calculations import CelestialSnapshot
from .schemas import DATASET_SEGMENTS

_ELEMENTS: Sequence[str] = ("water", "fire", "air", "earth", "ether")
_SNAPSHOT_FIELDS = {f.name for f in fields(CelestialSnapshot)}


def _id_range(prefix: str, start: int, end: int) -> List[str]:
    return [f"{prefix}-{i}" for i in range(start, end + 1)]


def _conditions_for_index(index: int) -> Dict[str, Dict[str, object]]:
    lunar_min = ((index - 1) % 30) + 1
    lunar_max = min(30, lunar_min + 3)
    element_idx = (index - 1) % len(_ELEMENTS)
    mars_house = ((index + 1) % 12) + 1
    saturn_house = ((index + 4) % 12) + 1
    jupiter_house = ((index + 7) % 12) + 1

    conditions: Dict[str, Dict[str, object]] = {
        "lunar_tithi": {"min": lunar_min, "max": lunar_max},
        "moon_element": {"any_of": [_ELEMENTS[element_idx], _ELEMENTS[(element_idx + 1) % len(_ELEMENTS)]]},
        "mars_house": {"equals": mars_house},
        "saturn_house": {"equals": saturn_house},
        "jupiter_house": {"max": jupiter_house},
        "rahu_aspects_ascendant": {"equals": index % 2 == 0},
    }

    return {key: value for key, value in conditions.items() if key in _SNAPSHOT_FIELDS}


def generate_past_life_taxonomy(start: int = 1, end: int = 108) -> List[Dict[str, Any]]:
    """Return PL-* engines with deterministic, schema-compliant scaffolds."""

    if start > end:
        raise ValueError("Start must not exceed end for past-life taxonomy")

    engines: List[Dict[str, Any]] = []
    for _id in _id_range("PL", start, end):
        index = int(_id.split("-")[1])
        confidence = round(0.6 + ((index % 10) * 0.01), 2)
        engines.append(
            {
                "id": _id,
                "tradition": "universal",
                "sutra_reference": f"Manuscript folio {_id}",
                "description": f"Scaffolded past-life insight {_id}",
                "narrative": f"Narrative placeholder for {_id}",
                "confidence": confidence,
                "conditions": _conditions_for_index(index),
            }
        )
    return engines


def generate_future_taxonomy(start: int = 1, end: int = 84) -> List[Dict[str, Any]]:
    """Return FU-* engines with deterministic, schema-compliant scaffolds."""

    if start > end:
        raise ValueError("Start must not exceed end for future taxonomy")

    engines: List[Dict[str, Any]] = []
    for _id in _id_range("FU", start, end):
        index = int(_id.split("-")[1])
        certainty = round(0.6 + ((index % 9) * 0.01), 2)
        engines.append(
            {
                "id": _id,
                "tradition": "universal",
                "sutra_reference": f"Manuscript folio {_id}",
                "description": f"Scaffolded future trajectory {_id}",
                "trajectory": f"Trajectory placeholder for {_id}",
                "window": f"Year block {(2025 + (index % 12))}",
                "certainty": certainty,
                "conditions": _conditions_for_index(index + 3),
            }
        )
    return engines


def merge_taxonomy_into_dataset(dataset: Dict[str, Any], *, overwrite_placeholders: bool = False) -> Dict[str, Any]:
    """Adds missing PL/FU ids while preserving any already authored entries."""

    existing_pl = {e.get("id") for e in (dataset.get("past_life_engines") or []) if isinstance(e, dict)}
    existing_fu = {e.get("id") for e in (dataset.get("future_engines") or []) if isinstance(e, dict)}

    pl_full = generate_past_life_taxonomy()
    fu_full = generate_future_taxonomy()

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
        dataset["past_life_engines"] = pl_full
        dataset["future_engines"] = fu_full

    return dataset


def build_taxonomy(dataset: Dict[str, Any]) -> Dict[str, List[str]]:
    """Return a simple taxonomy keyed by dataset section."""

    taxonomy: Dict[str, List[str]] = {}
    for section in DATASET_SEGMENTS:
        entries = dataset.get(section) or []
        if not isinstance(entries, Iterable):
            continue
        taxonomy[section] = [entry.get("id", "") for entry in entries if isinstance(entry, dict)]
    return taxonomy
