"""
Input validation utilities for BhriguWelt API
"""
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import re

class ValidationError(Exception):
    """Custom validation error"""
    pass


def validate_date(date_str: str, field_name: str = "date") -> Tuple[bool, Optional[str]]:
    """
    Validate date string format (YYYY-MM-DD)

    Returns:
        (is_valid, error_message)
    """
    if not date_str:
        return False, f"{field_name} is required"

    try:
        datetime.strptime(date_str, '%Y-%m-%d')

        # Check if date is reasonable (between 1900 and current year + 100)
        year = int(date_str.split('-')[0])
        current_year = datetime.now().year
        if year < 1900 or year > current_year + 100:
            return False, f"{field_name} year must be between 1900 and {current_year + 100}"

        return True, None
    except ValueError:
        return False, f"{field_name} must be in YYYY-MM-DD format"


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
