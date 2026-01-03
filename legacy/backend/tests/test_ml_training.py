from bhriguwelt.calculations import _benchmark_path, _logistic_model
from bhriguwelt.ml_training import train_ml_weighting


def test_benchmark_path_defaults_to_backend_fixture():
    path = _benchmark_path({})
    assert path.exists()
    assert "backend/tests/data/benchmark_charts.json" in str(path)


def test_training_returns_parameters():
    params = train_ml_weighting()
    assert params["samples"] > 0
    assert len(params["coefficients"]) == 12


def test_logistic_model_can_use_pretrained_parameters():
    scoring_config = {
        "ml_trained_parameters": {"coefficients": [0.0] * 12, "intercept": 2.0},
        "benchmark_data_path": _benchmark_path({}),
    }
    model = _logistic_model(scoring_config)
    probability = model.predict_proba([[0.0] * 12])[0][1]
    assert probability > 0.85
