from __future__ import annotations

from dataclasses import asdict, is_dataclass
from datetime import date, datetime, time
from typing import Any


def to_json_safe(obj: Any) -> Any:
    """Convert dataclasses + datetime/date/time into JSON-safe primitives."""
    if is_dataclass(obj):
        return to_json_safe(asdict(obj))

    if isinstance(obj, dict):
        return {str(k): to_json_safe(v) for k, v in obj.items()}

    if isinstance(obj, list):
        return [to_json_safe(x) for x in obj]

    if isinstance(obj, tuple):
        return [to_json_safe(x) for x in obj]

    if isinstance(obj, (datetime, date, time)):
        return obj.isoformat()

    return obj
