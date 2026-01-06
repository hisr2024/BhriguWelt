"""
Configuration for the Bhrigu-Nadi Astrology System.
"""

import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
CORE_WISDOM_DIR = BASE_DIR / "core_wisdom"
TESTS_DIR = BASE_DIR / "tests"

# Core wisdom files
BHRIGU_RULES_FILE = CORE_WISDOM_DIR / "bhrigu_samhita_rules.md"
NADI_RULES_FILE = CORE_WISDOM_DIR / "nadi_jyotisha_rules.md"
RULE_INDEX_FILE = CORE_WISDOM_DIR / "rule_index.json"
GLOSSARY_FILE = CORE_WISDOM_DIR / "glossary.md"
EXAMPLES_DIR = CORE_WISDOM_DIR / "examples"

# Swiss Ephemeris
# The Swiss Ephemeris library will look for data files in these locations
EPHE_PATH = os.environ.get("EPHE_PATH", str(BASE_DIR / "ephemeris_data"))

# Calculation settings
AYANAMSA_MODE = 1  # Lahiri ayanamsa (most commonly used)
HOUSE_SYSTEM = b'P'  # Placidus house system

# Engine settings
ENGINE_VERSION = "1.0.0"
DEFAULT_TRADITION = "combined"  # bhrigu, nadi, or combined

# Dasha settings
VIMSHOTTARI_TOTAL_YEARS = 120
VIMSHOTTARI_PERIODS = {
    "Ketu": 7,
    "Venus": 20,
    "Sun": 6,
    "Moon": 10,
    "Mars": 7,
    "Rahu": 18,
    "Jupiter": 16,
    "Saturn": 19,
    "Mercury": 17
}

# Nakshatra data
NAKSHATRA_DEGREES = 13.333333  # Each nakshatra spans 13°20' = 13.333333°
NAKSHATRA_PADA_DEGREES = 3.333333  # Each pada is 1/4 of nakshatra

# Planetary orbs for aspects and conjunctions
CONJUNCTION_ORB = 10.0  # degrees
ASPECT_ORB = 5.0  # degrees
TRANSIT_ORB = 5.0  # degrees

# Sign and nakshatra mappings
SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Moola", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

NAKSHATRA_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
    "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun",
    "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
    "Jupiter", "Saturn", "Mercury"
]

# Planet-sign lordships
SIGN_LORDS = {
    "Aries": "Mars",
    "Taurus": "Venus",
    "Gemini": "Mercury",
    "Cancer": "Moon",
    "Leo": "Sun",
    "Virgo": "Mercury",
    "Libra": "Venus",
    "Scorpio": "Mars",
    "Sagittarius": "Jupiter",
    "Capricorn": "Saturn",
    "Aquarius": "Saturn",
    "Pisces": "Jupiter"
}

# Exaltation and debilitation
EXALTATION_SIGNS = {
    "Sun": "Aries",
    "Moon": "Taurus",
    "Mars": "Capricorn",
    "Mercury": "Virgo",
    "Jupiter": "Cancer",
    "Venus": "Pisces",
    "Saturn": "Libra"
}

DEBILITATION_SIGNS = {
    "Sun": "Libra",
    "Moon": "Scorpio",
    "Mars": "Cancer",
    "Mercury": "Pisces",
    "Jupiter": "Capricorn",
    "Venus": "Virgo",
    "Saturn": "Aries"
}

# Refusal message for non-astrology queries
REFUSAL_MESSAGE = "This system supports ONLY Nadi Jyotisha & Bhrigu Samhita astrology queries."

# Disclaimers
STANDARD_DISCLAIMERS = [
    "This analysis is based solely on Nadi Jyotisha and Bhrigu Samhita principles.",
    "Astrological insights are for guidance and self-reflection, not deterministic predictions.",
    "No medical, legal, or financial advice is provided. Consult appropriate professionals for such matters.",
    "Free will and personal effort significantly influence life outcomes.",
    "Remedial measures are suggestions rooted in traditional practices; results vary by individual."
]
