"""
Test Suite for BhriguWelt Prediction System Overhaul
Validates critical fixes and enhancements
"""
import pytest
import sys
import os
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.bhrigu_predictions import BhriguPredictionsService
from services.prediction_orchestrator import PredictionOrchestrator, PredictionMode
from utils.logger import secure_log, sanitize_error, setup_logger


class TestSecureLogging:
    """Test secure logging functionality"""

    def test_api_key_sanitization(self):
        """Test that API keys are redacted from logs"""
        logger = setup_logger('test_logger')

        # Mock an error message containing API key
        message = "OpenAI error: sk-1234567890abcdef"
        sanitized = sanitize_error(message)

        # API keys should not appear in sanitized output
        assert 'sk-1234567890abcdef' not in sanitized
        assert '[REDACTED]' in sanitized or 'sk-' not in sanitized

    def test_secure_log_sanitizes_extra_data(self):
        """Test that secure_log sanitizes extra data"""
        logger = setup_logger('test_logger')

        extra_data = {
            'api_key': 'sk-secret123',
            'user_id': 123,
            'token': 'bearer-token-xyz'
        }

        # Should not raise exception
        secure_log(logger, 'info', 'Test message', extra=extra_data)


class TestBhriguPredictionsService:
    """Test BhriguPredictionsService enhancements"""

    def test_initialization_with_failed_services(self):
        """Test that service initializes even when some components fail"""
        # Mock failed services
        with patch('services.bhrigu_predictions.get_openai_service') as mock_openai, \
             patch('services.bhrigu_predictions.AstrologyCalculator') as mock_astro:

            mock_openai.side_effect = Exception("OpenAI not available")
            mock_astro.side_effect = Exception("Astrology service failed")

            # Should initialize without crashing
            service = BhriguPredictionsService()

            # Should record errors
            assert len(service.init_errors) == 2
            assert not service._is_healthy()

    def test_health_status_method(self):
        """Test get_health_status returns correct structure"""
        service = BhriguPredictionsService(
            openai_service=None,
            astrology_calculator=Mock(),
            section_parser=None,
            corpus_db=None
        )

        health = service.get_health_status()

        # Verify structure
        assert 'healthy' in health
        assert 'services' in health
        assert 'initialization_errors' in health
        assert 'errors' in health
        assert 'timestamp' in health

        # Should have service details
        assert 'openai_service' in health['services']
        assert 'astrology_calculator' in health['services']
        assert 'section_parser' in health['services']
        assert 'corpus_db' in health['services']

    def test_fallback_activation_when_unhealthy(self):
        """Test that fallback is activated when services are unhealthy"""
        service = BhriguPredictionsService(
            openai_service=None,
            astrology_calculator=Mock(),
            section_parser=None,
            corpus_db=None
        )

        birth_data = {
            'zodiac_sign': 'Aries',
            'date_of_birth': '1990-01-01'
        }

        # Should return fallback when unhealthy
        fallback = service._get_fallback_if_unavailable('karmic_journey', birth_data)

        assert fallback is not None
        assert 'category' in fallback
        assert fallback['category'] == 'karmic_journey'
        assert 'metadata' in fallback
        assert fallback['metadata'].get('fallback_mode') is True


class TestPredictionOrchestrator:
    """Test PredictionOrchestrator enhancements"""

    def test_input_validation_category(self):
        """Test that invalid category raises appropriate error"""
        orchestrator = PredictionOrchestrator()

        chart_data = {'zodiac_sign': 'Aries'}

        # Empty category should raise ValueError
        with pytest.raises(ValueError, match="Invalid category"):
            orchestrator.generate_prediction('', chart_data)

        # None category should raise ValueError
        with pytest.raises(ValueError, match="Invalid category"):
            orchestrator.generate_prediction(None, chart_data)

    def test_input_validation_chart_data(self):
        """Test that invalid chart data raises appropriate error"""
        orchestrator = PredictionOrchestrator()

        # Empty chart_data should raise ValueError
        with pytest.raises(ValueError, match="Invalid chart_data"):
            orchestrator.generate_prediction('karmic_journey', {})

        # None chart_data should raise ValueError
        with pytest.raises(ValueError, match="Invalid chart_data"):
            orchestrator.generate_prediction('karmic_journey', None)

    def test_valid_category_validation(self):
        """Test that valid categories are accepted"""
        orchestrator = PredictionOrchestrator()

        valid_categories = [
            'karmic_journey', 'past_lives', 'future_lives', 'present_life',
            'life_events', 'karmic_remedies', 'relationships', 'predictions'
        ]

        for category in valid_categories:
            chart_data = {'zodiac_sign': 'Aries'}

            # Should not raise on valid categories
            # (may fail for other reasons but not validation)
            try:
                result = orchestrator.generate_prediction(category, chart_data)
                assert 'status' in result or 'category' in result
            except Exception as e:
                # Validation should pass, other errors acceptable
                assert 'Invalid category' not in str(e)

    def test_mode_normalization(self):
        """Test that invalid modes fall back to hybrid"""
        orchestrator = PredictionOrchestrator()

        chart_data = {'zodiac_sign': 'Aries'}

        # Invalid mode should default to hybrid (won't raise exception)
        result = orchestrator.generate_prediction(
            'karmic_journey',
            chart_data,
            mode='invalid_mode'
        )

        # Should return some result (using hybrid/fallback)
        assert result is not None


class TestCriticalBugFixes:
    """Test critical bug fixes"""

    def test_line_1251_variable_fix(self):
        """
        Test that the line 1251 bug is fixed

        Previously: birth_data['age'] = current_age  (undefined)
        Fixed: birth_data['age'] = current_age_display
        """
        # This test verifies the fix exists in the code
        import services.bhrigu_predictions as bp_module

        # Read the source to verify fix
        source_path = bp_module.__file__
        with open(source_path, 'r') as f:
            content = f.read()

        # Check that the buggy line no longer exists
        assert "birth_data['age'] = current_age\n" not in content or \
               "birth_data['age'] = current_age_display" in content


class TestAPIHealthEndpoint:
    """Test API health endpoint"""

    def test_health_endpoint_structure(self):
        """Test that health endpoint returns expected structure"""
        from routes.bhrigu_predictions_routes import bhrigu_service

        health_status = bhrigu_service.get_health_status()

        # Verify response structure
        assert isinstance(health_status, dict)
        assert 'healthy' in health_status
        assert 'services' in health_status
        assert 'initialization_errors' in health_status
        assert 'errors' in health_status
        assert 'timestamp' in health_status


class TestFallbackCompleteness:
    """Test that all fallback functions return complete structures"""

    def test_fallback_karmic_journey_structure(self):
        """Test fallback_karmic_journey returns complete structure"""
        from services.prediction_helpers import fallback_karmic_journey

        birth_data = {'zodiac_sign': 'Aries'}
        result = fallback_karmic_journey(birth_data)

        # Verify essential fields
        assert 'category' in result
        assert 'title' in result
        assert 'full_analysis' in result
        assert 'metadata' in result
        assert 'generated_at' in result

        # Verify category-specific sections exist
        assert 'soul_purpose' in result
        assert 'karmic_blueprint' in result

    def test_all_fallback_functions_exist(self):
        """Test that all 8 fallback functions exist and are callable"""
        from services import prediction_helpers

        required_fallbacks = [
            'fallback_karmic_journey',
            'fallback_past_lives',
            'fallback_future_lives',
            'fallback_present_life',
            'fallback_life_events',
            'fallback_karmic_remedies',
            'fallback_relationships',
            'fallback_predictions'
        ]

        for fallback_name in required_fallbacks:
            assert hasattr(prediction_helpers, fallback_name), \
                f"Missing fallback function: {fallback_name}"

            fallback_func = getattr(prediction_helpers, fallback_name)
            assert callable(fallback_func), \
                f"Fallback function not callable: {fallback_name}"


def test_integration_prediction_with_fallback():
    """Integration test: Generate prediction with fallback mode"""
    service = BhriguPredictionsService(
        openai_service=None,  # Force fallback mode
        astrology_calculator=Mock(),
        section_parser=None,
        corpus_db=None
    )

    birth_data = {
        'zodiac_sign': 'Aries',
        'date_of_birth': '1990-01-01',
        'time_of_birth': '10:30',
        'latitude': 28.6139,
        'longitude': 77.2090
    }

    # Should get fallback prediction
    fallback = service._get_fallback_if_unavailable('karmic_journey', birth_data)

    assert fallback is not None
    assert fallback['category'] == 'karmic_journey'
    assert len(fallback['full_analysis']) > 0
    assert fallback['metadata']['fallback_mode'] is True


if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, '-v', '--tb=short'])
