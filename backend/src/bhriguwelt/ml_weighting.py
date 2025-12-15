"""ML-assisted weighting helpers with strict hallucination guards."""

from __future__ import annotations

import sys
from copy import deepcopy
from typing import Callable, Dict, Iterable, Mapping, MutableMapping

WeightMapping = Mapping[str, float]
ProposalFn = Callable[[Mapping[str, object], WeightMapping], Mapping[str, float]]


def normalize_weights(weights: Dict[str, float]) -> Dict[str, float]:
    """Normalize a weight mapping to sum to 1.0.

    The helper guards against zero or negative totals by returning the original
    mapping when normalization is impossible.
    """

    total = sum(value for value in weights.values() if value > 0)
    if total <= 0:
        return weights

    return {key: value / total for key, value in weights.items()}


def _deterministic_delta(token: str, *, limit: float) -> float:
    """Return a reproducible delta within +/- limit based on a token."""

    seed = abs(hash(token)) % 1000
    magnitude = (seed % 6) / 100  # 0.00, 0.01, ... 0.05
    direction = -1 if seed % 2 else 1
    return direction * min(magnitude, limit)


def conservative_adjustments(entry: Mapping[str, object], weights: WeightMapping) -> Dict[str, float]:
    """Return bounded adjustments without fabricating new weight keys."""

    adjusted: Dict[str, float] = {}
    for key, value in weights.items():
        delta = _deterministic_delta(f"{entry.get('id', 'entry')}-{key}", limit=0.05)
        adjusted_value = _clamp(value + delta, 0.0, 1.0)
        adjusted[key] = round(adjusted_value, 3)
    return adjusted


def apply_reweighting(
    dataset: Mapping[str, object],
    *,
    mode: str = "conservative",
    proposer: ProposalFn | None = None,
    logger: Callable[[str], None] = lambda message: print(message, file=sys.stdout),
) -> Dict[str, object]:
    """Return a dataset with adjusted weights while guarding against hallucinations."""

    payload = deepcopy(dataset)
    entries = payload.get("principles", [])
    if not isinstance(entries, list):
        return payload

    strategy = proposer or _strategy_for_mode(mode)

    for entry in entries:
        if not isinstance(entry, MutableMapping):
            continue
        weights = entry.get("weights")
        if not isinstance(weights, Mapping):
            continue

        proposals = strategy(entry, weights)
        _guard_proposals(weights, proposals)

        for key, new_value in proposals.items():
            old_value = float(weights.get(key, 0.0))
            bounded_value = _clamp(new_value, 0.0, 1.0)
            if bounded_value != old_value:
                logger(
                    f"{entry.get('id', 'entry')} weights[{key}]: "
                    f"{old_value:.3f} -> {bounded_value:.3f}"
                )
            entry["weights"][key] = round(bounded_value, 3)

        entry["weights"] = normalize_weights(dict(entry["weights"]))

    return payload


def _strategy_for_mode(mode: str) -> ProposalFn:
    normalized = (mode or "").lower()
    if normalized in {"conservative", "default"}:
        return conservative_adjustments
    raise ValueError(f"Unknown reweighting mode: {mode}")


def _guard_proposals(existing: WeightMapping, proposals: Mapping[str, float]) -> None:
    new_keys = set(proposals) - set(existing)
    if new_keys:
        joined = ", ".join(sorted(new_keys))
        raise ValueError(
            f"Proposals attempted to introduce new weight keys: {joined}. Hallucinations are not allowed."
        )


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, float(value)))


__all__ = [
    "apply_reweighting",
    "conservative_adjustments",
    "normalize_weights",
]
