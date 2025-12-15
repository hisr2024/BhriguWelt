"""Utility helpers for loading Bhrigu Samhita reference data."""

from __future__ import annotations

import hashlib
import json
import os
from copy import deepcopy
from importlib import import_module
from pathlib import Path
from typing import Any, Dict, List

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
_DEFAULT_DATASET = _default_bhrigu_data()
_EXPECTED_PRINCIPLE_CHECKSUMS = {
    principle.get("id"): principle.get("integrity", {}).get("checksum")
    for principle in _DEFAULT_DATASET.get("principles", [])
    if isinstance(principle, dict) and principle.get("id")
}


def _compute_principle_checksum(principle: Dict[str, Any]) -> str:
    material = {key: value for key, value in principle.items() if key != "integrity"}
    canonical = json.dumps(material, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _validate_principles(principles: List[Dict[str, Any]]) -> None:
    ids = set()
    for principle in principles:
        if not isinstance(principle, dict):
            raise ValueError("Each principle must be a mapping")

        identifier = principle.get("id")
        if not identifier:
            raise ValueError("Each principle requires an 'id'")
        if identifier in ids:
            raise ValueError(f"Duplicate principle id detected: {identifier}")
        ids.add(identifier)

        integrity = principle.setdefault("integrity", {})
        if integrity and not isinstance(integrity, dict):
            raise ValueError(f"Integrity block for {identifier} must be a mapping")

        panchang_context = principle.get("panchang_context")
        if panchang_context and not isinstance(panchang_context, dict):
            raise ValueError(f"Panchang context for {identifier} must be a mapping")

        checksum = _compute_principle_checksum(principle)
        expected_checksum = _EXPECTED_PRINCIPLE_CHECKSUMS.get(identifier)
        if expected_checksum and checksum != expected_checksum:
            raise ValueError(
                f"Checksum mismatch for {identifier}: expected {expected_checksum}"
            )

        recorded_checksum = integrity.get("checksum")
        if recorded_checksum and recorded_checksum != checksum:
            raise ValueError(f"Checksum mismatch for {identifier}: expected {checksum}")

        integrity.setdefault("sources", [])
        integrity["checksum"] = checksum


def _validate_engine_block(name: str, entries: List[Dict[str, Any]], required_fields: List[str]) -> None:
    if not isinstance(entries, list) or not entries:
        raise ValueError(
            f"'{name}' must be a non-empty list to keep the engine aligned with the Bhrigu Samhita folios"
        )

    for index, engine in enumerate(entries):
        if not isinstance(engine, dict):
            raise ValueError(f"Each entry in '{name}' must be a mapping (index {index})")

        missing = [field for field in required_fields if not engine.get(field)]
        if missing:
            identifier = engine.get("id", f"entry {index}")
            joined_missing = ", ".join(sorted(missing))
            raise ValueError(
                f"{name} entry '{identifier}' is missing required manuscript fields: {joined_missing}"
            )


def _validate_and_enrich(payload: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Bhrigu data payload must be a mapping")

    principles = payload.get("principles")
    if isinstance(principles, list):
        _validate_principles(principles)

    past_life_engines = payload.get("past_life_engines")
    if past_life_engines is None:
        raise ValueError("Payload must include 'past_life_engines' aligned to Bhrigu narratives")
    _validate_engine_block(
        "past_life_engines",
        past_life_engines,
        ["id", "sutra_reference", "description", "narrative"],
    )

    future_engines = payload.get("future_engines")
    if future_engines is None:
        raise ValueError("Payload must include 'future_engines' aligned to Bhrigu directives")
    _validate_engine_block(
        "future_engines",
        future_engines,
        ["id", "sutra_reference", "description", "trajectory"],
    )

    transit_rules = payload.get("transit_rules")
    if transit_rules is None:
        raise ValueError("Payload must include 'transit_rules' aligned to Bhrigu transit sutras")
    _validate_engine_block("transit_rules", transit_rules, ["id", "sutra_reference", "influence"])

    matchmaking_criteria = payload.get("matchmaking_criteria")
    if matchmaking_criteria is None:
        raise ValueError(
            "Payload must include 'matchmaking_criteria' aligned to Bhrigu compatibility sutras"
        )
    _validate_engine_block(
        "matchmaking_criteria",
        matchmaking_criteria,
        ["id", "sutra_reference", "pair_rules"],
    )

    return payload


def load_bhrigu_data(path: Path | None = None) -> Dict[str, Any]:
    """Return the parsed Bhrigu Samhita rule set as a dictionary.

    When PyYAML is unavailable the loader falls back to the baked-in
    :mod:`bhriguwelt.bhrigu_data` corpus. Supplying ``path`` forces a JSON parse,
    which is convenient for integration tests.
    """

    if path:
        with path.open("r", encoding="utf-8") as handle:
            return _validate_and_enrich(json.load(handle))

    if yaml and _DATA_PATH.exists():
        try:
            with _DATA_PATH.open("r", encoding="utf-8") as handle:
                return _validate_and_enrich(yaml.safe_load(handle))
        except Exception:  # pragma: no cover - defensive fallback
            pass

    if _DATA_PATH.exists():
        try:
            with _DATA_PATH.open("r", encoding="utf-8") as handle:
                return _validate_and_enrich(json.load(handle))
        except Exception:  # pragma: no cover - defensive fallback
            pass

    return _validate_and_enrich(deepcopy(_DEFAULT_DATASET))


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

    _validate_principles(principles)

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
