"""
Shared API utilities for Flask endpoints.
"""
from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from utils.response_formatter import error_response


class BhriguAPIHandler:
    """Compatibility layer for error formatting across API endpoints."""

    @staticmethod
    def send_error(
        message: str,
        status_code: int = 400,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Any, int]:
        """Return a consistent error response tuple.

        Args:
            message: Error message for the client.
            status_code: HTTP status code.
            error_code: Optional error code for client handling.
            details: Optional details for debugging.

        Returns:
            A Flask response tuple.
        """
        return error_response(
            message=message,
            status_code=status_code,
            error_code=error_code or 'BIRTHCHART_ERROR',
            details=details,
        )
