"""ML-assisted weighting helpers with strict hallucination guards."""

from __future__ import annotations

import csv
import sys
from copy import deepcopy
from pathlib import Path
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


def supervised_csv_reweight(
    dataset: Mapping[str, object],
    csv_path: str | Path,
    *,
    section: str = "principles",
    id_column: str = "id",
    weight_key_column: str = "weight_key",
    label_column: str = "label",
    learning_rate: float = 0.5,
    logger: Callable[[str], None] = lambda message: print(message, file=sys.stdout),
) -> Dict[str, object]:
    """Reweight existing rule weights using a labeled CSV without hallucinations.

    The CSV must contain ``id``, ``weight_key``, and ``label`` columns. Each row
    targets an existing entry ``id`` in the selected ``section`` (default:
    ``principles``). The helper refuses to introduce new identifiers or weight
    keys and errors when labels are missing, ensuring the process is purely
    deterministic and offline.
    """

    payload = deepcopy(dataset)
    entries = payload.get(section)
    if not isinstance(entries, list):
        raise ValueError(f"Section '{section}' must be a list to reweight")

    index: Dict[str, MutableMapping[str, object]] = {}
    for entry in entries:
        if not isinstance(entry, MutableMapping) or not entry.get("id"):
            continue
        if str(entry["id"]) in index:
            raise ValueError(f"Duplicate id detected while indexing: {entry['id']}")
        index[str(entry["id"])] = entry

    path = Path(csv_path)
    with path.open("r", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required_columns = {id_column, weight_key_column, label_column}
        if not required_columns.issubset(reader.fieldnames or set()):
            raise ValueError(
                f"CSV must include columns: {', '.join(sorted(required_columns))}"
            )

        for line_no, row in enumerate(reader, start=2):
            identifier = (row.get(id_column) or "").strip()
            weight_key = (row.get(weight_key_column) or "").strip()
            label_raw = row.get(label_column)

            if not identifier or not weight_key:
                raise ValueError(f"Missing id or weight key at CSV line {line_no}")
            if label_raw is None or str(label_raw).strip() == "":
                raise ValueError(f"Missing label for {identifier} at line {line_no}")
            try:
                label_value = float(label_raw)
            except ValueError as exc:
                raise ValueError(
                    f"Label for {identifier} at line {line_no} must be numeric"
                ) from exc

            entry = index.get(identifier)
            if entry is None:
                raise ValueError(
                    f"CSV references unknown id {identifier}; new ids are not permitted"
                )

            weights = entry.get("weights")
            if not isinstance(weights, MutableMapping):
                raise ValueError(
                    f"Entry {identifier} does not expose a mutable 'weights' mapping"
                )

            if weight_key not in weights:
                raise ValueError(
                    f"CSV attempted to introduce new weight key '{weight_key}' for {identifier}"
                )

            old_value = float(weights.get(weight_key, 0.0))
            blended = (1 - learning_rate) * old_value + learning_rate * label_value
            new_value = _clamp(blended, 0.0, 1.0)
            if new_value != old_value:
                logger(
                    f"{identifier} weights[{weight_key}]: {old_value:.3f} -> {new_value:.3f}"
                )
            weights[weight_key] = round(new_value, 3)
            entry["weights"] = normalize_weights(dict(weights))

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
    "supervised_csv_reweight",
]
