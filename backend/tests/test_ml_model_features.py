from __future__ import annotations

from pathlib import Path

import pytest

pytest.importorskip("pandas")
pytest.importorskip("sklearn")

import pandas as pd

from bhriguwelt.ml_model import encode_feedback_features, load_trained_model, train_feedback_model


def test_encode_feedback_features_includes_markers_and_weights():
    inputs = {
        "chart_markers": [
            {"planet": "sun", "house": 1},
            {"planet": "mars", "house": 3},
        ],
        "weights": {"career": 0.7, "health": "0.5"},
        "retrograde": True,
    }

    features = encode_feedback_features("horoscope", inputs)

    assert features["engine"] == "horoscope"
    assert features["chart.sun.house"] == 1
    assert features["chart.mars.house"] == 3
    assert features["weight.career"] == 0.7
    assert features["weight.health"] == 0.5
    assert features["retrograde"] == 1.0


def test_trained_model_supports_prediction(tmp_path: Path):
    frame = pd.DataFrame(
        [
            {
                "engine": "horoscope",
                "rating": 5,
                "inputs": {"chart_markers": [{"planet": "sun", "house": 1}], "weights": {"career": 0.9}},
            },
            {
                "engine": "future",
                "rating": 2,
                "inputs": {"placements": {"saturn": 7}, "weights": {"health": 0.3}},
            },
            {
                "engine": "matchmaking",
                "rating": 4,
                "inputs": {"chart": {"venus": 5}, "weights": {"compatibility": 0.8}},
            },
        ]
    )

    model_path = tmp_path / "feedback_model.joblib"
    summary = train_feedback_model(frame, model_path=model_path, n_estimators=10, test_size=0)
    assert summary.samples == 3

    model = load_trained_model(model_path)
    payload = encode_feedback_features("horoscope", {"weights": {"career": 0.6}, "chart_markers": [{"planet": "sun", "house": 2}]})
    prediction = model.predict([payload])[0]

    assert 1.0 <= prediction <= 5.0
