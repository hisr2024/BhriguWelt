"""
Enhanced Error Handling Middleware

Provides comprehensive error handling, logging, and user-friendly error responses
for the BhriguWelt Flask application.

Author: BhriguWelt Team
Version: 2.0.0
"""

from flask import jsonify, request
from werkzeug.exceptions import HTTPException
import logging
import traceback
from functools import wraps
from typing import Tuple, Dict, Any

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base class for API errors"""

    def __init__(self, message: str, status_code: int = 400, payload: Dict[str, Any] = None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary"""
        rv = {'error': self.message, 'status_code': self.status_code}
        rv.update(self.payload)
        return rv


class ValidationError(APIError):
    """Validation error (400)"""

    def __init__(self, message: str, payload: Dict[str, Any] = None):
        super().__init__(message, 400, payload)


class AuthenticationError(APIError):
    """Authentication error (401)"""

    def __init__(self, message: str = "Authentication required", payload: Dict[str, Any] = None):
        super().__init__(message, 401, payload)


class AuthorizationError(APIError):
    """Authorization error (403)"""

    def __init__(self, message: str = "Insufficient permissions", payload: Dict[str, Any] = None):
        super().__init__(message, 403, payload)


class NotFoundError(APIError):
    """Not found error (404)"""

    def __init__(self, message: str = "Resource not found", payload: Dict[str, Any] = None):
        super().__init__(message, 404, payload)


class RateLimitError(APIError):
    """Rate limit error (429)"""

    def __init__(self, message: str = "Rate limit exceeded", payload: Dict[str, Any] = None):
        super().__init__(message, 429, payload)


class ServerError(APIError):
    """Internal server error (500)"""

    def __init__(self, message: str = "Internal server error", payload: Dict[str, Any] = None):
        super().__init__(message, 500, payload)


def register_error_handlers(app):
    """Register error handlers with Flask app"""

    @app.errorhandler(APIError)
    def handle_api_error(error):
        """Handle custom API errors"""
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        logger.warning(f"API Error {error.status_code}: {error.message}")
        return response

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        """Handle validation errors"""
        response = jsonify(error.to_dict())
        response.status_code = 400
        logger.warning(f"Validation Error: {error.message}")
        return response

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle Werkzeug HTTP exceptions"""
        response = jsonify({
            'error': error.description or 'An error occurred',
            'status_code': error.code,
            'type': error.name
        })
        response.status_code = error.code
        logger.warning(f"HTTP Exception {error.code}: {error.description}")
        return response

    @app.errorhandler(400)
    def handle_bad_request(error):
        """Handle 400 Bad Request"""
        return jsonify({
            'error': 'Bad request - invalid input provided',
            'status_code': 400,
            'message': str(error) if str(error) != '400 Bad Request: The browser (or proxy) sent a request that this server could not understand.' else 'Invalid request format or parameters'
        }), 400

    @app.errorhandler(401)
    def handle_unauthorized(error):
        """Handle 401 Unauthorized"""
        return jsonify({
            'error': 'Authentication required',
            'status_code': 401,
            'message': 'Please provide valid authentication credentials'
        }), 401

    @app.errorhandler(403)
    def handle_forbidden(error):
        """Handle 403 Forbidden"""
        return jsonify({
            'error': 'Access forbidden',
            'status_code': 403,
            'message': 'You do not have permission to access this resource'
        }), 403

    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 Not Found"""
        return jsonify({
            'error': 'Resource not found',
            'status_code': 404,
            'path': request.path,
            'method': request.method
        }), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle 405 Method Not Allowed"""
        return jsonify({
            'error': 'Method not allowed',
            'status_code': 405,
            'method': request.method,
            'path': request.path,
            'allowed_methods': error.valid_methods if hasattr(error, 'valid_methods') else []
        }), 405

    @app.errorhandler(413)
    def handle_request_entity_too_large(error):
        """Handle 413 Payload Too Large"""
        return jsonify({
            'error': 'Request payload too large',
            'status_code': 413,
            'message': 'The request payload exceeds the maximum allowed size',
            'max_size': f"{app.config.get('MAX_CONTENT_LENGTH', 0) / 1024 / 1024:.2f} MB"
        }), 413

    @app.errorhandler(429)
    def handle_rate_limit_exceeded(error):
        """Handle 429 Rate Limit Exceeded"""
        return jsonify({
            'error': 'Rate limit exceeded',
            'status_code': 429,
            'message': 'Too many requests. Please try again later.',
            'retry_after': getattr(error, 'retry_after', 60)
        }), 429

    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 Internal Server Error"""
        logger.error(f"Internal Server Error: {str(error)}")
        logger.error(traceback.format_exc())

        # In production, don't expose internal error details
        is_production = app.config.get('ENV') == 'production'

        response = {
            'error': 'Internal server error',
            'status_code': 500,
            'message': 'An unexpected error occurred. Please try again later.'
        }

        if not is_production:
            response['debug'] = {
                'error_type': type(error).__name__,
                'error_message': str(error),
                'traceback': traceback.format_exc().split('\n')
            }

        return jsonify(response), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle unexpected exceptions"""
        logger.error(f"Unexpected Error: {str(error)}")
        logger.error(traceback.format_exc())

        is_production = app.config.get('ENV') == 'production'

        response = {
            'error': 'Unexpected error',
            'status_code': 500,
            'message': 'An unexpected error occurred. Please contact support if this persists.'
        }

        if not is_production:
            response['debug'] = {
                'error_type': type(error).__name__,
                'error_message': str(error),
                'traceback': traceback.format_exc().split('\n')
            }

        return jsonify(response), 500

    logger.info("Error handlers registered successfully")


def require_json(f):
    """Decorator to require JSON content type"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not request.is_json:
            raise ValidationError(
                'Content-Type must be application/json',
                payload={'received_content_type': request.content_type}
            )
        return f(*args, **kwargs)
    return wrapper


def validate_required_fields(required_fields: list):
    """Decorator to validate required fields in request"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                raise ValidationError('Content-Type must be application/json')

            data = request.get_json()
            missing_fields = [field for field in required_fields if field not in data]

            if missing_fields:
                raise ValidationError(
                    'Missing required fields',
                    payload={'missing_fields': missing_fields, 'required_fields': required_fields}
                )

            return f(*args, **kwargs)
        return wrapper
    return decorator


def log_request_info():
    """Log incoming request information"""
    logger.info(f"{request.method} {request.path} - IP: {request.remote_addr}")

    if request.is_json:
        data = request.get_json()
        # Don't log sensitive data
        safe_data = {k: v for k, v in data.items() if k not in ['password', 'token', 'api_key', 'secret']}
        logger.debug(f"Request data: {safe_data}")


def log_response_info(response):
    """Log outgoing response information"""
    logger.info(f"Response: {response.status_code} - {response.content_length} bytes")
    return response


def setup_request_logging(app):
    """Setup request/response logging"""

    @app.before_request
    def before_request():
        """Log request before processing"""
        log_request_info()

    @app.after_request
    def after_request(response):
        """Log response after processing"""
        return log_response_info(response)

    logger.info("Request logging configured")


def add_security_headers(response):
    """Add security headers to response"""
    # Content Security Policy
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://api.openai.com https://api.anthropic.com"
    )

    # X-Content-Type-Options
    response.headers['X-Content-Type-Options'] = 'nosniff'

    # X-Frame-Options
    response.headers['X-Frame-Options'] = 'DENY'

    # X-XSS-Protection
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # Strict-Transport-Security (HSTS)
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    # Referrer-Policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Permissions-Policy
    response.headers['Permissions-Policy'] = (
        "geolocation=(), microphone=(), camera=()"
    )

    return response


def setup_security_headers(app):
    """Setup security headers for all responses"""

    @app.after_request
    def apply_security_headers(response):
        """Apply security headers to response"""
        return add_security_headers(response)

    logger.info("Security headers configured")


def handle_cors_preflight():
    """Handle CORS preflight requests"""
    response = jsonify({'status': 'ok'})
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response, 200
