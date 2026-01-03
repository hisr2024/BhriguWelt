"""
Constants for AI service configuration
Centralized configuration values for AI features
"""

# PII Fields - Never to be transmitted to AI
PII_FIELDS = [
    'name',
    'email',
    'phone',
    'address',
    'birth_location',
    'place_of_birth',
    'exact_time',
    'date_of_birth',
    'time_of_birth',
    'latitude',
    'longitude',
    'city',
    'country'
]

# Allowed astrological fields for AI transmission
ALLOWED_ASTROLOGICAL_FIELDS = [
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

# Valid AI modes
AI_MODES = ['offline', 'hybrid', 'conversational']

# Rate limits (requests per minute)
AI_RATE_LIMIT = 10
GENERAL_RATE_LIMIT = 100

# Quotas
DEFAULT_DAILY_QUOTA = 1000
DEFAULT_MONTHLY_QUOTA = 30000
