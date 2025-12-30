"""Utilities for feature extraction and ML training on user feedback."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from tempfile import TemporaryDirectory
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

logger = logging.getLogger(__name__)

_MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
_DEFAULT_MODEL_PATH = _MODEL_DIR / "feedback_promoter_model.joblib"
_DEFAULT_METADATA_PATH = _MODEL_DIR / "feedback_promoter_model.json"


class TrainingSummary(dict):
    def __init__(self, payload: Dict[str, Any]):
        super().__init__(payload)

    def __getattr__(self, item: str):  # pragma: no cover - passthrough to dict
        try:
            return self[item]
        except KeyError as exc:  # pragma: no cover - mirror dict behavior
            raise AttributeError(item) from exc


def _coerce_float(value: Any) -> float | None:
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return None
    return None


def _extract_numeric_inputs(inputs: Dict[str, Any] | None) -> Dict[str, float]:
    numeric: Dict[str, float] = {}
    if not inputs:
        return numeric

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


def _encode_principle_weights(payload: Dict[str, Any]) -> Dict[str, float]:
    weights = payload.get("weights") or payload.get("principle_weights") or {}
    encoded: Dict[str, float] = {}
    for key, value in weights.items():
        coerced = _coerce_float(value)
        if coerced is not None:
            encoded[f"weight.{key}"] = coerced
    return encoded


def _encode_chart_markers(payload: Dict[str, Any]) -> Dict[str, float]:
    encoded: Dict[str, float] = {}
    for marker in payload.get("chart_markers", []) or []:
        planet = marker.get("planet")
        house = _coerce_float(marker.get("house"))
        if planet and house is not None:
            encoded[f"chart.{planet}.house"] = house
    return encoded


def _encode_remedy_signals(payload: Dict[str, Any]) -> Dict[str, float]:
    encoded: Dict[str, float] = {}
    remedies = payload.get("remedies") or payload.get("remedy_ids") or payload.get("remedy_id")
    if isinstance(remedies, list):
        items = remedies
    elif remedies:
        items = [remedies]
    else:
        items = []
    for item in items:
        if isinstance(item, dict):
            remedy_id = item.get("id") or item.get("remedy_id") or item.get("code")
        else:
            remedy_id = item
        if remedy_id:
            encoded[f"remedy.{remedy_id}"] = 1.0
    return encoded


def _flatten_numeric_signals(payload: Dict[str, Any]) -> Dict[str, float]:
    flattened = _extract_numeric_inputs(payload)
    return flattened


def encode_feedback_features(engine: str, inputs: Dict[str, Any] | None) -> Dict[str, Any]:
    payload = inputs if isinstance(inputs, dict) else {}
    features: Dict[str, Any] = {"engine": engine or payload.get("engine", "")}
    features.update(_encode_principle_weights(payload))
    features.update(_encode_chart_markers(payload))
    features.update(_encode_remedy_signals(payload))
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
    metadata_path: Path | None = None,
    limit: int | None = None,
    n_estimators: int = 50,
    max_depth: int | None = None,
    random_state: int = 42,
    test_size: float = 0.2,
) -> TrainingSummary:
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

    target = frame["rating"].astype(float)
    feature_rows = _prepare_feature_rows(frame)
    pipeline = _build_pipeline(n_estimators, max_depth, random_state)

    train_rows, test_rows, train_y, test_y = _split_training_data(feature_rows, target, test_size, random_state)
    pipeline.fit(train_rows, train_y)

    predictions = pipeline.predict(test_rows) if len(test_rows) else []
    mae = float(mean_absolute_error(test_y, predictions)) if len(test_y) else 0.0
    r2 = float(r2_score(test_y, predictions)) if len(test_y) > 1 else 1.0
    accuracy = float(pipeline.score(train_rows, train_y)) if len(train_rows) else 0.0

    destination = model_path or _DEFAULT_MODEL_PATH
    metadata_destination = metadata_path or destination.with_suffix(".json")

    previous_metadata = load_model_metadata(metadata_destination)
    previous_features = set(previous_metadata.get("feature_names", []))
    feature_names = list(pipeline.named_steps["vectorizer"].get_feature_names_out())
    new_features = sorted(set(feature_names) - previous_features)
    dropped_features = sorted(previous_features - set(feature_names))

    metadata = TrainingSummary(
        {
            "model_path": str(destination),
            "metadata_path": str(metadata_destination),
            "samples": int(len(frame)),
            "feature_count": len(feature_names),
            "promoter_rate": float(target.mean()),
            "accuracy": accuracy,
            "mae": mae,
            "r2": r2,
            "trained_at": datetime.utcnow().isoformat() + "Z",
            "feature_names": feature_names,
            "new_feature_count": len(new_features),
            "dropped_feature_count": len(dropped_features),
        }
    )

    _atomic_store_artifacts(pipeline, dict(metadata), destination, metadata_destination)
    logger.info(
        "Trained feedback model",
        extra={
            "accuracy": metadata.get("accuracy"),
            "samples": metadata.get("samples"),
            "new_features": metadata.get("new_feature_count"),
            "dropped_features": metadata.get("dropped_feature_count"),
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
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix="ml_artifacts_", dir=model_path.parent) as tmp_dir:
        tmp_model = Path(tmp_dir) / model_path.name
        tmp_metadata = Path(tmp_dir) / metadata_path.name
        joblib.dump(model, tmp_model)
        tmp_metadata.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        tmp_model.replace(model_path)
        tmp_metadata.replace(metadata_path)


__all__ = [
    "TrainingSummary",
    "encode_feedback_features",
    "train_feedback_model",
    "load_trained_model",
    "load_model_metadata",
    "load_model_artifacts",
    "load_feedback_dataframe",
]
