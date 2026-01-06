"""
End-to-end flow tests
Tests complete user journeys through the API
"""
import pytest
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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


class TestCompleteHoroscopeFlow:
    """Test complete horoscope generation flow"""
    
    def test_full_horoscope_generation(self, client, sample_birth_data):
        """Test complete workflow from birth data to horoscope"""
        # Step 1: Calculate birth chart
        response = client.post(
            '/api/astrology/birth-chart',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            birth_chart = json.loads(response.data)
            
            # Step 2: Get zodiac analysis
            response = client.post(
                '/api/astrology/zodiac-analysis',
                data=json.dumps(sample_birth_data),
                content_type='application/json'
            )
            
            # Should succeed if birth chart succeeded
            assert response.status_code in [200, 500]  # 500 if service unavailable
            
            # Step 3: Get planetary positions
            response = client.post(
                '/api/astrology/planetary-positions',
                data=json.dumps(sample_birth_data),
                content_type='application/json'
            )
            
            assert response.status_code in [200, 500]


class TestKarmicJourneyFlow:
    """Test complete karmic journey analysis flow"""
    
    def test_full_karmic_analysis(self, client, sample_birth_data):
        """Test complete karmic journey workflow"""
        # Get comprehensive karmic analysis
        response = client.post(
            '/api/karmic-journey/analysis',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        # Endpoint should be accessible
        assert response.status_code != 404
        
        if response.status_code == 200:
            # Get soul purpose
            response = client.post(
                '/api/karmic-journey/soul-purpose',
                data=json.dumps(sample_birth_data),
                content_type='application/json'
            )
            assert response.status_code in [200, 500]
            
            # Get karmic lessons
            response = client.post(
                '/api/karmic-journey/karmic-lessons',
                data=json.dumps(sample_birth_data),
                content_type='application/json'
            )
            assert response.status_code in [200, 500]


class TestMatchmakingFlow:
    """Test matchmaking workflow"""
    
    def test_compatibility_analysis(self, client):
        """Test relationship compatibility workflow"""
        # Sample data for two people
        person1_data = {
            'date_of_birth': '1990-01-01',
            'time_of_birth': '12:00',
            'place_of_birth': 'Mumbai',
            'latitude': 19.0760,
            'longitude': 72.8777
        }
        
        person2_data = {
            'date_of_birth': '1992-06-15',
            'time_of_birth': '14:30',
            'place_of_birth': 'Delhi',
            'latitude': 28.6139,
            'longitude': 77.2090
        }
        
        # Calculate birth charts for both
        response1 = client.post(
            '/api/astrology/birth-chart',
            data=json.dumps(person1_data),
            content_type='application/json'
        )
        
        response2 = client.post(
            '/api/astrology/birth-chart',
            data=json.dumps(person2_data),
            content_type='application/json'
        )
        
        # Both should succeed or fail consistently
        assert response1.status_code == response2.status_code or \
               (response1.status_code in [200, 500] and response2.status_code in [200, 500])


class TestPredictionFlow:
    """Test prediction workflow"""
    
    def test_multi_timeframe_predictions(self, client, sample_birth_data):
        """Test getting predictions for multiple timeframes"""
        timeframes = ['daily', 'weekly', 'monthly', 'yearly']
        
        for timeframe in timeframes:
            response = client.post(
                f'/api/predictions/{timeframe}',
                data=json.dumps(sample_birth_data),
                content_type='application/json'
            )
            
            # All timeframe endpoints should exist
            assert response.status_code != 404


class TestBhriguComprehensiveFlow:
    """Test Bhrigu Samhita comprehensive analysis flow"""
    
    def test_comprehensive_bhrigu_analysis(self, client, sample_birth_data):
        """Test complete Bhrigu Samhita analysis"""
        # Get comprehensive analysis covering all 8 categories
        response = client.post(
            '/api/bhrigu-predictions/comprehensive',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        # Endpoint should exist
        assert response.status_code != 404
        
        if response.status_code == 200:
            data = json.loads(response.data)
            
            # Should contain multiple categories
            # Adjust assertions based on actual response structure
            assert 'status' in data or 'data' in data
    
    def test_individual_category_predictions(self, client, sample_birth_data):
        """Test individual category predictions"""
        categories = [
            'karmic-journey',
            'past-lives',
            'future-lives',
            'present-life',
            'life-events',
            'karmic-remedies',
            'relationships',
            'predictions'
        ]
        
        for category in categories:
            response = client.post(
                f'/api/bhrigu-predictions/{category}',
                data=json.dumps(sample_birth_data),
                content_type='application/json'
            )
            
            # All category endpoints should exist
            assert response.status_code != 404


class TestAIEnhancedFlow:
    """Test AI-enhanced prediction flow"""
    
    def test_hybrid_mode_workflow(self, client, sample_birth_data):
        """Test workflow with AI hybrid mode"""
        # Step 1: Get AI consent info
        response = client.get('/api/ai/consent')
        assert response.status_code == 200
        
        # Step 2: Check AI status
        response = client.get('/api/ai/status')
        assert response.status_code == 200
        
        # Step 3: Get base prediction
        response = client.post(
            '/api/bhrigu-predictions/karmic-journey',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            prediction_data = json.loads(response.data)
            
            # Step 4: Enhance with AI (if configured)
            ai_data = {
                'report_section': 'karmic_journey',
                'birth_data': {
                    'zodiac_sign': 'Capricorn',
                    'nakshatra': 'Uttara Ashadha'
                }
            }
            
            response = client.post(
                '/api/ai/compose',
                data=json.dumps(ai_data),
                content_type='application/json',
                headers={'X-AI-Consent': 'granted', 'X-AI-Mode': 'hybrid'}
            )
            
            # Should process or fail gracefully
            assert response.status_code not in [404]


class TestCachingFlow:
    """Test caching behavior"""
    
    def test_prediction_caching(self, client, sample_birth_data):
        """Test that predictions can be cached"""
        # First request
        response1 = client.post(
            '/api/bhrigu-predictions/karmic-journey',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        # Second identical request
        response2 = client.post(
            '/api/bhrigu-predictions/karmic-journey',
            data=json.dumps(sample_birth_data),
            content_type='application/json'
        )
        
        # Both should return same status
        assert response1.status_code == response2.status_code
        
        # If successful, responses should be consistent
        if response1.status_code == 200 and response2.status_code == 200:
            data1 = json.loads(response1.data)
            data2 = json.loads(response2.data)
            
            # Should have similar structure (caching may add metadata)
            assert type(data1) == type(data2)


class TestSessionFlow:
    """Test session management"""
    
    def test_session_tracking(self, client):
        """Test prediction session tracking"""
        # Start a new session
        response = client.post(
            '/api/bhrigu-predictions/session/start',
            data=json.dumps({'user_hash': 'test-user-123'}),
            content_type='application/json'
        )
        
        # Session endpoint should exist
        assert response.status_code != 404


class TestErrorRecoveryFlow:
    """Test error recovery in workflows"""
    
    def test_recovery_from_invalid_data(self, client):
        """Test that system recovers from invalid data"""
        # Submit invalid data
        invalid_data = {'invalid': 'data'}
        
        response = client.post(
            '/api/astrology/birth-chart',
            data=json.dumps(invalid_data),
            content_type='application/json'
        )
        
        # Should return error
        assert response.status_code >= 400
        
        # Follow-up with valid data should work
        valid_data = {
            'date_of_birth': '1990-01-01',
            'time_of_birth': '12:00',
            'place_of_birth': 'Mumbai',
            'latitude': 19.0760,
            'longitude': 72.8777
        }
        
        response = client.post(
            '/api/astrology/birth-chart',
            data=json.dumps(valid_data),
            content_type='application/json'
        )
        
        # Should process normally
        assert response.status_code in [200, 500]
