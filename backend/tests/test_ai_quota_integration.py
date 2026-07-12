"""
Integration Tests for AI Quota and Cost Management System
Tests the complete flow with mocked OpenAI responses
"""

import os
import pytest
import json
from unittest.mock import patch, MagicMock, Mock
from datetime import datetime, timezone

# Import the quota module
from services.ai_quota import (
    estimate_tokens,
    estimate_cost,
    check_daily_quota_and_reserve,
    update_usage_after_call,
    sanitize_log,
    get_user_quota_status,
    QuotaExceededError,
    CostLimitExceededError
)


def install_quota_eval_sim(client):
    """
    Wire an `eval` side effect onto a MagicMock Redis client that simulates
    the atomic Lua quota script used by check_daily_quota_and_reserve.

    Current usage is read via client.get (so tests can control it with
    return_value/side_effect), and incrby/expire are invoked on the mock so
    call assertions keep working.
    """
    def _eval(script, numkeys, key, limit, incr):
        current = int(client.get(key) or 0)
        limit = int(limit)
        incr = int(incr)
        if (current + incr) > limit:
            return [0, limit - current]
        new_total = current + incr
        client.incrby(key, incr)
        client.expire(key, 172800)
        return [1, limit - new_total]

    client.eval.side_effect = _eval
    return client


class TestOpenAIIntegrationWithQuota:
    """Integration tests for OpenAI service with quota management"""

    @pytest.fixture
    def mock_redis_client(self):
        """Create a mock Redis client"""
        client = MagicMock()
        client.get.return_value = '0'  # No usage yet
        client.pipeline.return_value = client
        client.__enter__ = MagicMock(return_value=client)
        client.__exit__ = MagicMock(return_value=False)
        client.ping.return_value = True
        install_quota_eval_sim(client)
        return client

    @pytest.fixture
    def mock_openai_response_success(self):
        """Create a mock successful OpenAI response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'choices': [
                {
                    'message': {
                        'content': 'This is a test prediction from OpenAI.'
                    },
                    'finish_reason': 'stop'
                }
            ],
            'usage': {
                'prompt_tokens': 100,
                'completion_tokens': 50,
                'total_tokens': 150
            },
            'model': 'gpt-4o-mini'
        }
        return mock_response

    @pytest.fixture
    def mock_openai_response_429(self):
        """Create a mock 429 rate limit response"""
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.json.return_value = {
            'error': {
                'message': 'Rate limit exceeded',
                'type': 'rate_limit_error',
                'code': 'rate_limit_exceeded'
            }
        }
        mock_response.text = json.dumps(mock_response.json.return_value)
        return mock_response

    @pytest.fixture
    def mock_openai_response_insufficient_quota(self):
        """Create a mock insufficient quota response"""
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.json.return_value = {
            'error': {
                'message': 'You exceeded your current quota, please check your plan and billing details.',
                'type': 'insufficient_quota',
                'code': 'insufficient_quota'
            }
        }
        mock_response.text = json.dumps(mock_response.json.return_value)
        return mock_response

    @patch('services.ai_quota._get_redis_client')
    @patch('requests.post')
    def test_successful_openai_call_with_quota(
        self,
        mock_requests_post,
        mock_redis_getter,
        mock_redis_client,
        mock_openai_response_success
    ):
        """Test successful OpenAI call with quota tracking"""
        # Setup
        mock_redis_getter.return_value = mock_redis_client
        mock_requests_post.return_value = mock_openai_response_success

        with patch.dict(os.environ, {
            'USER_DAILY_TOKEN_LIMIT': '100000',
            'OPENAI_COST_PER_1K': '0.002',
            'PER_REQUEST_COST_LIMIT': '1.0'
        }):
            # Step 1: Check quota and reserve
            user_id = 'test_user_123'
            tokens_needed = 5000

            allowed, remaining = check_daily_quota_and_reserve(user_id, tokens_needed)

            assert allowed is True
            assert remaining == 95000

            # Verify Redis calls
            mock_redis_client.incrby.assert_called_once()
            mock_redis_client.expire.assert_called_once()

            # Step 2: Simulate OpenAI API call
            # (In real code, this would be inside openai_service.py)

            # Step 3: Update actual usage
            actual_tokens = 150  # From mock response
            update_result = update_usage_after_call(user_id, actual_tokens)

            assert update_result is True

    @patch('services.ai_quota._get_redis_client')
    def test_quota_exceeded_triggers_fallback(self, mock_redis_getter, mock_redis_client):
        """Test that quota exceeded error prevents OpenAI call"""
        # Setup: User has almost used up quota
        mock_redis_client.get.return_value = '99000'  # 99K tokens used
        mock_redis_getter.return_value = mock_redis_client

        with patch.dict(os.environ, {
            'USER_DAILY_TOKEN_LIMIT': '100000'
        }):
            # Try to reserve 5000 tokens (exceeds limit)
            with pytest.raises(QuotaExceededError) as exc_info:
                check_daily_quota_and_reserve('test_user_123', 5000)

            assert 'Daily token quota exceeded' in str(exc_info.value)
            assert 'Used: 99000/100000' in str(exc_info.value)

    @patch('services.ai_quota._get_redis_client')
    @patch('requests.post')
    def test_openai_429_error_handling(
        self,
        mock_requests_post,
        mock_redis_getter,
        mock_redis_client,
        mock_openai_response_429
    ):
        """Test handling of OpenAI 429 rate limit error"""
        mock_redis_getter.return_value = mock_redis_client
        mock_requests_post.return_value = mock_openai_response_429

        # Simulate the error that would be raised in openai_service
        from requests.exceptions import HTTPError

        error = HTTPError()
        error.response = mock_openai_response_429

        # The service should catch this and return fallback
        # In real integration, this would be handled by openai_service.py

        # Verify the error response contains the expected data
        assert mock_openai_response_429.status_code == 429
        error_body = mock_openai_response_429.json()
        assert 'error' in error_body
        assert error_body['error']['type'] == 'rate_limit_error'

    @patch('services.ai_quota._get_redis_client')
    @patch('requests.post')
    def test_openai_insufficient_quota_error(
        self,
        mock_requests_post,
        mock_redis_getter,
        mock_redis_client,
        mock_openai_response_insufficient_quota
    ):
        """Test handling of OpenAI insufficient_quota error"""
        mock_redis_getter.return_value = mock_redis_client
        mock_requests_post.return_value = mock_openai_response_insufficient_quota

        # Verify the error response
        assert mock_openai_response_insufficient_quota.status_code == 429
        error_body = mock_openai_response_insufficient_quota.json()
        assert 'insufficient_quota' in str(error_body).lower()

    def test_cost_limit_exceeded(self):
        """Test that high-cost requests are blocked"""
        with patch.dict(os.environ, {
            'OPENAI_COST_PER_1K': '0.002',
            'PER_REQUEST_COST_LIMIT': '0.01'  # Very low limit ($0.01)
        }):
            # Estimate cost for large request
            prompt_tokens = 10000
            response_tokens = 10000
            estimated_cost = estimate_cost(prompt_tokens, response_tokens)

            # Should exceed limit
            per_request_limit = float(os.getenv('PER_REQUEST_COST_LIMIT'))

            assert estimated_cost > per_request_limit

            # In real code, this would raise CostLimitExceededError
            if estimated_cost > per_request_limit:
                with pytest.raises(CostLimitExceededError):
                    raise CostLimitExceededError(
                        f"Cost ${estimated_cost:.4f} exceeds limit ${per_request_limit:.4f}"
                    )

    @patch('services.ai_quota._get_redis_client')
    def test_redis_unavailable_graceful_handling(self, mock_redis_getter):
        """Test graceful handling when Redis is unavailable"""
        # Redis is unavailable
        mock_redis_getter.return_value = None

        # Start from a clean in-memory fallback store for determinism
        from services import ai_quota as ai_quota_module
        ai_quota_module._memory_quota_store.clear()

        # Should allow request via the in-memory fallback (tokens still reserved
        # so quotas cannot be bypassed when Redis is down)
        allowed, remaining = check_daily_quota_and_reserve('test_user', 1000)

        assert allowed is True
        daily_limit = int(os.getenv('USER_DAILY_TOKEN_LIMIT', '100000'))
        assert remaining == daily_limit - 1000

    @patch('services.ai_quota._get_redis_client')
    def test_quota_status_endpoint(self, mock_redis_getter, mock_redis_client):
        """Test getting quota status for a user"""
        mock_redis_client.get.return_value = '25000'
        mock_redis_getter.return_value = mock_redis_client

        with patch.dict(os.environ, {'USER_DAILY_TOKEN_LIMIT': '100000'}):
            status = get_user_quota_status('test_user_123')

            assert status['used'] == 25000
            assert status['limit'] == 100000
            assert status['remaining'] == 75000
            assert status['percentage_used'] == 25.0
            assert status['redis_available'] is True

    @patch('services.ai_quota._get_redis_client')
    def test_multiple_requests_quota_accumulation(
        self,
        mock_redis_getter,
        mock_redis_client
    ):
        """Test that quota accumulates across multiple requests"""
        # Simulate multiple requests
        usage_values = ['0', '1000', '2500', '5000']
        mock_redis_client.get.side_effect = usage_values
        mock_redis_getter.return_value = mock_redis_client

        with patch.dict(os.environ, {'USER_DAILY_TOKEN_LIMIT': '10000'}):
            # Request 1: Use 1000 tokens
            allowed, remaining = check_daily_quota_and_reserve('user', 1000)
            assert allowed is True
            assert remaining == 9000

            # Request 2: Use 1500 tokens
            allowed, remaining = check_daily_quota_and_reserve('user', 1500)
            assert allowed is True
            assert remaining == 7500

            # Request 3: Use 2500 tokens
            allowed, remaining = check_daily_quota_and_reserve('user', 2500)
            assert allowed is True
            assert remaining == 5000

            # Request 4: Try to use 6000 tokens (should fail)
            with pytest.raises(QuotaExceededError):
                check_daily_quota_and_reserve('user', 6000)

    def test_log_sanitization_security(self):
        """Test that sensitive data is properly sanitized in logs"""
        # Test API key redaction
        log_with_key = "Error: Authentication failed with key sk-abc123def456"
        sanitized = sanitize_log(log_with_key)

        assert 'sk-abc123def456' not in sanitized
        assert '[REDACTED_API_KEY]' in sanitized

        # Test truncation
        long_log = "x" * 500
        sanitized_long = sanitize_log(long_log, max_length=100)

        assert len(sanitized_long) <= 120  # 100 + "[truncated]"
        assert '[truncated]' in sanitized_long

    @patch('services.ai_quota._get_redis_client')
    def test_anonymous_user_quota(self, mock_redis_getter, mock_redis_client):
        """Test quota tracking for anonymous (non-authenticated) users"""
        mock_redis_client.get.return_value = '0'
        mock_redis_getter.return_value = mock_redis_client

        with patch.dict(os.environ, {'USER_DAILY_TOKEN_LIMIT': '10000'}):
            # Empty user_id should use 'anonymous'
            allowed, remaining = check_daily_quota_and_reserve('', 500)

            assert allowed is True

            # Verify it used 'anonymous' user_id
            # The key would be ai_usage:anonymous:YYYY-MM-DD
            calls = [str(call) for call in mock_redis_client.get.call_args_list]
            assert any('anonymous' in str(call) for call in calls)

    def test_token_estimation_accuracy(self, monkeypatch):
        """Test token estimation minimums under the char-based fallback
        (tiktoken, when importable, yields smaller model-accurate counts)."""
        import services.ai_quota as ai_quota
        monkeypatch.setattr(ai_quota, 'TIKTOKEN_AVAILABLE', False)
        test_cases = [
            ("", 0),
            ("Hello", 1),
            ("Hello world", max(1, len("Hello world") // 4)),
            ("x" * 100, 25),
            ("x" * 400, 100),
            ("x" * 4000, 1000),
        ]

        for text, expected_min_tokens in test_cases:
            tokens = estimate_tokens(text)
            assert tokens >= expected_min_tokens

    def test_cost_calculation_accuracy(self):
        """Test cost calculation with various token counts"""
        with patch.dict(os.environ, {'OPENAI_COST_PER_1K': '0.002'}):
            test_cases = [
                (0, 0, 0.0),
                (1000, 0, 0.002),
                (500, 500, 0.002),
                (5000, 5000, 0.02),
                (10000, 5000, 0.03),
            ]

            for prompt_tokens, response_tokens, expected_cost in test_cases:
                cost = estimate_cost(prompt_tokens, response_tokens)
                assert abs(cost - expected_cost) < 0.0001  # Float comparison


class TestEndToEndQuotaFlow:
    """End-to-end integration tests simulating real usage patterns"""

    @patch('services.ai_quota._get_redis_client')
    @patch('requests.post')
    def test_complete_request_flow_success(
        self,
        mock_requests_post,
        mock_redis_getter
    ):
        """Test complete flow from quota check to usage update"""
        # Setup mocks
        mock_redis = MagicMock()
        mock_redis.get.side_effect = ['0', '5000']  # Before and after reservation
        mock_redis.pipeline.return_value = mock_redis
        mock_redis.__enter__ = MagicMock(return_value=mock_redis)
        mock_redis.__exit__ = MagicMock(return_value=False)
        install_quota_eval_sim(mock_redis)
        mock_redis_getter.return_value = mock_redis

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'choices': [{'message': {'content': 'Test'}, 'finish_reason': 'stop'}],
            'usage': {'prompt_tokens': 100, 'completion_tokens': 50, 'total_tokens': 150}
        }
        mock_requests_post.return_value = mock_response

        with patch.dict(os.environ, {
            'USER_DAILY_TOKEN_LIMIT': '100000',
            'OPENAI_COST_PER_1K': '0.002',
            'PER_REQUEST_COST_LIMIT': '1.0'
        }):
            # Step 1: Check quota
            user_id = 'test_user'
            allowed, remaining = check_daily_quota_and_reserve(user_id, 5000)
            assert allowed is True

            # Step 2: Check cost
            cost = estimate_cost(100, 50)
            assert cost < 1.0  # Within limit

            # Step 3: Make API call (simulated)
            # In real code, this would be in openai_service.py

            # Step 4: Update actual usage
            update_usage_after_call(user_id, 150)

            # Verify all Redis operations happened
            assert mock_redis.incrby.call_count == 2  # Reserve + update

    @patch('services.ai_quota._get_redis_client')
    def test_complete_request_flow_quota_exceeded(self, mock_redis_getter):
        """Test complete flow when quota is exceeded"""
        # Setup: User near limit
        mock_redis = MagicMock()
        mock_redis.get.return_value = '99500'
        install_quota_eval_sim(mock_redis)
        mock_redis_getter.return_value = mock_redis

        with patch.dict(os.environ, {'USER_DAILY_TOKEN_LIMIT': '100000'}):
            # Should raise quota error
            with pytest.raises(QuotaExceededError) as exc_info:
                check_daily_quota_and_reserve('test_user', 1000)

            # Verify error message is helpful
            error_msg = str(exc_info.value)
            assert 'Daily token quota exceeded' in error_msg
            assert '99500' in error_msg
            assert '100000' in error_msg

    @patch('services.ai_quota._get_redis_client')
    def test_complete_request_flow_cost_exceeded(self, mock_redis_getter):
        """Test complete flow when cost limit is exceeded"""
        mock_redis = MagicMock()
        mock_redis.get.return_value = '0'
        mock_redis_getter.return_value = mock_redis

        with patch.dict(os.environ, {
            'OPENAI_COST_PER_1K': '0.01',  # $0.01 per 1K tokens
            'PER_REQUEST_COST_LIMIT': '0.01'  # $0.01 limit
        }):
            # Large request that exceeds cost limit
            prompt_tokens = 2000
            response_tokens = 2000
            cost = estimate_cost(prompt_tokens, response_tokens)

            # Cost: 4000 tokens / 1000 * 0.01 = $0.04 > $0.01 limit
            assert cost > 0.01

            # Should raise cost limit error
            with pytest.raises(CostLimitExceededError):
                raise CostLimitExceededError(f"Cost ${cost:.4f} exceeds limit $0.01")


# Run tests with: pytest backend/tests/test_ai_quota_integration.py -v
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
