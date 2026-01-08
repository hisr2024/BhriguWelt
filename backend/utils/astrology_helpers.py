"""
Helpers for handling astrology calculation dependencies in routes.
"""
from typing import Any, Dict, Optional

from utils.errors import ASTROLOGY_DEPENDENCIES, AstrologyDependencyError
from utils.response_formatter import error_response


def get_cached_birth_data(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(payload, dict):
        return None
    return payload.get("birth_data") or payload.get("birth_chart")


def dependency_error_response(
    error: Optional[AstrologyDependencyError],
    status_code: int = 503
) -> tuple:
    required_packages = (
        error.missing if error and error.missing else list(ASTROLOGY_DEPENDENCIES.values())
    )
    return error_response(
        message=(
            "Astrology calculator is unavailable. Install required packages and restart the service."
        ),
        status_code=status_code,
        error_code="ASTROLOGY_DEPENDENCY_MISSING",
        details={"required_packages": required_packages}
    )
