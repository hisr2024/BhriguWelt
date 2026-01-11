"""
Enhanced Input Validators
Comprehensive validation for all user inputs with security checks
"""
import re
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, date
from utils.logger import setup_logger

logger = setup_logger(__name__)


class ValidationError(Exception):
    """Custom validation error"""
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")


class EnhancedValidator:
    """
    Enhanced validation for birth data, user inputs, and API requests
    Includes security checks for injection attacks and malicious inputs
    """

    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
        r"(--|\#|\/\*|\*\/)",
        r"(\bOR\b.*=.*)",
        r"(\bAND\b.*=.*)",
        r"(;\s*(DROP|DELETE|UPDATE))",
    ]

    # XSS patterns
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<object",
        r"<embed",
    ]

    # Valid timezone patterns
    VALID_TIMEZONES = [
        'Asia/Kolkata', 'Asia/Dubai', 'America/New_York', 'America/Los_Angeles',
        'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore',
        'Australia/Sydney', 'UTC', 'GMT'
    ]

    @staticmethod
    def validate_birth_data(data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """
        Comprehensive validation of birth data
        Returns: (is_valid, validated_data_or_errors)
        """
        errors = {}
        validated = {}

        try:
            # Validate date
            date_str = data.get('date')
            if not date_str:
                errors['date'] = "Birth date is required"
            else:
                try:
                    # Check for injection
                    if EnhancedValidator._check_injection(date_str):
                        errors['date'] = "Invalid date format"
                    else:
                        parsed_date = datetime.strptime(date_str, '%Y-%m-%d')

                        # Check if date is reasonable (1900-2100)
                        if parsed_date.year < 1900 or parsed_date.year > 2100:
                            errors['date'] = "Birth year must be between 1900 and 2100"
                        else:
                            validated['date'] = date_str
                except ValueError:
                    errors['date'] = "Invalid date format. Use YYYY-MM-DD"

            # Validate time
            time_str = data.get('time')
            if not time_str:
                errors['time'] = "Birth time is required"
            else:
                try:
                    # Check for injection
                    if EnhancedValidator._check_injection(time_str):
                        errors['time'] = "Invalid time format"
                    else:
                        # Parse time (HH:MM or HH:MM:SS format)
                        time_parts = time_str.split(':')
                        if len(time_parts) >= 2:
                            hour = int(time_parts[0])
                            minute = int(time_parts[1])

                            if hour < 0 or hour > 23:
                                errors['time'] = "Hour must be between 0 and 23"
                            elif minute < 0 or minute > 59:
                                errors['time'] = "Minute must be between 0 and 59"
                            else:
                                validated['time'] = time_str
                        else:
                            errors['time'] = "Invalid time format. Use HH:MM"
                except (ValueError, IndexError):
                    errors['time'] = "Invalid time format. Use HH:MM"

            # Validate location
            location = data.get('location', '').strip()
            if not location:
                errors['location'] = "Birth location is required"
            else:
                # Check for XSS and injection
                if EnhancedValidator._check_xss(location) or EnhancedValidator._check_injection(location):
                    errors['location'] = "Invalid location format"
                elif len(location) > 200:
                    errors['location'] = "Location name too long (max 200 characters)"
                else:
                    validated['location'] = location

            # Validate latitude (if provided)
            if 'latitude' in data:
                try:
                    lat = float(data['latitude'])
                    if lat < -90 or lat > 90:
                        errors['latitude'] = "Latitude must be between -90 and 90"
                    else:
                        validated['latitude'] = lat
                except (ValueError, TypeError):
                    errors['latitude'] = "Invalid latitude value"

            # Validate longitude (if provided)
            if 'longitude' in data:
                try:
                    lon = float(data['longitude'])
                    if lon < -180 or lon > 180:
                        errors['longitude'] = "Longitude must be between -180 and 180"
                    else:
                        validated['longitude'] = lon
                except (ValueError, TypeError):
                    errors['longitude'] = "Invalid longitude value"

            # Validate timezone (if provided)
            if 'timezone' in data:
                tz = data['timezone']
                if EnhancedValidator._check_injection(tz):
                    errors['timezone'] = "Invalid timezone format"
                elif tz not in EnhancedValidator.VALID_TIMEZONES and not tz.startswith('Asia/') and not tz.startswith('America/') and not tz.startswith('Europe/'):
                    # Allow some flexibility for timezones
                    logger.warning(f"Unusual timezone: {tz}")
                validated['timezone'] = tz

            # Validate name (if provided)
            if 'name' in data:
                name = data['name'].strip()
                if EnhancedValidator._check_xss(name) or EnhancedValidator._check_injection(name):
                    errors['name'] = "Invalid name format"
                elif len(name) > 100:
                    errors['name'] = "Name too long (max 100 characters)"
                else:
                    validated['name'] = name

            # Return results
            if errors:
                return False, errors
            else:
                return True, validated

        except Exception as e:
            logger.error(f"Validation error: {e}")
            return False, {'general': 'Validation failed'}

    @staticmethod
    def validate_question(question: str) -> Tuple[bool, str]:
        """
        Validate user question input
        Returns: (is_valid, error_message_or_cleaned_question)
        """
        if not question:
            return True, ""  # Optional field

        # Check length
        if len(question) > 5000:
            return False, "Question too long (max 5000 characters)"

        # Check for injection attacks
        if EnhancedValidator._check_injection(question):
            return False, "Invalid question format"

        # Check for XSS
        if EnhancedValidator._check_xss(question):
            return False, "Invalid question format"

        # Clean and return
        cleaned = question.strip()
        return True, cleaned

    @staticmethod
    def validate_matchmaking_data(person1: Dict, person2: Dict) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate matchmaking data for two persons
        Returns: (is_valid, errors_dict)
        """
        errors = {}

        # Validate person 1
        valid1, result1 = EnhancedValidator.validate_birth_data(person1)
        if not valid1:
            errors['person1'] = result1

        # Validate person 2
        valid2, result2 = EnhancedValidator.validate_birth_data(person2)
        if not valid2:
            errors['person2'] = result2

        return len(errors) == 0, errors

    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000) -> str:
        """
        Sanitize string input by removing dangerous characters
        """
        if not text:
            return ""

        # Remove null bytes
        text = text.replace('\x00', '')

        # Truncate to max length
        text = text[:max_length]

        # Remove control characters except newline and tab
        text = ''.join(char for char in text if char == '\n' or char == '\t' or not char.isascii() or ord(char) >= 32)

        return text.strip()

    @staticmethod
    def validate_category(category: str) -> bool:
        """
        Validate prediction category
        """
        valid_categories = [
            'karmic_journey',
            'past_lives',
            'future_lives',
            'present_life',
            'life_events',
            'karmic_remedies',
            'relationships',
            'predictions'
        ]

        return category in valid_categories

    @staticmethod
    def validate_mode(mode: str) -> bool:
        """
        Validate prediction mode
        """
        valid_modes = ['online', 'offline', 'hybrid']
        return mode in valid_modes

    @staticmethod
    def _check_injection(text: str) -> bool:
        """
        Check for SQL injection patterns
        """
        if not text:
            return False

        text_upper = text.upper()

        for pattern in EnhancedValidator.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_upper, re.IGNORECASE):
                logger.warning(f"Potential SQL injection detected: {pattern}")
                return True

        return False

    @staticmethod
    def _check_xss(text: str) -> bool:
        """
        Check for XSS attack patterns
        """
        if not text:
            return False

        text_lower = text.lower()

        for pattern in EnhancedValidator.XSS_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"Potential XSS attack detected: {pattern}")
                return True

        return False

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validate API key format
        """
        if not api_key:
            return False

        # Check length (typical API keys are 20-100 characters)
        if len(api_key) < 20 or len(api_key) > 200:
            return False

        # Check for valid characters (alphanumeric, hyphens, underscores)
        if not re.match(r'^[a-zA-Z0-9_-]+$', api_key):
            return False

        return True

    @staticmethod
    def validate_pagination(page: int, per_page: int) -> Tuple[bool, str]:
        """
        Validate pagination parameters
        """
        if page < 1:
            return False, "Page must be >= 1"

        if per_page < 1 or per_page > 100:
            return False, "Per page must be between 1 and 100"

        return True, ""

    @staticmethod
    def validate_date_range(start_date: str, end_date: str) -> Tuple[bool, str]:
        """
        Validate date range
        """
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')

            if start > end:
                return False, "Start date must be before end date"

            # Check range is reasonable (max 100 years)
            diff_days = (end - start).days
            if diff_days > 36500:  # ~100 years
                return False, "Date range too large (max 100 years)"

            return True, ""

        except ValueError:
            return False, "Invalid date format. Use YYYY-MM-DD"

    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Validate email format
        """
        if not email:
            return False

        # Basic email regex
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if not re.match(pattern, email):
            return False

        # Check length
        if len(email) > 254:  # RFC 5321
            return False

        return True

    @staticmethod
    def validate_phone(phone: str) -> bool:
        """
        Validate phone number format
        """
        if not phone:
            return False

        # Remove common separators
        cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)

        # Check if all digits
        if not cleaned.isdigit():
            return False

        # Check length (6-15 digits for international numbers)
        if len(cleaned) < 6 or len(cleaned) > 15:
            return False

        return True

    @staticmethod
    def rate_limit_check(identifier: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
        """
        Check if request should be rate limited
        Returns: True if allowed, False if rate limited
        """
        # This is a simplified check - production should use Redis or similar
        # For now, always return True
        return True


# Validation decorators for Flask routes
def validate_birth_data_decorator(f):
    """Decorator to validate birth data in request"""
    from functools import wraps
    from flask import request, jsonify

    @wraps(f)
    def decorated_function(*args, **kwargs):
        data = request.get_json()

        if not data:
            return jsonify({
                'error': 'No data provided',
                'error_code': 'MISSING_DATA'
            }), 400

        is_valid, result = EnhancedValidator.validate_birth_data(data)

        if not is_valid:
            return jsonify({
                'error': 'Validation failed',
                'errors': result,
                'error_code': 'VALIDATION_ERROR'
            }), 422

        # Add validated data to request
        request.validated_data = result

        return f(*args, **kwargs)

    return decorated_function


def validate_question_decorator(f):
    """Decorator to validate question parameter"""
    from functools import wraps
    from flask import request, jsonify

    @wraps(f)
    def decorated_function(*args, **kwargs):
        data = request.get_json()

        if data and 'question' in data:
            is_valid, result = EnhancedValidator.validate_question(data['question'])

            if not is_valid:
                return jsonify({
                    'error': 'Question validation failed',
                    'message': result,
                    'error_code': 'INVALID_QUESTION'
                }), 422

            data['question'] = result

        return f(*args, **kwargs)

    return decorated_function
