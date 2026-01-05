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
PRODUCTION_FRONTEND_URLS = [
    'https://bhrigu-welt.vercel.app',
    'https://bhriguwelt.vercel.app',
    'https://www.bhriguwelt.com',  # If custom domain exists
]

if IS_PRODUCTION:
    # Start with production URLs
    allowed_origins = PRODUCTION_FRONTEND_URLS.copy()
    # Add FRONTEND_URL if set and not already in list
    if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
        allowed_origins.insert(0, FRONTEND_URL)
else:
    # Development: Allow localhost with common ports
    allowed_origins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
    ]

print("Configuring CORS...")
# Configure CORS with explicit resource patterns and preflight handling
# Use wildcard patterns to ensure all API routes are covered
CORS(app,
     resources={
         r"/api/*": {
             "origins": allowed_origins,
             "methods": ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
             "allow_headers": ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-AI-Consent', 'X-AI-Mode'],
             "expose_headers": ['Content-Type', 'Authorization'],
             "supports_credentials": True,
             "max_age": 86400
         },
         r"/*": {
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

# Explicit preflight handler for all routes - MUST return proper headers
@app.before_request
def handle_preflight():
    """Handle CORS preflight requests explicitly for all routes"""
    if request.method == 'OPTIONS':
        # Get the origin from the request
        origin = request.headers.get('Origin', '')

        # Create response for preflight
        response = app.make_default_options_response()

        # In development, allow any origin for testing; in production, check allowed list
        if not IS_PRODUCTION or origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin if origin else '*'
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

    # In development, allow any origin; in production, check allowed list
    if not IS_PRODUCTION or origin in allowed_origins:
        # Always set these headers for allowed origins
        response.headers['Access-Control-Allow-Origin'] = origin if origin else '*'
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
    print("✓ All route modules imported successfully")
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
print("✓ All blueprints registered")

@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'BhriguWelt Astrology API is running',
        'version': '1.0.0',
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
            'users': '/api/users',
            'ai': '/api/ai',
            'bhrigu_predictions': '/api/bhrigu-predictions'
        }
    })

@app.route('/health')
def health():
    """Detailed health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'api': 'operational',
            'database': 'operational',
            'sarvam_ai': 'operational'
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found', 'message': str(error)}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

print("=" * 60)
print("✓ BhriguWelt Backend Initialization Complete")
print("=" * 60)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    print(f"Starting development server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
