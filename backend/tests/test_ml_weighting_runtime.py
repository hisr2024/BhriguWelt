import json

import pytest

from bhriguwelt.calculations import (
    CelestialSnapshot,
    _bayesian_weight,
    _benchmark_path,
    _feature_vector_from_snapshot,
    _logistic_model,
    _ml_weight_score,
    score_principles,
)


def _snapshot(**overrides) -> CelestialSnapshot:
    base = dict(
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Ayodhya",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return CelestialSnapshot.from_strings(**base)


def _runtime_config(**scoring_overrides):
    scoring = {
        "bayesian_alpha": 1.0,
        "bayesian_beta": 1.0,
        "ml_weight_floor": 0.4,
        "max_modifier": 1.1,
        "benchmark_data_path": _benchmark_path({}),
    }
    scoring.update(scoring_overrides)
    return {
        "scoring": scoring,
        "conflicts": {
            "strategy": "antiquity",
            "prefer_higher_weight": True,
            "default_rank": 99,
            "antiquity_ranks": {},
        },
        "interpretation": {},
    }


@pytest.fixture
def principle():
    return [{"id": "BR-ML", "weights": {"insight": 0.5}, "tradition": "universal"}]


def test_persisted_model_lifts_weights_when_enabled(tmp_path, monkeypatch, principle):
    artifact = tmp_path / "ml_model.json"
    artifact.write_text(json.dumps({"coefficients": [0.0] * 12, "intercept": 3.0}))

    snapshot = _snapshot()
    runtime_config = _runtime_config(ml_enabled=True, ml_model_path=str(artifact))

    monkeypatch.setenv("BHRIGU_ML_ENABLED", "1")
    enabled_scores = score_principles(snapshot, principle, runtime_config)
    monkeypatch.delenv("BHRIGU_ML_ENABLED", raising=False)

    legacy_config = _runtime_config(ml_enabled=False, ml_model_path=str(artifact))
    legacy_scores = score_principles(snapshot, principle, legacy_config)

    assert enabled_scores["insight"] > legacy_scores["insight"]


def test_ml_disabled_matches_legacy_path(tmp_path, principle):
    artifact = tmp_path / "ml_model.json"
    artifact.write_text(json.dumps({"coefficients": [0.0] * 12, "intercept": 1.5}))

    snapshot = _snapshot()
    runtime_config = _runtime_config(ml_enabled=False, ml_model_path=str(artifact), max_modifier=1.0)

    scores = score_principles(snapshot, principle, runtime_config)

    model = _logistic_model(runtime_config["scoring"])
    posterior = _bayesian_weight(0.5, runtime_config["scoring"]["bayesian_alpha"], runtime_config["scoring"]["bayesian_beta"])
    features = _feature_vector_from_snapshot(snapshot, posterior, 1.0, {})
    ml_score = _ml_weight_score(model, features)
    expected = round(min(1.0, ((posterior + ml_score) / 2) * 1.0), 2)

    assert scores["insight"] == expected
