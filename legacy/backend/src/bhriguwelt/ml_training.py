"""Utility helpers for fitting ML weighting coefficients from benchmark charts."""

from __future__ import annotations

import json
from typing import Any, Dict

from .calculations import LogisticRegression, _train_fallback_model, _training_matrix
from .config import load_runtime_config


def train_ml_weighting(scoring_config: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Fit a logistic model on curated benchmark charts.

    The function prefers scikit-learn's :class:`LogisticRegression` when it is
    available, falling back to the deterministic lightweight trainer when
    numerical dependencies are absent. The returned dictionary is structured so
    it can be dropped directly into ``ml_trained_parameters`` inside
    ``bhriguwelt.config``.
    """

    runtime_config = scoring_config or load_runtime_config().get("scoring", {})
    baseline_intercept = None
    if isinstance(runtime_config, dict):
        trained = runtime_config.get("ml_trained_parameters") or {}
        baseline_intercept = trained.get("intercept")
    features, labels = _training_matrix(runtime_config)
    trainer = "fallback"
    coefficients = []
    intercept = 0.0

    if LogisticRegression is not None:
        try:
            model = LogisticRegression(
                class_weight=runtime_config.get("logistic_class_weight", "balanced"),
                max_iter=int(runtime_config.get("logistic_max_iter", 500)),
                C=float(runtime_config.get("logistic_regularization", 1.4)),
                solver=str(runtime_config.get("logistic_solver", "liblinear")),
            )
            model.fit(features, labels)
            coefficients = model.coef_[0].tolist()
            intercept = float(model.intercept_[0])
            trainer = "sklearn"
        except Exception:  # pragma: no cover - deterministic fallback takes over
            coefficients = []

    if not coefficients:
        fallback = _train_fallback_model(features, labels, runtime_config)
        coefficients = fallback.weights
        intercept = fallback.intercept

    if baseline_intercept is not None:
        intercept = max(float(baseline_intercept), intercept)

    return {
        "coefficients": [round(float(weight), 6) for weight in coefficients],
        "intercept": round(float(intercept), 6),
        "trainer": trainer,
        "samples": len(features),
    }


def main() -> None:  # pragma: no cover - developer utility
    params = train_ml_weighting()
    print(json.dumps(params, indent=2))


if __name__ == "__main__":  # pragma: no cover - developer utility
    main()
