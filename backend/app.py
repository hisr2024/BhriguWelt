"""
BhriguWelt - Comprehensive Astrology API
Main application entry point
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
import sys
from datetime import datetime

print("=" * 60)
print("BhriguWelt Backend Initialization")
print("=" * 60)

# Load environment variables
load_dotenv()

# Security: Ensure critical environment variables are set in production
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
IS_PRODUCTION = FLASK_ENV == 'production'

print(f"Environment: {FLASK_ENV}")
print(f"Production Mode: {IS_PRODUCTION}")

if IS_PRODUCTION:
    # Enforce strict security in production
    # Note: FRONTEND_URL is optional - we have hardcoded production URLs as fallback
    required_vars = ['SECRET_KEY', 'JWT_SECRET_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        error_msg = f"Production mode requires environment variables: {', '.join(missing_vars)}"
        print(f"ERROR: {error_msg}", file=sys.stderr)
        raise RuntimeError(error_msg)
    print("✓ All required environment variables are set")

# Initialize Flask app
print("Initializing Flask application...")
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///bhriguwelt.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
print("✓ Flask app initialized")

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

print("Configuring CORS...")
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
print(f"✓ CORS configured with origins: {allowed_origins}")

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
@app.before_request
def handle_preflight():
    """Handle CORS preflight requests explicitly for all routes"""
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

    # Check if origin is allowed using helper function
    if is_origin_allowed(origin):
        # CORS spec requires exact origin match when credentials are enabled
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-AI-Consent, X-AI-Mode'
        response.headers['Vary'] = 'Origin'

    return response

print("Initializing JWT Manager...")
jwt = JWTManager(app)
print("✓ JWT Manager initialized")

# Initialize security middleware
print("Initializing security middleware...")
try:
    from middleware.security import SecurityMiddleware
    from middleware.rate_limiter import setup_rate_limiter
    security_middleware = SecurityMiddleware(app)
    limiter = setup_rate_limiter(app)
    print("✓ Security middleware initialized")
except Exception as e:
    print(f"WARNING: Failed to initialize security middleware: {e}", file=sys.stderr)

# Initialize Database
print("Initializing database...")
try:
    from models import db, init_db, seed_initial_wisdom
    init_db(app)

    # Seed initial wisdom if database is empty
    try:
        seed_initial_wisdom()
    except Exception as e:
        print(f"Note: Wisdom seeding skipped (may already exist): {e}")

    print("✓ Database initialized successfully")
except Exception as e:
    print(f"WARNING: Database initialization failed: {e}", file=sys.stderr)
    # Continue without database - API will still work with reduced functionality

# Import routes
print("Importing route modules...")
try:
    from routes import (
        astrology_routes,
        karmic_journey_routes,
        past_lives_routes,
        future_lives_routes,
        present_life_routes,
        life_events_routes,
        karmic_remedies_routes,
        predictions_routes,
        user_routes,
        ai_routes,
        bhrigu_predictions_routes
    )
    print("✓ Legacy route modules imported successfully")
    
    # Import new unified predictions routes
    try:
        from routes import predictions_unified
        print("✓ Unified predictions routes imported successfully")
    except Exception as e:
        print(f"WARNING: Failed to import unified predictions routes: {e}", file=sys.stderr)
        predictions_unified = None
        
except Exception as e:
    print(f"ERROR: Failed to import routes: {e}", file=sys.stderr)
    raise

# Register blueprints
print("Registering blueprints...")
app.register_blueprint(astrology_routes.bp)
app.register_blueprint(karmic_journey_routes.bp)
app.register_blueprint(past_lives_routes.bp)
app.register_blueprint(future_lives_routes.bp)
app.register_blueprint(present_life_routes.bp)
app.register_blueprint(life_events_routes.bp)
app.register_blueprint(karmic_remedies_routes.bp)
app.register_blueprint(predictions_routes.bp)
app.register_blueprint(user_routes.bp)
app.register_blueprint(ai_routes.bp)
app.register_blueprint(bhrigu_predictions_routes.bp)

# Register new unified predictions blueprint
if predictions_unified:
    app.register_blueprint(predictions_unified.bp)
    print("✓ Unified predictions blueprint registered")

print("✓ All blueprints registered")

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
            'karmic_journey': '/api/karmic-journey',
            'past_lives': '/api/past-lives',
            'future_lives': '/api/future-lives',
            'present_life': '/api/present-life',
            'life_events': '/api/life-events',
            'karmic_remedies': '/api/karmic-remedies',
            'predictions': '/api/predictions',
            'predictions_unified': '/api/predictions/<category>',
            'cosmic_blueprint': '/api/predictions/cosmic-blueprint',
            'users': '/api/users',
            'ai': '/api/ai',
            'bhrigu_predictions': '/api/bhrigu-predictions'
        },
        'features': {
            'online_mode': 'OpenAI-powered predictions with authentic corpus',
            'offline_mode': 'Local Bhrigu Samhita & Nadi Jyotisha wisdom',
            'hybrid_mode': 'Automatic fallback from online to offline',
            'trilingual': 'English, Hindi, Sanskrit support',
            'categories': '14+ prediction categories supported'
        }
    })

@app.route('/health')
def health():
    """Detailed health check"""
    # Check orchestrator status
    orchestrator_status = 'not_initialized'
    online_available = False
    offline_available = False
    
    try:
        from services.prediction_orchestrator import get_prediction_orchestrator
        orchestrator = get_prediction_orchestrator()
        orchestrator_status = 'operational'
        online_available = bool(orchestrator.openai_service and orchestrator.openai_service.enabled)
        offline_available = bool(orchestrator.offline_wisdom)
    except Exception as e:
        logger.warning(f"Orchestrator check failed: {e}")
    
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
    response = jsonify({'error': 'Internal server error', 'message': str(error)})
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
    import traceback
    print(f"Unhandled exception: {str(e)}")
    traceback.print_exc()
    
    # Only expose safe error messages
    error_message = 'An unexpected error occurred'
    if not IS_PRODUCTION:
        # In development, provide more details but sanitize sensitive info
        error_str = str(e)
        # Avoid exposing file paths, credentials, or stack traces
        if not any(sensitive in error_str.lower() for sensitive in ['password', 'key', 'secret', 'token', '/home/', '/usr/']):
            error_message = error_str
    
    response = jsonify({
        'error': 'Internal server error',
        'message': error_message
    })
    response.status_code = 500
    
    if is_origin_allowed(origin):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Vary'] = 'Origin'
    
    return response

print("=" * 60)
print("✓ BhriguWelt Backend Initialization Complete")
print("=" * 60)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    print(f"Starting development server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
