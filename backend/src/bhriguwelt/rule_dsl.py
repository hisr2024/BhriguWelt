"""Lightweight helpers for expressing Bhrigu Samhita rules in code.

The DSL helpers here avoid committing to a full parser while still giving
engine authors a consistent mapping shape for runtime evaluators.
"""

from __future__ import annotations

from typing import Any, Dict


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
