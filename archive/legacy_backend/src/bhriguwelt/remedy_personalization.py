"""ML-assisted personalization for remedy relevance using feedback signals."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Mapping, MutableMapping

from .ml_model import encode_feedback_features
from .ml_service import load_feedback_model

_MODEL = None


def _get_model():
    global _MODEL
    if _MODEL is None:
        _MODEL = load_feedback_model()
    return _MODEL


def _normalize_prediction(value: float, *, lower: float = 1.0, upper: float = 5.0) -> float:
    if upper <= lower:
        return 0.5
    normalized = (value - lower) / (upper - lower)
    return max(0.0, min(1.0, normalized))


def personalize_remedies_with_feedback(
    remedies: Iterable[Mapping[str, object]],
    *,
    engine: str,
    weights: Mapping[str, float],
    base_payload: Mapping[str, Any] | None = None,
    max_adjustment: float = 0.2,
) -> List[Dict[str, object]]:
    """Blend ML-derived affinity scores into remedy relevance ranking."""

    model = _get_model()
    if not model:
        return [dict(remedy) for remedy in remedies]

    personalized: List[Dict[str, object]] = []
    shared_inputs: Dict[str, Any] = {"weights": dict(weights)}
    if base_payload:
        shared_inputs.update(base_payload)

    for remedy in remedies:
        remedy_id = remedy.get("id")
        remedy_payload = dict(shared_inputs)
        remedy_payload["remedy_ids"] = [remedy_id] if remedy_id else []

        features = encode_feedback_features(engine, remedy_payload)
        prediction = float(model.predict([features])[0])
        ml_score = _normalize_prediction(prediction)
        adjustment = (ml_score - 0.5) * 2 * max_adjustment

        enriched: MutableMapping[str, object] = dict(remedy)
        base_relevance = float(enriched.get("relevance", 0.5))
        enriched["ml_score"] = round(ml_score, 2)
        enriched["relevance"] = round(max(0.0, min(1.0, base_relevance + adjustment)), 2)
        personalized.append(dict(enriched))

    personalized.sort(key=lambda entry: (-float(entry.get("relevance", 0.0)), str(entry.get("id", ""))))
    return personalized


__all__ = ["personalize_remedies_with_feedback"]
