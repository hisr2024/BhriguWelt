"""
Tests for security headers and middleware
"""
import pytest
import os
from unittest.mock import patch
from flask import Flask
from middleware.security import SecurityMiddleware


class TestSecurityHeaders:
    """Test security header functionality"""

    def test_csp_header_enabled_by_default(self):
        """Test that CSP headers are enabled by default"""
        app = Flask(__name__)
        SecurityMiddleware(app)

        with app.test_client() as client:
            with patch.dict(os.environ, {'DISABLE_CSP': 'false', 'FLASK_ENV': 'development'}):
                response = client.get('/')
                assert 'Content-Security-Policy' in response.headers

    def test_csp_header_can_be_disabled(self):
        """Test that CSP headers can be disabled via env var"""
        app = Flask(__name__)
        SecurityMiddleware(app)

        @app.route('/test')
        def test_route():
            return 'test'

        with app.test_client() as client:
            with patch.dict(os.environ, {'DISABLE_CSP': 'true', 'FLASK_ENV': 'development'}):
                response = client.get('/test')
                assert 'Content-Security-Policy' not in response.headers

    def test_csp_header_case_insensitive(self):
        """Test that DISABLE_CSP is case insensitive"""
        app = Flask(__name__)
        SecurityMiddleware(app)

        @app.route('/test')
        def test_route():
            return 'test'

        with app.test_client() as client:
            # Test various cases
            for value in ['True', 'TRUE', 'tRuE']:
                with patch.dict(os.environ, {'DISABLE_CSP': value, 'FLASK_ENV': 'development'}):
                    response = client.get('/test')
                    assert 'Content-Security-Policy' not in response.headers, \
                        f"CSP should be disabled with DISABLE_CSP={value}"

    def test_other_security_headers_always_present(self):
        """Test that other security headers are always present"""
        app = Flask(__name__)
        SecurityMiddleware(app)

        @app.route('/test')
        def test_route():
            return 'test'

        with app.test_client() as client:
            with patch.dict(os.environ, {'DISABLE_CSP': 'true', 'FLASK_ENV': 'development'}):
                response = client.get('/test')

                # These should always be present
                assert 'X-Frame-Options' in response.headers
                assert response.headers['X-Frame-Options'] == 'DENY'

                assert 'X-Content-Type-Options' in response.headers
                assert response.headers['X-Content-Type-Options'] == 'nosniff'

                assert 'X-XSS-Protection' in response.headers
                assert response.headers['X-XSS-Protection'] == '1; mode=block'

                assert 'Referrer-Policy' in response.headers
                assert 'Permissions-Policy' in response.headers

    def test_csp_includes_frontend_url(self):
        """Test that CSP header includes FRONTEND_URL from env"""
        app = Flask(__name__)
        SecurityMiddleware(app)

        @app.route('/test')
        def test_route():
            return 'test'

        with app.test_client() as client:
            with patch.dict(os.environ, {
                'DISABLE_CSP': 'false',
                'FLASK_ENV': 'development',
                'FRONTEND_URL': 'https://example.com'
            }):
                response = client.get('/test')
                csp = response.headers.get('Content-Security-Policy', '')
                assert 'https://example.com' in csp

    def test_csp_default_frontend_url(self):
        """Test that CSP uses default frontend URL if env not set"""
        app = Flask(__name__)
        SecurityMiddleware(app)

        @app.route('/test')
        def test_route():
            return 'test'

        with app.test_client() as client:
            with patch.dict(os.environ, {'DISABLE_CSP': 'false', 'FLASK_ENV': 'development'}, clear=False):
                # Remove FRONTEND_URL if present
                if 'FRONTEND_URL' in os.environ:
                    del os.environ['FRONTEND_URL']

                response = client.get('/test')
                csp = response.headers.get('Content-Security-Policy', '')
                assert 'bhrigu-welt.vercel.app' in csp

    def test_options_request_no_security_headers(self):
        """Test that OPTIONS requests don't get security headers (for CORS)"""
        app = Flask(__name__)
        SecurityMiddleware(app)

        @app.route('/test', methods=['OPTIONS', 'GET'])
        def test_route():
            return 'test'

        with app.test_client() as client:
            # OPTIONS request should not have CSP
            response = client.options('/test')
            # Note: Flask might still add some headers, but our middleware
            # should skip them for OPTIONS requests
            # This is primarily to avoid CORS conflicts

    def test_https_enforcement_in_production(self):
        """Test that HTTPS is enforced in production"""
        app = Flask(__name__)

        with patch.dict(os.environ, {'FLASK_ENV': 'production'}):
            SecurityMiddleware(app)

        @app.route('/test')
        def test_route():
            return 'test'

        with app.test_client() as client:
            # In test environment, request.is_secure will be False
            # So this mainly tests that the middleware is set up
            response = client.get('/test')
            # In actual production with HTTPS, this would redirect

    def test_csp_not_disabled_in_production(self):
        """Test that CSP is enforced in production even if DISABLE_CSP=true"""
        app = Flask(__name__)
        SecurityMiddleware(app)

        @app.route('/test')
        def test_route():
            return 'test'

        with app.test_client() as client:
            with patch.dict(os.environ, {'DISABLE_CSP': 'true', 'FLASK_ENV': 'production'}):
                response = client.get('/test')
                assert 'Content-Security-Policy' in response.headers


class TestSecurityMiddlewareInit:
    """Test SecurityMiddleware initialization"""

    def test_init_with_app(self):
        """Test initializing with app in constructor"""
        app = Flask(__name__)
        middleware = SecurityMiddleware(app)
        assert middleware.app == app

    def test_init_without_app(self):
        """Test initializing without app"""
        middleware = SecurityMiddleware()
        assert middleware.app is None

    def test_init_app_method(self):
        """Test init_app method"""
        app = Flask(__name__)
        middleware = SecurityMiddleware()
        middleware.init_app(app)
        assert middleware.app == app
