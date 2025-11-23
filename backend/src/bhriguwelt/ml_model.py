"""Utilities for feature extraction and ML training on user feedback."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction import DictVectorizer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from .feedback import load_feedback_dataframe

_MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
_DEFAULT_MODEL_PATH = _MODEL_DIR / "feedback_rating_model.joblib"


@dataclass
class TrainingSummary:
    model_path: str
    samples: int
    feature_count: int
    mae: float
    r2: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _coerce_float(value: Any) -> float | None:
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float, np.number)):
        return float(value)
    try:
        if isinstance(value, str) and value.strip():
            return float(value)
    except ValueError:
        return None
    return None


def _encode_principle_weights(inputs: Dict[str, Any]) -> Dict[str, float]:
    features: Dict[str, float] = {}
    weights = inputs.get("weights") or inputs.get("principle_weights")
    if isinstance(weights, dict):
        for name, value in weights.items():
            coerced = _coerce_float(value)
            if coerced is not None:
                features[f"weight.{name}"] = coerced
    return features


def _encode_chart_markers(inputs: Dict[str, Any]) -> Dict[str, float]:
    features: Dict[str, float] = {}
    markers = inputs.get("chart_markers") or inputs.get("placements") or inputs.get("chart")
    if isinstance(markers, dict):
        items = markers.items()
    elif isinstance(markers, list):
        # Expected list of marker dicts like {"planet": "mars", "house": 3}
        items = []
        for marker in markers:
            if not isinstance(marker, dict):
                continue
            planet = marker.get("planet") or marker.get("name")
            house = _coerce_float(marker.get("house") or marker.get("position"))
            if planet and house is not None:
                features[f"chart.{planet}.house"] = house
        return features
    else:
        items = []

    for planet, value in items:
        coerced = _coerce_float(value)
        if coerced is not None:
            features[f"chart.{planet}"] = coerced
    return features


def _flatten_numeric_signals(inputs: Dict[str, Any]) -> Dict[str, float]:
    numeric: Dict[str, float] = {}
    for key, value in inputs.items():
        if key in {"weights", "principle_weights", "chart_markers", "placements", "chart"}:
            continue
        if isinstance(value, dict):
            for sub_key, sub_value in value.items():
                coerced = _coerce_float(sub_value)
                if coerced is not None:
                    numeric[f"{key}.{sub_key}"] = coerced
        elif isinstance(value, list):
            numeric[f"{key}.count"] = float(len(value))
        else:
            coerced = _coerce_float(value)
            if coerced is not None:
                numeric[key] = coerced
    return numeric


def encode_feedback_features(engine: str, inputs: Dict[str, Any] | None) -> Dict[str, Any]:
    payload = inputs if isinstance(inputs, dict) else {}
    features: Dict[str, Any] = {"engine": engine or payload.get("engine", "")}
    features.update(_encode_principle_weights(payload))
    features.update(_encode_chart_markers(payload))
    features.update(_flatten_numeric_signals(payload))
    return features


def _prepare_feature_rows(feedback_frame: pd.DataFrame) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for _, row in feedback_frame.iterrows():
        rows.append(encode_feedback_features(row.get("engine", ""), row.get("inputs")))
    return rows


def _split_training_data(
    features: List[Dict[str, Any]], target: Iterable[float], test_size: float, random_state: int
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[float], List[float]]:
    if len(features) < 4 or test_size <= 0:
        return features, features, list(target), list(target)

    train_rows, test_rows, train_y, test_y = train_test_split(
        features,
        list(target),
        test_size=test_size,
        random_state=random_state,
        stratify=None,
    )
    return train_rows, test_rows, train_y, test_y


def _build_pipeline(n_estimators: int, max_depth: int | None, random_state: int) -> Pipeline:
    vectorizer = DictVectorizer(sparse=True)
    model = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=random_state,
        n_jobs=-1,
    )
    return Pipeline([("vectorizer", vectorizer), ("model", model)])


def train_feedback_model(
    feedback_frame: pd.DataFrame | None = None,
    *,
    model_path: Path | None = None,
    n_estimators: int = 200,
    max_depth: int | None = None,
    test_size: float = 0.2,
    random_state: int = 42,
) -> TrainingSummary:
    """Train a regression model to predict feedback ratings from request context."""

    frame = feedback_frame if feedback_frame is not None else load_feedback_dataframe()
    if frame.empty:
        raise ValueError("Cannot train ML model without feedback entries")

    target = frame["rating"].astype(float)
    feature_rows = _prepare_feature_rows(frame)
    pipeline = _build_pipeline(n_estimators, max_depth, random_state)

    train_rows, test_rows, train_y, test_y = _split_training_data(feature_rows, target, test_size, random_state)
    pipeline.fit(train_rows, train_y)

    predictions = pipeline.predict(test_rows) if test_rows else []
    mae = float(mean_absolute_error(test_y, predictions)) if len(test_y) else 0.0
    r2 = float(r2_score(test_y, predictions)) if len(test_y) > 1 else 1.0

    destination = model_path or _DEFAULT_MODEL_PATH
    destination.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, destination)

    vectorizer: DictVectorizer = pipeline.named_steps["vectorizer"]
    feature_count = len(vectorizer.feature_names_)

    return TrainingSummary(
        model_path=str(destination),
        samples=int(len(frame)),
        feature_count=int(feature_count),
        mae=mae,
        r2=r2,
    )


def load_trained_model(model_path: Path | None = None):
    """Load a serialized feedback model if it exists."""

    path = model_path or _DEFAULT_MODEL_PATH
    if not path.exists():
        raise FileNotFoundError(f"No trained model found at {path}")
    return joblib.load(path)


__all__ = [
    "TrainingSummary",
    "encode_feedback_features",
    "train_feedback_model",
    "load_trained_model",
    "load_feedback_dataframe",
]
