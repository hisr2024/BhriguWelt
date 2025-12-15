"""Utility helpers for loading Bhrigu Samhita reference data."""

from __future__ import annotations

import hashlib
import json
import os
from copy import deepcopy
from importlib import import_module
from pathlib import Path
from typing import Any, Dict, List, Set

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


def _validate_conditions_block(conditions: Dict[str, Any] | None, context: str = "conditions") -> None:
    if conditions is None:
        return

    if not isinstance(conditions, dict):
        raise ValueError(f"{context} must provide conditions as a mapping")

    for key, requirement in conditions.items():
        if isinstance(requirement, dict):
            unsupported = set(requirement) - {"min", "max", "any_of", "equals"}
            if unsupported:
                joined = ", ".join(sorted(unsupported))
                raise ValueError(
                    f"{context} condition '{key}' uses unsupported comparators: {joined}"
                )
            any_of = requirement.get("any_of")
            if any_of is not None and not isinstance(any_of, (list, tuple, set)):
                raise ValueError(
                    f"{context} condition '{key}' must express 'any_of' as a list or set"
                )
            for bound in ("min", "max"):
                bound_value = requirement.get(bound)
                if bound_value is not None and not isinstance(bound_value, (int, float)):
                    raise ValueError(
                        f"{context} condition '{key}' must express '{bound}' as a number"
                    )
            equals_value = requirement.get("equals")
            if equals_value is not None and isinstance(equals_value, dict):
                raise ValueError(
                    f"{context} condition '{key}' must express 'equals' as a scalar, not a mapping"
                )
        elif not isinstance(requirement, (str, int, float, bool, list, tuple, set)):
            raise ValueError(
                f"{context} condition '{key}' must use scalar or collection comparators"
            )


def _validate_transit_rules(rules: List[Dict[str, Any]]) -> None:
    if not isinstance(rules, list):
        raise ValueError("'transit_rules' must be a list")

    for index, rule in enumerate(rules):
        if not isinstance(rule, dict):
            raise ValueError(f"Transit rule at index {index} must be a mapping")

        missing = [field for field in ("id", "sutra_reference", "influence") if not rule.get(field)]
        if missing:
            raise ValueError(
                f"Transit rule {rule.get('id', f'entry {index}')} is missing required fields: {', '.join(sorted(missing))}"
            )

        _validate_conditions_block(rule.get("conditions"), context=f"transit_rules[{index}]")


def _validate_matchmaking_criteria(criteria: List[Dict[str, Any]]) -> None:
    if not isinstance(criteria, list):
        raise ValueError("'matchmaking_criteria' must be a list")

    for index, criterion in enumerate(criteria):
        if not isinstance(criterion, dict):
            raise ValueError(f"Matchmaking criterion at index {index} must be a mapping")

        missing = [
            field
            for field in ("id", "sutra_reference", "description", "pair_rules")
            if not criterion.get(field)
        ]
        if missing:
            raise ValueError(
                f"Matchmaking criterion {criterion.get('id', f'entry {index}')} is missing required fields: {', '.join(sorted(missing))}"
            )

        pair_rules = criterion.get("pair_rules", [])
        if not isinstance(pair_rules, list) or not pair_rules:
            raise ValueError(
                f"Matchmaking criterion {criterion.get('id', f'entry {index}')} must include pair rules as a non-empty list"
            )

        for rule_index, pair_rule in enumerate(pair_rules):
            if not isinstance(pair_rule, dict):
                raise ValueError(
                    f"Pair rule {rule_index} for criterion {criterion.get('id', f'entry {index}')} must be a mapping"
                )
            missing_pair_fields = [
                field
                for field in ("label", "primary_field", "partner_field", "comparator")
                if not pair_rule.get(field)
            ]
            if missing_pair_fields:
                raise ValueError(
                    f"Pair rule {rule_index} for criterion {criterion.get('id', f'entry {index}')} is missing required fields: {', '.join(sorted(missing_pair_fields))}"
                )


def _validate_remedies(remedies: List[Dict[str, Any]]) -> None:
    if not isinstance(remedies, list):
        raise ValueError("'remedies' must be a list")

    for index, remedy in enumerate(remedies):
        if not isinstance(remedy, dict):
            raise ValueError(f"Remedy at index {index} must be a mapping")
        missing = [field for field in ("id", "sutra_reference", "description") if not remedy.get(field)]
        if missing:
            raise ValueError(
                f"Remedy {remedy.get('id', f'entry {index}')} is missing required fields: {', '.join(sorted(missing))}"
            )


def _validate_unique_ids(payload: Dict[str, Any], blocks: List[str]) -> None:
    seen: Set[str] = set()
    owners: Dict[str, str] = {}

    for block in blocks:
        entries = payload.get(block, [])
        if entries is None:
            continue
        if not isinstance(entries, list):
            raise ValueError(f"'{block}' must be a list to validate identifiers")

        for index, entry in enumerate(entries):
            if not isinstance(entry, dict):
                raise ValueError(f"Each entry in '{block}' must be a mapping (index {index})")
            identifier = entry.get("id")
            if not identifier:
                continue
            if identifier in seen:
                clash = owners.get(identifier, "previous block")
                raise ValueError(
                    f"Duplicate id detected across Bhrigu dataset: '{identifier}' already used in {clash}"
                )
            seen.add(identifier)
            owners[identifier] = f"{block}[{index}]"


def _validate_and_enrich(payload: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Bhrigu data payload must be a mapping")

    # --- principles
    if isinstance(payload.get("principles"), list):
        _validate_principles(payload["principles"])

    # --- core engines
    for block, required in {
        "past_life_engines": ["id", "sutra_reference", "description", "narrative"],
        "future_engines": ["id", "sutra_reference", "description", "trajectory"],
    }.items():
        engines = payload.get(block)
        if engines is None:
            raise ValueError(f"Payload must include '{block}'")
        _validate_engine_block(block, engines, required)
        for i, e in enumerate(engines):
            _validate_conditions_block(e.get("conditions"), context=f"{block}[{i}]")

    # --- transit rules
    if payload.get("transit_rules"):
        _validate_transit_rules(payload["transit_rules"])

    # --- matchmaking
    if payload.get("matchmaking_criteria"):
        _validate_matchmaking_criteria(payload["matchmaking_criteria"])

    # --- remedies
    if payload.get("remedies"):
        _validate_remedies(payload["remedies"])

    # --- unique IDs across everything
    _validate_unique_ids(
        payload,
        [
            "principles",
            "past_life_engines",
            "future_engines",
            "transit_rules",
            "matchmaking_criteria",
            "remedies",
        ],
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
