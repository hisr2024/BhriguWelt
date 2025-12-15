"""Utilities for working with ML-friendly weight vectors."""

from __future__ import annotations

from typing import Dict


def normalize_weights(weights: Dict[str, float]) -> Dict[str, float]:
    """Normalize a weight mapping to sum to 1.0.

    The helper guards against zero or negative totals by returning the original
    mapping when normalization is impossible.
    """

    total = sum(value for value in weights.values() if value > 0)
    if total <= 0:
        return weights

    return {key: value / total for key, value in weights.items()}
