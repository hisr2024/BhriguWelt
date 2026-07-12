"""
Comprehensive Test Suite for Resilient Response System
VALIDATION EMPIRE: 10 Imperial Test Runs to ensure 100% response rate
"""
import importlib.util
import pytest
import json
import time
from datetime import datetime
from pathlib import Path
from unittest.mock import patch, MagicMock
from concurrent.futures import ThreadPoolExecutor, as_completed

# The frontend resilience layer is TypeScript; it cannot be imported or
# executed from Python. The frontend-facing tests below statically verify
# that the resilientFetch contract the backend relies on still exists.
RESILIENT_FETCH_TS = (
    Path(__file__).resolve().parents[2] / 'frontend' / 'lib' / 'api' / 'resilientFetch.ts'
)

# The full Flask app (used by the `client` fixture) needs the complete web
# stack from requirements.txt; some test environments install only the
# service-layer dependencies.
APP_DEPS_AVAILABLE = all(
    importlib.util.find_spec(mod) is not None
    for mod in ('flask_sqlalchemy', 'flask_jwt_extended')
)

# Test fixtures and sample data


@pytest.fixture
def resilient_fetch_source():
    if not RESILIENT_FETCH_TS.exists():
        pytest.skip("frontend/lib/api/resilientFetch.ts not present in this checkout")
    return RESILIENT_FETCH_TS.read_text()


@pytest.fixture(autouse=True)
def legacy_resilience_mode(monkeypatch):
    """These tests exercise the legacy always-return-a-dict resilience
    machinery, which is now gated behind BHRIGU_STRICT_PRECISION=false.
    Strict mode (default) raises PredictionUnavailableError instead of
    serving generalised fallback text; that contract is covered in
    tests/test_wisdom_core_pipeline.py."""
    monkeypatch.setenv('BHRIGU_STRICT_PRECISION', 'false')

@pytest.fixture
def sample_birth_data():
    """Sample birth data for testing"""
    return {
        'date_of_birth': '1990-01-15',
        'time_of_birth': '10:30',
        'place_of_birth': 'New Delhi',
        'latitude': 28.6139,
        'longitude': 77.2090,
        'timezone': 'Asia/Kolkata',
        'zodiac_sign': 'Capricorn',
        'moon_sign': 'Taurus',
        'ascendant': 'Aries',
        'nakshatra': 'Rohini'
    }


class TestBackendNormalOperation:
    """Test 1: Backend Normal - API call should return dict"""

    def test_prediction_returns_dict(self, sample_birth_data):
        """Ensure all prediction methods return dict objects"""
        from services.bhrigu_predictions import get_bhrigu_service

        service = get_bhrigu_service()
        result = service.generate_karmic_journey_prediction(sample_birth_data)

        assert isinstance(result, dict), "Result must be a dictionary"
        assert 'category' in result, "Result must have category field"
        assert 'title' in result, "Result must have title field"
        assert 'full_analysis' in result or 'error' in result, "Result must have content or error"
        print("✓ Test 1 PASSED: Backend returns dict")


class TestBackendErrorHandling:
    """Test 2: Backend Error - Force crash should return error dict"""

    def test_prediction_handles_crash(self, sample_birth_data):
        """Ensure crashes return error dicts instead of raising exceptions"""
        from services.bhrigu_predictions import get_bhrigu_service

        service = get_bhrigu_service()

        # Intentionally corrupt data to trigger error
        corrupted_data = sample_birth_data.copy()
        corrupted_data['zodiac_sign'] = None
        corrupted_data['date_of_birth'] = None

        # Should NOT raise exception - should return error dict
        try:
            result = service.generate_karmic_journey_prediction(corrupted_data)
            assert isinstance(result, dict), "Must return dict even on error"
            # Either successful fallback or error dict
            assert 'category' in result or 'error' in result
            print("✓ Test 2 PASSED: Backend handles crashes with error dict")
        except Exception as e:
            pytest.fail(f"Backend raised exception instead of returning error dict: {e}")


class TestBackendConcurrency:
    """Test 3: Backend Concurrency - 100 concurrent requests should all respond"""

    def test_concurrent_predictions(self, sample_birth_data):
        """Test concurrent request handling"""
        from services.prediction_orchestrator import get_prediction_orchestrator

        orchestrator = get_prediction_orchestrator()
        num_requests = 100
        results = []

        def make_prediction(index):
            try:
                result = orchestrator.generate_prediction(
                    'karmic_journey',
                    sample_birth_data,
                    mode='hybrid'
                )
                return {'index': index, 'success': True, 'result': result}
            except Exception as e:
                return {'index': index, 'success': False, 'error': str(e)}

        # Execute concurrent requests
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_prediction, i) for i in range(num_requests)]
            results = [future.result() for future in as_completed(futures)]

        # All should respond
        assert len(results) == num_requests, f"Expected {num_requests} responses, got {len(results)}"

        # All should succeed or return error dict (no crashes)
        successful = sum(1 for r in results if r['success'])
        print(f"✓ Test 3 PASSED: {successful}/{num_requests} concurrent requests succeeded")
        assert successful == num_requests, f"Expected all requests to succeed, only {successful} succeeded"


class TestFrontendNormalOperation:
    """Test 4: Frontend Normal - normalization contract must exist"""

    def test_frontend_api_structure(self, resilient_fetch_source):
        """Verify the response normalizer exists and always yields an object"""
        src = resilient_fetch_source

        assert 'export function normalizePredictionResponse' in src, \
            "normalizePredictionResponse export missing"
        # Invalid/null payloads must be converted into an error object,
        # never passed through as null/undefined
        assert "if (!data || typeof data !== 'object')" in src, \
            "normalizer must guard against null/non-object payloads"
        assert 'success: false' in src, "normalizer must flag failures"
        print("✓ Test 4 PASSED: Frontend normalization contract present")


class TestFrontendBackendDown:
    """Test 5: Frontend Backend Down - offline fallback contract must exist"""

    def test_offline_handling(self, resilient_fetch_source):
        """Verify resilientFetch returns offline fallback data on network errors"""
        src = resilient_fetch_source

        assert 'export async function resilientFetch' in src, \
            "resilientFetch export missing"
        # Network failures must surface offline mode with the caller's fallback data
        assert "error.message?.includes('Failed to fetch')" in src, \
            "network-error detection missing"
        assert 'offline: true' in src, "offline flag missing from network-error response"
        assert 'data: fallbackData' in src, "fallbackData must be served when offline"
        print("✓ Test 5 PASSED: Frontend offline fallback contract present")


class TestFrontendTimeout:
    """Test 6: Frontend Timeout - abort contract must exist"""

    def test_timeout_abort(self, resilient_fetch_source):
        """Verify resilientFetch aborts slow requests and flags the timeout"""
        src = resilient_fetch_source

        assert 'new AbortController()' in src, "timeout requires an AbortController"
        assert 'setTimeout(() => controller.abort(), timeout)' in src, \
            "requests must be aborted after the configured timeout"
        assert 'timedOut: true' in src, "timed-out responses must set timedOut"
        print("✓ Test 6 PASSED: Frontend timeout abort contract present")


class TestFrontendCacheRecovery:
    """Test 7: Frontend Cache Fail - corruption recovery contract must exist"""

    def test_cache_corruption_recovery(self, resilient_fetch_source):
        """Verify corrupted cache entries are cleared instead of crashing"""
        src = resilient_fetch_source

        assert 'export async function handleCacheCorruption' in src, \
            "handleCacheCorruption export missing"
        assert 'export async function safeGetItem' in src, "safeGetItem export missing"
        # Unparseable entries must be removed and reads must recover to null
        assert 'localStorage.removeItem' in src, \
            "corrupted entries must be removed from localStorage"
        assert 'await handleCacheCorruption(key)' in src, \
            "safeGetItem must trigger corruption recovery on parse failure"
        print("✓ Test 7 PASSED: Frontend cache corruption recovery contract present")


class TestEndToEnd:
    """Test 8: End-to-End - Full flow should show data in UI"""

    def test_full_prediction_flow(self, sample_birth_data):
        """Test complete prediction generation flow"""
        from services.bhrigu_predictions import get_bhrigu_service

        service = get_bhrigu_service()

        # Test all prediction categories
        categories = [
            'karmic_journey', 'past_lives', 'future_lives',
            'present_life', 'life_events', 'karmic_remedies',
            'relationships', 'predictions'
        ]

        for category in categories:
            generator = getattr(service, f'generate_{category}_prediction', None)
            if not generator:
                # Try alternate name
                if category == 'predictions':
                    generator = service.generate_general_predictions

            if generator:
                result = generator(sample_birth_data)
                assert isinstance(result, dict), f"{category} must return dict"
                assert 'category' in result or 'error' in result
                print(f"✓ Test 8 PASSED: {category} E2E flow complete")


class TestLoadTest:
    """Test 9: Load Test - 1000 requests should maintain stability"""

    def test_system_under_load(self, sample_birth_data):
        """Test system stability under heavy load"""
        from services.prediction_orchestrator import get_prediction_orchestrator

        orchestrator = get_prediction_orchestrator()
        num_requests = 1000
        success_count = 0
        error_count = 0
        start_time = time.time()

        categories = ['karmic_journey', 'past_lives', 'present_life']

        def make_prediction(index):
            category = categories[index % len(categories)]
            try:
                result = orchestrator.generate_prediction(category, sample_birth_data)
                return True
            except Exception as e:
                # Log exception for debugging but return False to track failures
                return False

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(make_prediction, i) for i in range(num_requests)]
            results = [future.result() for future in as_completed(futures)]

        success_count = sum(results)
        error_count = len(results) - success_count
        duration = time.time() - start_time

        success_rate = (success_count / num_requests) * 100
        avg_time = (duration / num_requests) * 1000  # ms per request

        print(f"✓ Test 9 PASSED: Load test complete")
        print(f"  - Requests: {num_requests}")
        print(f"  - Success: {success_count} ({success_rate:.1f}%)")
        print(f"  - Errors: {error_count}")
        print(f"  - Avg time: {avg_time:.1f}ms")
        print(f"  - Total time: {duration:.1f}s")

        assert success_rate >= 95, f"Success rate {success_rate}% below 95% threshold"


class TestEdgeCases:
    """Test 10: Edge Test - Invalid data should show error display"""

    def test_invalid_data_handling(self):
        """Test handling of various invalid inputs"""
        from services.bhrigu_predictions import get_bhrigu_service

        service = get_bhrigu_service()

        # Test cases with invalid data
        invalid_cases = [
            {},  # Empty
            {'invalid': 'data'},  # Wrong fields
            {'date_of_birth': 'invalid-date'},  # Invalid date
            {'zodiac_sign': None},  # Null values
        ]

        for invalid_data in invalid_cases:
            result = service.generate_karmic_journey_prediction(invalid_data)
            assert isinstance(result, dict), "Must return dict for invalid data"
            # Should either have fallback or error
            assert 'full_analysis' in result or 'error' in result
            print(f"✓ Test 10 PASSED: Invalid data handled: {invalid_data}")


# Integration test to validate all systems
@pytest.mark.skipif(
    not APP_DEPS_AVAILABLE,
    reason="Flask app requires flask_sqlalchemy/flask_jwt_extended (installed via "
           "requirements.txt in CI); without them the client fixture yields a Mock"
)
class TestSystemIntegration:
    """Integration test validating entire resilient system"""

    def test_health_endpoint_response_metrics(self, client):
        """Verify health endpoint includes response metrics"""
        response = client.get('/health')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert 'response_system' in data
        assert data['response_system']['guaranteed_response'] == True
        assert data['response_system']['expected_response_rate'] == '100%'
        print("✓ Integration Test PASSED: Health endpoint has response metrics")

    def test_route_error_handling(self, client, sample_birth_data):
        """Verify routes always return JSON even on errors"""
        response = client.post(
            '/api/bhrigu-predictions/karmic-journey',
            json=sample_birth_data,
            headers={'Content-Type': 'application/json'}
        )

        # Should get a response (even if error)
        assert response.status_code in [200, 400, 500]
        assert response.content_type == 'application/json'

        data = json.loads(response.data)
        assert isinstance(data, dict)
        print("✓ Integration Test PASSED: Routes return JSON")


if __name__ == '__main__':
    print("=" * 60)
    print("BHRIGUWELT RESILIENT RESPONSE SYSTEM TEST SUITE")
    print("Validation Empire: 10 Imperial Test Runs")
    print("=" * 60)
    pytest.main([__file__, '-v', '--tb=short'])
