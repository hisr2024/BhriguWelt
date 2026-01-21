"""
AI Quota and Cost Management Service
Provides Redis-backed daily per-user token quota tracking and cost estimation
with security-focused logging and conservative token estimation.

Falls back to in-memory tracking when Redis is unavailable to prevent quota bypass.
"""

import os
import re
import hashlib
from datetime import datetime, timezone
from typing import Tuple, Optional, Dict, Any
from collections import defaultdict
from threading import Lock
from utils.logger import setup_logger

logger = setup_logger(__name__)

# In-memory fallback for quota tracking when Redis is unavailable
_memory_quota_store = defaultdict(int)
_memory_quota_lock = Lock()
_memory_fallback_active = False
_redis_unavailable_logged = False  # Track if we've already logged Redis unavailability

# Try to import redis - gracefully handle if not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("redis package not installed - using in-memory quota tracking")


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


def _get_redis_client() -> Optional[Any]:
    """
    Get Redis client instance using production-grade connection manager.

    Returns:
        Redis client or None if Redis is unavailable
    """
    if not REDIS_AVAILABLE:
        return None

    try:
        # Use the new Redis connection manager with connection pooling,
        # retry logic, and circuit breaker pattern
        from services.redis_connection import get_redis_client
        return get_redis_client()
    except Exception as e:
        # Fallback to old behavior if new module fails to import
        logger.warning(f"Failed to use Redis connection manager, falling back: {sanitize_log(str(e))}")
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
        except Exception as e2:
            logger.warning(f"Failed to connect to Redis: {sanitize_log(str(e2))}")
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


def _check_memory_quota(user_id: str, tokens_needed: int, daily_limit: int) -> Tuple[bool, int]:
    """
    In-memory fallback quota tracking when Redis is unavailable.

    WARNING: This is a fallback mechanism that doesn't persist across restarts.
    Data is lost on server restart, which resets all quotas.

    Args:
        user_id: Unique user identifier
        tokens_needed: Number of tokens to reserve
        daily_limit: Daily token limit

    Returns:
        Tuple of (allowed: bool, remaining: int)

    Note:
        This fallback prevents quota bypass attacks when Redis is down,
        but quotas reset on server restart. Use Redis for production.
    """
    global _memory_fallback_active

    # Log warning on first use of fallback
    if not _memory_fallback_active:
        _memory_fallback_active = True
        logger.error(
            "QUOTA FALLBACK ACTIVE: Redis unavailable, using in-memory tracking. "
            "Quotas will reset on server restart! This should only happen in development."
        )

    quota_key = _get_quota_key(user_id)

    with _memory_quota_lock:
        current_usage = _memory_quota_store[quota_key]
        new_usage = current_usage + tokens_needed

        if new_usage > daily_limit:
            remaining = daily_limit - current_usage
            logger.warning(
                f"[MEMORY FALLBACK] Quota exceeded for user {sanitize_log(user_id)}: "
                f"needed={tokens_needed}, remaining={remaining}, limit={daily_limit}"
            )
            raise QuotaExceededError(
                f"Daily token quota exceeded. Used: {current_usage}/{daily_limit} tokens. "
                f"Needed: {tokens_needed}, Available: {remaining}"
            )

        # Reserve tokens
        _memory_quota_store[quota_key] = new_usage
        remaining = daily_limit - new_usage

        logger.info(
            f"[MEMORY FALLBACK] Quota reserved for user {sanitize_log(user_id)}: "
            f"reserved={tokens_needed}, remaining={remaining}/{daily_limit}"
        )

        return True, remaining


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

    # If Redis unavailable, use in-memory fallback instead of bypassing
    if not client:
        return _check_memory_quota(user_id, tokens_needed, daily_limit)

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
        global _redis_unavailable_logged
        redis_enabled = os.getenv('REDIS_ENABLED', 'true').lower() == 'true'
        if redis_enabled and not _redis_unavailable_logged:
            logger.warning("Redis unavailable - cannot update usage counter (further warnings suppressed)")
            _redis_unavailable_logged = True
        elif not redis_enabled:
            logger.debug("Redis disabled - skipping usage counter update")
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
# Tests are defined only when pytest is available (not in production)
# Run tests with: pytest backend/services/ai_quota.py -v
# ============================================================================

# Note: Test classes moved to backend/tests/test_ai_quota.py to avoid
# import errors in production when pytest is not installed.
