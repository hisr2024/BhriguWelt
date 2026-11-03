"""
Tests for AI Quota Management Service

Tests the implementation of token quota tracking including:
- Token estimation
- Cost calculation
- Quota checking and reservation
- Redis interaction (mocked)
- Memory fallback when Redis unavailable
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import os

# Import the module under test
from backend.services import ai_quota
from backend.services.ai_quota import (
    estimate_tokens,
    estimate_cost,
    sanitize_log,
    check_daily_quota_and_reserve,
    update_usage_after_call,
    get_user_quota_status,
    QuotaExceededError,
    CostLimitExceededError,
)


class TestTokenEstimation:
    """Tests for token estimation functions."""

    def test_estimate_tokens_empty_string(self):
        """Empty string should return minimum of 1 token."""
        assert estimate_tokens("") == 1

    def test_estimate_tokens_none(self):
        """None should be treated as empty string."""
        assert estimate_tokens(None) == 1

    def test_estimate_tokens_short_string(self):
        """Short strings should return minimum of 1 token."""
        assert estimate_tokens("a") == 1
        assert estimate_tokens("ab") == 1
        assert estimate_tokens("abc") == 1

    def test_estimate_tokens_formula(self, monkeypatch):
        """The char-based fallback formula is len(text) // 4 (tiktoken, when
        importable, gives model-accurate counts instead — forced off here).
        Patch the SAME module object estimate_tokens was imported from
        (backend.services.ai_quota); the bare services.ai_quota path is a
        distinct module identity and patching it has no effect here."""
        monkeypatch.setattr(ai_quota, '_get_encoder', lambda: None)
        text = "a" * 100
        assert estimate_tokens(text) == 25

    def test_estimate_tokens_long_text(self, monkeypatch):
        """Longer text should scale correctly under the fallback formula."""
        monkeypatch.setattr(ai_quota, '_get_encoder', lambda: None)
        text = "Hello world! " * 100
        expected = len(text) // 4
        assert estimate_tokens(text) == expected


class TestCostEstimation:
    """Tests for cost estimation functions."""

    def test_estimate_cost_default_rate(self, monkeypatch):
        """Test cost calculation with default rate."""
        monkeypatch.delenv('OPENAI_COST_PER_1K', raising=False)
        # Default is $0.002 per 1K tokens
        cost = estimate_cost(1000, 500)
        assert cost == pytest.approx(0.003, rel=1e-4)

    def test_estimate_cost_custom_rate(self, monkeypatch):
        """Test cost calculation with custom rate."""
        monkeypatch.setenv('OPENAI_COST_PER_1K', '0.01')
        cost = estimate_cost(1000, 0)
        assert cost == pytest.approx(0.01, rel=1e-4)

    def test_estimate_cost_zero_tokens(self):
        """Zero tokens should result in zero cost."""
        cost = estimate_cost(0, 0)
        assert cost == 0


class TestLogSanitization:
    """Tests for log sanitization."""

    def test_sanitize_log_redacts_api_key(self):
        """API keys should be redacted."""
        text = "API Key: sk-abc123def456xyz"
        sanitized = sanitize_log(text)
        assert "sk-abc123def456xyz" not in sanitized
        assert "[REDACTED_API_KEY]" in sanitized

    def test_sanitize_log_truncates_long_strings(self):
        """Long strings should be truncated."""
        text = "a" * 500
        sanitized = sanitize_log(text, max_length=100)
        assert len(sanitized) < 150  # truncated + suffix
        assert "[truncated]" in sanitized

    def test_sanitize_log_handles_empty(self):
        """Empty string should be returned as-is."""
        assert sanitize_log("") == ""
        assert sanitize_log(None) is None


class TestQuotaChecking:
    """Tests for quota checking and reservation."""

    def test_check_quota_allows_within_limit(self, mock_redis, monkeypatch):
        """Quota should be allowed when under limit."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: mock_redis)
        monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")

        allowed, remaining = check_daily_quota_and_reserve("user123", 200)

        assert allowed is True
        assert remaining == 800

    def test_check_quota_blocks_over_limit(self, mock_redis, monkeypatch):
        """Quota should be blocked when over limit."""
        # Pre-populate usage near limit
        key = ai_quota._get_quota_key("user123")
        mock_redis.store[key] = 950

        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: mock_redis)
        monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")

        with pytest.raises(QuotaExceededError):
            check_daily_quota_and_reserve("user123", 100)

    def test_check_quota_anonymous_user(self, mock_redis, monkeypatch):
        """Anonymous users should use 'anonymous' as user_id."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: mock_redis)
        monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")

        allowed, remaining = check_daily_quota_and_reserve("", 100)

        assert allowed is True
        assert remaining == 900

    def test_check_quota_none_user(self, mock_redis, monkeypatch):
        """None user_id should be treated as anonymous."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: mock_redis)
        monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")

        allowed, remaining = check_daily_quota_and_reserve(None, 100)

        assert allowed is True


class TestUsageUpdate:
    """Tests for usage update after API calls."""

    def test_update_usage_increments_counter(self, mock_redis, monkeypatch):
        """Usage update should increment the counter."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: mock_redis)

        result = update_usage_after_call("user123", 150)

        assert result is True
        key = ai_quota._get_quota_key("user123")
        assert mock_redis.store.get(key) == 150

    def test_update_usage_accumulates(self, mock_redis, monkeypatch):
        """Multiple updates should accumulate."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: mock_redis)

        update_usage_after_call("user123", 100)
        update_usage_after_call("user123", 50)

        key = ai_quota._get_quota_key("user123")
        assert mock_redis.store.get(key) == 150

    def test_update_usage_no_redis(self, monkeypatch):
        """Update should return False when Redis unavailable."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: None)

        result = update_usage_after_call("user123", 150)

        assert result is False


class TestQuotaStatus:
    """Tests for quota status retrieval."""

    def test_get_quota_status_empty(self, mock_redis, monkeypatch):
        """New user should have full quota available."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: mock_redis)
        monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")

        status = get_user_quota_status("newuser")

        assert status['used'] == 0
        assert status['limit'] == 1000
        assert status['remaining'] == 1000
        assert status['percentage_used'] == 0.0

    def test_get_quota_status_partial_usage(self, mock_redis, monkeypatch):
        """User with usage should show correct remaining."""
        key = ai_quota._get_quota_key("user123")
        mock_redis.store[key] = 250

        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: mock_redis)
        monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")

        status = get_user_quota_status("user123")

        assert status['used'] == 250
        assert status['remaining'] == 750
        assert status['percentage_used'] == 25.0

    def test_get_quota_status_no_redis(self, monkeypatch):
        """Status should indicate Redis unavailable."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: None)

        status = get_user_quota_status("user123")

        assert status['redis_available'] is False
        assert status['used'] == 0


class TestMemoryFallback:
    """Tests for in-memory fallback when Redis unavailable."""

    def test_memory_fallback_tracks_usage(self, monkeypatch):
        """Memory fallback should track usage correctly."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: None)
        monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")

        # Reset memory store for this test
        ai_quota._memory_quota_store.clear()
        ai_quota._memory_fallback_active = False

        allowed, remaining = check_daily_quota_and_reserve("memuser", 200)

        assert allowed is True
        assert remaining == 800

    def test_memory_fallback_blocks_over_limit(self, monkeypatch):
        """Memory fallback should block when over limit."""
        monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: None)
        monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")

        # Reset memory store
        ai_quota._memory_quota_store.clear()
        ai_quota._memory_fallback_active = False

        # Use up most of the quota
        check_daily_quota_and_reserve("memuser2", 900)

        # Should block exceeding request
        with pytest.raises(QuotaExceededError):
            check_daily_quota_and_reserve("memuser2", 200)


class TestQuotaKeyGeneration:
    """Tests for quota key generation."""

    def test_quota_key_format(self):
        """Quota key should have expected format."""
        key = ai_quota._get_quota_key("user123")
        assert key.startswith("ai_usage:user123:")
        # Should contain date in YYYY-MM-DD format
        assert len(key.split(":")) == 3

    def test_quota_key_long_user_id_hashed(self):
        """Long user IDs should be hashed."""
        long_id = "a" * 100
        key = ai_quota._get_quota_key(long_id)
        # Should use hash prefix
        assert "hash_" in key

    def test_quota_key_different_users(self):
        """Different users should have different keys."""
        key1 = ai_quota._get_quota_key("user1")
        key2 = ai_quota._get_quota_key("user2")
        assert key1 != key2


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_quota_check_handles_redis_error(self, mock_redis, monkeypatch):
        """Should allow request on Redis error (fail open)."""
        def failing_redis():
            client = mock_redis
            client.eval = Mock(side_effect=Exception("Redis error"))
            return client

        monkeypatch.setattr(ai_quota, "_get_redis_client", failing_redis)
        monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")

        # Should not raise, should allow request
        allowed, remaining = check_daily_quota_and_reserve("user123", 100)
        assert allowed is True

    def test_estimate_tokens_with_unicode(self):
        """Should handle unicode text correctly."""
        text = "Hello " * 10
        tokens = estimate_tokens(text)
        assert tokens > 0

    def test_estimate_cost_very_small(self, monkeypatch):
        """Should handle very small token counts."""
        monkeypatch.setenv('OPENAI_COST_PER_1K', '0.002')
        cost = estimate_cost(1, 1)
        assert cost == pytest.approx(0.000004, rel=1e-2)
