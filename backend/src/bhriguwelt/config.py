"""Runtime configuration loader for scoring and interpretation knobs."""

from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Any, Dict

DEFAULT_CONFIG: Dict[str, Any] = {
    "scoring": {
        "bayesian_alpha": 1.1,
        "bayesian_beta": 1.05,
        "ml_weight_floor": 0.4,
        "max_modifier": 1.35,
        "ml_training_posteriors": [0.45, 0.62, 0.8],
        "ml_training_modifiers": [1.0, 1.15, 1.28],
        "ml_negative_jitter": 0.18,
        "logistic_max_iter": 500,
        "logistic_regularization": 1.4,
        "logistic_class_weight": "balanced",
        "logistic_solver": "liblinear",
        "logistic_positive_bias": 0.2,
        "logistic_negative_bias": -0.1,
        "benchmark_data_path": None,
        "exponential_weighting": {
            "enabled": True,
            "curve": 1.18,
            "ceiling": 0.22,
            "anchor": 0.55,
            "stability_bonus": 0.04,
        },
    },
    "conflicts": {
        "strategy": "antiquity",
        "prefer_higher_weight": True,
        "default_rank": 99,
        "antiquity_ranks": {},
    },
    "interpretation": {
        "personalized_prefix": "{name}, born in {birth_place},",
        "fallback_name": "the native",
        "fallback_birth_place": "the recorded locale",
        "gratitude_phrase": "Bhrigu folios acknowledge your lineage.",
        "remedy_prefix": "Prescribed for {name}:",
        "remedy_disclaimer": "Remedies are textual transmissions; validate with a qualified practitioner before acting.",
        "epithet_threshold": 0.62,
        "epithets": {
            "past_life_clarity": "bearing lucid ancestral memory ({score:.2f})",
            "career_command": "the chart-holder of decisive leadership ({score:.2f})",
            "wealth_activation": "guardian of dormant treasuries ({score:.2f})",
            "spiritual_detachment": "pilgrim of inner austerity ({score:.2f})",
            "matchmaking_insight": "mediator of harmonious matches ({score:.2f})",
            "resilience": "architect of patient rebuilding ({score:.2f})",
        },
    },
}

_CONFIG_PATH = Path(__file__).resolve().parents[2] / "config" / "bhriguwelt_config.yml"


def _yaml_module():
    if importlib.util.find_spec("yaml") is None:
        return None
    import yaml  # type: ignore

    return yaml


def load_runtime_config(path: Path | None = None) -> Dict[str, Any]:
    """Load YAML configuration if available, otherwise fall back to defaults."""

    yaml_module = _yaml_module()
    config_path = path or _CONFIG_PATH
    if yaml_module and config_path.exists():
        with config_path.open("r", encoding="utf-8") as handle:
            loaded = yaml_module.safe_load(handle)
            merged: Dict[str, Any] = {**DEFAULT_CONFIG, **(loaded or {})}
            merged["scoring"] = {**DEFAULT_CONFIG.get("scoring", {}), **(loaded or {}).get("scoring", {})}
            merged["conflicts"] = {**DEFAULT_CONFIG.get("conflicts", {}), **(loaded or {}).get("conflicts", {})}
            merged["interpretation"] = {**DEFAULT_CONFIG.get("interpretation", {}), **(loaded or {}).get("interpretation", {})}
            return merged

    return DEFAULT_CONFIG.copy()
