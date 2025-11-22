from __future__ import annotations

import importlib.util
import sys
from datetime import datetime
from pathlib import Path

import pytest


def _load_feedback_module(tmp_path: Path):
    spec = importlib.util.spec_from_file_location(
        "bhriguwelt.feedback", Path(__file__).resolve().parents[1] / "src" / "bhriguwelt" / "feedback.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


@pytest.fixture()
def feedback(monkeypatch, tmp_path):
    monkeypatch.setenv("BHRIGU_FEEDBACK_DB", str(tmp_path / "feedback.db"))
    return _load_feedback_module(tmp_path)


def test_record_feedback_persists_rating(feedback):
    entry = feedback.record_feedback(engine="horoscope", rating=5, seeker_name="Asha", notes="Beautifully precise")
    assert entry.id == 1
    assert entry.engine == "horoscope"
    assert entry.notes == "Beautifully precise"


def test_quarterly_reviews_roll_up_counts(feedback):
    feedback.record_feedback(engine="horoscope", rating=4, created_at=datetime(2024, 4, 5), notes="Gentle guidance")
    feedback.record_feedback(engine="future", rating=5, created_at=datetime(2024, 5, 15))
    feedback.record_feedback(engine="matchmaking", rating=3, created_at=datetime(2023, 12, 12))

    summary = feedback.quarterly_reviews()
    labels = [item["label"] for item in summary]
    assert "2024 Q2" in labels
    q2 = next(item for item in summary if item["label"] == "2024 Q2")
    assert q2["submissions"] == 2
    assert q2["average_rating"] == 4.5
    assert q2["recent_notes"][0]["notes"] == "Gentle guidance"

    assert "2023 Q4" in labels
    q4 = next(item for item in summary if item["label"] == "2023 Q4")
    assert q4["submissions"] == 1
