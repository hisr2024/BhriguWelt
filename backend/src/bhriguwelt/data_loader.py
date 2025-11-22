"""Utility helpers for loading Bhrigu Samhita reference data."""

from __future__ import annotations

import os
from copy import deepcopy
from importlib import import_module
from pathlib import Path
from typing import Any, Dict

from .bhrigu_data import as_dict as _default_bhrigu_data

try:  # pragma: no cover - optional dependency
    yaml = import_module("yaml")
except ModuleNotFoundError:  # pragma: no cover - expected in offline envs
    yaml = None

_DATA_PATH = Path(
    os.environ.get(
        "BHRIGUWELT_DATA_PATH",
        Path(__file__).resolve().parents[2] / "data" / "bhrigu_samhita_principles.yml",
    )
)


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


def persist_bhrigu_data(payload: Dict[str, Any], path: Path | None = None) -> Dict[str, Any]:
    """Persist the Bhrigu Samhita corpus to disk for offline updates.

    The payload must contain a ``principles`` list and an optional ``metadata``
    mapping. Data is serialized to the configured ``BHRIGUWELT_DATA_PATH``
    (or an overridden ``path``) using YAML when available, with a JSON
    fallback for environments without PyYAML.
    """

    if not isinstance(payload, dict):
        raise ValueError("Payload must be a dictionary")

    principles = payload.get("principles")
    if not isinstance(principles, list) or not principles:
        raise ValueError("Payload must include a non-empty 'principles' list")

    metadata = payload.get("metadata", {})
    if metadata and not isinstance(metadata, dict):
        raise ValueError("'metadata' must be a mapping when provided")

    target_path = path or _DATA_PATH
    target_path.parent.mkdir(parents=True, exist_ok=True)

    if yaml:
        with target_path.open("w", encoding="utf-8") as handle:
            yaml.safe_dump(payload, handle, allow_unicode=True, sort_keys=False)
    else:
        import json

        with target_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)

    return payload


def current_data_path() -> Path:
    return _DATA_PATH


def set_data_path(path: Path) -> Path:
    global _DATA_PATH

    _DATA_PATH = path
    return _DATA_PATH
