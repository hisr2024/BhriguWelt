"""Authoritative taxonomy helpers for BhriguWelt datasets."""

from __future__ import annotations

import re
from typing import Dict, Iterable, List, Mapping, Set


PAST_LIFE_PREFIX = "PL"
FUTURE_PREFIX = "FU"
PRINCIPLE_PREFIX = "BR"
REMEDY_PREFIX = "REM"
TRANSIT_PREFIX = "TR"
MATCHMAKING_PREFIX = "MM"

PAST_LIFE_RANGE = (1, 108)
FUTURE_RANGE = (1, 84)

_CATEGORY_PREFIXES: Mapping[str, str] = {
    "past_life_engines": PAST_LIFE_PREFIX,
    "future_engines": FUTURE_PREFIX,
    "principles": PRINCIPLE_PREFIX,
    "remedies": REMEDY_PREFIX,
    "transit_rules": TRANSIT_PREFIX,
    "matchmaking_criteria": MATCHMAKING_PREFIX,
}


def expected_ids(prefix: str, start: int, end: int) -> Set[str]:
    """Return the expected inclusive identifier set for a prefix.

    Examples
    --------
    >>> sorted(list(expected_ids("PL", 1, 3)))
    ['PL-1', 'PL-2', 'PL-3']
    """

    return {f"{prefix}-{i}" for i in range(int(start), int(end) + 1)}


def validate_id(prefix: str, id_str: str, start: int | None = None, end: int | None = None) -> None:
    """Raise a :class:`ValueError` when the identifier is malformed.

    Validation focuses on the canonical ``PREFIX-<integer>`` pattern and, when
    bounds are supplied, enforces that the integer falls inside the range.
    """

    if not isinstance(id_str, str):
        raise ValueError(f"Identifier must be a string for prefix {prefix}: {id_str}")

    pattern = re.compile(rf"^{re.escape(prefix)}-(\d+)$")
    match = pattern.match(id_str)
    if not match:
        raise ValueError(f"Identifier '{id_str}' must follow pattern {prefix}-<number>")

    if start is None or end is None:
        return

    number = int(match.group(1))
    if number < start or number > end:
        raise ValueError(
            f"Identifier '{id_str}' is outside expected range {prefix}-{start}…{end}"
        )


def missing_ids_in_dataset(dataset: Mapping[str, object]) -> Dict[str, List[str]]:
    """Return missing taxonomy identifiers per category.

    Only the canonical past-life and future engines have enforced complete
    ranges; other categories report an empty list to signal that completeness
    is not enforced.
    """

    missing: Dict[str, List[str]] = {
        "past_life_engines": [],
        "future_engines": [],
        "principles": [],
        "remedies": [],
        "transit_rules": [],
        "matchmaking_criteria": [],
    }

    past_expected = expected_ids(PAST_LIFE_PREFIX, *PAST_LIFE_RANGE)
    future_expected = expected_ids(FUTURE_PREFIX, *FUTURE_RANGE)

    pl_ids = _ids_for_category(dataset, "past_life_engines")
    fu_ids = _ids_for_category(dataset, "future_engines")

    missing["past_life_engines"] = sorted(past_expected - pl_ids)
    missing["future_engines"] = sorted(future_expected - fu_ids)
    return missing


def _ids_for_category(dataset: Mapping[str, object], key: str) -> Set[str]:
    entries = dataset.get(key) or []
    if not isinstance(entries, Iterable):
        return set()
    return {str(entry.get("id")) for entry in entries if isinstance(entry, Mapping) and entry.get("id")}


__all__ = [
    "expected_ids",
    "validate_id",
    "missing_ids_in_dataset",
    "PAST_LIFE_PREFIX",
    "FUTURE_PREFIX",
    "PRINCIPLE_PREFIX",
    "REMEDY_PREFIX",
    "TRANSIT_PREFIX",
    "MATCHMAKING_PREFIX",
    "PAST_LIFE_RANGE",
    "FUTURE_RANGE",
]
