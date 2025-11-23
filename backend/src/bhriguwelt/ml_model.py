"""Lightweight utilities for training ML refinements from user feedback."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, Dict, Tuple

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .feedback import load_feedback_dataframe

logger = logging.getLogger(__name__)

_MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
_DEFAULT_MODEL_PATH = _MODEL_DIR / "feedback_promoter_model.joblib"
_DEFAULT_METADATA_PATH = _MODEL_DIR / "feedback_promoter_model.json"


def _extract_numeric_inputs(inputs: Dict[str, Any] | None) -> Dict[str, float]:
    numeric: Dict[str, float] = {}
    if not inputs:
        return numeric

    for key, value in inputs.items():
        if isinstance(value, bool):
            numeric[key] = 1.0 if value else 0.0
        elif isinstance(value, (int, float)):
            numeric[key] = float(value)
        elif isinstance(value, dict):
            for sub_key, sub_value in value.items():
                if isinstance(sub_value, bool):
                    numeric[f"{key}.{sub_key}"] = 1.0 if sub_value else 0.0
                elif isinstance(sub_value, (int, float)):
                    numeric[f"{key}.{sub_key}"] = float(sub_value)
    return numeric


def _feature_frame(feedback_frame: pd.DataFrame) -> pd.DataFrame:
    feature_rows: list[Dict[str, float]] = []
    for inputs in feedback_frame.get("inputs", []):
        feature_rows.append(_extract_numeric_inputs(inputs))

    base_features = pd.DataFrame(feature_rows)
    engine_dummies = pd.get_dummies(feedback_frame["engine"], prefix="engine", dtype=float)

    if base_features.empty:
        base_features["bias"] = 1.0

    combined = pd.concat([engine_dummies.reset_index(drop=True), base_features.reset_index(drop=True)], axis=1)
    return combined.fillna(0.0)


def _split_training_data(
    features: pd.DataFrame, target: pd.Series
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    if len(features) < 4:
        return features, target, features, target

    return train_test_split(
        features,
        target,
        test_size=0.25,
        random_state=42,
        stratify=target if target.nunique() > 1 else None,
    )


def train_feedback_model(
    feedback_frame: pd.DataFrame | None = None,
    *,
    model_path: Path | None = None,
    metadata_path: Path | None = None,
    limit: int | None = None,
) -> Dict[str, Any]:
    """Train a simple classifier that predicts promoter feedback (4-5 ratings).

    Parameters
    ----------
    feedback_frame:
        Optional DataFrame to train on. If omitted, feedback is loaded from the
        persistent SQLite database.
    model_path:
        Optional destination for the serialized model. Defaults to
        ``backend/models/feedback_promoter_model.joblib``.
    metadata_path:
        Optional destination for the training metadata. Defaults to a JSON
        manifest co-located with the serialized model.
    limit:
        Optional cap on the amount of feedback to train on, ordered by recency.
    """

    frame = feedback_frame if feedback_frame is not None else load_feedback_dataframe(limit=limit)
    if frame.empty:
        raise ValueError("Cannot train ML model without feedback entries")

    target = (frame["rating"] >= 4).astype(int)
    if target.nunique() < 2:
        raise ValueError("Training requires both positive and negative feedback ratings")

    features = _feature_frame(frame)

    pipeline = Pipeline(
        [
            ("scale", StandardScaler(with_mean=False)),
            (
                "model",
                LogisticRegression(
                    max_iter=500,
                    class_weight="balanced",
                    solver="liblinear",
                ),
            ),
        ]
    )

    train_x, test_x, train_y, test_y = _split_training_data(features, target)
    pipeline.fit(train_x, train_y)
    score = pipeline.score(test_x, test_y)

    destination = model_path or _DEFAULT_MODEL_PATH
    metadata_destination = metadata_path or _DEFAULT_METADATA_PATH

    previous_metadata = load_model_metadata(metadata_destination)
    previous_features = set(previous_metadata.get("feature_names", []))
    feature_names = list(features.columns)
    new_features = sorted(set(feature_names) - previous_features)
    dropped_features = sorted(previous_features - set(feature_names))

    metadata = {
        "model_path": str(destination),
        "metadata_path": str(metadata_destination),
        "samples": int(len(frame)),
        "feature_count": int(features.shape[1]),
        "promoter_rate": float(target.mean()),
        "accuracy": float(score),
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "feature_names": feature_names,
        "new_feature_count": len(new_features),
        "dropped_feature_count": len(dropped_features),
    }

    _atomic_store_artifacts(pipeline, metadata, destination, metadata_destination)
    logger.info(
        "Trained feedback model",
        extra={
            "accuracy": metadata["accuracy"],
            "samples": metadata["samples"],
            "new_features": metadata["new_feature_count"],
            "dropped_features": metadata["dropped_feature_count"],
        },
    )

    return metadata


def load_trained_model(model_path: Path | None = None):
    """Load a serialized feedback model if it exists."""

    path = model_path or _DEFAULT_MODEL_PATH
    if not path.exists():
        raise FileNotFoundError(f"No trained model found at {path}")
    return joblib.load(path)


def load_model_metadata(metadata_path: Path | None = None) -> Dict[str, Any]:
    """Load JSON metadata associated with the trained model if present."""

    path = metadata_path or _DEFAULT_METADATA_PATH
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_model_artifacts(
    model_path: Path | None = None, metadata_path: Path | None = None
) -> Tuple[Any, Dict[str, Any]]:
    """Load the trained model alongside its metadata."""

    model = load_trained_model(model_path=model_path)
    metadata = load_model_metadata(metadata_path=metadata_path)
    return model, metadata


def _atomic_store_artifacts(
    model: Any, metadata: Dict[str, Any], model_path: Path, metadata_path: Path
) -> None:
    model_path.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix="ml_artifacts_", dir=model_path.parent) as tmp_dir:
        tmp_model = Path(tmp_dir) / model_path.name
        tmp_metadata = Path(tmp_dir) / metadata_path.name
        joblib.dump(model, tmp_model)
        tmp_metadata.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        tmp_model.replace(model_path)
        tmp_metadata.replace(metadata_path)


__all__ = [
    "train_feedback_model",
    "load_trained_model",
    "load_model_metadata",
    "load_model_artifacts",
    "load_feedback_dataframe",
]
