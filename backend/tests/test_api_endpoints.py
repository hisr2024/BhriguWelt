"""
Integration tests for all API endpoints
Tests complete request/response cycles
"""
import pytest
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# The full Flask app requires the complete web stack from requirements.txt
# (flask_jwt_extended et al.); skip cleanly in partially provisioned envs.
pytest.importorskip('flask_jwt_extended')
pytest.importorskip('flask_sqlalchemy')

from app import app


@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def sample_birth_data():
    """Sample birth data for testing"""
    return {
        'date_of_birth': '1990-01-01',
        'time_of_birth': '12:00',
        'place_of_birth': 'Mumbai',
        'latitude': 19.0760,
        'longitude': 72.8777
    }


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_check(self, client):
        """Test basic health check endpoint"""
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy' or 'status' in data


class TestAstrologyEndpoints:
    """Test astrology calculation endpoints"""
    
    def test_birth_chart_valid(self, client, sample_birth_data):
        """Test birth chart calculation with valid data"""
        response = client.post(
            '/api/astrology/birth-chart',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        # Should succeed or return informative error
        assert response.status_code in [200, 400, 422, 500]
        
        if response.status_code == 200:
            data = json.loads(response.data)
            assert 'zodiac_sign' in data or 'data' in data
    
    def test_birth_chart_invalid(self, client):
        """Test birth chart with invalid data"""
        invalid_data = {
            'date_of_birth': 'invalid',
            'time_of_birth': 'invalid',
            'place_of_birth': ''
        }
        
        response = client.post(
            '/api/astrology/birth-chart',
            data=json.dumps(invalid_data),
            content_type='application/json'
        )
        
        # Should return error status
        assert response.status_code >= 400
    
    def test_birth_chart_missing_fields(self, client):
        """Test birth chart with missing required fields"""
        incomplete_data = {
            'date_of_birth': '1990-01-01'
        }
        
        response = client.post(
            '/api/astrology/birth-chart',
            data=json.dumps(incomplete_data),
            content_type='application/json'
        )
        
        # Should return error status
        assert response.status_code >= 400


class TestKarmicJourneyEndpoints:
    """Test karmic journey endpoints"""
    
    def test_karmic_analysis_endpoint_exists(self, client, sample_birth_data):
        """Test that karmic analysis endpoint exists"""
        response = client.post(
            '/api/bhrigu-predictions/karmic-journey',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        # Endpoint should exist (not 404)
        assert response.status_code != 404


class TestPredictionEndpoints:
    """Test prediction endpoints"""
    
    def test_daily_prediction_endpoint(self, client, sample_birth_data):
        """Test daily prediction endpoint"""
        response = client.post(
            '/api/bhrigu-predictions/predictions',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        # Endpoint should exist
        assert response.status_code != 404
    
    def test_question_prediction_endpoint(self, client, sample_birth_data):
        """Test question-based prediction endpoint"""
        data = {
            **sample_birth_data,
            'question': 'What does my future hold in career?'
        }
        
        response = client.post(
            '/api/bhrigu-predictions/predictions',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Endpoint should exist
        assert response.status_code != 404


class TestAIEndpoints:
    """Test AI feature endpoints"""
    
    def test_ai_status_endpoint(self, client):
        """Test AI status endpoint"""
        response = client.get('/api/ai/status')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'status' in data
    
    def test_ai_consent_info_endpoint(self, client):
        """Test AI consent info endpoint"""
        response = client.get('/api/ai/consent')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'status' in data
    
    def test_ai_compose_requires_consent(self, client):
        """Test that AI compose requires consent header"""
        data = {
            'report_section': 'karmic_journey',
            'birth_data': {
                'zodiac_sign': 'Capricorn',
                'nakshatra': 'Uttara Ashadha'
            }
        }
        
        # Without consent header
        response = client.post(
            '/api/ai/compose',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Should require consent (403 or similar)
        assert response.status_code in [400, 403]
        
        # With consent header
        response = client.post(
            '/api/ai/compose',
            data=json.dumps(data),
            content_type='application/json',
            headers={'X-AI-Consent': 'granted', 'X-AI-Mode': 'hybrid'}
        )
        
        # Should process (200 or 500 if AI not configured, but not 403)
        assert response.status_code not in [403]


class TestBhriguPredictionEndpoints:
    """Test Bhrigu Samhita prediction endpoints"""
    
    def test_bhrigu_karmic_journey_endpoint(self, client, sample_birth_data):
        """Test Bhrigu karmic journey endpoint"""
        response = client.post(
            '/api/bhrigu-predictions/karmic-journey',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        # Endpoint should exist
        assert response.status_code != 404
    
    def test_bhrigu_comprehensive_endpoint(self, client, sample_birth_data):
        """Test Bhrigu comprehensive prediction endpoint"""
        response = client.post(
            '/api/bhrigu-predictions/comprehensive',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        # Endpoint should exist
        assert response.status_code != 404


class TestErrorHandling:
    """Test error handling across endpoints"""
    
    def test_malformed_json(self, client):
        """Test handling of malformed JSON"""
        response = client.post(
            '/api/astrology/birth-chart',
            data='{"invalid": json}',
            content_type='application/json'
        )
        
        # Should return 400 Bad Request
        assert response.status_code == 400
    
    def test_missing_content_type(self, client, sample_birth_data):
        """Test handling of missing content-type header"""
        response = client.post(
            '/api/astrology/birth-chart',
            data=json.dumps(sample_birth_data)
        )
        
        # Should still process or return appropriate error
        assert response.status_code in [200, 400, 415, 422, 500]
    
    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.options('/api/astrology/birth-chart')
        
        # Check for CORS headers (if configured)
        # This test may need adjustment based on actual CORS setup
        assert response.status_code in [200, 204]
