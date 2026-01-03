from __future__ import annotations

from pathlib import Path

import pytest

pytest.importorskip("pandas")
pytest.importorskip("sklearn")

from bhriguwelt import feedback
from bhriguwelt.ml_model import train_feedback_model


@pytest.fixture()
def isolated_feedback_db(monkeypatch, tmp_path: Path):
    monkeypatch.setenv("BHRIGU_FEEDBACK_DB", str(tmp_path / "feedback.db"))
    return tmp_path


def test_load_feedback_dataframe_exposes_inputs(isolated_feedback_db: Path):
    feedback.record_feedback(
        engine="horoscope",
        rating=5,
        seeker_name="Mina",
        notes="Resonated",
        inputs={"engine": "horoscope", "moon_element": "air"},
    )

    frame = feedback.load_feedback_dataframe()
    assert "inputs" in frame.columns
    assert frame.iloc[0]["inputs"] == {"engine": "horoscope", "moon_element": "air"}


def test_train_feedback_model_writes_artifact(isolated_feedback_db: Path):
    feedback.record_feedback(
        engine="horoscope",
        rating=5,
        seeker_name="Arjun",
        notes="Clear guidance",
        inputs={"past_life_clarity": 0.8, "weights": {"career": 0.5}},
    )
    feedback.record_feedback(
        engine="future",
        rating=2,
        seeker_name="Anita",
        notes="Too vague",
        inputs={"past_life_clarity": 0.25, "weights": {"career": 0.1}},
    )
    feedback.record_feedback(
        engine="matchmaking",
        rating=4,
        seeker_name="Kabir",
        notes="Useful",
        inputs={"venus_house": 7, "weights": {"compatibility": 0.7}},
    )
    feedback.record_feedback(
        engine="past-life",
        rating=3,
        seeker_name="Leela",
        notes="Unsure",
        inputs={"saturn_retrograde": True, "weights": {"karmic": 0.2}},
    )

    model_path = isolated_feedback_db / "feedback_model.joblib"
    summary = train_feedback_model(model_path=model_path, n_estimators=20, test_size=0)

    assert model_path.exists()
    assert summary.samples == 4
    assert summary.feature_count >= 1
    assert summary.mae >= 0.0
