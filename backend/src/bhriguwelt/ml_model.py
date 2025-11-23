"""Lightweight utilities for training ML refinements from user feedback."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .feedback import load_feedback_dataframe

_MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
_DEFAULT_MODEL_PATH = _MODEL_DIR / "feedback_promoter_model.joblib"


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
    """

    frame = feedback_frame if feedback_frame is not None else load_feedback_dataframe()
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
    destination.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, destination)

    return {
        "model_path": str(destination),
        "samples": int(len(frame)),
        "feature_count": int(features.shape[1]),
        "promoter_rate": float(target.mean()),
        "accuracy": float(score),
    }


def load_trained_model(model_path: Path | None = None):
    """Load a serialized feedback model if it exists."""

    path = model_path or _DEFAULT_MODEL_PATH
    if not path.exists():
        raise FileNotFoundError(f"No trained model found at {path}")
    return joblib.load(path)


__all__ = [
    "train_feedback_model",
    "load_trained_model",
    "load_feedback_dataframe",
]
