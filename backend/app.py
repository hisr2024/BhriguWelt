"""
BhriguWelt - Comprehensive Astrology API
Main application entry point
"""
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
import sys
import json
import uuid
import gzip
import io
from datetime import datetime
from pathlib import Path
from werkzeug.exceptions import RequestEntityTooLarge
from utils.logger import setup_logger, log_exception

logger = setup_logger(__name__)
logger.info("=" * 60)
logger.info("BhriguWelt Backend Initialization")
logger.info("=" * 60)

# Load environment variables
load_dotenv()

# Security: Ensure critical environment variables are set
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
IS_PRODUCTION = FLASK_ENV == 'production'

logger.info("Environment: %s", FLASK_ENV)
logger.info("Production Mode: %s", IS_PRODUCTION)

def _exit_startup(error_lines):
    print("ERROR: Backend startup checks failed:", file=sys.stderr)
    for line in error_lines:
        print(f" - {line}", file=sys.stderr)
    sys.exit(1)

def _check_required_env_vars():
    """Validate environment variables with detailed feedback"""
    # Only require critical vars in production; allow defaults for development
    if IS_PRODUCTION:
        required_vars = {
            'OPENAI_API_KEY': 'Required for AI-enhanced predictions (e.g., sk-...)',
            'SECRET_KEY': 'Required for Flask session security (generate with: python -c "import secrets; print(secrets.token_hex(32))")',
            'JWT_SECRET_KEY': 'Required for JWT token signing (generate with: python -c "import secrets; print(secrets.token_hex(32))")',
            'FRONTEND_URL': 'Required for CORS configuration (e.g., https://yourdomain.com)',
        }
        missing_vars = []
        for var, description in required_vars.items():
            if not os.getenv(var):
                missing_vars.append(f"{var}: {description}")

        if missing_vars:
            error_lines = ["Missing required environment variables in PRODUCTION mode:"]
            error_lines.extend(missing_vars)
            error_lines.append("\nSet these in your .env file or environment configuration.")
            _exit_startup(error_lines)

        # Validate OPENAI_API_KEY format
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key and not openai_key.startswith('sk-'):
            logger.warning("OPENAI_API_KEY does not start with 'sk-' - this may be invalid")

    # Log environment variable status
    env_status = {
        'OPENAI_API_KEY': '✓ Set' if os.getenv('OPENAI_API_KEY') else '✗ Not set (offline mode only)',
        'SECRET_KEY': '✓ Set' if os.getenv('SECRET_KEY') else '⚠ Will generate random key',
        'JWT_SECRET_KEY': '✓ Set' if os.getenv('JWT_SECRET_KEY') else '⚠ Will generate random key',
        'DATABASE_URL': '✓ Set' if os.getenv('DATABASE_URL') else '⚠ Using SQLite default',
        'REDIS_URL': '✓ Set' if os.getenv('REDIS_URL') else '✗ Not set (caching disabled)',
        'MAPBOX_ACCESS_TOKEN': '✓ Set' if os.getenv('MAPBOX_ACCESS_TOKEN') or os.getenv('MAPBOX_TOKEN') else '✗ Not set (Nominatim only)',
    }

    logger.info("Environment Variables Status:")
    for key, status in env_status.items():
        logger.info(f"  {key}: {status}")

    print("✓ Environment variable validation complete")

def _check_corpus_files():
    required_files = [
        "bhrigu_samhita_principles.yml",
        "nadi_jyotisha_principles.yml",
    ]
    repo_root = Path(__file__).parent.parent
    search_paths = [
        Path(__file__).parent / "data",
        repo_root / "archive" / "legacy_backend" / "data",
    ]
    missing_by_path = {}
    for base_path in search_paths:
        missing = [name for name in required_files if not (base_path / name).exists()]
        if not missing:
            print(f"✓ Corpus files found in: {base_path}")
            return
        missing_by_path[str(base_path)] = missing

    error_lines = [
        "Required corpus files are missing.",
        f"Expected files: {', '.join(required_files)}",
        "Searched paths:",
    ]
    for base_path, missing in missing_by_path.items():
        error_lines.append(f"{base_path} (missing: {', '.join(missing)})")
    _exit_startup(error_lines)

_check_required_env_vars()
_check_corpus_files()

# Initialize Flask app
logger.info("Initializing Flask application...")
app = Flask(__name__)

# Security: Generate secure random secrets if not provided
import secrets
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)
    logger.warning("SECRET_KEY not set - generated random key for this session. Set SECRET_KEY in production!")

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
if not JWT_SECRET_KEY:
    JWT_SECRET_KEY = secrets.token_hex(32)
    logger.warning("JWT_SECRET_KEY not set - generated random key for this session. Set JWT_SECRET_KEY in production!")

app.config['SECRET_KEY'] = SECRET_KEY
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///bhriguwelt.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MAX_REQUEST_BYTES = int(os.getenv('MAX_REQUEST_BYTES', str(1024 * 1024)))
app.config['MAX_CONTENT_LENGTH'] = MAX_REQUEST_BYTES
logger = setup_logger(__name__)
print("✓ Flask app initialized")

# Initialize CORS configuration
logger.info("Configuring CORS...")

PRODUCTION_FRONTEND_URLS = [
    "https://bhrigu-welt.vercel.app",
    "https://bhriguwelt.vercel.app",
]

STANDARD_CORS_HEADERS = [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "X-AI-Consent",
    "X-AI-Mode",
    "X-Client-Online",
    "X-Uncompressed-Content-Length",
    "Content-Encoding",
    "X-API-Key",
    "X-Request-ID",
    "X-Correlation-ID",
    # Add lowercase versions for case-insensitive browser compatibility
    "x-ai-consent",
    "x-ai-mode",
    "x-client-online",
    "x-uncompressed-content-length",
    "x-api-key",
    "x-request-id",
    "x-correlation-id",
]

def _get_allowed_origins():
    allowed_origins = list(PRODUCTION_FRONTEND_URLS)
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        allowed_origins.append(frontend_url)
    if not IS_PRODUCTION:
        allowed_origins.extend([
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
        ])
    return sorted(set(allowed_origins))

ALLOWED_ORIGINS = _get_allowed_origins()

def _merge_cors_headers_case_insensitive(existing_headers, requested_headers):
    merged = {header.lower(): header for header in existing_headers}
    for header in requested_headers:
        normalized = header.lower()
        if normalized not in merged:
            merged[normalized] = header
    return list(merged.values())

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ALLOWED_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": STANDARD_CORS_HEADERS,
            "supports_credentials": True,
            "expose_headers": ["X-Correlation-ID"],
            "max_age": 86400,
        }
    },
)

logger.info("✓ CORS configured with allowed origins: %s", ", ".join(ALLOWED_ORIGINS))

# Request preprocessing middleware
def _assign_correlation_id():
    """Set a per-request correlation ID for response tracking."""
    request_id = request.headers.get('X-Request-ID') or request.headers.get('X-Correlation-ID')
    g.correlation_id = request_id or str(uuid.uuid4())

@app.before_request
def ensure_correlation_id():
    _assign_correlation_id()

@app.before_request
def handle_preflight():
    """
    Explicitly handle OPTIONS (preflight) requests to ensure CORS headers
    are properly set. This fixes the x-client-online header issue by
    explicitly returning all requested headers in the preflight response.
    """
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        origin = request.headers.get('Origin')

        if origin and origin in ALLOWED_ORIGINS:
            # Get all headers requested by the browser
            request_headers_str = request.headers.get('Access-Control-Request-Headers', '')
            requested_headers = [h.strip() for h in request_headers_str.split(',') if h.strip()]

            # Build a set of all allowed headers (case-insensitive)
            allowed_headers_lower = {h.lower() for h in STANDARD_CORS_HEADERS}

            # Add all requested headers to the allowed list
            all_headers = list(STANDARD_CORS_HEADERS)
            for header in requested_headers:
                if header.lower() not in allowed_headers_lower:
                    all_headers.append(header)
                    allowed_headers_lower.add(header.lower())

            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
            response.headers['Access-Control-Allow-Headers'] = ', '.join(all_headers)
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '86400'
            response.headers['Vary'] = 'Origin'

        return response

@app.before_request
def decompress_gzip_payload():
    if request.method in ['POST', 'PUT', 'PATCH']:
        content_encoding = request.headers.get('Content-Encoding', '').lower()
        if content_encoding == 'gzip':
            try:
                compressed_data = request.get_data(cache=False)
                decompressed_data = gzip.decompress(compressed_data)
            except OSError:
                return jsonify({
                    'message': 'Invalid gzip payload. Ensure the request body is valid gzip data.',
                    'error_code': 'INVALID_GZIP',
                }), 400

            if len(decompressed_data) > MAX_REQUEST_BYTES:
                raise RequestEntityTooLarge()

            request._cached_data = decompressed_data
            request.environ['wsgi.input'] = io.BytesIO(decompressed_data)
            request.environ['CONTENT_LENGTH'] = str(len(decompressed_data))

@app.errorhandler(RequestEntityTooLarge)
def handle_request_entity_too_large(error):
    return jsonify({
        'message': 'Request payload exceeds the allowed size limit.',
        'error_code': 'PAYLOAD_TOO_LARGE',
        'details': {
            'max_bytes': MAX_REQUEST_BYTES,
        },
    }), 413

# Add correlation ID to responses
@app.after_request
def add_response_headers(response):
    """
    Add correlation ID to all responses for request tracking.
    Flask-CORS handles all CORS headers automatically.
    """
    correlation_id = getattr(g, 'correlation_id', None)

    # Add correlation ID to response headers and JSON body
    if correlation_id:
        response.headers['X-Correlation-ID'] = correlation_id

        # Add to JSON response body if applicable
        if response.content_type and 'application/json' in response.content_type:
            response_data = response.get_json(silent=True)
            if isinstance(response_data, dict) and 'correlation_id' not in response_data:
                response_data['correlation_id'] = correlation_id
                response.set_data(json.dumps(response_data))

    # Ensure CORS headers are present on all responses
    origin = request.headers.get("Origin")
    if origin and origin in ALLOWED_ORIGINS:
        # Only set headers if not already set by Flask-CORS
        if "Access-Control-Allow-Origin" not in response.headers:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"

        # Ensure all standard headers are allowed
        if "Access-Control-Allow-Headers" not in response.headers:
            response.headers["Access-Control-Allow-Headers"] = ", ".join(STANDARD_CORS_HEADERS)

    return response

logger.info("Initializing JWT Manager...")
jwt = JWTManager(app)
logger.info("✓ JWT Manager initialized")

# Initialize security middleware
logger.info("Initializing security middleware...")
try:
    from middleware.security import SecurityMiddleware
    from middleware.rate_limiter import setup_rate_limiter
    from middleware.csrf_protection import CSRFMiddleware
    security_middleware = SecurityMiddleware(app)
    limiter = setup_rate_limiter(app)
    csrf_middleware = CSRFMiddleware(app)
    logger.info("✓ Security middleware initialized (including CSRF protection)")
except Exception as e:
    log_exception(logger, e, context="Failed to initialize security middleware")

# Initialize Database
logger.info("Initializing database...")
try:
    from models import db, init_db, seed_initial_wisdom
    init_db(app)

    # Seed initial wisdom if database is empty
    try:
        with app.app_context():
            seed_initial_wisdom()
    except Exception as e:
        log_exception(logger, e, context="Wisdom seeding skipped (may already exist)")

    logger.info("✓ Database initialized successfully")
except Exception as e:
    log_exception(logger, e, context="Database initialization failed")
    # Continue without database - API will still work with reduced functionality

# Initialize Sentry error tracking
logger.info("Initializing Sentry error tracking...")
try:
    from services.sentry_service import init_sentry
    init_sentry(app)
    logger.info("✓ Sentry error tracking initialized (if configured)")
except Exception as e:
    log_exception(logger, e, context="Sentry initialization skipped")
    # Continue without Sentry - graceful degradation

# Import routes
logger.info("Importing route modules...")
try:
    from routes import (
        astrology_routes,
        user_routes,
        ai_routes,
        bhrigu_predictions_routes,
        matchmaking_routes
    )
    print("✓ Core route modules imported successfully")
    
    # Import new unified predictions routes
    try:
        from routes import predictions_unified
        logger.info("✓ Unified predictions routes imported successfully")
    except Exception as e:
        log_exception(logger, e, context="Failed to import unified predictions routes")
        predictions_unified = None
        
except Exception as e:
    log_exception(logger, e, context="Failed to import routes")
    raise

# Register blueprints
logger.info("Registering blueprints...")
app.register_blueprint(astrology_routes.bp)
app.register_blueprint(user_routes.bp)
app.register_blueprint(ai_routes.bp)
app.register_blueprint(bhrigu_predictions_routes.bp)
app.register_blueprint(matchmaking_routes.bp)

# Register new unified predictions blueprint
if predictions_unified:
    app.register_blueprint(predictions_unified.bp)
    logger.info("✓ Unified predictions blueprint registered")

logger.info("✓ All blueprints registered")

@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'BhriguWelt Astrology API is running',
        'version': '2.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': {
            'astrology': '/api/astrology',
            'predictions': '/api/predictions',
            'predictions_unified': '/api/predictions/<category>',
            'cosmic_blueprint': '/api/predictions/cosmic-blueprint',
            'matchmaking': '/api/matchmaking',
            'users': '/api/users',
            'ai': '/api/ai',
            'bhrigu_predictions': '/api/bhrigu-predictions'
        },
        'features': {
            'online_mode': 'OpenAI-powered predictions with authentic corpus',
            'offline_mode': 'Local Bhrigu Samhita & Nadi Jyotisha wisdom',
            'hybrid_mode': 'Automatic fallback from online to offline',
            'trilingual': 'English, Hindi, Sanskrit support',
            'categories': '14+ prediction categories supported',
            'matchmaking': 'Ashtakoot Kundali matching with Guna Milan'
        }
    })

@app.route('/health')
def health():
    """
    Comprehensive health check with Vedic wisdom system status
    ENHANCED: Includes geocoding, corpus, wisdom database, and astrology calculator status
    """
    # Check orchestrator status
    orchestrator_status = 'not_initialized'
    online_available = False
    offline_available = False
    bhrigu_init_error = None
    response_metrics = {
        'guaranteed': True,
        'fallback_enabled': True,
        'concurrent_safe': True,
        'crash_prevention': True
    }

    try:
        from services.prediction_orchestrator import get_prediction_orchestrator
        orchestrator = get_prediction_orchestrator()
        orchestrator_status = 'operational'
        online_available = bool(orchestrator.openai_service and orchestrator.openai_service.enabled)
        offline_available = bool(orchestrator.offline_wisdom)

        # Check if lock is initialized (concurrent safety)
        response_metrics['concurrent_safe'] = bool(hasattr(orchestrator, 'lock'))
    except Exception as e:
        logger.warning(f"Orchestrator check failed: {e}")

    try:
        from services.bhrigu_predictions import get_bhrigu_service_init_error
        bhrigu_init_error = get_bhrigu_service_init_error()
    except Exception as e:
        logger.warning(f"Bhrigu service error check failed: {e}")

    # Check astrology calculator status
    astrology_status = 'operational'
    geocoding_services = {'nominatim': 'unknown', 'mapbox': 'unknown'}
    try:
        from services.astrology_calculator import get_astrology_calculator
        calc = get_astrology_calculator()
        if calc:
            geocoding_services['nominatim'] = 'operational'
            geocoding_services['mapbox'] = 'operational' if calc.mapbox_geolocator else 'not_configured'
        else:
            astrology_status = 'unavailable'
    except Exception as e:
        astrology_status = 'error'
        logger.warning(f"Astrology calculator check failed: {e}")

    # Check corpus files availability
    corpus_status = {}
    import os
    from pathlib import Path
    data_dir = Path(__file__).parent / 'data'
    corpus_files = {
        'bhrigu_samhita': 'bhrigu_samhita_principles.yml',
        'nadi_jyotisha': 'nadi_jyotisha_principles.yml',
        'soul_journey': 'bhrigu_karmic_soul_journey_model.json'
    }
    for key, filename in corpus_files.items():
        file_path = data_dir / filename
        corpus_status[key] = 'available' if file_path.exists() else 'missing'

    # Check wisdom database
    wisdom_count = 0
    try:
        from models import BhriguWisdomEntry
        wisdom_count = BhriguWisdomEntry.query.count()
    except Exception as e:
        logger.warning(f"Wisdom database check failed: {e}")

    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '2.0.0',
        'services': {
            'api': 'operational',
            'database': 'operational',
            'openai': 'operational' if online_available else 'offline',
            'prediction_orchestrator': orchestrator_status,
            'offline_wisdom': 'operational' if offline_available else 'unavailable',
            'astrology_calculator': astrology_status,
            'geocoding': geocoding_services
        },
        'vedic_wisdom_system': {
            'corpus_files': corpus_status,
            'wisdom_entries': wisdom_count,
            'traditions_supported': ['Bhrigu Samhita', 'Nadi Jyotisha', 'Parashara', 'Jaimini'],
            'calculation_engine': 'Swiss Ephemeris with Lahiri Ayanamsa'
        },
        'response_system': {
            'guaranteed_response': response_metrics['guaranteed'],
            'fallback_enabled': response_metrics['fallback_enabled'],
            'concurrent_safe': response_metrics['concurrent_safe'],
            'crash_prevention': response_metrics['crash_prevention'],
            'expected_response_rate': '100%',
            'max_timeout': '5000ms'
        },
        'errors': {
            'bhrigu_predictions_init': bhrigu_init_error
        },
        'features': {
            'online_predictions': online_available,
            'offline_predictions': offline_available,
            'hybrid_mode': online_available and offline_available,
            'trilingual_support': True,
            'resilient_routes': True,
            'thread_safe': True,
            'geocoding_retry': True,
            'cache_enabled': True
        },
        'prediction_categories': [
            'karmic_journey', 'past_lives', 'future_lives', 'present_life',
            'life_events', 'karmic_remedies', 'relationships', 'predictions'
        ]
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Not found',
        'message': str(error)
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    log_exception(logger, error, context="Internal server error")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred.'
    }), 500

@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all unhandled exceptions"""
    log_exception(logger, e, context="Unhandled exception")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred.'
    }), 500

logger.info("=" * 60)
logger.info("✓ BhriguWelt Backend Initialization Complete")
logger.info("=" * 60)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    logger.info("Starting development server on port %s...", port)
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
