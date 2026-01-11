"""
AI Quota and Cost Management Service
Provides Redis-backed daily per-user token quota tracking and cost estimation
with security-focused logging and conservative token estimation.
"""

import os
import re
import hashlib
from datetime import datetime, timezone
from typing import Tuple, Optional, Dict, Any
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Try to import redis - gracefully handle if not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("redis package not installed - quota management disabled")


# Custom exceptions
class QuotaExceededError(Exception):
    """Raised when user exceeds their daily token quota"""
    pass


class CostLimitExceededError(Exception):
    """Raised when estimated cost exceeds per-request limit"""
    pass


def estimate_tokens(text: str) -> int:
    """
    Conservative token estimation using character count method.
    This is a simple heuristic that can be replaced with tiktoken later.

    Formula: max(1, len(text) // 4)

    Args:
        text: Input text to estimate tokens for

    Returns:
        Estimated token count (minimum 1)

    Note:
        For production use with accurate tokenization, consider integrating tiktoken:
        import tiktoken
        encoding = tiktoken.encoding_for_model("gpt-4")
        return len(encoding.encode(text))
    """
    if text is None:
        text = ""
    return max(1, len(text) // 4)


def estimate_cost(prompt_tokens: int, response_tokens: int) -> float:
    """
    Estimate cost in USD based on token counts and configured pricing.

    Formula: cost = (prompt_tokens + response_tokens) / 1000 * OPENAI_COST_PER_1K

    Args:
        prompt_tokens: Number of tokens in the prompt
        response_tokens: Expected/actual number of tokens in the response

    Returns:
        Estimated cost in USD

    Example:
        >>> os.environ['OPENAI_COST_PER_1K'] = '0.002'
        >>> estimate_cost(1000, 500)
        0.003
    """
    cost_per_1k = float(os.getenv('OPENAI_COST_PER_1K', '0.002'))  # Default: $0.002 per 1K tokens
    total_tokens = prompt_tokens + response_tokens
    cost = (total_tokens / 1000.0) * cost_per_1k
    return cost


def sanitize_log(s: str, max_length: int = 256) -> str:
    """
    Sanitize log output by redacting API keys and limiting length.

    Security features:
    - Replaces patterns starting with 'sk-' with '[REDACTED_API_KEY]'
    - Truncates to max_length characters
    - Preserves useful debugging information

    Args:
        s: String to sanitize
        max_length: Maximum length of output (default 256)

    Returns:
        Sanitized string safe for logging

    Example:
        >>> sanitize_log("API Key: sk-abc123def456")
        'API Key: [REDACTED_API_KEY]'
    """
    if not s:
        return s

    # Redact API keys (patterns starting with sk-)
    sanitized = re.sub(r'sk-[a-zA-Z0-9]+', '[REDACTED_API_KEY]', s)

    # Limit length for log safety
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length] + '...[truncated]'

    return sanitized


def _get_redis_client() -> Optional[redis.Redis]:
    """
    Get Redis client instance.

    Returns:
        Redis client or None if Redis is unavailable
    """
    if not REDIS_AVAILABLE:
        return None

    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')

    try:
        client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True
        )
        # Test connection
        client.ping()
        return client
    except Exception as e:
        logger.warning(f"Failed to connect to Redis: {sanitize_log(str(e))}")
        return None


def _get_quota_key(user_id: str) -> str:
    """
    Generate Redis key for user's daily quota.

    Format: ai_usage:{user_id}:{YYYY-MM-DD}

    Args:
        user_id: Unique user identifier

    Returns:
        Redis key string
    """
    # Use UTC date for consistency
    date_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    # Hash long user IDs to keep keys manageable
    if len(user_id) > 64:
        user_hash = hashlib.sha256(user_id.encode()).hexdigest()[:16]
        user_id = f"hash_{user_hash}"
    return f"ai_usage:{user_id}:{date_str}"


def check_daily_quota_and_reserve(user_id: str, tokens_needed: int) -> Tuple[bool, int]:
    """
    Check if user has sufficient quota and atomically reserve tokens.

    This function performs an atomic check-and-reserve operation using Redis
    to prevent race conditions. If the user has sufficient quota, the tokens
    are immediately reserved.

    Args:
        user_id: Unique user identifier
        tokens_needed: Number of tokens to reserve

    Returns:
        Tuple of (allowed: bool, remaining: int)
        - allowed: True if quota is sufficient and tokens reserved
        - remaining: Remaining tokens after reservation (or current if denied)

    Raises:
        QuotaExceededError: If user exceeds daily token quota

    Example:
        >>> allowed, remaining = check_daily_quota_and_reserve('user123', 1000)
        >>> if allowed:
        ...     # Proceed with OpenAI call
        ...     pass
    """
    # Get daily limit from environment
    daily_limit = int(os.getenv('USER_DAILY_TOKEN_LIMIT', '100000'))  # Default: 100K tokens/day

    # If no user_id provided, use anonymous quota
    if not user_id:
        user_id = 'anonymous'
        logger.debug("No user_id provided, using anonymous quota")

    # Get Redis client
    client = _get_redis_client()

    # If Redis unavailable, allow but log warning
    if not client:
        logger.warning(f"Redis unavailable - bypassing quota check for user {sanitize_log(user_id)}")
        return True, daily_limit

    quota_key = _get_quota_key(user_id)

    try:
        script = """
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local incr = tonumber(ARGV[2])
        local current = tonumber(redis.call('GET', key) or '0')
        if (current + incr) > limit then
            return {0, limit - current}
        end
        local new_total = redis.call('INCRBY', key, incr)
        redis.call('EXPIRE', key, 172800)
        return {1, limit - new_total}
        """

        allowed, remaining = client.eval(script, 1, quota_key, daily_limit, tokens_needed)
        allowed = bool(allowed)

        if not allowed:
            logger.warning(
                f"Quota exceeded for user {sanitize_log(user_id)}: "
                f"needed={tokens_needed}, remaining={remaining}, limit={daily_limit}"
            )
            current_usage = daily_limit - int(remaining)
            raise QuotaExceededError(
                f"Daily token quota exceeded. Used: {current_usage}/{daily_limit} tokens. "
                f"Needed: {tokens_needed}, Available: {remaining}"
            )

        logger.info(
            f"Quota reserved for user {sanitize_log(user_id)}: "
            f"reserved={tokens_needed}, remaining={remaining}/{daily_limit}"
        )

        return True, int(remaining)

    except QuotaExceededError:
        # Re-raise quota errors
        raise
    except Exception as e:
        logger.error(f"Error checking quota: {sanitize_log(str(e))}")
        # On error, allow request but log the issue
        return True, daily_limit


def update_usage_after_call(user_id: str, tokens_used: int) -> bool:
    """
    Update actual token usage after successful OpenAI call.

    This function should be called after receiving a response from OpenAI
    to record the actual tokens consumed. If tokens were over-estimated
    during reservation, this adjusts the counter.

    Note: This function adds to the existing counter. If you want to replace
    the estimated value with actual, you'll need to track the estimated amount
    and calculate the difference.

    Args:
        user_id: Unique user identifier
        tokens_used: Actual number of tokens used (from OpenAI response)

    Returns:
        True if update successful, False otherwise

    Example:
        >>> # After OpenAI call
        >>> actual_tokens = response.json()['usage']['total_tokens']
        >>> update_usage_after_call('user123', actual_tokens)
    """
    if not user_id:
        user_id = 'anonymous'

    client = _get_redis_client()

    if not client:
        logger.warning("Redis unavailable - cannot update usage counter")
        return False

    quota_key = _get_quota_key(user_id)

    try:
        # Add actual usage (note: this adds to any reservation already made)
        client.incrby(quota_key, tokens_used)
        # Ensure expiry is set
        client.expire(quota_key, 48 * 60 * 60)

        # Get total usage for logging
        total_usage = client.get(quota_key)
        daily_limit = int(os.getenv('USER_DAILY_TOKEN_LIMIT', '100000'))

        logger.info(
            f"Usage updated for user {sanitize_log(user_id)}: "
            f"added={tokens_used}, total={total_usage}/{daily_limit}"
        )

        return True

    except Exception as e:
        logger.error(f"Error updating usage: {sanitize_log(str(e))}")
        return False


def get_user_quota_status(user_id: str) -> Dict[str, Any]:
    """
    Get current quota status for a user.

    Args:
        user_id: Unique user identifier

    Returns:
        Dictionary with quota information:
        - used: Tokens used today
        - limit: Daily token limit
        - remaining: Remaining tokens
        - percentage_used: Percentage of quota consumed
    """
    if not user_id:
        user_id = 'anonymous'

    daily_limit = int(os.getenv('USER_DAILY_TOKEN_LIMIT', '100000'))

    client = _get_redis_client()

    if not client:
        return {
            'used': 0,
            'limit': daily_limit,
            'remaining': daily_limit,
            'percentage_used': 0.0,
            'redis_available': False
        }

    quota_key = _get_quota_key(user_id)

    try:
        current_usage = client.get(quota_key)
        used = int(current_usage) if current_usage else 0
        remaining = max(0, daily_limit - used)
        percentage = (used / daily_limit * 100) if daily_limit > 0 else 0

        return {
            'used': used,
            'limit': daily_limit,
            'remaining': remaining,
            'percentage_used': round(percentage, 2),
            'redis_available': True
        }

    except Exception as e:
        logger.error(f"Error getting quota status: {sanitize_log(str(e))}")
        return {
            'used': 0,
            'limit': daily_limit,
            'remaining': daily_limit,
            'percentage_used': 0.0,
            'redis_available': False,
            'error': str(e)
        }


# ============================================================================
# UNIT TESTS (pytest style)
# ============================================================================

import pytest
from unittest.mock import MagicMock, patch, call


class TestTokenEstimation:
    """Test token estimation functions"""

    def test_estimate_tokens_basic(self):
        """Test basic token estimation"""
        # Empty string
        assert estimate_tokens("") == 1

        # Short text
        assert estimate_tokens("Hello world") == max(1, len("Hello world") // 4)

        # Longer text (each 4 chars ≈ 1 token)
        text = "a" * 400
        assert estimate_tokens(text) == 100

    def test_estimate_tokens_minimum(self):
        """Test that minimum token count is 1"""
        assert estimate_tokens("a") == 1
        assert estimate_tokens("ab") == 1
        assert estimate_tokens("abc") == 1

    def test_estimate_tokens_none(self):
        """Test handling of None input"""
        assert estimate_tokens(None) == 1


class TestCostEstimation:
    """Test cost estimation functions"""

    def test_estimate_cost_basic(self):
        """Test basic cost estimation"""
        with patch.dict(os.environ, {'OPENAI_COST_PER_1K': '0.002'}):
            # 1000 prompt + 500 response = 1500 tokens
            # 1500 / 1000 * 0.002 = 0.003
            cost = estimate_cost(1000, 500)
            assert cost == 0.003

    def test_estimate_cost_zero_tokens(self):
        """Test cost with zero tokens"""
        with patch.dict(os.environ, {'OPENAI_COST_PER_1K': '0.002'}):
            cost = estimate_cost(0, 0)
            assert cost == 0.0

    def test_estimate_cost_default_pricing(self):
        """Test cost with default pricing"""
        with patch.dict(os.environ, {}, clear=True):
            # Default should be 0.002
            cost = estimate_cost(1000, 0)
            assert cost == 0.002

    def test_estimate_cost_custom_pricing(self):
        """Test cost with custom pricing"""
        with patch.dict(os.environ, {'OPENAI_COST_PER_1K': '0.01'}):
            cost = estimate_cost(2000, 1000)
            # 3000 tokens / 1000 * 0.01 = 0.03
            assert cost == 0.03


class TestLogSanitization:
    """Test log sanitization functions"""

    def test_sanitize_api_key(self):
        """Test API key redaction"""
        text = "Using API key: sk-abc123def456ghi789"
        result = sanitize_log(text)
        assert 'sk-' not in result
        assert '[REDACTED_API_KEY]' in result

    def test_sanitize_multiple_keys(self):
        """Test multiple API key redaction"""
        text = "Key1: sk-abc123 and Key2: sk-def456"
        result = sanitize_log(text)
        assert 'sk-abc123' not in result
        assert 'sk-def456' not in result
        assert result.count('[REDACTED_API_KEY]') == 2

    def test_sanitize_long_text(self):
        """Test text truncation"""
        text = "a" * 500
        result = sanitize_log(text, max_length=100)
        assert len(result) <= 120  # 100 + "[truncated]"
        assert '[truncated]' in result

    def test_sanitize_empty(self):
        """Test empty string handling"""
        assert sanitize_log("") == ""
        assert sanitize_log(None) is None


class TestQuotaManagement:
    """Test quota management functions"""

    @patch('backend.services.ai_quota._get_redis_client')
    def test_check_quota_redis_unavailable(self, mock_redis):
        """Test quota check when Redis is unavailable"""
        mock_redis.return_value = None

        allowed, remaining = check_daily_quota_and_reserve('user123', 1000)

        assert allowed is True
        # Should return default limit when Redis unavailable
        assert remaining == int(os.getenv('USER_DAILY_TOKEN_LIMIT', '100000'))

    @patch('backend.services.ai_quota._get_redis_client')
    def test_check_quota_sufficient(self, mock_redis):
        """Test quota check with sufficient quota"""
        # Mock Redis client
        mock_client = MagicMock()
        mock_client.eval.return_value = [1, 85000]
        mock_redis.return_value = mock_client

        with patch.dict(os.environ, {'USER_DAILY_TOKEN_LIMIT': '100000'}):
            allowed, remaining = check_daily_quota_and_reserve('user123', 5000)

            assert allowed is True
            assert remaining == 85000  # 100K - 10K - 5K
            mock_client.eval.assert_called_once()

    @patch('backend.services.ai_quota._get_redis_client')
    def test_check_quota_exceeded(self, mock_redis):
        """Test quota check when quota exceeded"""
        # Mock Redis client with high usage
        mock_client = MagicMock()
        mock_client.eval.return_value = [0, 5000]
        mock_redis.return_value = mock_client

        with patch.dict(os.environ, {'USER_DAILY_TOKEN_LIMIT': '100000'}):
            with pytest.raises(QuotaExceededError):
                check_daily_quota_and_reserve('user123', 10000)  # Try to use 10K more

    @patch('backend.services.ai_quota._get_redis_client')
    def test_check_quota_first_use(self, mock_redis):
        """Test quota check for first use of the day"""
        # Mock Redis client with no previous usage
        mock_client = MagicMock()
        mock_client.eval.return_value = [1, 99000]
        mock_redis.return_value = mock_client

        with patch.dict(os.environ, {'USER_DAILY_TOKEN_LIMIT': '100000'}):
            allowed, remaining = check_daily_quota_and_reserve('user123', 1000)

            assert allowed is True
            assert remaining == 99000  # 100K - 1K

    @patch('backend.services.ai_quota._get_redis_client')
    def test_update_usage_success(self, mock_redis):
        """Test successful usage update"""
        mock_client = MagicMock()
        mock_client.get.return_value = '15000'
        mock_redis.return_value = mock_client

        result = update_usage_after_call('user123', 5000)

        assert result is True
        mock_client.incrby.assert_called_once()
        mock_client.expire.assert_called_once()

    @patch('backend.services.ai_quota._get_redis_client')
    def test_update_usage_redis_unavailable(self, mock_redis):
        """Test usage update when Redis unavailable"""
        mock_redis.return_value = None

        result = update_usage_after_call('user123', 5000)

        assert result is False

    @patch('backend.services.ai_quota._get_redis_client')
    def test_get_quota_status(self, mock_redis):
        """Test getting quota status"""
        mock_client = MagicMock()
        mock_client.get.return_value = '25000'
        mock_redis.return_value = mock_client

        with patch.dict(os.environ, {'USER_DAILY_TOKEN_LIMIT': '100000'}):
            status = get_user_quota_status('user123')

            assert status['used'] == 25000
            assert status['limit'] == 100000
            assert status['remaining'] == 75000
            assert status['percentage_used'] == 25.0
            assert status['redis_available'] is True


class TestQuotaKeyGeneration:
    """Test Redis key generation"""

    def test_quota_key_format(self):
        """Test quota key format"""
        with patch('backend.services.ai_quota.datetime') as mock_datetime:
            mock_datetime.now.return_value.strftime.return_value = '2026-01-11'

            key = _get_quota_key('user123')

            assert key == 'ai_usage:user123:2026-01-11'

    def test_quota_key_long_user_id(self):
        """Test quota key with long user ID"""
        long_id = 'a' * 100
        key = _get_quota_key(long_id)

        # Should be hashed
        assert 'hash_' in key
        assert len(key) < len(long_id) + 50


class TestExceptions:
    """Test custom exceptions"""

    def test_quota_exceeded_error(self):
        """Test QuotaExceededError exception"""
        with pytest.raises(QuotaExceededError) as exc_info:
            raise QuotaExceededError("Quota exceeded")

        assert "Quota exceeded" in str(exc_info.value)

    def test_cost_limit_exceeded_error(self):
        """Test CostLimitExceededError exception"""
        with pytest.raises(CostLimitExceededError) as exc_info:
            raise CostLimitExceededError("Cost limit exceeded")

        assert "Cost limit exceeded" in str(exc_info.value)


# Run tests with: pytest backend/services/ai_quota.py -v
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
