"""
BhriguWelt - Comprehensive Astrology API
Main application entry point
"""
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
import json
import uuid
from datetime import datetime
from pathlib import Path
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
    required_vars = ['OPENAI_API_KEY', 'SECRET_KEY', 'JWT_SECRET_KEY', 'FRONTEND_URL']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        _exit_startup([f"Missing required environment variables: {', '.join(missing_vars)}"])
    print("✓ All required environment variables are set")

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
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///bhriguwelt.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
logger.info("✓ Flask app initialized")

# Initialize CORS with strict origin checking
# Production URLs are hardcoded, FRONTEND_URL is optional for additional origins
FRONTEND_URL = os.getenv('FRONTEND_URL')

# Production frontend URLs - always allowed in production
# These are hardcoded to ensure backend works even without FRONTEND_URL env var
PRODUCTION_FRONTEND_URLS = [
    'https://bhrigu-welt.vercel.app',
    'https://bhriguwelt.vercel.app',
]

if IS_PRODUCTION:
    # Start with production URLs (guaranteed to have at least 2 URLs)
    allowed_origins = PRODUCTION_FRONTEND_URLS.copy()
    # Add FRONTEND_URL if set and not already in list
    if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
        allowed_origins.insert(0, FRONTEND_URL)
else:
    # Development: Allow localhost with common ports (guaranteed to have at least 4 URLs)
    allowed_origins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
    ] + PRODUCTION_FRONTEND_URLS

logger.info("Configuring CORS...")
# Configure CORS with explicit resource patterns and preflight handling
# IMPORTANT: Flask-CORS uses REGEX patterns, not glob patterns!
# r"/api/*" only matches /api/ + zero or more "/" chars - WRONG!
# r"/api/.*" matches /api/ + any characters - CORRECT!
CORS(app,
     resources={
         r"/api/.*": {
             "origins": allowed_origins,
             "methods": ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
             "allow_headers": ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-AI-Consent', 'X-AI-Mode'],
             "expose_headers": ['Content-Type', 'Authorization'],
             "supports_credentials": True,
             "max_age": 86400
         },
         r"/.*": {
             "origins": allowed_origins,
             "methods": ['GET', 'OPTIONS'],
             "supports_credentials": True
         }
     },
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-AI-Consent', 'X-AI-Mode'],
     expose_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
     max_age=86400)  # Cache preflight for 24 hours
logger.info("✓ CORS configured with origins: %s", allowed_origins)

# Helper function for origin validation
def is_origin_allowed(origin: str) -> bool:
    """
    Check if an origin is allowed for CORS requests.
    Production: Strict whitelist only
    Development: Localhost patterns + whitelist
    """
    if not origin:
        return False
    
    if IS_PRODUCTION:
        return origin in allowed_origins
    else:
        # Development: Allow localhost/127.0.0.1 origins or whitelisted origins
        return origin in allowed_origins or (
            origin.startswith('http://localhost:') or 
            origin.startswith('http://127.0.0.1:')
        )

# Explicit preflight handler for all routes - MUST return proper headers
def _assign_correlation_id():
    """Set a per-request correlation ID for response tracking."""
    request_id = request.headers.get('X-Request-ID') or request.headers.get('X-Correlation-ID')
    g.correlation_id = request_id or str(uuid.uuid4())

@app.before_request
def ensure_correlation_id():
    _assign_correlation_id()

@app.before_request
def handle_preflight():
    """Handle CORS preflight requests explicitly for all routes"""
    _assign_correlation_id()
    if request.method == 'OPTIONS':
        # Get the origin from the request
        origin = request.headers.get('Origin', '')

        # Create response for preflight
        response = app.make_default_options_response()

        # Check if origin is allowed using helper function
        if is_origin_allowed(origin):
            # CORS spec requires exact origin match when credentials are enabled
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-AI-Consent, X-AI-Mode'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '86400'
            response.headers['Vary'] = 'Origin'

        return response

# Add CORS headers to ALL responses - critical for actual requests after preflight
@app.after_request
def add_cors_headers(response):
    """Add CORS headers to all responses - ensures headers are present"""
    origin = request.headers.get('Origin', '')
    correlation_id = getattr(g, 'correlation_id', None)

    # Check if origin is allowed using helper function
    if is_origin_allowed(origin):
        # CORS spec requires exact origin match when credentials are enabled
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-AI-Consent, X-AI-Mode'
        response.headers['Vary'] = 'Origin'

    if correlation_id:
        response.headers['X-Correlation-ID'] = correlation_id
        response_data = response.get_json(silent=True)
        if isinstance(response_data, dict) and 'correlation_id' not in response_data:
            response_data['correlation_id'] = correlation_id
            response.set_data(json.dumps(response_data))
            response.headers['Content-Type'] = 'application/json'

    return response

logger.info("Initializing JWT Manager...")
jwt = JWTManager(app)
logger.info("✓ JWT Manager initialized")

# Initialize security middleware
logger.info("Initializing security middleware...")
try:
    from middleware.security import SecurityMiddleware
    from middleware.rate_limiter import setup_rate_limiter
    security_middleware = SecurityMiddleware(app)
    limiter = setup_rate_limiter(app)
    logger.info("✓ Security middleware initialized")
except Exception as e:
    log_exception(logger, e, context="Failed to initialize security middleware")

# Initialize Database
logger.info("Initializing database...")
try:
    from models import db, init_db, seed_initial_wisdom
    init_db(app)

    # Seed initial wisdom if database is empty
    try:
        seed_initial_wisdom()
    except Exception as e:
        log_exception(logger, e, context="Wisdom seeding skipped (may already exist)")

    logger.info("✓ Database initialized successfully")
except Exception as e:
    log_exception(logger, e, context="Database initialization failed")
    # Continue without database - API will still work with reduced functionality

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
    """Detailed health check"""
    # Check orchestrator status
    orchestrator_status = 'not_initialized'
    online_available = False
    offline_available = False
    bhrigu_init_error = None
    
    try:
        from services.prediction_orchestrator import get_prediction_orchestrator
        orchestrator = get_prediction_orchestrator()
        orchestrator_status = 'operational'
        online_available = bool(orchestrator.openai_service and orchestrator.openai_service.enabled)
        offline_available = bool(orchestrator.offline_wisdom)
    except Exception as e:
        logger.warning(f"Orchestrator check failed: {e}")

    try:
        from services.bhrigu_predictions import get_bhrigu_service_init_error
        bhrigu_init_error = get_bhrigu_service_init_error()
    except Exception as e:
        logger.warning(f"Bhrigu service error check failed: {e}")
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'api': 'operational',
            'database': 'operational',
            'openai': 'operational' if online_available else 'offline',
            'prediction_orchestrator': orchestrator_status,
            'offline_wisdom': 'operational' if offline_available else 'unavailable'
        },
        'errors': {
            'bhrigu_predictions_init': bhrigu_init_error
        },
        'features': {
            'online_predictions': online_available,
            'offline_predictions': offline_available,
            'hybrid_mode': online_available and offline_available,
            'trilingual_support': True
        }
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors with CORS headers"""
    origin = request.headers.get('Origin', '')
    response = jsonify({'error': 'Not found', 'message': str(error)})
    response.status_code = 404
    
    if is_origin_allowed(origin):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Vary'] = 'Origin'
    
    return response

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors with CORS headers"""
    origin = request.headers.get('Origin', '')
    log_exception(logger, error, context="Internal server error")
    response = jsonify({'error': 'Internal server error', 'message': 'An unexpected error occurred.'})
    response.status_code = 500
    
    if is_origin_allowed(origin):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Vary'] = 'Origin'
    
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all unhandled exceptions with CORS headers"""
    origin = request.headers.get('Origin', '')
    
    # Log the full error for debugging
    log_exception(logger, e, context="Unhandled exception")
    
    response = jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred.'
    })
    response.status_code = 500
    
    if is_origin_allowed(origin):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Vary'] = 'Origin'
    
    return response

logger.info("=" * 60)
logger.info("✓ BhriguWelt Backend Initialization Complete")
logger.info("=" * 60)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    logger.info("Starting development server on port %s...", port)
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
