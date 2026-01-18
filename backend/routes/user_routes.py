"""
User API Routes
User management and profile endpoints
"""
from flask import Blueprint, request, jsonify
from utils.logger import setup_logger, log_exception
from utils.response_formatter import error_response, success_response
from middleware.passcode_rate_limiter import (
    is_device_locked,
    record_failed_passcode_attempt,
    reset_failed_attempts,
    get_lockout_info
)
import bcrypt
import os

bp = Blueprint('users', __name__, url_prefix='/api/users')
logger = setup_logger(__name__)

# Cache for bcrypt hashed passcode (generated once per server restart)
_cached_passcode_hash = None

def get_expected_passcode_hash():
    """Get or generate the bcrypt hash of the expected passcode"""
    global _cached_passcode_hash
    if _cached_passcode_hash is None:
        expected_passcode = os.getenv('DEFAULT_PASSCODE', '1234')
        _cached_passcode_hash = bcrypt.hashpw(expected_passcode.encode('utf-8'), bcrypt.gensalt())
        logger.info("Generated bcrypt hash for default passcode")
    return _cached_passcode_hash

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


@bp.route('/verify-passcode', methods=['POST'])
def verify_passcode():
    """
    Verify user passcode with brute-force protection.

    This endpoint implements rate limiting to prevent brute-force attacks:
    - Allows 10 failed attempts within 5 minutes
    - Locks device for 10 minutes after threshold exceeded
    - Resets attempts on successful verification

    Request JSON:
    {
        "device_id": "unique-device-identifier",
        "passcode": "1234"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return error_response("Request body is required", 400)

        device_id = data.get('device_id')
        passcode = data.get('passcode')

        # Validate required fields
        if not device_id:
            return error_response("device_id is required", 400)

        if not passcode:
            return error_response("passcode is required", 400)

        # Check if device is locked
        if is_device_locked(device_id):
            is_locked, attempts_remaining, lockout_ttl = get_lockout_info(device_id)

            logger.warning(f"Passcode attempt rejected: device {device_id} is locked")

            return error_response(
                f"Too many failed attempts. Device temporarily locked for {lockout_ttl} seconds.",
                429,  # HTTP 429 Too Many Requests
                error_code="DEVICE_LOCKED",
                details={
                    'lockout_ttl_seconds': lockout_ttl,
                    'retry_after': lockout_ttl
                }
            )

        # In production, verify against stored hash from database
        # For demo purposes, use cached bcrypt hash of env var
        expected_hash = get_expected_passcode_hash()

        # Verify passcode using bcrypt (secure constant-time comparison)
        passcode_matches = bcrypt.checkpw(passcode.encode('utf-8'), expected_hash)

        if passcode_matches:
            # Successful verification - reset attempts
            reset_failed_attempts(device_id)

            logger.info(f"Passcode verified successfully for device {device_id}")

            return success_response(
                data={'verified': True},
                message="Passcode verified successfully"
            )
        else:
            # Failed verification - record attempt
            attempts = record_failed_passcode_attempt(device_id)
            is_locked, attempts_remaining, _ = get_lockout_info(device_id)

            logger.warning(
                f"Failed passcode verification for device {device_id}: "
                f"{attempts} attempts, {attempts_remaining} remaining"
            )

            if is_locked:
                # Just got locked on this attempt
                _, _, lockout_ttl = get_lockout_info(device_id)
                return error_response(
                    f"Too many failed attempts. Device locked for {lockout_ttl} seconds.",
                    429,
                    error_code="DEVICE_LOCKED",
                    details={
                        'lockout_ttl_seconds': lockout_ttl,
                        'retry_after': lockout_ttl
                    }
                )

            return error_response(
                "Invalid passcode",
                401,
                error_code="INVALID_PASSCODE",
                details={
                    'attempts_remaining': attempts_remaining
                }
            )

    except Exception as e:
        log_exception(logger, e, context="users.verify_passcode")
        return error_response("Failed to verify passcode. Please try again later.", 500)


@bp.route('/passcode-status/<device_id>', methods=['GET'])
def passcode_status(device_id):
    """
    Get passcode lockout status for a device.

    This endpoint allows clients to check if a device is locked
    and how many attempts remain before lockout.

    Returns:
    {
        "status": "success",
        "data": {
            "is_locked": false,
            "attempts_remaining": 10,
            "lockout_ttl_seconds": 0
        }
    }
    """
    try:
        if not device_id:
            return error_response("device_id is required", 400)

        is_locked, attempts_remaining, lockout_ttl = get_lockout_info(device_id)

        return success_response(
            data={
                'is_locked': is_locked,
                'attempts_remaining': attempts_remaining,
                'lockout_ttl_seconds': lockout_ttl
            },
            message="Passcode status retrieved successfully"
        )

    except Exception as e:
        log_exception(logger, e, context="users.passcode_status")
        return error_response("Failed to get passcode status. Please try again later.", 500)
