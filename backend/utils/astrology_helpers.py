"""
Helpers for handling astrology calculation dependencies in routes.
"""
from typing import Any, Dict, Optional, Tuple

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


def handle_birth_chart_error(chart: Dict[str, Any]) -> Optional[tuple]:
    """
    Check if birth chart calculation returned an error and return appropriate error response.

    This function standardizes error handling across all astrology endpoints by:
    - Checking for 'error' key in calculator response
    - Returning appropriate HTTP status codes based on error type
    - Properly propagating error messages

    Args:
        chart: Birth chart calculation result dict

    Returns:
        Error response tuple if error exists, None otherwise

    Error code to HTTP status mapping:
        - 'geocoding_failed': 400 (Bad Request - invalid location)
        - 'timezone_error': 400 (Bad Request - invalid timezone)
        - 'invalid_date': 400 (Bad Request - invalid date/time)
        - Other errors: 500 (Internal Server Error)
    """
    if not isinstance(chart, dict):
        return error_response("Invalid birth chart response", 500)

    if 'error' in chart:
        error_info = chart['error']
        error_code = error_info.get('code', 'unknown')
        error_message = error_info.get('message', 'Failed to calculate birth chart')

        # Map error codes to HTTP status codes
        client_error_codes = ['geocoding_failed', 'timezone_error', 'invalid_date', 'invalid_time']

        status_code = 400 if error_code in client_error_codes else 500

        return error_response(error_message, status_code)

    return None
