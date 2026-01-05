"""
Security middleware for Flask application
Implements security headers and HTTPS enforcement
"""
from flask import request, make_response
from functools import wraps
import os


class SecurityMiddleware:
    """
    Security middleware for BhriguWelt backend
    Adds security headers and enforces HTTPS
    """
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize security middleware with Flask app"""
        app.after_request(self.add_security_headers)
        
        # Force HTTPS in production
        if os.getenv('FLASK_ENV') == 'production':
            app.before_request(self.enforce_https)
    
    @staticmethod
    def add_security_headers(response):
        """Add security headers to all responses"""
        # Skip security headers for CORS preflight (OPTIONS) requests
        # to avoid interfering with CORS headers
        if request.method == 'OPTIONS':
            return response

        # Content Security Policy
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://api.openai.com"
        )

        # X-Frame-Options
        response.headers['X-Frame-Options'] = 'DENY'

        # X-Content-Type-Options
        response.headers['X-Content-Type-Options'] = 'nosniff'

        # X-XSS-Protection
        response.headers['X-XSS-Protection'] = '1; mode=block'

        # Strict-Transport-Security (HSTS)
        if request.is_secure:
            response.headers['Strict-Transport-Security'] = (
                'max-age=31536000; includeSubDomains; preload'
            )

        # Referrer-Policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions-Policy (formerly Feature-Policy)
        response.headers['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=()'
        )

        return response
    
    @staticmethod
    def enforce_https():
        """Enforce HTTPS in production"""
        if not request.is_secure and request.headers.get('X-Forwarded-Proto') != 'https':
            # Redirect to HTTPS
            url = request.url.replace('http://', 'https://', 1)
            return make_response('', 301, {'Location': url})


def require_https(f):
    """Decorator to require HTTPS for specific routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_secure and os.getenv('FLASK_ENV') == 'production':
            return make_response({'error': 'HTTPS required'}, 403)
        return f(*args, **kwargs)
    return decorated_function


def validate_content_type(allowed_types=['application/json']):
    """Decorator to validate request content type"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method in ['POST', 'PUT', 'PATCH']:
                content_type = request.headers.get('Content-Type', '')
                if not any(ct in content_type for ct in allowed_types):
                    return make_response({
                        'error': f'Content-Type must be one of: {", ".join(allowed_types)}'
                    }, 415)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
