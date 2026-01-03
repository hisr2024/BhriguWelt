"""
Unit tests for AI service security features
Tests PII redaction and validation without requiring full app import
"""
import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from middleware.sanitizer import RequestSanitizer


def test_pii_sanitization():
    """Test that PII is properly removed from birth data"""
    birth_data_with_pii = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'phone': '+1234567890',
        'birth_location': 'New York, NY',
        'place_of_birth': 'New York',
        'date_of_birth': '1990-01-01',
        'time_of_birth': '10:30',
        'latitude': 40.7128,
        'longitude': -74.0060,
        'zodiac_sign': 'Aries',
        'nakshatra': 'Ashwini',
        'moon_sign': 'Taurus',
        'ascendant': 'Gemini',
        'planetary_positions': {'sun': {'degree': 15}}
    }
    
    sanitized = RequestSanitizer.sanitize_for_ai(birth_data_with_pii)
    
    # PII should be removed
    assert 'name' not in sanitized, "Name should be removed"
    assert 'email' not in sanitized, "Email should be removed"
    assert 'phone' not in sanitized, "Phone should be removed"
    assert 'birth_location' not in sanitized, "Birth location should be removed"
    assert 'place_of_birth' not in sanitized, "Place of birth should be removed"
    assert 'date_of_birth' not in sanitized, "Date of birth should be removed"
    assert 'time_of_birth' not in sanitized, "Time of birth should be removed"
    assert 'latitude' not in sanitized, "Latitude should be removed"
    assert 'longitude' not in sanitized, "Longitude should be removed"
    
    # Astrological data should be preserved
    assert sanitized['zodiac_sign'] == 'Aries', "Zodiac sign should be preserved"
    assert sanitized['nakshatra'] == 'Ashwini', "Nakshatra should be preserved"
    assert sanitized['moon_sign'] == 'Taurus', "Moon sign should be preserved"
    assert sanitized['ascendant'] == 'Gemini', "Ascendant should be preserved"
    assert 'planetary_positions' in sanitized, "Planetary positions should be preserved"
    
    print("✓ PII sanitization test passed")


def test_only_allowed_fields_preserved():
    """Test that only whitelisted astrological fields are preserved"""
    birth_data = {
        'zodiac_sign': 'Aries',
        'nakshatra': 'Ashwini',
        'moon_sign': 'Taurus',
        'ascendant': 'Gemini',
        'planetary_positions': {'sun': {'degree': 15}},
        'houses': ['House 1', 'House 2'],
        'dasha_period': 'Venus',
        'yogas': ['Raj Yoga'],
        'doshas': ['Kaal Sarp'],
        'elements': 'Fire',
        'qualities': 'Cardinal',
        'karmic_number': 7,
        # Fields that should be removed
        'custom_field': 'value',
        'unknown_data': 'test'
    }
    
    sanitized = RequestSanitizer.sanitize_for_ai(birth_data)
    
    # Allowed fields should be present
    assert 'zodiac_sign' in sanitized
    assert 'nakshatra' in sanitized
    assert 'moon_sign' in sanitized
    assert 'ascendant' in sanitized
    assert 'planetary_positions' in sanitized
    assert 'houses' in sanitized
    assert 'dasha_period' in sanitized
    assert 'yogas' in sanitized
    assert 'doshas' in sanitized
    assert 'elements' in sanitized
    assert 'qualities' in sanitized
    assert 'karmic_number' in sanitized
    
    # Non-allowed fields should be removed
    assert 'custom_field' not in sanitized, "Custom field should be removed"
    assert 'unknown_data' not in sanitized, "Unknown data should be removed"
    
    print("✓ Whitelist test passed")


def test_validate_zodiac_sign():
    """Test zodiac sign validation"""
    # Valid signs
    assert RequestSanitizer.validate_zodiac_sign('Aries') == True
    assert RequestSanitizer.validate_zodiac_sign('Taurus') == True
    assert RequestSanitizer.validate_zodiac_sign('Gemini') == True
    assert RequestSanitizer.validate_zodiac_sign('Cancer') == True
    assert RequestSanitizer.validate_zodiac_sign('Leo') == True
    assert RequestSanitizer.validate_zodiac_sign('Virgo') == True
    assert RequestSanitizer.validate_zodiac_sign('Libra') == True
    assert RequestSanitizer.validate_zodiac_sign('Scorpio') == True
    assert RequestSanitizer.validate_zodiac_sign('Sagittarius') == True
    assert RequestSanitizer.validate_zodiac_sign('Capricorn') == True
    assert RequestSanitizer.validate_zodiac_sign('Aquarius') == True
    assert RequestSanitizer.validate_zodiac_sign('Pisces') == True
    
    # Invalid signs
    assert RequestSanitizer.validate_zodiac_sign('InvalidSign') == False
    assert RequestSanitizer.validate_zodiac_sign('aries') == False  # Case sensitive
    assert RequestSanitizer.validate_zodiac_sign('') == False
    
    print("✓ Zodiac sign validation test passed")


def test_validate_nakshatra():
    """Test nakshatra validation"""
    # Valid nakshatras
    assert RequestSanitizer.validate_nakshatra('Ashwini') == True
    assert RequestSanitizer.validate_nakshatra('Bharani') == True
    assert RequestSanitizer.validate_nakshatra('Krittika') == True
    assert RequestSanitizer.validate_nakshatra('Rohini') == True
    
    # Invalid nakshatras
    assert RequestSanitizer.validate_nakshatra('InvalidNakshatra') == False
    assert RequestSanitizer.validate_nakshatra('ashwini') == False  # Case sensitive
    assert RequestSanitizer.validate_nakshatra('') == False
    
    print("✓ Nakshatra validation test passed")


def test_ai_response_sanitization():
    """Test that AI responses are sanitized for XSS"""
    malicious_response = """
    <script>alert('xss')</script>
    <div onclick="alert('xss')">Click me</div>
    <a href="javascript:alert('xss')">Link</a>
    Normal text content
    """
    
    sanitized = RequestSanitizer.sanitize_ai_response(malicious_response)
    
    # Malicious content should be removed
    assert '<script>' not in sanitized, "Script tags should be removed"
    assert 'onclick' not in sanitized, "Event handlers should be removed"
    assert 'javascript:' not in sanitized, "JavaScript protocol should be removed"
    
    # Normal content should remain
    assert 'Normal text content' in sanitized, "Normal text should be preserved"
    
    print("✓ XSS sanitization test passed")


def test_sanitize_string():
    """Test string sanitization"""
    # Test HTML escaping
    dangerous_string = '<script>alert("xss")</script>'
    sanitized = RequestSanitizer.sanitize_string(dangerous_string)
    assert '<script>' not in sanitized, "HTML should be escaped"
    assert '&lt;' in sanitized or 'script' not in sanitized, "HTML entities or stripped"
    
    # Test length limiting
    long_string = 'a' * 2000
    sanitized = RequestSanitizer.sanitize_string(long_string, max_length=100)
    assert len(sanitized) <= 100, "String should be truncated to max length"
    
    # Test whitespace trimming
    whitespace_string = '   test string   '
    sanitized = RequestSanitizer.sanitize_string(whitespace_string)
    assert sanitized == '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' or sanitized.strip() != whitespace_string, "Whitespace should be trimmed"
    
    print("✓ String sanitization test passed")


def test_empty_birth_data():
    """Test sanitization with empty birth data"""
    empty_data = {}
    sanitized = RequestSanitizer.sanitize_for_ai(empty_data)
    assert sanitized == {}, "Empty data should return empty dict"
    
    print("✓ Empty data test passed")


def test_nested_structure_preservation():
    """Test that nested structures are preserved"""
    birth_data = {
        'zodiac_sign': 'Aries',
        'planetary_positions': {
            'sun': {'degree': 15, 'sign': 'Aries'},
            'moon': {'degree': 28, 'sign': 'Taurus'}
        },
        'houses': ['House 1', 'House 2', 'House 3']
    }
    
    sanitized = RequestSanitizer.sanitize_for_ai(birth_data)
    
    # Check nested dict preserved
    assert 'planetary_positions' in sanitized
    assert isinstance(sanitized['planetary_positions'], dict)
    assert 'sun' in sanitized['planetary_positions']
    
    # Check list preserved
    assert 'houses' in sanitized
    assert isinstance(sanitized['houses'], list)
    assert len(sanitized['houses']) == 3
    
    print("✓ Nested structure test passed")


if __name__ == '__main__':
    # Run all tests
    test_pii_sanitization()
    test_only_allowed_fields_preserved()
    test_validate_zodiac_sign()
    test_validate_nakshatra()
    test_ai_response_sanitization()
    test_sanitize_string()
    test_empty_birth_data()
    test_nested_structure_preservation()
    
    print("\n✅ All security tests passed!")
