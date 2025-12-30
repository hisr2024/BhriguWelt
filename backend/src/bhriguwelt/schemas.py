"""Shared schema fragments and lint helpers for the Bhrigu data platform."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Set

from .data_loader import _compute_principle_checksum
from .taxonomy import FUTURE_PREFIX, FUTURE_RANGE, PAST_LIFE_PREFIX, PAST_LIFE_RANGE, expected_ids

DATASET_SEGMENTS = (
    "principles",
    "remedies",
    "past_life_engines",
    "future_engines",
    "transit_rules",
    "matchmaking_criteria",
)

SUPPORTED_OPS = {"equals", "min", "max", "any_of"}

ENGINE_BLOCKS: Mapping[str, List[str]] = {
    "principles": ["id", "description", "sutra_reference"],
    "past_life_engines": ["id", "sutra_reference", "description", "narrative"],
    "future_engines": ["id", "sutra_reference", "description", "trajectory"],
    "transit_rules": ["id", "sutra_reference", "influence"],
    "matchmaking_criteria": ["id", "sutra_reference", "pair_rules"],
    "remedies": ["id", "sutra_reference", "description"],
}


@dataclass(frozen=True)
class LintIssue:
    """Structured lint finding."""

    level: str
    path: str
    message: str


def validate_condition_ops(conditions: object, context: str = "conditions") -> List[LintIssue]:
    """Validate comparator names and shapes for a conditions mapping."""

    if conditions is None:
        return []

    if not isinstance(conditions, Mapping):
        return [LintIssue("ERROR", context, "conditions must be a mapping")]

    issues: List[LintIssue] = []
    for field, clause in conditions.items():
        if clause is None:
            continue
        if isinstance(clause, Mapping):
            unsupported = set(clause) - SUPPORTED_OPS
            if unsupported:
                issues.append(
                    LintIssue(
                        "ERROR",
                        f"{context}.{field}",
                        f"unsupported comparators: {', '.join(sorted(unsupported))}",
                    )
                )
            any_of = clause.get("any_of") if isinstance(clause, Mapping) else None
            if any_of is not None and not isinstance(any_of, (list, tuple, set)):
                issues.append(
                    LintIssue(
                        "ERROR",
                        f"{context}.{field}",
                        "any_of must be expressed as a list/tuple/set",
                    )
                )
        elif not isinstance(clause, (str, int, float, bool, list, tuple, set)):
            issues.append(
                LintIssue(
                    "ERROR",
                    f"{context}.{field}",
                    "conditions must be scalar, sequence, or comparator mapping",
                )
            )

    return issues


def validate_required_fields(block: str, entries: object) -> List[LintIssue]:
    """Check a dataset block for required keys."""

    required = ENGINE_BLOCKS.get(block, [])
    if entries is None:
        return [LintIssue("ERROR", block, "missing required section")]
    if not isinstance(entries, list):
        return [LintIssue("ERROR", block, "section must be a list")]

    issues: List[LintIssue] = []
    if not entries:
        issues.append(LintIssue("WARN", block, "section is empty"))

    for idx, entry in enumerate(entries):
        if not isinstance(entry, MutableMapping):
            issues.append(LintIssue("ERROR", f"{block}[{idx}]", "entry must be a mapping"))
            continue
        missing = [field for field in required if not entry.get(field)]
        if missing:
            issues.append(
                LintIssue(
                    "ERROR",
                    f"{block}[{idx}]",
                    f"missing required fields: {', '.join(sorted(missing))}",
                )
            )

    return issues


def validate_unique_ids(dataset: Mapping[str, Any]) -> List[LintIssue]:
    """Ensure identifiers do not collide across sections."""

    seen: Dict[str, str] = {}
    issues: List[LintIssue] = []

    for block in DATASET_SEGMENTS:
        entries = dataset.get(block) or []
        if not isinstance(entries, Iterable):
            continue
        for idx, entry in enumerate(entries):
            if not isinstance(entry, Mapping):
                continue
            identifier = entry.get("id")
            if not identifier:
                continue
            if identifier in seen:
                issues.append(
                    LintIssue(
                        "ERROR",
                        f"{block}[{idx}]",
                        f"duplicate id detected (first seen in {seen[identifier]})",
                    )
                )
            else:
                seen[identifier] = f"{block}[{idx}]"

    return issues


def validate_principle_checksums(principles: object) -> List[LintIssue]:
    """Validate checksum integrity for principles without mutating the payload."""

    if principles is None:
        return []
    if not isinstance(principles, list):
        return [LintIssue("ERROR", "principles", "section must be a list for checksum validation")]

    issues: List[LintIssue] = []
    for idx, principle in enumerate(principles):
        if not isinstance(principle, Mapping):
            issues.append(LintIssue("ERROR", f"principles[{idx}]", "entry must be a mapping"))
            continue

        checksum = principle.get("integrity", {}).get("checksum")
        if not checksum:
            issues.append(
                LintIssue(
                    "WARN",
                    f"principles[{idx}].integrity",
                    "missing checksum; run lint with autofix to stamp",
                )
            )
            continue

        computed = _compute_principle_checksum(dict(principle))
        if checksum != computed:
            issues.append(
                LintIssue(
                    "ERROR",
                    f"principles[{idx}].integrity",
                    f"checksum mismatch: expected {computed}",
                )
            )
    return issues


def missing_taxonomy_ids(dataset: Mapping[str, Any]) -> Dict[str, List[str]]:
    """Return missing ids for the canonical PL/FU ranges."""

    pl_expected = expected_ids(PAST_LIFE_PREFIX, *PAST_LIFE_RANGE)
    fu_expected = expected_ids(FUTURE_PREFIX, *FUTURE_RANGE)

    pl_ids = _collect_ids(dataset.get("past_life_engines"))
    fu_ids = _collect_ids(dataset.get("future_engines"))

    return {
        "past_life_engines": sorted(pl_expected - pl_ids),
        "future_engines": sorted(fu_expected - fu_ids),
    }


def _collect_ids(entries: object) -> Set[str]:
    if not isinstance(entries, Iterable):
        return set()
    return {str(item.get("id")) for item in entries if isinstance(item, Mapping) and item.get("id")}


__all__ = [
    "LintIssue",
    "SUPPORTED_OPS",
    "ENGINE_BLOCKS",
    "DATASET_SEGMENTS",
    "validate_condition_ops",
    "validate_principle_checksums",
    "validate_required_fields",
    "validate_unique_ids",
    "missing_taxonomy_ids",
]
