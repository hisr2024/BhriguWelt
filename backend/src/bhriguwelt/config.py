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
        "logistic_positive_bias": 0.2,
        "logistic_negative_bias": -0.1,
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
