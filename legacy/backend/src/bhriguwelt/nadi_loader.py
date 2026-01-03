"""Helpers for loading Nadi Jyotisha core wisdom datasets."""

from __future__ import annotations

import json
import os
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict

from .nadi_data import as_dict as _default_nadi_data


def _resolve_nadi_path() -> Path:
    env_path = os.environ.get("NADI_DATA_PATH")
    project_root = Path(__file__).resolve().parents[2]
    if env_path:
        candidate = Path(env_path).expanduser()
        if not candidate.is_absolute():
            return (project_root / candidate).resolve(strict=False)
        return candidate.resolve(strict=False)
    return (project_root / "data" / "nadi_jyotisha_principles.yml").resolve(strict=False)


_NADI_DATA_PATH = _resolve_nadi_path()


def _validate_nadi_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Nadi payload must be a dictionary")

    principles = payload.get("principles")
    if principles is None or not isinstance(principles, list) or not principles:
        raise ValueError("Nadi payload must include a non-empty 'principles' list")

    remedies = payload.get("remedies")
    if remedies is not None and not isinstance(remedies, list):
        raise ValueError("'remedies' must be a list when provided")

    observances = payload.get("observances")
    if observances is not None and not isinstance(observances, list):
        raise ValueError("'observances' must be a list when provided")

    metadata = payload.get("metadata")
    if metadata is not None and not isinstance(metadata, dict):
        raise ValueError("'metadata' must be a mapping when provided")

    return payload


def load_nadi_data(path: Path | None = None) -> Dict[str, Any]:
    resolved_path = path or _NADI_DATA_PATH

    if resolved_path.exists():
        with resolved_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
            return _validate_nadi_payload(payload)

    return _validate_nadi_payload(deepcopy(_default_nadi_data()))


def current_nadi_path() -> Path:
    return _NADI_DATA_PATH


def set_nadi_path(path: Path) -> Path:
    global _NADI_DATA_PATH

    _NADI_DATA_PATH = path
    return _NADI_DATA_PATH


__all__ = ["current_nadi_path", "load_nadi_data", "set_nadi_path"]
