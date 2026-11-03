"""
Tests for Passcode Rate Limiter Middleware

Tests brute-force protection for passcode verification:
- Attempt tracking and lockouts
- Redis integration
- Device locking logic
- TTL management
"""
import pytest
from unittest.mock import Mock, patch, MagicMock

# fakeredis is a test dependency from requirements.txt; skip cleanly when the
# environment installs only the core service dependencies.
fakeredis = pytest.importorskip('fakeredis')


class TestPasscodeRateLimiter:
    """Test suite for passcode rate limiter"""

    @pytest.fixture
    def mock_redis(self):
        """Provide a fake Redis client for testing"""
        return fakeredis.FakeStrictRedis(decode_responses=True)

    @pytest.fixture
    def limiter_with_redis(self, mock_redis):
        """Patch rate limiter to use fake Redis"""
        with patch('backend.middleware.passcode_rate_limiter._redis_client', mock_redis):
            with patch('backend.middleware.passcode_rate_limiter.get_redis_client', return_value=mock_redis):
                yield mock_redis

    def test_record_failed_attempt_first_time(self, limiter_with_redis):
        """Test recording first failed attempt sets TTL"""
        from backend.middleware.passcode_rate_limiter import record_failed_passcode_attempt

        device_id = 'test-device-1'

        # Record first attempt
        attempts = record_failed_passcode_attempt(device_id)

        assert attempts == 1

        # Check TTL was set
        key = f"passcode:attempts:{device_id}"
        ttl = limiter_with_redis.ttl(key)
        assert ttl > 0  # TTL should be set

    def test_record_failed_attempt_increments(self, limiter_with_redis):
        """Test multiple failed attempts increment counter"""
        from backend.middleware.passcode_rate_limiter import record_failed_passcode_attempt

        device_id = 'test-device-2'

        # Record multiple attempts
        attempts1 = record_failed_passcode_attempt(device_id)
        attempts2 = record_failed_passcode_attempt(device_id)
        attempts3 = record_failed_passcode_attempt(device_id)

        assert attempts1 == 1
        assert attempts2 == 2
        assert attempts3 == 3

    def test_device_locked_after_threshold(self, limiter_with_redis):
        """Test device is locked after exceeding attempt threshold"""
        from backend.middleware.passcode_rate_limiter import (
            record_failed_passcode_attempt,
            is_device_locked,
            MAX_ATTEMPTS
        )

        device_id = 'test-device-3'

        # Record attempts up to threshold
        for i in range(MAX_ATTEMPTS):
            record_failed_passcode_attempt(device_id)

        # Device should now be locked
        assert is_device_locked(device_id) is True

        # Lock key should exist with TTL
        lock_key = f"passcode:lock:{device_id}"
        assert limiter_with_redis.exists(lock_key) > 0
        assert limiter_with_redis.ttl(lock_key) > 0

    def test_device_not_locked_before_threshold(self, limiter_with_redis):
        """Test device is not locked before reaching threshold"""
        from backend.middleware.passcode_rate_limiter import (
            record_failed_passcode_attempt,
            is_device_locked,
            MAX_ATTEMPTS
        )

        device_id = 'test-device-4'

        # Record attempts below threshold
        for i in range(MAX_ATTEMPTS - 1):
            record_failed_passcode_attempt(device_id)

        # Device should NOT be locked yet
        assert is_device_locked(device_id) is False

    def test_reset_failed_attempts(self, limiter_with_redis):
        """Test resetting attempts after successful auth"""
        from backend.middleware.passcode_rate_limiter import (
            record_failed_passcode_attempt,
            reset_failed_attempts,
            get_attempt_count,
            is_device_locked,
            MAX_ATTEMPTS
        )

        device_id = 'test-device-5'

        # Record some failed attempts
        for i in range(5):
            record_failed_passcode_attempt(device_id)

        assert get_attempt_count(device_id) == 5

        # Reset attempts
        success = reset_failed_attempts(device_id)

        assert success is True
        assert get_attempt_count(device_id) == 0
        assert is_device_locked(device_id) is False

    def test_reset_clears_lock(self, limiter_with_redis):
        """Test reset clears both attempts and lock"""
        from backend.middleware.passcode_rate_limiter import (
            record_failed_passcode_attempt,
            reset_failed_attempts,
            is_device_locked,
            MAX_ATTEMPTS
        )

        device_id = 'test-device-6'

        # Lock the device
        for i in range(MAX_ATTEMPTS):
            record_failed_passcode_attempt(device_id)

        assert is_device_locked(device_id) is True

        # Reset should clear lock
        reset_failed_attempts(device_id)

        assert is_device_locked(device_id) is False

    def test_get_lockout_info(self, limiter_with_redis):
        """Test getting comprehensive lockout status"""
        from backend.middleware.passcode_rate_limiter import (
            record_failed_passcode_attempt,
            get_lockout_info,
            MAX_ATTEMPTS
        )

        device_id = 'test-device-7'

        # No attempts yet
        is_locked, remaining, ttl = get_lockout_info(device_id)
        assert is_locked is False
        assert remaining == MAX_ATTEMPTS
        assert ttl == 0

        # After some attempts
        for i in range(3):
            record_failed_passcode_attempt(device_id)

        is_locked, remaining, ttl = get_lockout_info(device_id)
        assert is_locked is False
        assert remaining == MAX_ATTEMPTS - 3
        assert ttl == 0

        # After lockout
        for i in range(MAX_ATTEMPTS):
            record_failed_passcode_attempt(device_id)

        is_locked, remaining, ttl = get_lockout_info(device_id)
        assert is_locked is True
        assert remaining == 0
        assert ttl > 0  # Should have lockout TTL

    def test_redis_unavailable_fails_open(self):
        """Test system fails open when Redis is unavailable"""
        from backend.middleware.passcode_rate_limiter import (
            record_failed_passcode_attempt,
            is_device_locked
        )

        with patch('backend.middleware.passcode_rate_limiter.get_redis_client', return_value=None):
            device_id = 'test-device-8'

            # Should not block when Redis unavailable
            attempts = record_failed_passcode_attempt(device_id)
            assert attempts == 0  # Returns 0 when Redis unavailable

            is_locked = is_device_locked(device_id)
            assert is_locked is False  # Fails open

    def test_concurrent_attempts_same_device(self, limiter_with_redis):
        """Test multiple concurrent attempts are tracked correctly"""
        from backend.middleware.passcode_rate_limiter import (
            record_failed_passcode_attempt,
            get_attempt_count
        )

        device_id = 'test-device-9'

        # Simulate concurrent attempts
        results = []
        for i in range(5):
            attempts = record_failed_passcode_attempt(device_id)
            results.append(attempts)

        # Each should increment
        assert results == [1, 2, 3, 4, 5]
        assert get_attempt_count(device_id) == 5


class TestPasscodeVerificationEndpoint:
    """Test passcode verification endpoint with rate limiting"""

    @pytest.fixture
    def client(self):
        """Flask test client (the backend exposes a module-level app, not a factory)"""
        from backend.app import app
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client

    @pytest.fixture
    def mock_redis_for_endpoint(self):
        """Mock Redis for endpoint tests.

        Patch the 'middleware.passcode_rate_limiter' module identity — that is
        what routes/user_routes.py imports; patching the 'backend.'-prefixed
        path targets a different module object and never reaches the endpoint.
        """
        fake_redis = fakeredis.FakeStrictRedis(decode_responses=True)
        with patch('middleware.passcode_rate_limiter.get_redis_client', return_value=fake_redis):
            with patch('middleware.passcode_rate_limiter._redis_client', fake_redis):
                yield fake_redis

    def test_verify_passcode_success(self, client, mock_redis_for_endpoint):
        """Test successful passcode verification"""
        response = client.post(
            '/api/users/verify-passcode',
            json={
                'device_id': 'device-1',
                'passcode': '1234'
            }
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert data['data']['verified'] is True

    def test_verify_passcode_invalid(self, client, mock_redis_for_endpoint):
        """Test failed passcode verification increments attempts"""
        response = client.post(
            '/api/users/verify-passcode',
            json={
                'device_id': 'device-2',
                'passcode': 'wrong'
            }
        )

        assert response.status_code == 401
        data = response.get_json()
        assert 'Invalid passcode' in data['message']
        assert 'attempts_remaining' in data.get('details', {})

    def test_verify_passcode_locked_device(self, client, mock_redis_for_endpoint):
        """Test locked device returns 429 Too Many Requests"""
        from backend.middleware.passcode_rate_limiter import MAX_ATTEMPTS

        device_id = 'device-3'

        # Exhaust attempts
        for i in range(MAX_ATTEMPTS):
            client.post(
                '/api/users/verify-passcode',
                json={
                    'device_id': device_id,
                    'passcode': 'wrong'
                }
            )

        # Next attempt should be blocked
        response = client.post(
            '/api/users/verify-passcode',
            json={
                'device_id': device_id,
                'passcode': '1234'
            }
        )

        assert response.status_code == 429
        data = response.get_json()
        assert 'locked' in data['message'].lower()
        assert data.get('error_code') == 'DEVICE_LOCKED'

    def test_passcode_status_endpoint(self, client, mock_redis_for_endpoint):
        """Test getting passcode status for device"""
        device_id = 'device-4'

        response = client.get(f'/api/users/passcode-status/{device_id}')

        assert response.status_code == 200
        data = response.get_json()
        assert 'is_locked' in data['data']
        assert 'attempts_remaining' in data['data']
        assert 'lockout_ttl_seconds' in data['data']
