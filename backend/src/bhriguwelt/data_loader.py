"""Utility helpers for loading Bhrigu Samhita reference data."""

from __future__ import annotations

from copy import deepcopy
from importlib import import_module
from pathlib import Path
from typing import Any, Dict

from .bhrigu_data import as_dict as _default_bhrigu_data

try:  # pragma: no cover - optional dependency
    yaml = import_module("yaml")
except ModuleNotFoundError:  # pragma: no cover - expected in offline envs
    yaml = None

_DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "bhrigu_samhita_principles.yml"


def load_bhrigu_data(path: Path | None = None) -> Dict[str, Any]:
    """Return the parsed Bhrigu Samhita rule set as a dictionary.

    When PyYAML is unavailable the loader falls back to the baked-in
    :mod:`bhriguwelt.bhrigu_data` corpus. Supplying ``path`` forces a JSON parse,
    which is convenient for integration tests.
    """

    if path:
        import json

        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    if yaml and _DATA_PATH.exists():
        with _DATA_PATH.open("r", encoding="utf-8") as handle:
            return yaml.safe_load(handle)

    return deepcopy(_default_bhrigu_data())
