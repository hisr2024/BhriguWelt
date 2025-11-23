"""Lifecycle helpers for training and loading ML artifacts with telemetry."""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from .ml_model import load_model_artifacts, load_model_metadata, train_feedback_model
from .telemetry import capture_exception

logger = logging.getLogger(__name__)

_STATE: Dict[str, Any] = {
    "last_retrain": None,
    "last_retrain_error": None,
    "last_load": None,
    "last_load_error": None,
}


def retrain_feedback_model(limit: Optional[int] = None) -> Dict[str, Any]:
    """Trigger feedback-based model retraining and record telemetry."""

    try:
        metrics = train_feedback_model(limit=limit)
    except Exception as exc:  # pragma: no cover - defensive for service calls
        _STATE["last_retrain_error"] = str(exc)
        capture_exception(exc, {"phase": "retrain"})
        logger.exception("Feedback model retraining failed")
        raise

    _STATE["last_retrain"] = metrics
    _STATE["last_retrain_error"] = None
    logger.info(
        "Feedback model retraining completed",
        extra={
            "accuracy": metrics.get("accuracy"),
            "samples": metrics.get("samples"),
            "feature_drift": {
                "new": metrics.get("new_feature_count"),
                "dropped": metrics.get("dropped_feature_count"),
            },
        },
    )
    return metrics


def record_model_load(model_path=None, metadata_path=None) -> None:
    """Log metrics present in persisted metadata to surface load-time issues."""

    try:
        metadata = load_model_metadata(metadata_path=metadata_path)
        if not metadata:
            raise FileNotFoundError("No model metadata found")
        _STATE["last_load"] = metadata
        _STATE["last_load_error"] = None
        logger.info(
            "Loaded feedback model metadata",
            extra={
                "accuracy": metadata.get("accuracy"),
                "samples": metadata.get("samples"),
                "feature_count": metadata.get("feature_count"),
            },
        )
    except Exception as exc:  # pragma: no cover - defensive for startup
        _STATE["last_load_error"] = str(exc)
        capture_exception(exc, {"phase": "load"})
        logger.warning("Unable to load feedback model metadata: %s", exc)


def load_feedback_model(model_path=None, metadata_path=None):
    """Load the trained model and report telemetry-friendly status."""

    try:
        model, metadata = load_model_artifacts(model_path=model_path, metadata_path=metadata_path)
        _STATE["last_load"] = metadata or {}
        _STATE["last_load_error"] = None
        logger.info(
            "Feedback model loaded",
            extra={
                "accuracy": metadata.get("accuracy"),
                "samples": metadata.get("samples"),
                "feature_count": metadata.get("feature_count"),
            },
        )
        return model
    except Exception as exc:  # pragma: no cover - defensive for runtime
        _STATE["last_load_error"] = str(exc)
        capture_exception(exc, {"phase": "load"})
        logger.warning("Unable to load feedback model: %s", exc)
        return None


def get_ml_health() -> Dict[str, Any]:
    """Expose the latest ML lifecycle events for health endpoints."""

    return {
        "last_retrain": _STATE.get("last_retrain"),
        "last_retrain_error": _STATE.get("last_retrain_error"),
        "last_load": _STATE.get("last_load"),
        "last_load_error": _STATE.get("last_load_error"),
    }


__all__ = ["retrain_feedback_model", "record_model_load", "load_feedback_model", "get_ml_health"]
