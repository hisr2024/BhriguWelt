"""
Enhanced Redis Caching Service
Performance-optimized with connection pooling, circuit breaker, and monitoring
"""

import os
import json
import hashlib
from typing import Any, Optional, Callable, Mapping, Sequence
from datetime import timedelta
from functools import wraps
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Try to import redis - it's optional
try:
    import redis
    from redis.connection import ConnectionPool
    from redis.sentinel import Sentinel
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("redis package not installed - caching disabled")


class CircuitBreaker:
    """
    Circuit breaker pattern for Redis operations
    Prevents cascading failures when Redis is down
    """
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.last_failure_time = None
        self.state = 'closed'  # closed, open, half_open

    def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.state == 'open':
            # Check if recovery timeout has passed
            import time
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = 'half_open'
                logger.info("Circuit breaker entering half-open state")
            else:
                raise Exception("Circuit breaker is open")

        try:
            result = func(*args, **kwargs)
            # Success - reset circuit
            if self.state == 'half_open':
                self.state = 'closed'
                self.failure_count = 0
                logger.info("Circuit breaker closed after successful recovery")
            return result
        except Exception as e:
            self.failure_count += 1
            import time
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                self.state = 'open'
                logger.error(f"Circuit breaker opened after {self.failure_count} failures")

            raise e


class RedisCache:
    """
    Enhanced Redis caching service with performance optimizations
    Features: connection pooling, circuit breaker, TTL management, monitoring
    """

    def __init__(self):
        self.enabled = os.getenv('ENABLE_CACHING', 'true').lower() == 'true'
        self.client = None
        self.pool = None
        self.circuit_breaker = CircuitBreaker()
        self.stats = {
            'hits': 0,
            'misses': 0,
            'errors': 0,
            'sets': 0,
            'deletes': 0
        }

        if REDIS_AVAILABLE and self.enabled:
            self._init_redis()

    def _init_redis(self):
        """Initialize Redis connection with optimized settings"""
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        redis_password = os.getenv('REDIS_PASSWORD')
        max_connections = int(os.getenv('REDIS_MAX_CONNECTIONS', 50))
        socket_timeout = int(os.getenv('REDIS_SOCKET_TIMEOUT', 5))
        socket_connect_timeout = int(os.getenv('REDIS_CONNECT_TIMEOUT', 5))

        try:
            # Create connection pool for better performance
            self.pool = ConnectionPool.from_url(
                redis_url,
                max_connections=max_connections,
                socket_timeout=socket_timeout,
                socket_connect_timeout=socket_connect_timeout,
                socket_keepalive=True,
                socket_keepalive_options={
                    1: 1,  # TCP_KEEPIDLE
                    2: 1,  # TCP_KEEPINTVL
                    3: 3   # TCP_KEEPCNT
                },
                retry_on_timeout=True,
                health_check_interval=30,
                password=redis_password,
                decode_responses=True
            )

            self.client = redis.Redis(connection_pool=self.pool)

            # Test connection
            self.client.ping()
            logger.info(f"✓ Redis cache initialized with connection pool (max_connections={max_connections})")

        except Exception as e:
            logger.warning(f"Redis initialization failed: {str(e)} - caching disabled")
            self.client = None
            self.enabled = False

    def _make_key(self, namespace: str, key: str) -> str:
        """Generate namespaced cache key"""
        # Hash long keys to prevent Redis key length issues
        if len(key) > 200:
            key_hash = hashlib.sha256(key.encode()).hexdigest()[:16]
            return f"bhrigu:{namespace}:{key_hash}"
        return f"bhrigu:{namespace}:{key}"

    def get(self, namespace: str, key: str, default=None) -> Any:
        """
        Get value from cache

        Args:
            namespace: Cache namespace (e.g., 'prediction', 'chart')
            key: Cache key
            default: Default value if not found
        """
        if not self.enabled or not self.client:
            self.stats['misses'] += 1
            return default

        try:
            cache_key = self._make_key(namespace, key)

            def _get():
                return self.client.get(cache_key)

            value = self.circuit_breaker.call(_get)

            if value is None:
                self.stats['misses'] += 1
                logger.debug(f"Cache miss: {namespace}:{key[:50]}")
                return default

            self.stats['hits'] += 1
            logger.debug(f"Cache hit: {namespace}:{key[:50]}")

            # Deserialize JSON
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value

        except Exception as e:
            self.stats['errors'] += 1
            logger.warning(f"Cache get error: {str(e)}")
            return default

    def set(self, namespace: str, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache

        Args:
            namespace: Cache namespace
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time-to-live in seconds (default: 3600 = 1 hour)
        """
        if not self.enabled or not self.client:
            return False

        ttl = ttl or int(os.getenv('REDIS_DEFAULT_TTL', 3600))

        try:
            cache_key = self._make_key(namespace, key)

            # Serialize to JSON if not string
            if not isinstance(value, str):
                value = json.dumps(value)

            def _set():
                return self.client.setex(cache_key, ttl, value)

            self.circuit_breaker.call(_set)
            self.stats['sets'] += 1
            logger.debug(f"Cache set: {namespace}:{key[:50]} (TTL: {ttl}s)")
            return True

        except Exception as e:
            self.stats['errors'] += 1
            logger.warning(f"Cache set error: {str(e)}")
            return False

    def delete(self, namespace: str, key: str) -> bool:
        """Delete value from cache"""
        if not self.enabled or not self.client:
            return False

        try:
            cache_key = self._make_key(namespace, key)

            def _delete():
                return self.client.delete(cache_key)

            self.circuit_breaker.call(_delete)
            self.stats['deletes'] += 1
            return True

        except Exception as e:
            self.stats['errors'] += 1
            logger.warning(f"Cache delete error: {str(e)}")
            return False

    def get_many(self, namespace: str, keys: Sequence[str], default=None) -> dict:
        """
        Fetch multiple cached values in a single pipeline call.

        Args:
            namespace: Cache namespace
            keys: Cache keys to retrieve
            default: Default value for missing keys
        """
        if not self.enabled or not self.client or not keys:
            self.stats['misses'] += len(keys)
            return {key: default for key in keys}

        cache_keys = [self._make_key(namespace, key) for key in keys]

        try:
            def _get_many():
                pipeline = self.client.pipeline(transaction=False)
                for cache_key in cache_keys:
                    pipeline.get(cache_key)
                return pipeline.execute()

            values = self.circuit_breaker.call(_get_many)

            results = {}
            for key, value in zip(keys, values):
                if value is None:
                    self.stats['misses'] += 1
                    results[key] = default
                    continue

                self.stats['hits'] += 1
                try:
                    results[key] = json.loads(value)
                except json.JSONDecodeError:
                    results[key] = value

            return results

        except Exception as e:
            self.stats['errors'] += 1
            logger.warning(f"Cache get_many error: {str(e)}")
            self.stats['misses'] += len(keys)
            return {key: default for key in keys}

    def set_many(self, namespace: str, items: Mapping[str, Any], ttl: Optional[int] = None) -> bool:
        """
        Set multiple cache entries in a single pipeline call.

        Args:
            namespace: Cache namespace
            items: Mapping of cache keys to values
            ttl: Time-to-live in seconds
        """
        if not self.enabled or not self.client or not items:
            return False

        ttl = ttl or int(os.getenv('REDIS_DEFAULT_TTL', 3600))

        try:
            def _set_many():
                pipeline = self.client.pipeline(transaction=False)
                for key, value in items.items():
                    cache_key = self._make_key(namespace, key)
                    if not isinstance(value, str):
                        value = json.dumps(value)
                    pipeline.setex(cache_key, ttl, value)
                return pipeline.execute()

            self.circuit_breaker.call(_set_many)
            self.stats['sets'] += len(items)
            logger.debug(f"Cache set_many: {namespace} ({len(items)} keys, TTL: {ttl}s)")
            return True

        except Exception as e:
            self.stats['errors'] += 1
            logger.warning(f"Cache set_many error: {str(e)}")
            return False

    def delete_many(self, namespace: str, keys: Sequence[str]) -> int:
        """Delete multiple cache keys in a single pipeline call."""
        if not self.enabled or not self.client or not keys:
            return 0

        cache_keys = [self._make_key(namespace, key) for key in keys]

        try:
            def _delete_many():
                pipeline = self.client.pipeline(transaction=False)
                for cache_key in cache_keys:
                    pipeline.delete(cache_key)
                return pipeline.execute()

            results = self.circuit_breaker.call(_delete_many)
            deleted = sum(int(result) for result in results if isinstance(result, int))
            self.stats['deletes'] += deleted
            return deleted

        except Exception as e:
            self.stats['errors'] += 1
            logger.warning(f"Cache delete_many error: {str(e)}")
            return 0

    def delete_pattern(self, namespace: str, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.enabled or not self.client:
            return 0

        try:
            cache_pattern = self._make_key(namespace, pattern)

            def _delete_pattern():
                keys = self.client.keys(cache_pattern)
                if keys:
                    return self.client.delete(*keys)
                return 0

            count = self.circuit_breaker.call(_delete_pattern)
            self.stats['deletes'] += count
            logger.info(f"Cache pattern delete: {namespace}:{pattern} ({count} keys)")
            return count

        except Exception as e:
            self.stats['errors'] += 1
            logger.warning(f"Cache pattern delete error: {str(e)}")
            return 0

    def flush_namespace(self, namespace: str) -> int:
        """Flush all keys in namespace"""
        return self.delete_pattern(namespace, '*')

    def exists(self, namespace: str, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.enabled or not self.client:
            return False

        try:
            cache_key = self._make_key(namespace, key)

            def _exists():
                return self.client.exists(cache_key)

            return bool(self.circuit_breaker.call(_exists))

        except Exception as e:
            return False

    def get_ttl(self, namespace: str, key: str) -> Optional[int]:
        """Get remaining TTL for key"""
        if not self.enabled or not self.client:
            return None

        try:
            cache_key = self._make_key(namespace, key)

            def _ttl():
                return self.client.ttl(cache_key)

            ttl = self.circuit_breaker.call(_ttl)
            return ttl if ttl > 0 else None

        except Exception as e:
            return None

    def get_stats(self) -> dict:
        """Get cache statistics"""
        stats = self.stats.copy()

        # Calculate hit rate
        total_requests = stats['hits'] + stats['misses']
        stats['hit_rate'] = (stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        stats['total_requests'] = total_requests
        stats['enabled'] = self.enabled
        stats['circuit_breaker_state'] = self.circuit_breaker.state

        # Get Redis info if available
        if self.enabled and self.client:
            try:
                info = self.client.info('stats')
                stats['redis_connected_clients'] = info.get('connected_clients', 0)
                stats['redis_used_memory'] = info.get('used_memory_human', 'N/A')
                stats['redis_total_commands'] = info.get('total_commands_processed', 0)
            except (redis.ConnectionError, redis.TimeoutError) as e:
                logger.debug(f"Redis info unavailable: {e}")

        return stats

    def reset_stats(self):
        """Reset cache statistics"""
        self.stats = {
            'hits': 0,
            'misses': 0,
            'errors': 0,
            'sets': 0,
            'deletes': 0
        }


# Global cache instance
cache = RedisCache()


def cached(namespace: str, ttl: Optional[int] = None, key_func: Optional[Callable] = None):
    """
    Decorator for caching function results

    Args:
        namespace: Cache namespace
        ttl: Time-to-live in seconds
        key_func: Function to generate cache key from args/kwargs

    Example:
        @cached('predictions', ttl=3600)
        def get_prediction(user_id, birth_data):
            return expensive_computation()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default: use function name + args
                key_parts = [func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = ':'.join(key_parts)

            # Try to get from cache
            result = cache.get(namespace, cache_key)
            if result is not None:
                return result

            # Execute function
            result = func(*args, **kwargs)

            # Cache result
            cache.set(namespace, cache_key, result, ttl)

            return result

        # Add cache control methods to decorated function
        wrapper.cache_clear = lambda: cache.flush_namespace(namespace)
        wrapper.cache_stats = lambda: cache.get_stats()

        return wrapper

    return decorator


# Warm cache with frequently accessed data
def warm_cache(namespace: str, data: dict, ttl: Optional[int] = None):
    """
    Pre-populate cache with frequently accessed data

    Args:
        namespace: Cache namespace
        data: Dict of key-value pairs to cache
        ttl: Time-to-live in seconds
    """
    if not cache.enabled:
        return

    if cache.set_many(namespace, data, ttl):
        logger.info(f"Cache warmed: {namespace} ({len(data)}/{len(data)} keys)")
    else:
        logger.info(f"Cache warmed: {namespace} (0/{len(data)} keys)")
