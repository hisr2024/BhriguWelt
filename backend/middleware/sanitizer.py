"""
Request sanitization middleware
Validates and sanitizes all incoming requests
"""
import re
from typing import Dict, Any, List
from flask import request, make_response
from functools import wraps
import html


class RequestSanitizer:
    """
    Sanitize and validate incoming requests
    Prevents injection attacks and malformed data
    """
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """Sanitize string input"""
        if not isinstance(value, str):
            return str(value)
        
        # Trim whitespace
        value = value.strip()
        
        # Limit length
        value = value[:max_length]
        
        # HTML escape
        value = html.escape(value)
        
        # Remove control characters
        value = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
        
        return value
    
    @staticmethod
    def sanitize_for_ai(birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize birth data for AI API calls
        Remove all PII, keep only astrological data
        """
        # Allowed fields only (no PII)
        allowed_fields = [
            'zodiac_sign',
            'nakshatra',
            'moon_sign',
            'ascendant',
            'planetary_positions',
            'houses',
            'dasha_period',
            'yogas',
            'doshas',
            'elements',
            'qualities',
            'karmic_number'
        ]
        
        sanitized = {}
        for field in allowed_fields:
            if field in birth_data:
                value = birth_data[field]
                
                # Sanitize string values
                if isinstance(value, str):
                    sanitized[field] = RequestSanitizer.sanitize_string(value, max_length=100)
                elif isinstance(value, (dict, list)):
                    # Keep structured data as-is (already validated)
                    sanitized[field] = value
                elif isinstance(value, (int, float)):
                    sanitized[field] = value
        
        return sanitized
    
    @staticmethod
    def validate_birth_data(data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Validate birth data structure and values
        Returns (is_valid, error_message)
        """
        required_fields = ['date_of_birth', 'time_of_birth', 'latitude', 'longitude']
        
        # Check required fields
        for field in required_fields:
            if field not in data:
                return False, f'Missing required field: {field}'
        
        # Validate date format (YYYY-MM-DD)
        date_pattern = r'^\d{4}-\d{2}-\d{2}$'
        if not re.match(date_pattern, str(data['date_of_birth'])):
            return False, 'Invalid date format. Use YYYY-MM-DD'
        
        # Validate time format (HH:MM)
        time_pattern = r'^\d{2}:\d{2}(:\d{2})?$'
        if not re.match(time_pattern, str(data['time_of_birth'])):
            return False, 'Invalid time format. Use HH:MM or HH:MM:SS'
        
        # Validate latitude (-90 to 90)
        try:
            lat = float(data['latitude'])
            if not -90 <= lat <= 90:
                return False, 'Latitude must be between -90 and 90'
        except (ValueError, TypeError):
            return False, 'Invalid latitude value'
        
        # Validate longitude (-180 to 180)
        try:
            lon = float(data['longitude'])
            if not -180 <= lon <= 180:
                return False, 'Longitude must be between -180 and 180'
        except (ValueError, TypeError):
            return False, 'Invalid longitude value'
        
        return True, ''
    
    @staticmethod
    def validate_zodiac_sign(sign: str) -> bool:
        """Validate zodiac sign"""
        valid_signs = [
            'Aries', 'Taurus', 'Gemini', 'Cancer',
            'Leo', 'Virgo', 'Libra', 'Scorpio',
            'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ]
        return sign in valid_signs
    
    @staticmethod
    def validate_nakshatra(nakshatra: str) -> bool:
        """Validate nakshatra"""
        valid_nakshatras = [
            'Ashwini', 'Bharani', 'Krittika', 'Rohini',
            'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya',
            'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
            'Hasta', 'Chitra', 'Swati', 'Vishakha',
            'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
            'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
            'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
        ]
        return nakshatra in valid_nakshatras
    
    @staticmethod
    def sanitize_ai_response(response: str) -> str:
        """
        Sanitize AI response to prevent XSS
        """
        # Remove script tags
        response = re.sub(r'<script[^>]*>.*?</script>', '', response, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove event handlers
        response = re.sub(r'\son\w+\s*=\s*["\'][^"\']*["\']', '', response, flags=re.IGNORECASE)
        
        # Remove javascript: protocol
        response = re.sub(r'javascript:', '', response, flags=re.IGNORECASE)
        
        # HTML escape (preserve markdown formatting)
        # response = html.escape(response)
        
        return response
    
    @staticmethod
    def limit_request_size(max_bytes: int = 1048576):  # 1MB default
        """Decorator to limit request body size"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                if request.content_length and request.content_length > max_bytes:
                    return make_response({
                        'error': 'Request too large',
                        'max_size': f'{max_bytes} bytes'
                    }, 413)
                return f(*args, **kwargs)
            return decorated_function
        return decorator


def validate_request_data(schema: Dict[str, type]):
    """
    Decorator to validate request data against a schema
    
    Example:
        @validate_request_data({
            'name': str,
            'date_of_birth': str,
            'latitude': float
        })
        def create_profile():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return make_response({'error': 'Content-Type must be application/json'}, 400)
            
            data = request.get_json()
            
            # Check required fields
            for field, field_type in schema.items():
                if field not in data:
                    return make_response({
                        'error': f'Missing required field: {field}'
                    }, 400)
                
                # Check field type
                if not isinstance(data[field], field_type):
                    return make_response({
                        'error': f'Field {field} must be of type {field_type.__name__}'
                    }, 400)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def sanitize_ai_request():
    """Decorator to sanitize birth data before sending to AI"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.is_json:
                data = request.get_json()
                if 'birth_data' in data:
                    data['birth_data'] = RequestSanitizer.sanitize_for_ai(data['birth_data'])
                # Update request data
                request._cached_json = (data, data)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
