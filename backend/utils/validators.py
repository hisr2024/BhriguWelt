"""
Input validation utilities for BhriguWelt API
"""
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import html
import re
from dateutil import parser

class ValidationError(Exception):
    """Custom validation error"""
    pass


def validate_date(date_str: str, field_name: str = "date") -> Tuple[bool, Optional[str]]:
    """
    Validate date string format across multiple common formats.

    Returns:
        (is_valid, error_message)
    """
    if not date_str:
        return False, f"{field_name} is required"

    try:
        parsed_date = parser.parse(str(date_str), dayfirst=False, yearfirst=False).date()
    except (ValueError, TypeError, OverflowError):
        return False, f"{field_name} must be a valid date format (e.g. YYYY-MM-DD, MM/DD/YYYY)"

    if parsed_date.year < 1900:
        return False, f"{field_name} year must be 1900 or later"

    if parsed_date > datetime.now().date():
        return False, f"{field_name} cannot be in the future"

    return True, None


def validate_time(time_str: str, field_name: str = "time") -> Tuple[bool, Optional[str]]:
    """
    Validate time string format (HH:MM or HH:MM:SS)

    Returns:
        (is_valid, error_message)
    """
    if not time_str:
        return False, f"{field_name} is required"

    # Try both formats
    for fmt in ['%H:%M', '%H:%M:%S']:
        try:
            datetime.strptime(time_str, fmt)
            return True, None
        except ValueError:
            continue

    return False, f"{field_name} must be in HH:MM or HH:MM:SS format"


def validate_place(place_str: str, field_name: str = "place") -> Tuple[bool, Optional[str]]:
    """
    Validate place name

    Returns:
        (is_valid, error_message)
    """
    if not place_str:
        return False, f"{field_name} is required"

    if len(place_str.strip()) < 2:
        return False, f"{field_name} must be at least 2 characters"

    if len(place_str) > 200:
        return False, f"{field_name} must be less than 200 characters"

    return True, None


def validate_email(email_str: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email format

    Returns:
        (is_valid, error_message)
    """
    if not email_str:
        return False, "Email is required"

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email_str):
        return False, "Invalid email format"

    return True, None


def validate_birth_details(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate complete birth details

    Returns:
        (is_valid, error_message)
    """
    # Validate date of birth
    is_valid, error = validate_date(data.get('date_of_birth', ''), 'Date of birth')
    if not is_valid:
        return False, error

    # Validate time of birth
    is_valid, error = validate_time(data.get('time_of_birth', ''), 'Time of birth')
    if not is_valid:
        return False, error

    # Validate place of birth
    is_valid, error = validate_place(data.get('place_of_birth', ''), 'Place of birth')
    if not is_valid:
        return False, error

    return True, None


def validate_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
    """
    Validate geographic coordinates

    Returns:
        (is_valid, error_message)
    """
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return False, "Latitude and longitude must be numbers"

    if lat < -90 or lat > 90:
        return False, "Latitude must be between -90 and 90"

    if lon < -180 or lon > 180:
        return False, "Longitude must be between -180 and 180"

    return True, None


def sanitize_input(value: str, max_length: int = 500) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks

    Args:
        value: Input string
        max_length: Maximum allowed length

    Returns:
        Sanitized string
    """
    if not isinstance(value, str):
        return str(value)

    # Remove potentially dangerous characters
    sanitized = value.strip()

    # Limit length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized


def sanitizeQuestion(value: str, max_length: int = 500) -> str:
    """
    Sanitize user questions by stripping HTML/JS and limiting length.

    Args:
        value: Input question
        max_length: Maximum allowed length

    Returns:
        Sanitized question string
    """
    if not isinstance(value, str):
        value = str(value)

    sanitized = value.strip()

    # Remove script tags and inline event handlers
    sanitized = re.sub(r'<script[^>]*>.*?</script>', '', sanitized, flags=re.DOTALL | re.IGNORECASE)
    sanitized = re.sub(r'\son\w+\s*=\s*["\'][^"\']*["\']', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)

    # Strip remaining HTML tags
    sanitized = re.sub(r'<[^>]+>', '', sanitized)
    sanitized = html.unescape(sanitized)

    # Remove control characters
    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', sanitized)

    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized


def validate_ai_mode(mode: str) -> Tuple[bool, Optional[str]]:
    """
    Validate AI mode selection

    Returns:
        (is_valid, error_message)
    """
    valid_modes = ['traditional', 'hybrid', 'conversational']

    if mode not in valid_modes:
        return False, f"Invalid AI mode. Must be one of: {', '.join(valid_modes)}"

    return True, None


def validate_report_type(report_type: str) -> Tuple[bool, Optional[str]]:
    """
    Validate report type

    Returns:
        (is_valid, error_message)
    """
    valid_types = [
        'birth-chart', 'karmic-journey', 'past-lives', 'future-lives',
        'present-life', 'life-events', 'karmic-remedies', 'predictions',
        'compatibility', 'daily', 'weekly', 'monthly', 'yearly'
    ]

    if report_type not in valid_types:
        return False, f"Invalid report type. Must be one of: {', '.join(valid_types)}"

    return True, None


def validate_birth_data(data: Dict[str, Any]) -> Optional[str]:
    """
    Validate birth data for Bhrigu predictions API.
    Accepts either place_of_birth (string) OR latitude/longitude (numbers).
    
    Returns:
        None if valid, error message string if invalid
    """
    if not data:
        return "Request body is required"
    
    # Validate date of birth (required)
    is_valid, error = validate_date(data.get('date_of_birth', ''), 'Date of birth')
    if not is_valid:
        return error
    
    # Validate time of birth (required)
    is_valid, error = validate_time(data.get('time_of_birth', ''), 'Time of birth')
    if not is_valid:
        return error
    
    # Must have either place_of_birth OR (latitude AND longitude)
    place = data.get('place_of_birth', '')
    has_place = bool(place.strip()) if isinstance(place, str) else False
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    has_coords = latitude is not None and longitude is not None
    
    if not has_place and not has_coords:
        return "Either place_of_birth or both latitude and longitude are required"
    
    # Validate coordinates if provided (even if place is also provided)
    if has_coords:
        is_valid, error = validate_coordinates(latitude, longitude)
        if not is_valid:
            return error
    
    return None  # Valid
