"""Minimal authoring DSL for Bhrigu rule conditions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, Mapping


@dataclass(frozen=True)
class Rule:
    """Structured representation of a conditions mapping.

    The helper keeps authors focused on the allowed comparator surface (`equals`,
    `any_of`, `min`, `max`) that :func:`bhriguwelt.calculations._matches_rule`
    already understands.
    """

    conditions: Dict[str, Dict[str, object]]

    def to_dict(self) -> Dict[str, Dict[str, object]]:
        return self.conditions


def _ensure_iterable(values: Iterable[Any]) -> Iterable[Any]:
    if isinstance(values, (str, bytes)):
        return [values]
    return values


def eq(field: str, value: Any) -> Rule:
    """Return a rule asserting equality for a snapshot field."""

    return Rule({field: {"equals": value}})


def any_of(field: str, values: Iterable[Any]) -> Rule:
    """Return a rule permitting any of the supplied values."""

    normalized = list(_ensure_iterable(values))
    return Rule({field: {"any_of": normalized}})


def between(field: str, minimum: float, maximum: float) -> Rule:
    """Return a range rule inclusive of both bounds."""

    return Rule({field: {"min": minimum, "max": maximum}})


def all_of(*clauses: Rule) -> Rule:
    """Merge multiple rule clauses into a single mapping."""

    merged: Dict[str, Dict[str, object]] = {}
    for clause in clauses:
        if not isinstance(clause, Rule):
            raise TypeError("all_of expects Rule instances")
        for field, comparators in clause.conditions.items():
            merged.setdefault(field, {})
            merged[field].update(comparators)
    return Rule(merged)


def compile_rule(rule: Rule | Mapping[str, Any] | None) -> Dict[str, Any]:
    """Convert a :class:`Rule` into the dict structure used by engines."""

    if rule is None:
        return {}
    if isinstance(rule, Rule):
        return rule.to_dict()
    if isinstance(rule, Mapping):
        return {str(k): v for k, v in rule.items()}
    raise TypeError("compile_rule expects a Rule or mapping")

