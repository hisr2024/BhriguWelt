"""Lightweight helpers for expressing Bhrigu Samhita rules in code.

The DSL helpers here avoid committing to a full parser while still giving
engine authors a consistent mapping shape for runtime evaluators.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from .schemas import SUPPORTED_OPS


def normalize_rule_payload(rule_id: str, *, conditions: Dict[str, Any] | None = None, **metadata: Any) -> Dict[str, Any]:
    """Return a canonical mapping for a rule entry.

    The helper keeps rule payloads consistent when scripting data migrations or
    writing unit tests around the engine analyzers.
    """

    payload: Dict[str, Any] = {"id": rule_id}
    if conditions:
        payload["conditions"] = conditions
    payload.update(metadata)
    return payload


@dataclass
class DSLParseError(Exception):
    message: str
    line: int


def _strip_quotes(s: str) -> str:
    s = s.strip()
    if (s.startswith("\"") and s.endswith("\"")) or (s.startswith("'") and s.endswith("'")):
        return s[1:-1]
    return s


def parse_dsl(text: str) -> List[Dict[str, Any]]:
    """
    Parse a minimal rule DSL into engine dicts.
    Supports: engine <ID>: blocks, key = value, and when: condition lines:
      field op value
    ops: equals|min|max|any_of
    values: numbers, true/false, strings, [a,b,c]
    """
    lines = [ln.rstrip() for ln in text.splitlines()]
    engines: List[Dict[str, Any]] = []
    current: Dict[str, Any] | None = None
    in_when = False

    def commit():
        nonlocal current, in_when
        if current is not None:
            current.setdefault("conditions", {})
            engines.append(current)
        current = None
        in_when = False

    def parse_value(raw: str) -> Any:
        raw = raw.strip()
        low = raw.lower()
        if low in {"true", "false"}:
            return low == "true"
        if raw.startswith("[") and raw.endswith("]"):
            body = raw[1:-1].strip()
            if not body:
                return []
            parts = [p.strip() for p in body.split(",")]
            return [parse_value(p) for p in parts]
        # int / float
        try:
            if "." in raw:
                return float(raw)
            return int(raw)
        except Exception:
            return _strip_quotes(raw)

    for i, ln in enumerate(lines, start=1):
        s = ln.strip()
        if not s or s.startswith("#"):
            continue

        if s.lower().startswith("engine "):
            commit()
            # engine PL-12:
            head = s[len("engine "):].strip()
            if not head.endswith(":"):
                raise DSLParseError("engine header must end with ':'", i)
            engine_id = head[:-1].strip()
            current = {"id": engine_id}
            continue

        if current is None:
            raise DSLParseError("content outside engine block", i)

        if s.lower() == "when:":
            in_when = True
            current.setdefault("conditions", {})
            continue

        if not in_when:
            # key = value
            if "=" not in s:
                raise DSLParseError("expected key = value", i)
            key, raw = [p.strip() for p in s.split("=", 1)]
            val = parse_value(raw)
            # map friendly keys to canonical fields
            mapping = {
                "sutra": "sutra_reference",
                "desc": "description",
            }
            current[mapping.get(key, key)] = val
        else:
            # condition line: field op value
            parts = s.split(None, 2)
            if len(parts) != 3:
                raise DSLParseError("condition must be: <field> <op> <value>", i)
            field, op, raw = parts
            op = op.strip()
            if op not in SUPPORTED_OPS:
                raise DSLParseError(f"unsupported op '{op}' (allowed: {sorted(SUPPORTED_OPS)})", i)
            val = parse_value(raw)
            current["conditions"].setdefault(field, {})
            if not isinstance(current["conditions"][field], dict):
                current["conditions"][field] = {}
            current["conditions"][field][op] = val

    commit()
    return engines


def compile_dsl_to_dataset_entries(text: str) -> List[Dict[str, Any]]:
    """Parse + normalize fields commonly used by your engines."""
    engines = parse_dsl(text)
    for e in engines:
        e.setdefault("tradition", "universal")
        e.setdefault("conditions", {})
    return engines
