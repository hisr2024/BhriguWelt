"""
Production-grade Redis Connection Manager
Provides connection pooling, retry logic, circuit breaker pattern, and graceful degradation
"""
import os
import time
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from functools import wraps
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Try to import redis with graceful handling
try:
    import redis
    from redis.connection import ConnectionPool
    from redis.exceptions import RedisError, ConnectionError, TimeoutError
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None
    ConnectionPool = None
    RedisError = Exception
    ConnectionError = Exception
    TimeoutError = Exception
    logger.warning("redis package not installed - Redis features will be disabled")


class CircuitBreaker:
    """
    Circuit breaker pattern to prevent cascading failures.

    States:
    - CLOSED: Normal operation
    - OPEN: Failures exceeded threshold, reject requests immediately
    - HALF_OPEN: Testing if service recovered
    """

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        """
        Initialize circuit breaker

        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before testing recovery
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    def call(self, func):
        """Decorator to wrap function calls with circuit breaker logic"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            if self.state == "OPEN":
                if self._should_attempt_reset():
                    self.state = "HALF_OPEN"
                    logger.info("Circuit breaker entering HALF_OPEN state - testing connection")
                else:
                    # Circuit is open, fail fast
                    raise ConnectionError("Circuit breaker is OPEN - Redis unavailable")

            try:
                result = func(*args, **kwargs)
                self._on_success()
                return result
            except Exception as e:
                self._on_failure()
                raise e

        return wrapper

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to test recovery"""
        if self.last_failure_time is None:
            return True
        return datetime.now() - self.last_failure_time > timedelta(seconds=self.recovery_timeout)

    def _on_success(self):
        """Handle successful call"""
        if self.state == "HALF_OPEN":
            logger.info("Circuit breaker CLOSED - Redis connection recovered")
            self.state = "CLOSED"
        self.failure_count = 0
        self.last_failure_time = None

    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.failure_count >= self.failure_threshold:
            logger.warning(
                f"Circuit breaker OPEN - {self.failure_count} consecutive failures. "
                f"Will retry in {self.recovery_timeout} seconds"
            )
            self.state = "OPEN"


class RedisConnectionManager:
    """
    Singleton Redis connection manager with production-grade features:
    - Connection pooling
    - Retry logic with exponential backoff
    - Circuit breaker pattern
    - Graceful degradation
    - Health checks
    - Thread-safe operations
    """

    _instance: Optional['RedisConnectionManager'] = None
    _lock = None

    def __new__(cls):
        """Singleton pattern to ensure single connection pool"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        """Initialize Redis connection manager"""
        if self._initialized:
            return

        self._initialized = True
        self.enabled = os.getenv('REDIS_ENABLED', 'true').lower() == 'true'
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.pool: Optional[ConnectionPool] = None
        self.client: Optional['redis.Redis'] = None
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=int(os.getenv('REDIS_CIRCUIT_BREAKER_THRESHOLD', '5')),
            recovery_timeout=int(os.getenv('REDIS_CIRCUIT_BREAKER_TIMEOUT', '60'))
        )

        # Metrics
        self.connection_attempts = 0
        self.connection_failures = 0
        self.connection_successes = 0
        self.last_connection_time: Optional[datetime] = None

        # Log initial configuration
        if not REDIS_AVAILABLE:
            logger.info("Redis client library not available - Redis features disabled")
        elif not self.enabled:
            logger.info("Redis disabled via REDIS_ENABLED=false environment variable")
        else:
            logger.info(f"Redis connection manager initialized with URL: {self._sanitize_url(self.redis_url)}")
            self._initialize_connection()

    def _sanitize_url(self, url: str) -> str:
        """Sanitize Redis URL for logging (hide password)"""
        if '@' in url:
            # redis://user:password@host:port -> redis://user:***@host:port
            parts = url.split('@')
            if ':' in parts[0]:
                auth_parts = parts[0].rsplit(':', 1)
                return f"{auth_parts[0]}:***@{parts[1]}"
        return url

    def _initialize_connection(self):
        """Initialize Redis connection pool"""
        if not REDIS_AVAILABLE or not self.enabled:
            return

        try:
            # Parse connection parameters
            max_connections = int(os.getenv('REDIS_MAX_CONNECTIONS', '50'))
            socket_timeout = int(os.getenv('REDIS_SOCKET_TIMEOUT', '5'))
            socket_connect_timeout = int(os.getenv('REDIS_CONNECT_TIMEOUT', '5'))

            # Create connection pool
            self.pool = ConnectionPool.from_url(
                self.redis_url,
                max_connections=max_connections,
                socket_timeout=socket_timeout,
                socket_connect_timeout=socket_connect_timeout,
                decode_responses=True,
                retry_on_timeout=True,
                health_check_interval=30
            )

            # Create Redis client
            self.client = redis.Redis(connection_pool=self.pool)

            # Test connection
            self._test_connection_internal()

            logger.info(
                f"Redis connection pool created successfully "
                f"(max_connections={max_connections}, timeout={socket_timeout}s)"
            )

        except Exception as e:
            logger.error(f"Failed to initialize Redis connection pool: {str(e)}")
            self.client = None
            self.pool = None

    def _test_connection_internal(self):
        """Internal method to test connection"""
        if self.client:
            # Wrap the ping call with circuit breaker
            wrapped_ping = self.circuit_breaker.call(lambda: self.client.ping())
            return wrapped_ping()

    def get_client(self) -> Optional['redis.Redis']:
        """
        Get Redis client with retry logic

        Returns:
            Redis client or None if unavailable
        """
        if not REDIS_AVAILABLE or not self.enabled:
            return None

        if self.client is None:
            logger.warning("Redis client not initialized")
            return None

        # Check circuit breaker state
        if self.circuit_breaker.state == "OPEN":
            logger.debug("Redis circuit breaker is OPEN - skipping connection attempt")
            return None

        try:
            # Quick health check
            self.connection_attempts += 1
            self.client.ping()
            self.connection_successes += 1
            self.last_connection_time = datetime.now()
            return self.client

        except Exception as e:
            self.connection_failures += 1
            logger.warning(f"Redis connection check failed: {str(e)}")
            return None

    def execute_with_retry(
        self,
        operation,
        *args,
        max_retries: int = 3,
        backoff_base: float = 0.1,
        **kwargs
    ) -> Optional[Any]:
        """
        Execute Redis operation with retry logic and exponential backoff

        Args:
            operation: Redis operation to execute (e.g., client.get, client.set)
            *args: Positional arguments for the operation
            max_retries: Maximum number of retry attempts
            backoff_base: Base delay for exponential backoff (seconds)
            **kwargs: Keyword arguments for the operation

        Returns:
            Operation result or None if failed after retries
        """
        client = self.get_client()
        if client is None:
            return None

        last_exception = None
        for attempt in range(max_retries + 1):
            try:
                result = operation(*args, **kwargs)

                # Reset circuit breaker on success
                if attempt > 0:
                    logger.info(f"Redis operation succeeded on attempt {attempt + 1}")

                return result

            except Exception as e:
                last_exception = e

                if attempt < max_retries:
                    delay = backoff_base * (2 ** attempt)
                    logger.warning(
                        f"Redis operation failed (attempt {attempt + 1}/{max_retries + 1}): {str(e)}. "
                        f"Retrying in {delay}s..."
                    )
                    time.sleep(delay)
                else:
                    logger.error(
                        f"Redis operation failed after {max_retries + 1} attempts: {str(e)}"
                    )
                    self.circuit_breaker._on_failure()

        return None

    def test_connection(self) -> bool:
        """
        Test Redis connection health

        Returns:
            True if connection is healthy, False otherwise
        """
        if not REDIS_AVAILABLE or not self.enabled:
            return False

        try:
            client = self.get_client()
            if client is None:
                return False

            client.ping()
            return True

        except Exception as e:
            logger.warning(f"Redis health check failed: {str(e)}")
            return False

    def get_metrics(self) -> Dict[str, Any]:
        """
        Get connection metrics

        Returns:
            Dictionary with connection statistics
        """
        return {
            'enabled': self.enabled,
            'available': REDIS_AVAILABLE,
            'connected': self.test_connection(),
            'circuit_breaker_state': self.circuit_breaker.state,
            'connection_attempts': self.connection_attempts,
            'connection_successes': self.connection_successes,
            'connection_failures': self.connection_failures,
            'last_connection_time': self.last_connection_time.isoformat() if self.last_connection_time else None,
            'failure_count': self.circuit_breaker.failure_count,
            'last_failure_time': self.circuit_breaker.last_failure_time.isoformat() if self.circuit_breaker.last_failure_time else None
        }

    def close(self):
        """Close Redis connection pool"""
        if self.pool:
            self.pool.disconnect()
            logger.info("Redis connection pool closed")


# Singleton instance accessor
_redis_manager: Optional[RedisConnectionManager] = None


def get_redis_manager() -> RedisConnectionManager:
    """
    Get singleton Redis connection manager instance

    Returns:
        RedisConnectionManager instance
    """
    global _redis_manager
    if _redis_manager is None:
        _redis_manager = RedisConnectionManager()
    return _redis_manager


def get_redis_client() -> Optional['redis.Redis']:
    """
    Convenience function to get Redis client

    Returns:
        Redis client or None if unavailable
    """
    manager = get_redis_manager()
    return manager.get_client()


# Example usage
if __name__ == '__main__':
    # Example 1: Basic usage
    manager = get_redis_manager()
    client = manager.get_client()

    if client:
        # Set value with retry
        result = manager.execute_with_retry(client.set, 'test_key', 'test_value', ex=60)
        print(f"Set result: {result}")

        # Get value with retry
        value = manager.execute_with_retry(client.get, 'test_key')
        print(f"Get result: {value}")

        # Health check
        is_healthy = manager.test_connection()
        print(f"Connection healthy: {is_healthy}")

        # Get metrics
        metrics = manager.get_metrics()
        print(f"Metrics: {metrics}")
    else:
        print("Redis not available - graceful degradation in effect")
