"""Shared schema fragments for the Bhrigu data platform."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Set

DATASET_SEGMENTS = (
    "principles",
    "remedies",
    "past_life_engines",
    "future_engines",
    "transit_rules",
    "matchmaking_criteria",
)

SUPPORTED_OPS: Set[str] = {"equals", "any_of", "min", "max"}

ENGINE_BLOCKS = {
    "principles": "principle",
    "past_life_engines": "past_life_engine",
    "future_engines": "future_engine",
    "transit_rules": "transit_rule",
    "matchmaking_criteria": "matchmaking_criterion",
    "remedies": "remedy",
}

REQUIRED_FIELDS = {
    "principle": ["id", "description", "sutra_reference"],
    "past_life_engine": ["id", "sutra_reference", "description", "narrative", "conditions"],
    "future_engine": ["id", "sutra_reference", "description", "trajectory", "conditions"],
    "transit_rule": ["id", "sutra_reference", "planet", "influence", "conditions"],
    "matchmaking_criterion": ["id", "sutra_reference", "description", "pair_rules"],
    "remedy": ["id", "sutra_reference", "description"],
}


@dataclass(frozen=True)
class LintIssue:
    level: str  # "ERROR" | "WARN"
    path: str
    message: str


def normalize_conditions(conditions: Dict[str, Any] | None) -> Dict[str, Dict[str, Any]]:
    """Normalize conditions into canonical {field: {op: value}} form."""
    normalized: Dict[str, Dict[str, Any]] = {}
    if not conditions:
        return normalized

    for field, raw in conditions.items():
        if isinstance(raw, dict):
            ops = {k: v for k, v in raw.items() if k in SUPPORTED_OPS}
            if not ops:
                # treat as equals dict (discourage but handle)
                normalized[field] = {"equals": raw}
            else:
                normalized[field] = ops
        elif isinstance(raw, (list, tuple, set)):
            normalized[field] = {"any_of": list(raw)}
        else:
            normalized[field] = {"equals": raw}
    return normalized


def validate_condition_ops(conditions: Dict[str, Any] | None) -> List[LintIssue]:
    issues: List[LintIssue] = []
    if not conditions:
        return issues
    if not isinstance(conditions, dict):
        return [LintIssue("ERROR", "conditions", "conditions must be a mapping")]
    for field, raw in conditions.items():
        if isinstance(raw, dict):
            unknown = [k for k in raw.keys() if k not in SUPPORTED_OPS]
            if unknown:
                issues.append(LintIssue("ERROR", f"conditions.{field}", f"unknown operators: {unknown}"))
        elif isinstance(raw, (list, tuple, set)):
            # ok
            pass
        else:
            # ok
            pass
    return issues


def validate_required_fields(block_name: str, entries: Any) -> List[LintIssue]:
    issues: List[LintIssue] = []
    kind = ENGINE_BLOCKS.get(block_name)
    if not kind:
        return issues

    if entries is None:
        issues.append(LintIssue("ERROR", block_name, "missing block"))
        return issues

    if not isinstance(entries, list) or not entries:
        issues.append(LintIssue("ERROR", block_name, "must be a non-empty list"))
        return issues

    required = REQUIRED_FIELDS[kind]
    for idx, e in enumerate(entries):
        if not isinstance(e, dict):
            issues.append(LintIssue("ERROR", f"{block_name}[{idx}]", "entry must be a mapping"))
            continue
        for field in required:
            if field not in e or e.get(field) in (None, "", [], {}):
                issues.append(LintIssue("ERROR", f"{block_name}[{idx}].{field}", "missing required field"))
    return issues


def validate_unique_ids(dataset: Dict[str, Any]) -> List[LintIssue]:
    issues: List[LintIssue] = []
    seen: Dict[str, str] = {}
    for block in ENGINE_BLOCKS.keys():
        entries = dataset.get(block) or []
        if not isinstance(entries, list):
            continue
        for idx, e in enumerate(entries):
            if not isinstance(e, dict):
                continue
            _id = e.get("id")
            if not _id:
                continue
            if _id in seen:
                issues.append(
                    LintIssue("ERROR", f"{block}[{idx}].id", f"duplicate id '{_id}' also in {seen[_id]}")
                )
            else:
                seen[_id] = f"{block}[{idx}]"
    return issues
