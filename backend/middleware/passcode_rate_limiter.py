"""
Passcode Rate Limiter Middleware

Provides brute-force protection for passcode verification by:
- Tracking failed attempts per device
- Locking devices after threshold exceeded
- Using Redis for distributed rate limiting

Security design:
- 10 failed attempts within 5 minutes triggers 10-minute lockout
- Attempts counter expires after 5 minutes of no activity
- Lock expires automatically after 10 minutes
- Device ID based tracking (not IP to support multiple devices)
"""
import os
from typing import Optional, Tuple
import redis
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Configuration
MAX_ATTEMPTS = int(os.getenv('PASSCODE_MAX_ATTEMPTS', '10'))
ATTEMPT_WINDOW_SECONDS = int(os.getenv('PASSCODE_ATTEMPT_WINDOW', '300'))  # 5 minutes
LOCKOUT_DURATION_SECONDS = int(os.getenv('PASSCODE_LOCKOUT_DURATION', '600'))  # 10 minutes

# Initialize Redis client
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """
    Get or initialize Redis client for rate limiting.

    Returns:
        Redis client or None if Redis unavailable
    """
    global _redis_client

    if _redis_client is not None:
        return _redis_client

    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    try:
        _redis_client = redis.Redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2
        )
        # Test connection
        _redis_client.ping()
        logger.info("✓ Passcode rate limiter connected to Redis")
        return _redis_client
    except (redis.ConnectionError, redis.TimeoutError) as e:
        logger.warning(f"Redis unavailable for passcode rate limiting: {e}")
        return None


def _get_attempts_key(device_id: str) -> str:
    """Get Redis key for attempt counter."""
    return f"passcode:attempts:{device_id}"


def _get_lock_key(device_id: str) -> str:
    """Get Redis key for device lock."""
    return f"passcode:lock:{device_id}"


def record_failed_passcode_attempt(device_id: str) -> int:
    """
    Record a failed passcode attempt and return total attempts count.

    Args:
        device_id: Unique device identifier

    Returns:
        Total number of failed attempts in current window
    """
    client = get_redis_client()
    if not client:
        # Fail open - if Redis unavailable, don't block but log warning
        logger.warning(f"Cannot record failed attempt for {device_id}: Redis unavailable")
        return 0

    try:
        attempts_key = _get_attempts_key(device_id)
        lock_key = _get_lock_key(device_id)

        # Increment attempt counter
        attempts = client.incr(attempts_key)

        # Set TTL on first attempt
        if attempts == 1:
            client.expire(attempts_key, ATTEMPT_WINDOW_SECONDS)

        # Lock device if threshold exceeded
        if attempts >= MAX_ATTEMPTS:
            client.setex(lock_key, LOCKOUT_DURATION_SECONDS, '1')
            logger.warning(
                f"Device {device_id} locked after {attempts} failed attempts"
            )

        logger.info(
            f"Failed passcode attempt for device {device_id}: "
            f"{attempts}/{MAX_ATTEMPTS} attempts"
        )

        return attempts

    except redis.RedisError as e:
        logger.error(f"Redis error recording failed attempt: {e}")
        return 0


def is_device_locked(device_id: str) -> bool:
    """
    Check if device is currently locked due to too many failed attempts.

    Args:
        device_id: Unique device identifier

    Returns:
        True if device is locked, False otherwise
    """
    client = get_redis_client()
    if not client:
        # Fail open - if Redis unavailable, don't block
        return False

    try:
        lock_key = _get_lock_key(device_id)
        is_locked = client.exists(lock_key) > 0

        if is_locked:
            # Get remaining lock time
            ttl = client.ttl(lock_key)
            logger.warning(
                f"Device {device_id} is locked (TTL: {ttl}s remaining)"
            )

        return is_locked

    except redis.RedisError as e:
        logger.error(f"Redis error checking device lock: {e}")
        # Fail open on error
        return False


def get_attempt_count(device_id: str) -> int:
    """
    Get current failed attempt count for device.

    Args:
        device_id: Unique device identifier

    Returns:
        Number of failed attempts in current window
    """
    client = get_redis_client()
    if not client:
        return 0

    try:
        attempts_key = _get_attempts_key(device_id)
        attempts = client.get(attempts_key)
        return int(attempts) if attempts else 0

    except (redis.RedisError, ValueError) as e:
        logger.error(f"Redis error getting attempt count: {e}")
        return 0


def reset_failed_attempts(device_id: str) -> bool:
    """
    Reset failed attempts counter for device after successful authentication.

    Args:
        device_id: Unique device identifier

    Returns:
        True if reset successful, False otherwise
    """
    client = get_redis_client()
    if not client:
        return False

    try:
        attempts_key = _get_attempts_key(device_id)
        lock_key = _get_lock_key(device_id)

        # Delete both attempts counter and lock
        client.delete(attempts_key, lock_key)

        logger.info(f"Reset passcode attempts for device {device_id}")
        return True

    except redis.RedisError as e:
        logger.error(f"Redis error resetting attempts: {e}")
        return False


def get_lockout_info(device_id: str) -> Tuple[bool, int, int]:
    """
    Get comprehensive lockout status for device.

    Args:
        device_id: Unique device identifier

    Returns:
        Tuple of (is_locked, attempts_remaining, lockout_ttl_seconds)
    """
    client = get_redis_client()
    if not client:
        return False, MAX_ATTEMPTS, 0

    try:
        attempts = get_attempt_count(device_id)
        is_locked = is_device_locked(device_id)
        attempts_remaining = max(0, MAX_ATTEMPTS - attempts)

        lockout_ttl = 0
        if is_locked:
            lock_key = _get_lock_key(device_id)
            lockout_ttl = max(0, client.ttl(lock_key))

        return is_locked, attempts_remaining, lockout_ttl

    except redis.RedisError as e:
        logger.error(f"Redis error getting lockout info: {e}")
        return False, MAX_ATTEMPTS, 0
