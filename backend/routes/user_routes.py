"""
User API Routes
User management and profile endpoints
"""
from flask import Blueprint, request, jsonify
from utils.logger import setup_logger, log_exception
from utils.response_formatter import error_response

bp = Blueprint('users', __name__, url_prefix='/api/users')
logger = setup_logger(__name__)

@bp.route('/profiles', methods=['POST'])
def create_profile():
    """
    Create user profile

    Request JSON:
    {
        "name": "John Doe",
        "date_of_birth": "1990-01-15",
        "time_of_birth": "14:30",
        "place_of_birth": "New Delhi, India"
    }
    """
    try:
        data = request.get_json()

        # In a real app, save to database
        profile = {
            'id': 'generated-id',
            'name': data.get('name'),
            'date_of_birth': data.get('date_of_birth'),
            'time_of_birth': data.get('time_of_birth'),
            'place_of_birth': data.get('place_of_birth'),
            'created_at': '2025-01-03T00:00:00Z'
        }

        return jsonify({
            'status': 'success',
            'data': profile
        }), 201

    except Exception as e:
        log_exception(logger, e, context="users.create_profile")
        return error_response("Failed to create profile. Please try again later.", 500)

@bp.route('/profiles/<profile_id>', methods=['GET'])
def get_profile(profile_id):
    """Get user profile by ID"""
    try:
        # In a real app, fetch from database
        profile = {
            'id': profile_id,
            'name': 'John Doe',
            'date_of_birth': '1990-01-15',
            'time_of_birth': '14:30',
            'place_of_birth': 'New Delhi, India'
        }

        return jsonify({
            'status': 'success',
            'data': profile
        }), 200

    except Exception as e:
        log_exception(logger, e, context="users.get_profile")
        return error_response("Failed to fetch profile. Please try again later.", 500)

@bp.route('/profiles/<profile_id>', methods=['PUT'])
def update_profile(profile_id):
    """Update user profile"""
    try:
        data = request.get_json()

        # In a real app, update in database
        profile = {
            'id': profile_id,
            'name': data.get('name'),
            'date_of_birth': data.get('date_of_birth'),
            'time_of_birth': data.get('time_of_birth'),
            'place_of_birth': data.get('place_of_birth'),
            'updated_at': '2025-01-03T00:00:00Z'
        }

        return jsonify({
            'status': 'success',
            'data': profile
        }), 200

    except Exception as e:
        log_exception(logger, e, context="users.update_profile")
        return error_response("Failed to update profile. Please try again later.", 500)
