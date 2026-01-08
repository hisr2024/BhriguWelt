"""
Standardized response formatting for API endpoints
"""
from flask import jsonify
from typing import Any, Dict, Optional
from datetime import datetime


def success_response(
    data: Any,
    message: str = "Success",
    status_code: int = 200,
    meta: Optional[Dict] = None
) -> tuple:
    """
    Format successful API response

    Args:
        data: Response data
        message: Success message
        status_code: HTTP status code
        meta: Optional metadata (pagination, etc.)

    Returns:
        JSON response tuple (response, status_code)
    """
    response = {
        'status': 'success',
        'message': message,
        'data': data,
        'timestamp': datetime.utcnow().isoformat()
    }

    if meta:
        response['meta'] = meta

    return jsonify(response), status_code


def prediction_response(
    prediction: Any,
    metadata: Optional[Dict] = None,
    status: str = "success",
    status_code: int = 200,
    message: Optional[str] = None
) -> tuple:
    """
    Format prediction API response with a consistent envelope.

    Args:
        prediction: Prediction payload (string or structured object)
        metadata: Optional metadata about the prediction
        status: Response status ("success" or "error")
        status_code: HTTP status code
        message: Optional message for client display

    Returns:
        JSON response tuple (response, status_code)
    """
    response = {
        'status': status,
        'prediction': prediction,
        'metadata': metadata,
        'timestamp': datetime.utcnow().isoformat()
    }

    if message:
        response['message'] = message

    return jsonify(response), status_code


def prediction_error_response(
    message: str,
    status_code: int = 400,
    metadata: Optional[Dict] = None
) -> tuple:
    """
    Format prediction error response with prediction envelope.

    Args:
        message: Error message
        status_code: HTTP status code
        metadata: Optional metadata about the failure

    Returns:
        JSON response tuple (response, status_code)
    """
    error_metadata = metadata or {}
    error_metadata['error'] = message
    return prediction_response(
        prediction=None,
        metadata=error_metadata,
        status='error',
        status_code=status_code,
        message=message
    )


def error_response(
    message: str,
    status_code: int = 400,
    error_code: Optional[str] = None,
    details: Optional[Dict] = None
) -> tuple:
    """
    Format error API response

    Args:
        message: Error message
        status_code: HTTP status code
        error_code: Optional error code for client handling
        details: Optional additional error details

    Returns:
        JSON response tuple (response, status_code)
    """
    response = {
        'status': 'error',
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }

    if error_code:
        response['error_code'] = error_code

    if details:
        response['details'] = details

    return jsonify(response), status_code


def validation_error_response(
    message: str,
    field: Optional[str] = None,
    value: Optional[Any] = None
) -> tuple:
    """
    Format validation error response

    Args:
        message: Validation error message
        field: Field that failed validation
        value: Invalid value (if safe to return)

    Returns:
        JSON response tuple (response, status_code)
    """
    details = {}
    if field:
        details['field'] = field
    if value is not None and len(str(value)) < 100:  # Don't return large values
        details['provided_value'] = value

    return error_response(
        message=message,
        status_code=400,
        error_code='VALIDATION_ERROR',
        details=details if details else None
    )


def not_found_response(resource: str = "Resource") -> tuple:
    """
    Format 404 not found response

    Args:
        resource: Resource type that was not found

    Returns:
        JSON response tuple (response, status_code)
    """
    return error_response(
        message=f"{resource} not found",
        status_code=404,
        error_code='NOT_FOUND'
    )


def unauthorized_response(message: str = "Unauthorized access") -> tuple:
    """
    Format 401 unauthorized response

    Returns:
        JSON response tuple (response, status_code)
    """
    return error_response(
        message=message,
        status_code=401,
        error_code='UNAUTHORIZED'
    )


def forbidden_response(message: str = "Access forbidden") -> tuple:
    """
    Format 403 forbidden response

    Returns:
        JSON response tuple (response, status_code)
    """
    return error_response(
        message=message,
        status_code=403,
        error_code='FORBIDDEN'
    )


def server_error_response(message: str = "Internal server error") -> tuple:
    """
    Format 500 internal server error response

    Returns:
        JSON response tuple (response, status_code)
    """
    return error_response(
        message=message,
        status_code=500,
        error_code='INTERNAL_ERROR'
    )


def paginated_response(
    data: list,
    page: int,
    per_page: int,
    total: int,
    message: str = "Success"
) -> tuple:
    """
    Format paginated response

    Args:
        data: List of items for current page
        page: Current page number
        per_page: Items per page
        total: Total number of items
        message: Success message

    Returns:
        JSON response tuple (response, status_code)
    """
    total_pages = (total + per_page - 1) // per_page

    meta = {
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
    }

    return success_response(data=data, message=message, meta=meta)
