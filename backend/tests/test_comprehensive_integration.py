"""
Comprehensive Integration Tests for BhriguWelt
Tests end-to-end workflows, all prediction categories, and system integration
"""
import pytest
import json
from datetime import datetime
from flask import Flask
from typing import Dict, Any

# Test fixtures for birth data
@pytest.fixture(autouse=True)
def offline_integration_mode(monkeypatch):
    """Integration runs have no live LLM; exercise the legacy offline path.
    The strict no-fallback contract is covered in test_wisdom_core_pipeline.py."""
    monkeypatch.setenv('BHRIGU_STRICT_PRECISION', 'false')


SAMPLE_BIRTH_DATA = {
    "date_of_birth": "1990-05-15",
    "time_of_birth": "14:30",
    "place_of_birth": "New Delhi, India",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "timezone": "Asia/Kolkata"
}

SAMPLE_BIRTH_DATA_2 = {
    "date_of_birth": "1985-10-20",
    "time_of_birth": "08:45",
    "place_of_birth": "Mumbai, India",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "timezone": "Asia/Kolkata"
}


class TestHealthEndpoints:
    """Test all health and status endpoints"""

    def test_simple_status(self, client):
        """Test simple status endpoint"""
        response = client.get('/api/health/status')
        assert response.status_code == 200

        data = response.get_json()
        assert data['status'] == 'ok'
        assert 'timestamp' in data
        assert data['service'] == 'BhriguWelt-API'
        assert data['version'] == '2.0.0'

    def test_detailed_health(self, client):
        """Test detailed health endpoint"""
        response = client.get('/api/health/detailed')
        assert response.status_code in [200, 503]  # May be degraded

        data = response.get_json()
        assert 'status' in data
        assert 'services' in data
        assert 'vedic_systems' in data
        assert 'infrastructure' in data

        # Check key services are reported
        assert 'prediction_orchestrator' in data['services']
        assert 'calculation_engine' in data['vedic_systems']
        assert 'database' in data['infrastructure']

    def test_prediction_health(self, client):
        """Test prediction-specific health check"""
        response = client.get('/api/health/predictions')
        assert response.status_code == 200

        data = response.get_json()
        assert data['status'] in ['operational', 'error']
        assert 'categories' in data

        # Check all 8 prediction categories are reported
        expected_categories = [
            'karmic_journey', 'past_lives', 'future_lives', 'present_life',
            'life_events', 'karmic_remedies', 'relationships', 'predictions'
        ]

        for category in expected_categories:
            assert category in data['categories']

    def test_database_health(self, client):
        """Test database health endpoint"""
        response = client.get('/api/health/database')
        assert response.status_code in [200, 503]

        data = response.get_json()
        assert 'status' in data
        assert 'tables' in data or 'error' in data

    def test_corpus_health(self, client):
        """Test corpus files health check"""
        response = client.get('/api/health/corpus')
        assert response.status_code == 200

        data = response.get_json()
        assert 'files' in data
        assert 'summary' in data

        # Check key corpus files are reported
        assert 'bhrigu_samhita_principles' in data['files']
        assert 'nadi_jyotisha_principles' in data['files']

    def test_readiness_probe(self, client):
        """Test Kubernetes readiness probe"""
        response = client.get('/api/health/readiness')
        assert response.status_code in [200, 503]

        data = response.get_json()
        assert 'ready' in data

    def test_liveness_probe(self, client):
        """Test Kubernetes liveness probe"""
        response = client.get('/api/health/liveness')
        assert response.status_code == 200

        data = response.get_json()
        assert data['alive'] == True


class TestVedicCalculations:
    """Test Vedic calculation engine functionality"""

    def test_soul_purpose_calculation(self):
        """Test soul purpose calculation"""
        from services.vedic_calculation_engine import VedicCalculationEngine

        engine = VedicCalculationEngine()

        chart_data = {
            'ascendant': 'Aries',
            'moon_sign': 'Taurus',
            'nakshatra': 'Rohini',
            'planets': {
                'Sun': {'sign': 'Taurus', 'house': 2}
            }
        }

        result = engine.calculate_soul_purpose(chart_data)

        assert 'primary_purpose' in result
        assert 'purpose_indicators' in result
        assert 'dharmic_path' in result
        assert 'soul_lessons' in result

    def test_karmic_debts_calculation(self):
        """Test karmic debts and credits calculation"""
        from services.vedic_calculation_engine import VedicCalculationEngine

        engine = VedicCalculationEngine()

        chart_data = {
            'planets': {
                'Saturn': {'house': 8, 'sign': 'Scorpio'},
                'Rahu': {'house': 12, 'sign': 'Pisces'},
                'Ketu': {'house': 6, 'sign': 'Virgo'},
                'Jupiter': {'house': 5, 'sign': 'Leo'}
            }
        }

        result = engine.calculate_karmic_debts(chart_data)

        assert 'karmic_debts' in result
        assert 'karmic_credits' in result
        assert 'balance' in result
        assert isinstance(result['karmic_debts'], list)
        assert isinstance(result['karmic_credits'], list)

    def test_dasha_timing_calculation(self):
        """Test Vimshottari Dasha calculations"""
        from services.vedic_calculation_engine import VedicCalculationEngine

        engine = VedicCalculationEngine()

        chart_data = {'planets': {'Moon': {'longitude': 45.2, 'sign': 'Taurus'}}}

        # Moon at 45.2 deg sidereal = Rohini
        result = engine.calculate_dasha_timing('1990-05-15', 45.2, chart_data)

        assert result.get('success') is True
        assert result['birth_nakshatra'] == 'Rohini'
        assert 'birth_nakshatra_lord' in result
        assert 'current_maha_dasha' in result
        assert 'current_bhuktis' in result
        assert isinstance(result['dasha_timeline'], list)
        assert len(result['dasha_timeline']) >= 9

    def test_life_events_timing(self):
        """Test life events timing predictions"""
        from services.vedic_calculation_engine import VedicCalculationEngine

        engine = VedicCalculationEngine()

        dasha_data = {
            'dasha_periods': [
                {'planet': 'Venus', 'start_date': '2020-01-01', 'end_date': '2040-01-01'},
                {'planet': 'Jupiter', 'start_date': '2040-01-01', 'end_date': '2056-01-01'}
            ]
        }

        transits = {'current_date': '2025-01-01'}

        result = engine.calculate_life_events_timing(dasha_data, transits)

        assert 'marriage' in result
        assert 'career' in result
        assert 'children' in result
        assert 'wealth' in result

    def test_remedial_measures_generation(self):
        """Test remedial measures generation"""
        from services.vedic_calculation_engine import VedicCalculationEngine

        engine = VedicCalculationEngine()

        afflictions = ['Saturn in 8th house', 'Rahu in 12th house']
        ascendant = 'Leo'

        result = engine.generate_remedial_measures(afflictions, ascendant)

        assert result.get('success') is True
        remedies = result['remedies']
        assert 'mantras' in remedies
        assert 'gemstones' in remedies
        assert 'yantras' in remedies
        assert 'charity' in remedies
        assert 'rituals' in remedies


class TestVedicYogasCalculator:
    """Test Vedic yogas calculator"""

    def test_yogas_calculation(self):
        """Test complete yogas calculation"""
        from services.vedic_yogas_calculator import VedicYogasCalculator

        calculator = VedicYogasCalculator()

        chart_data = {
            'ascendant': 'Leo',
            'planets': {
                'Sun': {'sign': 'Aries', 'house': 9},
                'Moon': {'sign': 'Taurus', 'house': 10},
                'Mars': {'sign': 'Capricorn', 'house': 6},
                'Mercury': {'sign': 'Virgo', 'house': 2},
                'Jupiter': {'sign': 'Cancer', 'house': 12},
                'Venus': {'sign': 'Pisces', 'house': 8},
                'Saturn': {'sign': 'Libra', 'house': 3}
            },
            'houses': {}
        }

        result = calculator.calculate_all_yogas(chart_data)

        assert 'raja_yogas' in result
        assert 'dhana_yogas' in result
        assert 'mahapurusha_yogas' in result
        assert 'chandra_yogas' in result
        assert 'surya_yogas' in result
        assert 'summary' in result

        # Check summary calculations
        assert 'total_benefic' in result['summary']
        assert 'total_malefic' in result['summary']
        assert 'strength_score' in result['summary']

    def test_raja_yogas(self):
        """Test Raja yogas specifically"""
        from services.vedic_yogas_calculator import VedicYogasCalculator

        calculator = VedicYogasCalculator()

        chart_data = {
            'ascendant': 'Cancer',
            'planets': {
                'Jupiter': {'sign': 'Cancer', 'house': 1},
                'Venus': {'sign': 'Pisces', 'house': 9}
            },
            'houses': {}
        }

        result = calculator._calculate_raja_yogas(
            chart_data['planets'],
            chart_data['ascendant'],
            chart_data['houses']
        )

        assert isinstance(result, list)
        assert len(result) > 0

    def test_mahapurusha_yogas(self):
        """Test Pancha Mahapurusha yogas"""
        from services.vedic_yogas_calculator import VedicYogasCalculator

        calculator = VedicYogasCalculator()

        # Mars in kendra in own sign (Ruchaka Yoga)
        planets = {
            'Mars': {'sign': 'Aries', 'house': 1}
        }

        result = calculator._calculate_mahapurusha_yogas(planets)

        assert isinstance(result, list)
        # Should detect Ruchaka Yoga
        ruchaka_found = any(yoga['name'] == 'Ruchaka Yoga' for yoga in result)
        assert ruchaka_found


class TestPredictionWorkflows:
    """Test end-to-end prediction workflows"""

    def test_karmic_journey_prediction(self, client):
        """Test karmic journey prediction workflow"""
        response = client.post(
            '/api/bhrigu-predictions/karmic-journey',
            json=SAMPLE_BIRTH_DATA,
            headers={'Content-Type': 'application/json'}
        )

        assert response.status_code == 200
        data = response.get_json()

        assert 'prediction' in data or 'error' not in data
        # Should have key sections
        if 'prediction' in data:
            assert isinstance(data['prediction'], dict)
            assert len(data['prediction'].get('full_analysis', '')) > 100

    def test_past_lives_prediction(self, client):
        """Test past lives prediction workflow"""
        response = client.post(
            '/api/bhrigu-predictions/past-lives',
            json=SAMPLE_BIRTH_DATA,
            headers={'Content-Type': 'application/json'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'prediction' in data or 'error' not in data

    def test_life_events_prediction(self, client):
        """Test life events prediction workflow"""
        response = client.post(
            '/api/bhrigu-predictions/life-events',
            json=SAMPLE_BIRTH_DATA,
            headers={'Content-Type': 'application/json'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'prediction' in data or 'error' not in data

    def test_karmic_remedies_prediction(self, client):
        """Test karmic remedies prediction workflow"""
        response = client.post(
            '/api/bhrigu-predictions/karmic-remedies',
            json=SAMPLE_BIRTH_DATA,
            headers={'Content-Type': 'application/json'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'prediction' in data or 'error' not in data

    def test_relationships_prediction(self, client):
        """Test relationships prediction workflow"""
        response = client.post(
            '/api/bhrigu-predictions/relationships',
            json=SAMPLE_BIRTH_DATA,
            headers={'Content-Type': 'application/json'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'prediction' in data or 'error' not in data

    def test_all_categories_sequential(self, client):
        """Test all 8 prediction categories in sequence"""
        categories = [
            'karmic_journey',
            'past_lives',
            'future_lives',
            'present_life',
            'life_events',
            'karmic_remedies',
            'relationships',
            'predictions'
        ]

        results = {}

        for category in categories:
            response = client.post(
                f"/api/bhrigu-predictions/{category.replace('_', '-')}",
                json=SAMPLE_BIRTH_DATA,
                headers={'Content-Type': 'application/json'}
            )

            assert response.status_code == 200, f"Failed for category: {category}"
            data = response.get_json()

            # Store result
            results[category] = {
                'success': 'prediction' in data,
                'has_content': bool((data.get('prediction') or {}).get('full_analysis'))
            }

        # Verify all categories returned predictions
        assert all(r['success'] for r in results.values()), \
            f"Some categories failed: {results}"


class TestOfflineMode:
    """Test offline prediction capabilities"""

    def test_offline_wisdom_generator(self):
        """Test offline wisdom generator initialization"""
        from services.bhrigu_offline_wisdom import BhriguOfflineWisdomGenerator

        generator = BhriguOfflineWisdomGenerator()

        # Check initialization
        assert generator.zodiac_traits is not None
        assert len(generator.zodiac_traits) == 12

        assert generator.nakshatra_traits is not None
        assert len(generator.nakshatra_traits) == 27

    def test_offline_prediction_generation(self):
        """Test offline prediction generation"""
        from services.bhrigu_offline_wisdom import BhriguOfflineWisdomGenerator

        generator = BhriguOfflineWisdomGenerator()

        birth_data = {
            'zodiac_sign': 'Aries',
            'nakshatra': 'Ashwini',
            'moon_sign': 'Taurus'
        }

        # The generator exposes one method per category
        generators = {
            'karmic_journey': lambda: generator.generate_karmic_journey(birth_data),
            'past_lives': lambda: generator.generate_past_lives(birth_data),
            'relationships': lambda: generator.generate_relationships(birth_data),
            'predictions': lambda: generator.generate_general_predictions(birth_data),
        }

        for category, generate in generators.items():
            result = generate()
            assert isinstance(result, str), category + ' should return text'
            assert len(result) > 100, category + ' should have substantial content'


class TestCachingSystem:
    """Test prediction caching functionality"""

    def test_cache_creation(self, client):
        """Test that predictions are cached"""
        # Make first request
        response1 = client.post(
            '/api/bhrigu-predictions/predictions',
            json=SAMPLE_BIRTH_DATA,
            headers={'Content-Type': 'application/json'}
        )

        assert response1.status_code == 200

        # Make second identical request
        response2 = client.post(
            '/api/bhrigu-predictions/predictions',
            json=SAMPLE_BIRTH_DATA,
            headers={'Content-Type': 'application/json'}
        )

        assert response2.status_code == 200

        # Both should return valid predictions
        data1 = response1.get_json()
        data2 = response2.get_json()

        assert 'prediction' in data1
        assert 'prediction' in data2

    def test_cache_different_inputs(self, client):
        """Test that different inputs create different cache entries"""
        response1 = client.post(
            '/api/bhrigu-predictions/predictions',
            json=SAMPLE_BIRTH_DATA,
            headers={'Content-Type': 'application/json'}
        )

        response2 = client.post(
            '/api/bhrigu-predictions/predictions',
            json=SAMPLE_BIRTH_DATA_2,
            headers={'Content-Type': 'application/json'}
        )

        assert response1.status_code == 200
        assert response2.status_code == 200

        # Both should succeed
        data1 = response1.get_json()
        data2 = response2.get_json()

        assert 'prediction' in data1
        assert 'prediction' in data2


class TestErrorHandling:
    """Test error handling and resilience"""

    def test_invalid_birth_data(self, client):
        """Test handling of invalid birth data"""
        invalid_data = {
            "date": "invalid-date",
            "time": "25:99",
            "location": ""
        }

        response = client.post(
            '/api/bhrigu-predictions/predictions',
            json=invalid_data,
            headers={'Content-Type': 'application/json'}
        )

        # Should either handle gracefully or return validation error
        assert response.status_code in [200, 400, 422]

    def test_missing_required_fields(self, client):
        """Test handling of missing required fields"""
        incomplete_data = {
            "date": "1990-05-15"
            # Missing time, location, etc.
        }

        response = client.post(
            '/api/bhrigu-predictions/predictions',
            json=incomplete_data,
            headers={'Content-Type': 'application/json'}
        )

        # Should handle gracefully
        assert response.status_code in [200, 400, 422]

    def test_empty_request(self, client):
        """Test handling of empty request"""
        response = client.post(
            '/api/bhrigu-predictions/predictions',
            json={},
            headers={'Content-Type': 'application/json'}
        )

        # Should handle gracefully
        assert response.status_code in [200, 400, 422]


class TestMatchmakingSystem:
    """Test Kundali matchmaking functionality"""

    def test_matchmaking_calculation(self, client):
        """Test matchmaking calculation"""
        person1_data = SAMPLE_BIRTH_DATA
        person2_data = SAMPLE_BIRTH_DATA_2

        response = client.post(
            '/api/matchmaking/compatibility',
            json={
                'person1': person1_data,
                'person2': person2_data
            },
            headers={'Content-Type': 'application/json'}
        )

        # Should return matchmaking results
        assert response.status_code in [200, 400]

        if response.status_code == 200:
            data = response.get_json()
            # Check for key matchmaking components
            assert 'compatibility_score' in data or 'guna_milan' in data or 'error' not in data


class TestSecurityAndValidation:
    """Test security measures and input validation"""

    def test_csrf_token_endpoint(self, client):
        """Test CSRF token generation"""
        response = client.get('/api/csrf-token')
        # 404 while CSRF protection is disabled by configuration; when
        # enabled the endpoint must return a token.
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.get_json()
            assert 'csrf_token' in data

    def test_rate_limiting(self, client):
        """Test rate limiting (if enabled)"""
        # Make multiple rapid requests
        responses = []
        for i in range(10):
            response = client.get('/health')
            responses.append(response.status_code)

        # Should not block health checks
        assert all(code == 200 for code in responses)

    def test_sql_injection_protection(self, client):
        """Test SQL injection protection"""
        malicious_data = {
            "date": "1990-05-15'; DROP TABLE users; --",
            "location": "Mumbai<script>alert('xss')</script>"
        }

        response = client.post(
            '/api/bhrigu-predictions/predictions',
            json=malicious_data,
            headers={'Content-Type': 'application/json'}
        )

        # Should handle safely without crashing
        assert response.status_code in [200, 400, 422]


# Pytest fixtures
@pytest.fixture
def app():
    """Create Flask app for testing.

    Import via the 'backend.' package path — the repo-root 'app/' package
    (the FastAPI service) shadows backend/app.py on a bare 'from app import'.
    """
    from backend.app import app as flask_app
    flask_app.config['TESTING'] = True
    return flask_app


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create test CLI runner"""
    return app.test_cli_runner()


# Test execution
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
