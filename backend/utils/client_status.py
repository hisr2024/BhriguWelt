"""Utilities for interpreting client online/offline headers."""
from typing import Optional


def parse_client_online(value: Optional[str]) -> Optional[bool]:
    """Parse the X-Client-Online header into a boolean.

    Returns True/False when explicitly set, otherwise None.
    """
    if value is None:
        return None

    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "online", "on"}:
        return True
    if normalized in {"0", "false", "no", "offline", "off"}:
        return False
    return None
