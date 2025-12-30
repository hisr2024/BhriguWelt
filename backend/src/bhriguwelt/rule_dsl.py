"""Minimal authoring DSL for Bhrigu rule conditions."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Mapping, MutableMapping, Tuple

try:  # pragma: no cover - optional dependency
    import yaml
except Exception:  # pragma: no cover - offline envs
    yaml = None


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


# --- DSL parsing helpers ----------------------------------------------------

_ALLOWED_COMPARATORS = {"equals", "any_of", "min", "max"}
_PREFIX_TO_SECTION = {"PL": "past_life_engines", "FU": "future_engines"}


def parse_dsl(text: str) -> Dict[str, Any]:
    """Parse DSL text into a Python mapping with helpful errors."""

    if not text:
        return {}

    try:
        if yaml:
            parsed = yaml.safe_load(text)
        else:
            parsed = json.loads(text)
    except Exception:
        try:
            parsed = _parse_simple_yaml(text)
        except Exception as exc:  # pragma: no cover - defensive
            raise ValueError(f"Unable to parse DSL: {exc}") from exc

    if parsed is None:
        return {}
    if not isinstance(parsed, dict):
        raise ValueError("DSL must be a mapping of ids to rule blocks")
    return parsed


def compile_to_dataset(dsl_dict: Mapping[str, Any]) -> Dict[str, Any]:
    """Compile a DSL mapping into the canonical dataset structure."""

    if not isinstance(dsl_dict, Mapping):
        raise ValueError("DSL payload must be a mapping")

    dataset: Dict[str, Any] = {
        "metadata": dict(dsl_dict.get("metadata", {})),
        "principles": [],
        "past_life_engines": [],
        "future_engines": [],
        "remedies": [],
        "transit_rules": [],
        "matchmaking_criteria": [],
    }

    for raw_id, block in dsl_dict.items():
        if raw_id == "metadata":
            continue
        section, prefix = _resolve_section(raw_id)
        if not isinstance(block, Mapping):
            raise ValueError(f"Rule for {raw_id} must be a mapping with 'when' and 'then'")

        conditions = _normalize_conditions(block.get("when"), f"{raw_id}.when")
        payload = block.get("then") or {}
        if not isinstance(payload, Mapping):
            raise ValueError(f"Rule for {raw_id} must provide a 'then' mapping")

        compiled_entry = _compile_entry(raw_id, prefix, conditions, payload)
        dataset[section].append(compiled_entry)

    for section in ("past_life_engines", "future_engines"):
        dataset[section] = sorted(dataset[section], key=lambda entry: entry["id"])
    return dataset


def _resolve_section(identifier: str) -> Tuple[str, str]:
    if not isinstance(identifier, str) or "-" not in identifier:
        raise ValueError(f"Rule ids must follow PREFIX-<number> format, got: {identifier}")
    prefix = identifier.split("-", 1)[0]
    section = _PREFIX_TO_SECTION.get(prefix)
    if not section:
        raise ValueError(f"Unsupported rule prefix '{prefix}' in {identifier}")
    return section, prefix


def _normalize_conditions(conditions: object, context: str) -> Dict[str, Dict[str, object]]:
    if conditions is None:
        return {}
    if not isinstance(conditions, Mapping):
        raise ValueError(f"{context} must be a mapping")

    normalized: Dict[str, Dict[str, object]] = {}
    for field, clause in conditions.items():
        if clause is None:
            continue
        if isinstance(clause, Mapping):
            unsupported = set(clause) - _ALLOWED_COMPARATORS
            if unsupported:
                joined = ", ".join(sorted(unsupported))
                raise ValueError(f"{context}.{field} uses unsupported comparators: {joined}")
            normalized[str(field)] = dict(clause)
            any_of = clause.get("any_of")
            if any_of is not None and not isinstance(any_of, (list, tuple, set)):
                raise ValueError(f"{context}.{field}.any_of must be a list or set")
        else:
            normalized[str(field)] = {"equals": clause}
    return normalized


def _compile_entry(
    identifier: str, prefix: str, conditions: Dict[str, Dict[str, object]], payload: Mapping[str, object]
) -> Dict[str, object]:
    compiled: Dict[str, object] = {"id": identifier, "conditions": conditions, "tradition": "universal"}
    if prefix == "PL":
        narrative = payload.get("narrative")
        sutra_reference = payload.get("sutra_reference")
        if not narrative or not sutra_reference:
            raise ValueError(f"Past-life rule {identifier} must include narrative and sutra_reference")
        compiled.update(
            {
                "sutra_reference": str(sutra_reference),
                "narrative": str(narrative),
                "description": payload.get("description", str(narrative)),
                "confidence": float(payload.get("confidence", 0.6)),
            }
        )
    elif prefix == "FU":
        trajectory = payload.get("trajectory")
        sutra_reference = payload.get("sutra_reference")
        if not trajectory or not sutra_reference:
            raise ValueError(f"Future rule {identifier} must include trajectory and sutra_reference")
        compiled.update(
            {
                "sutra_reference": str(sutra_reference),
                "trajectory": str(trajectory),
                "window": str(payload.get("window", "")),
                "description": payload.get("description", str(trajectory)),
                "certainty": float(payload.get("certainty", 0.65)),
            }
        )
    else:
        raise ValueError(f"Unsupported prefix '{prefix}' in {identifier}")

    return compiled


def _parse_simple_yaml(text: str) -> Dict[str, Any]:
    """Tiny YAML subset parser to keep DSL usable without PyYAML."""

    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        return {}

    root: Dict[str, Any] = {}
    stack: list[Tuple[int, Dict[str, Any]]] = [(-1, root)]

    for raw_line in lines:
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        line = raw_line.strip()
        if ":" not in line:
            raise ValueError(f"Invalid DSL line (missing colon): {line}")
        key, raw_value = line.split(":", 1)
        key = key.strip()
        value_str = raw_value.strip()
        while stack and indent <= stack[-1][0]:
            stack.pop()
        parent = stack[-1][1]

        if value_str == "":
            new_map: Dict[str, Any] = {}
            parent[key] = new_map
            stack.append((indent, new_map))
        else:
            parent[key] = _parse_inline_value(value_str)

    return root


def _parse_inline_value(value: str) -> Any:
    normalized = value.strip()
    if normalized.startswith("{") and normalized.endswith("}"):
        inner = normalized[1:-1].strip()
        mapping: Dict[str, Any] = {}
        if not inner:
            return mapping
        for part in inner.split(","):
            if ":" not in part:
                continue
            key, val = part.split(":", 1)
            mapping[key.strip()] = _parse_inline_value(val)
        return mapping

    if normalized.startswith("[") and normalized.endswith("]"):
        inner = normalized[1:-1].strip()
        if not inner:
            return []
        return [
            _parse_inline_value(item)
            for item in inner.split(",")
            if item.strip()
        ]

    lowered = normalized.lower()
    if lowered in {"true", "false"}:
        return lowered == "true"
    try:
        if "." in normalized:
            return float(normalized)
        return int(normalized)
    except ValueError:
        pass
    if (normalized.startswith("\"") and normalized.endswith("\"")) or (
        normalized.startswith("'") and normalized.endswith("'")
    ):
        return normalized[1:-1]
    return normalized


__all__ = [
    "Rule",
    "eq",
    "any_of",
    "between",
    "all_of",
    "compile_rule",
    "parse_dsl",
    "compile_to_dataset",
]

