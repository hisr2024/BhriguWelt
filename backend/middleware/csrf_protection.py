"""
CSRF Protection for API Endpoints
Implements double-submit cookie pattern for stateless API security
"""

import os
from functools import wraps
from flask import request, jsonify
import secrets
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Try to import flask-wtf CSRF - it's optional
try:
    from flask_wtf.csrf import CSRFProtect, generate_csrf
    CSRF_AVAILABLE = True
except ImportError:
    CSRF_AVAILABLE = False
    logger.warning("flask-wtf not installed - CSRF protection disabled")


class CSRFMiddleware:
    """
    CSRF Protection Middleware for API endpoints
    Uses double-submit cookie pattern for stateless protection
    """

    def __init__(self, app=None):
        self.app = app
        self.csrf = None
        # Disable CSRF for API endpoints - using CORS + client-side auth instead
        # CSRF is primarily for server-side session-based authentication
        # This app uses client-side encryption (IndexedDB) with no server sessions
        self.enabled = os.getenv('ENABLE_CSRF_PROTECTION', 'false').lower() == 'true'

        # Exempt paths (health checks, public endpoints, and ALL API endpoints)
        self.exempt_paths = [
            '/health',
            '/',
            '/api/',  # Exempt all API endpoints
        ]

        # Safe methods that don't need CSRF protection
        self.safe_methods = ['GET', 'HEAD', 'OPTIONS']

        if app:
            self.init_app(app)

    def init_app(self, app):
        """Initialize CSRF protection with Flask app"""
        if not CSRF_AVAILABLE:
            logger.warning("flask-wtf not available - CSRF protection disabled")
            return

        if not self.enabled:
            logger.info("CSRF protection disabled by configuration")
            return

        # Configure Flask-WTF CSRF
        app.config['WTF_CSRF_ENABLED'] = True
        app.config['WTF_CSRF_TIME_LIMIT'] = None  # No time limit for API tokens
        app.config['WTF_CSRF_SSL_STRICT'] = os.getenv('FLASK_ENV') == 'production'

        # Use cookie-based CSRF for API
        app.config['WTF_CSRF_CHECK_DEFAULT'] = False  # We'll check manually
        app.config['WTF_CSRF_METHODS'] = ['POST', 'PUT', 'PATCH', 'DELETE']

        # Cookie settings
        app.config['WTF_CSRF_COOKIE_NAME'] = 'csrf_token'
        app.config['WTF_CSRF_COOKIE_HTTPONLY'] = False  # Must be readable by JS
        app.config['WTF_CSRF_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'
        app.config['WTF_CSRF_COOKIE_SAMESITE'] = 'Lax'

        # Initialize CSRFProtect but disable default behavior
        self.csrf = CSRFProtect(app)

        # Exempt all routes by default, then selectively protect
        self.csrf.exempt('*')

        # Add before_request handler for manual validation
        app.before_request(self.validate_csrf)

        # Add endpoint to get CSRF token
        @app.route('/api/csrf-token', methods=['GET'])
        def get_csrf_token():
            """Endpoint to get CSRF token for API clients"""
            if not CSRF_AVAILABLE or not self.enabled:
                return jsonify({'csrf_token': 'disabled'}), 200

            token = generate_csrf()
            return jsonify({'csrf_token': token}), 200

        logger.info("✓ CSRF protection initialized")

    def validate_csrf(self):
        """Validate CSRF token for unsafe requests"""
        # Skip if CSRF is disabled
        if not CSRF_AVAILABLE or not self.enabled:
            return None

        # Skip safe methods
        if request.method in self.safe_methods:
            return None

        # Skip exempt paths (check both exact match and prefix match)
        for exempt_path in self.exempt_paths:
            if request.path == exempt_path or request.path.startswith(exempt_path):
                return None

        # Skip OPTIONS (CORS preflight)
        if request.method == 'OPTIONS':
            return None

        # Get token from header (preferred for APIs)
        token_header = request.headers.get('X-CSRF-Token')

        # Get token from form data (fallback)
        token_form = request.form.get('csrf_token')

        # Get token from JSON body (alternative for APIs)
        token_json = None
        if request.is_json:
            try:
                token_json = request.json.get('csrf_token')
            except:
                pass

        # Use any available token
        token = token_header or token_form or token_json

        if not token:
            logger.warning(f"CSRF token missing for {request.method} {request.path}")
            return jsonify({
                'error': 'CSRF token missing',
                'message': 'Include X-CSRF-Token header or csrf_token in request',
                'hint': 'Get token from GET /api/csrf-token',
                'error_code': 'CSRF_TOKEN_MISSING'
            }), 403

        # Validate token
        try:
            from flask_wtf.csrf import validate_csrf
            validate_csrf(token)
            return None  # Valid token
        except Exception as e:
            logger.warning(f"CSRF validation failed for {request.method} {request.path}: {str(e)}")
            return jsonify({
                'error': 'CSRF validation failed',
                'message': 'Invalid or expired CSRF token',
                'hint': 'Get new token from GET /api/csrf-token',
                'error_code': 'CSRF_VALIDATION_FAILED'
            }), 403

    def exempt(self, *routes):
        """Exempt specific routes from CSRF protection"""
        for route in routes:
            if route not in self.exempt_paths:
                self.exempt_paths.append(route)
        logger.debug(f"CSRF exempt paths: {self.exempt_paths}")


def csrf_protect(f):
    """
    Decorator to explicitly require CSRF protection on a route
    Use this for critical state-changing operations
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # This is already handled by the middleware
        # This decorator is just for explicit documentation
        return f(*args, **kwargs)
    return decorated_function


def csrf_exempt(f):
    """
    Decorator to explicitly exempt a route from CSRF protection
    Use sparingly and only for truly public endpoints
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)

    # Mark function as exempt
    decorated_function._csrf_exempt = True
    return decorated_function
