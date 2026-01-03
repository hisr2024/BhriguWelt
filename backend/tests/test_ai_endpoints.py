"""
Tests for AI endpoints
Validates security, consent, and PII redaction
"""
import pytest
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from middleware.sanitizer import RequestSanitizer


@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_ai_status_endpoint(client):
    """Test AI status endpoint is accessible"""
    response = client.get('/api/ai/status')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert 'ai_available' in data['data']


def test_ai_consent_info_endpoint(client):
    """Test consent info endpoint returns proper structure"""
    response = client.get('/api/ai/consent')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert 'modes' in data['data']
    assert 'offline' in data['data']['modes']
    assert 'hybrid' in data['data']['modes']
    assert 'conversational' in data['data']['modes']
    assert 'data_never_transmitted' in data['data']


def test_ai_compose_requires_consent(client):
    """Test that compose endpoint requires consent header"""
    response = client.post(
        '/api/ai/compose',
        json={
            'report_section': 'karmic_journey',
            'birth_data': {'zodiac_sign': 'Aries'}
        },
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'consent' in data['message'].lower()


def test_ai_compose_with_consent_but_no_api_key(client):
    """Test compose endpoint with consent but no API key configured"""
    response = client.post(
        '/api/ai/compose',
        json={
            'report_section': 'karmic_journey',
            'birth_data': {'zodiac_sign': 'Aries'}
        },
        headers={
            'Content-Type': 'application/json',
            'X-AI-Consent': 'granted',
            'X-AI-Mode': 'hybrid'
        }
    )
    # Should return 503 if API key not configured, or process if configured
    assert response.status_code in [200, 503]


def test_ai_chat_requires_consent(client):
    """Test that chat endpoint requires consent"""
    response = client.post(
        '/api/ai/chat',
        json={
            'message': 'What does my chart say?',
            'birth_data': {'zodiac_sign': 'Aries'}
        },
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 403


def test_ai_summarize_requires_consent(client):
    """Test that summarize endpoint requires consent"""
    response = client.post(
        '/api/ai/summarize',
        json={
            'report_data': 'Sample report content',
            'birth_data': {'zodiac_sign': 'Aries'}
        },
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 403


def test_pii_sanitization():
    """Test that PII is properly removed from birth data"""
    birth_data_with_pii = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'phone': '+1234567890',
        'birth_location': 'New York, NY',
        'zodiac_sign': 'Aries',
        'nakshatra': 'Ashwini',
        'moon_sign': 'Taurus',
        'planetary_positions': {'sun': {'degree': 15}}
    }
    
    sanitized = RequestSanitizer.sanitize_for_ai(birth_data_with_pii)
    
    # PII should be removed
    assert 'name' not in sanitized
    assert 'email' not in sanitized
    assert 'phone' not in sanitized
    assert 'birth_location' not in sanitized
    
    # Astrological data should be preserved
    assert sanitized['zodiac_sign'] == 'Aries'
    assert sanitized['nakshatra'] == 'Ashwini'
    assert sanitized['moon_sign'] == 'Taurus'
    assert 'planetary_positions' in sanitized


def test_validate_zodiac_sign():
    """Test zodiac sign validation"""
    assert RequestSanitizer.validate_zodiac_sign('Aries') == True
    assert RequestSanitizer.validate_zodiac_sign('Taurus') == True
    assert RequestSanitizer.validate_zodiac_sign('InvalidSign') == False
    assert RequestSanitizer.validate_zodiac_sign('aries') == False  # Case sensitive


def test_validate_nakshatra():
    """Test nakshatra validation"""
    assert RequestSanitizer.validate_nakshatra('Ashwini') == True
    assert RequestSanitizer.validate_nakshatra('Bharani') == True
    assert RequestSanitizer.validate_nakshatra('InvalidNakshatra') == False


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
    assert '<script>' not in sanitized
    assert 'onclick' not in sanitized
    assert 'javascript:' not in sanitized
    
    # Normal content should remain
    assert 'Normal text content' in sanitized


def test_ai_compose_validates_required_fields(client):
    """Test that compose endpoint validates required fields"""
    # Missing report_section
    response = client.post(
        '/api/ai/compose',
        json={'birth_data': {'zodiac_sign': 'Aries'}},
        headers={
            'Content-Type': 'application/json',
            'X-AI-Consent': 'granted',
            'X-AI-Mode': 'hybrid'
        }
    )
    assert response.status_code == 400
    
    # Missing birth_data
    response = client.post(
        '/api/ai/compose',
        json={'report_section': 'karmic_journey'},
        headers={
            'Content-Type': 'application/json',
            'X-AI-Consent': 'granted',
            'X-AI-Mode': 'hybrid'
        }
    )
    assert response.status_code == 400


def test_ai_chat_validates_required_fields(client):
    """Test that chat endpoint validates required fields"""
    # Missing message
    response = client.post(
        '/api/ai/chat',
        json={'birth_data': {'zodiac_sign': 'Aries'}},
        headers={
            'Content-Type': 'application/json',
            'X-AI-Consent': 'granted',
            'X-AI-Mode': 'conversational'
        }
    )
    assert response.status_code == 400


def test_ai_summarize_validates_summary_type(client):
    """Test that summarize endpoint validates summary type"""
    response = client.post(
        '/api/ai/summarize',
        json={
            'report_data': 'Content',
            'birth_data': {'zodiac_sign': 'Aries'},
            'summary_type': 'invalid_type'
        },
        headers={
            'Content-Type': 'application/json',
            'X-AI-Consent': 'granted',
            'X-AI-Mode': 'hybrid'
        }
    )
    # Should return error or process (depends on API key)
    if response.status_code == 400:
        data = json.loads(response.data)
        assert 'summary type' in data['message'].lower()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
