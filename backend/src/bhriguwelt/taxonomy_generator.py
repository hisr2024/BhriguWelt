"""Taxonomy assembly helpers for the BhriguWelt datasets."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List

from .schemas import DATASET_SEGMENTS


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
