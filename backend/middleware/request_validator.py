"""
Enhanced Request Validation Middleware
Provides comprehensive request validation, sanitization, and security checks
"""

from functools import wraps
from flask import request, jsonify
from typing import Callable, Optional, List, Dict, Any
from utils.validators import (
    validate_birth_data,
    sanitize_input,
    sanitizeQuestion,
    ValidationError
)
from utils.logger import setup_logger
import json

logger = setup_logger(__name__)


def validate_json_content_type(f: Callable) -> Callable:
    """
    Decorator to ensure request has JSON content type for POST/PUT/PATCH
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ['POST', 'PUT', 'PATCH']:
            content_type = request.headers.get('Content-Type', '')
            if 'application/json' not in content_type:
                return jsonify({
                    'success': False,
                    'error': 'Content-Type must be application/json',
                    'message': 'Invalid content type'
                }), 415
        return f(*args, **kwargs)
    return decorated_function


def validate_request_size(max_size_bytes: int = 1_048_576) -> Callable:
    """
    Decorator to validate request size doesn't exceed limit
    Default: 1MB
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            content_length = request.content_length
            if content_length and content_length > max_size_bytes:
                return jsonify({
                    'success': False,
                    'error': f'Request too large. Maximum size: {max_size_bytes} bytes',
                    'message': 'Payload too large'
                }), 413
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_birth_data_request(f: Callable) -> Callable:
    """
    Decorator to validate birth data in request body
    Used for prediction endpoints
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            data = request.get_json()
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'Request body is required',
                    'message': 'No data provided'
                }), 400

            # Validate birth data
            validation_error = validate_birth_data(data)
            if validation_error:
                return jsonify({
                    'success': False,
                    'error': validation_error,
                    'message': 'Invalid birth data'
                }), 400

            # Sanitize text inputs
            if 'question' in data and data['question']:
                data['question'] = sanitizeQuestion(data['question'], max_length=500)

            if 'place_of_birth' in data and data['place_of_birth']:
                data['place_of_birth'] = sanitize_input(data['place_of_birth'], max_length=200)

            # Store sanitized data back
            request._sanitized_data = data

            return f(*args, **kwargs)

        except json.JSONDecodeError:
            return jsonify({
                'success': False,
                'error': 'Invalid JSON format',
                'message': 'Request body must be valid JSON'
            }), 400
        except Exception as e:
            logger.error(f"Validation error in {f.__name__}: {e}", exc_info=True)
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'message': 'Request validation error'
            }), 500

    return decorated_function


def validate_required_fields(required_fields: List[str]) -> Callable:
    """
    Decorator to validate required fields in request body

    Args:
        required_fields: List of field names that must be present
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = request.get_json()
                if not data:
                    return jsonify({
                        'success': False,
                        'error': 'Request body is required',
                        'message': 'No data provided'
                    }), 400

                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        'success': False,
                        'error': f"Missing required fields: {', '.join(missing_fields)}",
                        'message': 'Required fields missing'
                    }), 400

                return f(*args, **kwargs)

            except json.JSONDecodeError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid JSON format',
                    'message': 'Request body must be valid JSON'
                }), 400
            except Exception as e:
                logger.error(f"Field validation error in {f.__name__}: {e}", exc_info=True)
                return jsonify({
                    'success': False,
                    'error': 'Validation failed',
                    'message': 'Request validation error'
                }), 500

        return decorated_function
    return decorator


def sanitize_request_data(fields_config: Dict[str, Dict[str, Any]]) -> Callable:
    """
    Decorator to sanitize specified fields in request body

    Args:
        fields_config: Dict mapping field names to sanitization config
                      e.g., {'question': {'max_length': 500, 'sanitizer': 'question'}}
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = request.get_json()
                if data:
                    for field, config in fields_config.items():
                        if field in data and data[field]:
                            max_length = config.get('max_length', 500)
                            sanitizer_type = config.get('sanitizer', 'default')

                            if sanitizer_type == 'question':
                                data[field] = sanitizeQuestion(data[field], max_length)
                            else:
                                data[field] = sanitize_input(data[field], max_length)

                    request._sanitized_data = data

                return f(*args, **kwargs)

            except Exception as e:
                logger.error(f"Sanitization error in {f.__name__}: {e}", exc_info=True)
                return f(*args, **kwargs)  # Continue even if sanitization fails

        return decorated_function
    return decorator


def validate_pagination(max_per_page: int = 100) -> Callable:
    """
    Decorator to validate pagination parameters

    Args:
        max_per_page: Maximum items per page allowed
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                page = request.args.get('page', 1, type=int)
                per_page = request.args.get('per_page', 20, type=int)

                if page < 1:
                    return jsonify({
                        'success': False,
                        'error': 'Page number must be >= 1',
                        'message': 'Invalid pagination'
                    }), 400

                if per_page < 1 or per_page > max_per_page:
                    return jsonify({
                        'success': False,
                        'error': f'Per page must be between 1 and {max_per_page}',
                        'message': 'Invalid pagination'
                    }), 400

                return f(*args, **kwargs)

            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'error': 'Invalid pagination parameters',
                    'message': 'Pagination values must be integers'
                }), 400

        return decorated_function
    return decorator


def validate_no_sql_injection(f: Callable) -> Callable:
    """
    Decorator to check for common SQL injection patterns
    Note: This is a defense-in-depth measure. Parameterized queries are the primary defense.
    """
    SQL_INJECTION_PATTERNS = [
        r"(\bUNION\b.*\bSELECT\b)",
        r"(\bDROP\b.*\bTABLE\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(\bUPDATE\b.*\bSET\b)",
        r"(;.*--)",
        r"('.*OR.*'.*=.*')",
    ]

    @wraps(f)
    def decorated_function(*args, **kwargs):
        import re

        try:
            data = request.get_json() if request.is_json else {}
            query_params = request.args.to_dict()

            # Check all string values for SQL injection patterns
            all_values = list(query_params.values())
            if data:
                all_values.extend([v for v in data.values() if isinstance(v, str)])

            for value in all_values:
                if isinstance(value, str):
                    for pattern in SQL_INJECTION_PATTERNS:
                        if re.search(pattern, value, re.IGNORECASE):
                            logger.warning(f"Potential SQL injection attempt detected: {value[:100]}")
                            return jsonify({
                                'success': False,
                                'error': 'Invalid input detected',
                                'message': 'Request contains suspicious patterns'
                            }), 400

            return f(*args, **kwargs)

        except Exception as e:
            logger.error(f"SQL injection check error in {f.__name__}: {e}", exc_info=True)
            return f(*args, **kwargs)  # Continue even if check fails

    return decorated_function
