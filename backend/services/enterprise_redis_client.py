"""
Enterprise Redis Client with High Availability
Features: Sentinel support, advanced circuit breaker, comprehensive monitoring, async support
"""

import os
import json
import time
import logging
import hashlib
from typing import Any, Dict, List, Optional, Union, Callable
from dataclasses import dataclass
from contextlib import contextmanager
from functools import wraps
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Try to import redis
try:
    import redis
    from redis.connection import ConnectionPool
    from redis.sentinel import Sentinel
    from redis.exceptions import RedisError, ConnectionError as RedisConnectionError, TimeoutError
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("❌ redis package not installed - Redis client disabled")


@dataclass
class RedisConfig:
    """Redis configuration with validation"""
    host: str = "localhost"
    port: int = 6379
    password: Optional[str] = None
    db: int = 0
    socket_timeout: float = 5.0
    socket_connect_timeout: float = 5.0
    socket_keepalive: bool = True
    socket_keepalive_options: Dict = None
    health_check_interval: int = 30
    max_connections: int = 50
    retry_on_timeout: bool = True
    decode_responses: bool = True
    use_sentinel: bool = False
    sentinel_master_name: str = "bhriguwelt-master"
    sentinel_hosts: List[tuple] = None

    def __post_init__(self):
        if self.socket_keepalive_options is None:
            self.socket_keepalive_options = {
                1: 1,  # TCP_KEEPIDLE
                2: 1,  # TCP_KEEPINTVL
                3: 3   # TCP_KEEPCNT
            }
        if self.sentinel_hosts is None:
            self.sentinel_hosts = [("localhost", 26379)]


class RedisConnectionError(Exception):
    """Custom exception for Redis connection issues"""
    pass


class RedisOperationError(Exception):
    """Custom exception for Redis operation failures"""
    pass


class EnhancedCircuitBreaker:
    """
    Enhanced circuit breaker with half-open state and automatic recovery
    """
    def __init__(self, failure_threshold=5, recovery_timeout=60, half_open_max_calls=3):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        self.half_open_calls = 0
        self.last_failure_time = None
        self.state = 'closed'  # closed, open, half_open
        self.consecutive_successes = 0

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        # Check if we should transition from open to half-open
        if self.state == 'open':
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = 'half_open'
                self.half_open_calls = 0
                logger.info("🟡 Circuit breaker entering half-open state")
            else:
                raise RedisConnectionError("🔴 Circuit breaker is open - Redis temporarily unavailable")

        # In half-open state, limit number of test calls
        if self.state == 'half_open':
            if self.half_open_calls >= self.half_open_max_calls:
                raise RedisConnectionError("🟡 Circuit breaker half-open - max test calls reached")
            self.half_open_calls += 1

        try:
            result = func(*args, **kwargs)

            # Success handling
            if self.state == 'half_open':
                self.consecutive_successes += 1
                if self.consecutive_successes >= 2:  # Require 2 successes to close
                    self.state = 'closed'
                    self.failure_count = 0
                    self.consecutive_successes = 0
                    logger.info("🟢 Circuit breaker closed after successful recovery")
            elif self.state == 'closed':
                # Reset failure count on success
                if self.failure_count > 0:
                    self.failure_count = 0

            return result

        except Exception as e:
            self.failure_count += 1
            self.consecutive_successes = 0
            self.last_failure_time = time.time()

            if self.state == 'half_open':
                # Failed during half-open - reopen circuit
                self.state = 'open'
                logger.error(f"🔴 Circuit breaker reopened after half-open failure")
            elif self.failure_count >= self.failure_threshold:
                self.state = 'open'
                logger.error(f"🔴 Circuit breaker opened after {self.failure_count} failures")

            raise e

    def get_state(self) -> Dict[str, Any]:
        """Get circuit breaker state"""
        return {
            'state': self.state,
            'failure_count': self.failure_count,
            'consecutive_successes': self.consecutive_successes,
            'last_failure_time': self.last_failure_time,
            'is_available': self.state != 'open'
        }


class EnterpriseRedisClient:
    """
    Enterprise-grade Redis client with HA, monitoring, and resilience
    Features:
    - Sentinel support for automatic failover
    - Advanced circuit breaker pattern
    - Comprehensive health monitoring
    - Connection pooling and retry logic
    - Statistics and metrics tracking
    """

    def __init__(self, config: RedisConfig = None):
        self.config = config or self._load_config_from_env()
        self._client = None
        self._pool = None
        self._sentinel = None
        self._is_connected = False
        self._connection_attempts = 0
        self._last_health_check = 0
        self._circuit_breaker = EnhancedCircuitBreaker(
            failure_threshold=5,
            recovery_timeout=60,
            half_open_max_calls=3
        )

        # Statistics tracking
        self._stats = {
            'operations': {
                'get': 0,
                'set': 0,
                'delete': 0,
                'incr': 0,
                'hits': 0,
                'misses': 0,
                'errors': 0
            },
            'connection': {
                'total_attempts': 0,
                'successful_connections': 0,
                'failed_connections': 0,
                'reconnections': 0
            },
            'performance': {
                'avg_response_time_ms': 0,
                'total_response_time_ms': 0,
                'operation_count': 0
            }
        }

        # Initialize connection
        if REDIS_AVAILABLE:
            self._initialize_connection()
        else:
            logger.error("❌ Redis not available - install redis package")

    def _load_config_from_env(self) -> RedisConfig:
        """Load configuration from environment variables"""
        # Parse sentinel hosts from environment
        sentinel_hosts_str = os.getenv('REDIS_SENTINEL_HOSTS', 'localhost:26379')
        sentinel_hosts = []
        for host_str in sentinel_hosts_str.split(','):
            host_port = host_str.strip().split(':')
            host = host_port[0]
            port = int(host_port[1]) if len(host_port) > 1 else 26379
            sentinel_hosts.append((host, port))

        return RedisConfig(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', '6379')),
            password=os.getenv('REDIS_PASSWORD'),
            db=int(os.getenv('REDIS_DB', '0')),
            socket_timeout=float(os.getenv('REDIS_SOCKET_TIMEOUT', '5.0')),
            socket_connect_timeout=float(os.getenv('REDIS_CONNECT_TIMEOUT', '5.0')),
            max_connections=int(os.getenv('REDIS_MAX_CONNECTIONS', '50')),
            use_sentinel=os.getenv('REDIS_USE_SENTINEL', 'false').lower() == 'true',
            sentinel_master_name=os.getenv('REDIS_SENTINEL_MASTER', 'bhriguwelt-master'),
            sentinel_hosts=sentinel_hosts
        )

    def _initialize_connection(self):
        """Initialize Redis connection with HA support"""
        self._stats['connection']['total_attempts'] += 1

        try:
            if self.config.use_sentinel:
                self._initialize_sentinel_connection()
            else:
                self._initialize_direct_connection()

            self._is_connected = self._test_connection()

            if self._is_connected:
                logger.info(f"✅ Redis connection established (mode: {'sentinel' if self.config.use_sentinel else 'direct'})")
                self._connection_attempts = 0
                self._stats['connection']['successful_connections'] += 1
            else:
                raise RedisConnectionError("Connection test failed")

        except Exception as e:
            logger.error(f"❌ Redis initialization failed: {e}")
            self._is_connected = False
            self._stats['connection']['failed_connections'] += 1
            self._handle_connection_failure()

    def _initialize_direct_connection(self):
        """Initialize direct Redis connection"""
        # Create connection pool
        self._pool = ConnectionPool(
            host=self.config.host,
            port=self.config.port,
            password=self.config.password,
            db=self.config.db,
            socket_timeout=self.config.socket_timeout,
            socket_connect_timeout=self.config.socket_connect_timeout,
            socket_keepalive=self.config.socket_keepalive,
            socket_keepalive_options=self.config.socket_keepalive_options,
            max_connections=self.config.max_connections,
            retry_on_timeout=self.config.retry_on_timeout,
            decode_responses=self.config.decode_responses,
            health_check_interval=self.config.health_check_interval
        )

        self._client = redis.Redis(connection_pool=self._pool)
        logger.info(f"📡 Direct Redis connection initialized (host={self.config.host}:{self.config.port})")

    def _initialize_sentinel_connection(self):
        """Initialize Redis Sentinel connection for HA"""
        try:
            self._sentinel = Sentinel(
                self.config.sentinel_hosts,
                socket_timeout=self.config.socket_timeout,
                password=self.config.password,
                db=self.config.db,
                decode_responses=self.config.decode_responses
            )

            # Get master connection
            self._client = self._sentinel.master_for(
                self.config.sentinel_master_name,
                socket_timeout=self.config.socket_timeout,
                socket_keepalive=self.config.socket_keepalive,
                socket_keepalive_options=self.config.socket_keepalive_options,
                max_connections=self.config.max_connections,
                retry_on_timeout=self.config.retry_on_timeout,
                decode_responses=self.config.decode_responses
            )

            logger.info(f"🛡️ Sentinel connection initialized (master={self.config.sentinel_master_name})")

        except Exception as e:
            logger.error(f"Sentinel initialization failed: {e}")
            raise

    def _test_connection(self) -> bool:
        """Test Redis connection with ping"""
        try:
            result = self._client.ping()
            return result is True or result == "PONG"
        except Exception as e:
            logger.warning(f"❌ Redis ping failed: {e}")
            return False

    def _handle_connection_failure(self):
        """Handle connection failures"""
        self._connection_attempts += 1
        backoff_time = min(300, 2 ** self._connection_attempts)  # Max 5 minutes
        logger.warning(f"⚠️ Connection attempt {self._connection_attempts} failed, would retry in {backoff_time}s")

    def _measure_operation(self, func: Callable) -> Any:
        """Measure operation execution time"""
        start_time = time.time()
        try:
            result = func()
            elapsed_ms = (time.time() - start_time) * 1000

            # Update performance stats
            self._stats['performance']['total_response_time_ms'] += elapsed_ms
            self._stats['performance']['operation_count'] += 1
            self._stats['performance']['avg_response_time_ms'] = (
                self._stats['performance']['total_response_time_ms'] /
                self._stats['performance']['operation_count']
            )

            return result
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.warning(f"Operation failed after {elapsed_ms:.2f}ms: {e}")
            raise

    @contextmanager
    def _operation_context(self):
        """Context manager for Redis operations with automatic retry and circuit breaker"""
        if not REDIS_AVAILABLE:
            raise RedisOperationError("Redis not available")

        max_retries = 3
        for attempt in range(max_retries):
            try:
                if not self._is_connected:
                    logger.info(f"🔄 Attempting reconnection (attempt {attempt + 1})")
                    self._initialize_connection()
                    self._stats['connection']['reconnections'] += 1

                yield self._client
                break

            except Exception as e:
                logger.warning(f"Operation failed (attempt {attempt + 1}/{max_retries}): {e}")

                if attempt == max_retries - 1:
                    self._stats['operations']['errors'] += 1
                    self._handle_connection_failure()
                    raise RedisOperationError(f"Operation failed after {max_retries} attempts: {e}")

                # Exponential backoff
                time.sleep(0.1 * (2 ** attempt))

    # Public API methods with circuit breaker and statistics

    def get(self, key: str) -> Optional[str]:
        """Get value from Redis with circuit breaker protection"""
        self._stats['operations']['get'] += 1

        try:
            with self._operation_context() as client:
                def _get():
                    return self._measure_operation(lambda: client.get(key))

                result = self._circuit_breaker.call(_get)

                if result is None:
                    self._stats['operations']['misses'] += 1
                else:
                    self._stats['operations']['hits'] += 1

                return result

        except Exception as e:
            self._stats['operations']['errors'] += 1
            logger.warning(f"Get operation failed for key '{key}': {e}")
            return None

    def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        """Set value in Redis with optional expiration"""
        self._stats['operations']['set'] += 1

        try:
            with self._operation_context() as client:
                def _set():
                    return self._measure_operation(lambda: client.set(key, value, ex=ex))

                result = self._circuit_breaker.call(_set)
                return bool(result)

        except Exception as e:
            self._stats['operations']['errors'] += 1
            logger.warning(f"Set operation failed for key '{key}': {e}")
            return False

    def delete(self, *keys: str) -> int:
        """Delete keys from Redis"""
        self._stats['operations']['delete'] += len(keys)

        try:
            with self._operation_context() as client:
                def _delete():
                    return self._measure_operation(lambda: client.delete(*keys))

                count = self._circuit_breaker.call(_delete)
                return count

        except Exception as e:
            self._stats['operations']['errors'] += 1
            logger.warning(f"Delete operation failed: {e}")
            return 0

    def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            with self._operation_context() as client:
                def _exists():
                    return self._measure_operation(lambda: client.exists(key))

                result = self._circuit_breaker.call(_exists)
                return bool(result)

        except Exception as e:
            self._stats['operations']['errors'] += 1
            return False

    def incr(self, key: str) -> int:
        """Increment integer value atomically"""
        self._stats['operations']['incr'] += 1

        try:
            with self._operation_context() as client:
                def _incr():
                    return self._measure_operation(lambda: client.incr(key))

                return self._circuit_breaker.call(_incr)

        except Exception as e:
            self._stats['operations']['errors'] += 1
            logger.warning(f"Incr operation failed for key '{key}': {e}")
            raise RedisOperationError(f"Failed to increment key: {e}")

    def expire(self, key: str, time: int) -> bool:
        """Set key expiration"""
        try:
            with self._operation_context() as client:
                def _expire():
                    return self._measure_operation(lambda: client.expire(key, time))

                result = self._circuit_breaker.call(_expire)
                return bool(result)

        except Exception as e:
            self._stats['operations']['errors'] += 1
            logger.warning(f"Expire operation failed for key '{key}': {e}")
            return False

    def hget(self, key: str, field: str) -> Optional[str]:
        """Get hash field value"""
        try:
            with self._operation_context() as client:
                def _hget():
                    return self._measure_operation(lambda: client.hget(key, field))

                return self._circuit_breaker.call(_hget)

        except Exception as e:
            self._stats['operations']['errors'] += 1
            return None

    def hset(self, key: str, field: str, value: Any) -> bool:
        """Set hash field value"""
        try:
            with self._operation_context() as client:
                def _hset():
                    return self._measure_operation(lambda: client.hset(key, field, value))

                result = self._circuit_breaker.call(_hset)
                return bool(result)

        except Exception as e:
            self._stats['operations']['errors'] += 1
            return False

    def hgetall(self, key: str) -> Dict[str, str]:
        """Get all hash fields"""
        try:
            with self._operation_context() as client:
                def _hgetall():
                    return self._measure_operation(lambda: client.hgetall(key))

                return self._circuit_breaker.call(_hgetall) or {}

        except Exception as e:
            self._stats['operations']['errors'] += 1
            return {}

    def hincrby(self, key: str, field: str, amount: int = 1) -> int:
        """Increment hash field by amount"""
        try:
            with self._operation_context() as client:
                def _hincrby():
                    return self._measure_operation(lambda: client.hincrby(key, field, amount))

                return self._circuit_breaker.call(_hincrby)

        except Exception as e:
            self._stats['operations']['errors'] += 1
            raise RedisOperationError(f"Failed to increment hash field: {e}")

    # Health and monitoring methods

    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        circuit_state = self._circuit_breaker.get_state()

        return {
            'status': 'healthy' if self._is_connected and circuit_state['is_available'] else 'unhealthy',
            'connected': self._is_connected,
            'circuit_breaker': circuit_state,
            'connection_attempts': self._connection_attempts,
            'last_health_check': self._last_health_check,
            'mode': 'sentinel' if self.config.use_sentinel else 'direct',
            'config': {
                'host': self.config.host,
                'port': self.config.port,
                'use_sentinel': self.config.use_sentinel,
                'sentinel_master': self.config.sentinel_master_name if self.config.use_sentinel else None,
                'max_connections': self.config.max_connections
            }
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive Redis statistics"""
        stats = {
            'operations': self._stats['operations'].copy(),
            'connection': self._stats['connection'].copy(),
            'performance': self._stats['performance'].copy(),
            'health': self.get_health_status()
        }

        # Calculate additional metrics
        total_ops = self._stats['operations']['get'] + self._stats['operations']['set']
        if total_ops > 0:
            stats['operations']['cache_hit_rate'] = (
                self._stats['operations']['hits'] / total_ops * 100
            )

        # Get Redis server info if available
        if self._is_connected and self._client:
            try:
                info = self._client.info()
                stats['redis_info'] = {
                    'connected_clients': info.get('connected_clients', 0),
                    'used_memory_human': info.get('used_memory_human', '0B'),
                    'used_memory_peak_human': info.get('used_memory_peak_human', '0B'),
                    'total_connections_received': info.get('total_connections_received', 0),
                    'total_commands_processed': info.get('total_commands_processed', 0),
                    'keyspace_hits': info.get('keyspace_hits', 0),
                    'keyspace_misses': info.get('keyspace_misses', 0),
                    'uptime_in_seconds': info.get('uptime_in_seconds', 0),
                    'role': info.get('role', 'unknown')
                }

                # Calculate server-side cache hit rate
                server_hits = info.get('keyspace_hits', 0)
                server_misses = info.get('keyspace_misses', 0)
                server_total = server_hits + server_misses
                if server_total > 0:
                    stats['redis_info']['server_cache_hit_rate'] = (server_hits / server_total * 100)

            except Exception as e:
                logger.warning(f"Failed to get Redis server info: {e}")
                stats['redis_info'] = {'error': str(e)}

        return stats

    def reset_stats(self):
        """Reset statistics"""
        self._stats = {
            'operations': {
                'get': 0,
                'set': 0,
                'delete': 0,
                'incr': 0,
                'hits': 0,
                'misses': 0,
                'errors': 0
            },
            'connection': {
                'total_attempts': self._stats['connection']['total_attempts'],
                'successful_connections': self._stats['connection']['successful_connections'],
                'failed_connections': self._stats['connection']['failed_connections'],
                'reconnections': 0
            },
            'performance': {
                'avg_response_time_ms': 0,
                'total_response_time_ms': 0,
                'operation_count': 0
            }
        }
        logger.info("📊 Redis statistics reset")

    def health_check(self) -> bool:
        """Perform health check"""
        try:
            self._last_health_check = int(time.time())

            if not self._is_connected:
                return False

            # Ping test
            start_time = time.time()
            result = self._test_connection()
            elapsed_ms = (time.time() - start_time) * 1000

            if result:
                logger.debug(f"✅ Health check passed ({elapsed_ms:.2f}ms)")
            else:
                logger.warning(f"❌ Health check failed ({elapsed_ms:.2f}ms)")

            return result

        except Exception as e:
            logger.error(f"❌ Health check error: {e}")
            return False

    def close(self):
        """Close Redis connections gracefully"""
        try:
            if self._client:
                self._client.close()
            if self._pool:
                self._pool.disconnect()
            self._is_connected = False
            logger.info("🔒 Redis connections closed gracefully")
        except Exception as e:
            logger.error(f"Error closing Redis connections: {e}")


# Global enterprise client instance
enterprise_redis_client = EnterpriseRedisClient() if REDIS_AVAILABLE else None

# Cleanup on exit
if enterprise_redis_client:
    import atexit
    atexit.register(enterprise_redis_client.close)
