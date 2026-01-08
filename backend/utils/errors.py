"""
Custom error types for dependency and runtime issues.
"""
from typing import List, Optional

ASTROLOGY_DEPENDENCIES = {
    "ephem": "ephem",
    "pytz": "pytz",
    "timezonefinder": "timezonefinder",
    "geopy": "geopy"
}


class AstrologyDependencyError(ImportError):
    """Raised when required astrology calculation dependencies are missing."""

    def __init__(self, message: str, missing: Optional[List[str]] = None):
        super().__init__(message)
        self.missing = missing or []

    @classmethod
    def for_missing(cls, missing: List[str]) -> "AstrologyDependencyError":
        packages = ", ".join(missing)
        install_hint = " ".join(missing)
        message = (
            "Astrology calculator dependencies are missing. "
            f"Install the following packages: {packages}. "
            f"Example: pip install {install_hint}"
        )
        return cls(message, missing=missing)
