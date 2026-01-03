"""
BhriguWelt - Comprehensive Astrology API
Main application entry point
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables
load_dotenv()

# Security: Ensure critical environment variables are set in production
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
IS_PRODUCTION = FLASK_ENV == 'production'

if IS_PRODUCTION:
    # Enforce strict security in production
    required_vars = ['SECRET_KEY', 'JWT_SECRET_KEY', 'FRONTEND_URL']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        raise RuntimeError(f"Production mode requires environment variables: {', '.join(missing_vars)}")

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///bhriguwelt.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize CORS with strict origin checking
# In production, FRONTEND_URL must be set (checked above)
# In development, allow localhost origins only
FRONTEND_URL = os.getenv('FRONTEND_URL')
if IS_PRODUCTION and FRONTEND_URL:
    allowed_origins = [FRONTEND_URL]
else:
    # Development: Allow localhost with common ports
    allowed_origins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
    ]

CORS(app,
     origins=allowed_origins,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

jwt = JWTManager(app)

# Import routes
from routes import (
    astrology_routes,
    karmic_journey_routes,
    past_lives_routes,
    future_lives_routes,
    present_life_routes,
    life_events_routes,
    karmic_remedies_routes,
    predictions_routes,
    user_routes
)

# Register blueprints
app.register_blueprint(astrology_routes.bp)
app.register_blueprint(karmic_journey_routes.bp)
app.register_blueprint(past_lives_routes.bp)
app.register_blueprint(future_lives_routes.bp)
app.register_blueprint(present_life_routes.bp)
app.register_blueprint(life_events_routes.bp)
app.register_blueprint(karmic_remedies_routes.bp)
app.register_blueprint(predictions_routes.bp)
app.register_blueprint(user_routes.bp)

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
            'users': '/api/users'
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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
