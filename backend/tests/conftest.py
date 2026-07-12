"""
Shared pytest fixtures for BhriguWelt backend tests.

Provides comprehensive mocking for:
- Redis client (with FakeRedis implementation)
- Environment variables for testing
- Flask test client
- Sample birth chart data
- OpenAI service mocks

This ensures all tests can run in CI without external dependencies.
"""
import pytest
import os
import sys
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List


# ============================================================================
# FAKE REDIS IMPLEMENTATION
# ============================================================================

class FakeRedis:
    """
    In-memory Redis mock that implements all Redis operations used in the codebase.

    This provides a complete Redis API mock for testing without requiring
    a real Redis server, enabling CI tests to pass without external dependencies.
    """

    def __init__(self):
        self.store: Dict[str, Any] = {}
        self.expiry: Dict[str, int] = {}
        self.sets: Dict[str, set] = {}
        self._pipeline_commands: List = []
        self._in_pipeline = False

    def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        value = self.store.get(key)
        if value is None:
            return None
        return str(value) if not isinstance(value, bytes) else value.decode()

    def set(self, key: str, value: Any, ex: Optional[int] = None, px: Optional[int] = None,
            nx: bool = False, xx: bool = False) -> bool:
        """Set key to value with optional expiration"""
        if nx and key in self.store:
            return False
        if xx and key not in self.store:
            return False
        self.store[key] = value
        if ex:
            self.expiry[key] = ex
        if px:
            self.expiry[key] = px // 1000
        return True

    def setex(self, key: str, time: int, value: Any) -> bool:
        """Set key with expiration time in seconds"""
        self.store[key] = value
        self.expiry[key] = time
        return True

    def setnx(self, key: str, value: Any) -> bool:
        """Set key only if it doesn't exist"""
        if key in self.store:
            return False
        self.store[key] = value
        return True

    def delete(self, *keys: str) -> int:
        """Delete one or more keys"""
        count = 0
        for key in keys:
            if key in self.store:
                del self.store[key]
                self.expiry.pop(key, None)
                count += 1
        return count

    def exists(self, *keys: str) -> int:
        """Check if keys exist"""
        return sum(1 for key in keys if key in self.store)

    def keys(self, pattern: str = "*") -> List[str]:
        """Get all keys matching pattern"""
        import fnmatch
        return [k for k in self.store.keys() if fnmatch.fnmatch(k, pattern)]

    def incr(self, key: str) -> int:
        """Increment key by 1"""
        return self.incrby(key, 1)

    def incrby(self, key: str, amount: int) -> int:
        """Increment key by amount"""
        current = int(self.store.get(key, 0))
        new_val = current + amount
        self.store[key] = new_val
        return new_val

    def incrbyfloat(self, key: str, amount: float) -> float:
        """Increment key by float amount"""
        current = float(self.store.get(key, 0))
        new_val = current + amount
        self.store[key] = new_val
        return new_val

    def decr(self, key: str) -> int:
        """Decrement key by 1"""
        return self.incrby(key, -1)

    def decrby(self, key: str, amount: int) -> int:
        """Decrement key by amount"""
        return self.incrby(key, -amount)

    def expire(self, key: str, time: int) -> bool:
        """Set expiration on key"""
        if key in self.store:
            self.expiry[key] = time
            return True
        return False

    def ttl(self, key: str) -> int:
        """Get TTL for key"""
        if key not in self.store:
            return -2
        return self.expiry.get(key, -1)

    def persist(self, key: str) -> bool:
        """Remove expiration from key"""
        if key in self.expiry:
            del self.expiry[key]
            return True
        return False

    def ping(self) -> bool:
        """Health check"""
        return True

    def flushdb(self) -> bool:
        """Clear all data"""
        self.store.clear()
        self.expiry.clear()
        self.sets.clear()
        return True

    def flushall(self) -> bool:
        """Clear all data (alias for flushdb in single-db mock)"""
        return self.flushdb()

    # Hash operations
    def hget(self, name: str, key: str) -> Optional[str]:
        """Get hash field value"""
        hash_data = self.store.get(name, {})
        if isinstance(hash_data, dict):
            value = hash_data.get(key)
            return str(value) if value is not None else None
        return None

    def hset(self, name: str, key: str = None, value: Any = None, mapping: Dict = None) -> int:
        """Set hash field(s)"""
        if name not in self.store:
            self.store[name] = {}

        count = 0
        if mapping:
            for k, v in mapping.items():
                if k not in self.store[name]:
                    count += 1
                self.store[name][k] = v
        if key is not None and value is not None:
            if key not in self.store[name]:
                count += 1
            self.store[name][key] = value
        return count

    def hgetall(self, name: str) -> Dict:
        """Get all hash fields"""
        return dict(self.store.get(name, {}))

    def hdel(self, name: str, *keys: str) -> int:
        """Delete hash fields"""
        if name not in self.store:
            return 0
        count = 0
        for key in keys:
            if key in self.store[name]:
                del self.store[name][key]
                count += 1
        return count

    def hexists(self, name: str, key: str) -> bool:
        """Check if hash field exists"""
        return name in self.store and key in self.store.get(name, {})

    # Set operations
    def sadd(self, name: str, *values) -> int:
        """Add members to set"""
        if name not in self.sets:
            self.sets[name] = set()
        count = 0
        for v in values:
            if v not in self.sets[name]:
                self.sets[name].add(v)
                count += 1
        return count

    def smembers(self, name: str) -> set:
        """Get all members of set"""
        return self.sets.get(name, set())

    def sismember(self, name: str, value: Any) -> bool:
        """Check if value is member of set"""
        return value in self.sets.get(name, set())

    def srem(self, name: str, *values) -> int:
        """Remove members from set"""
        if name not in self.sets:
            return 0
        count = 0
        for v in values:
            if v in self.sets[name]:
                self.sets[name].remove(v)
                count += 1
        return count

    # List operations
    def lpush(self, name: str, *values) -> int:
        """Push values to left of list"""
        if name not in self.store:
            self.store[name] = []
        for v in reversed(values):
            self.store[name].insert(0, v)
        return len(self.store[name])

    def rpush(self, name: str, *values) -> int:
        """Push values to right of list"""
        if name not in self.store:
            self.store[name] = []
        self.store[name].extend(values)
        return len(self.store[name])

    def lpop(self, name: str) -> Optional[str]:
        """Pop from left of list"""
        if name not in self.store or not self.store[name]:
            return None
        return str(self.store[name].pop(0))

    def rpop(self, name: str) -> Optional[str]:
        """Pop from right of list"""
        if name not in self.store or not self.store[name]:
            return None
        return str(self.store[name].pop())

    def lrange(self, name: str, start: int, end: int) -> List:
        """Get range of list elements"""
        if name not in self.store:
            return []
        if end == -1:
            return self.store[name][start:]
        return self.store[name][start:end + 1]

    def llen(self, name: str) -> int:
        """Get length of list"""
        return len(self.store.get(name, []))

    # Lua script evaluation (for atomic quota operations)
    def eval(self, script: str, numkeys: int, *keys_and_args) -> Any:
        """
        Execute Lua script.
        Implements the quota check script used in ai_quota.py
        """
        if numkeys == 1:
            key = keys_and_args[0]
            args = keys_and_args[1:]

            # Handle quota check script
            if 'INCRBY' in script and 'EXPIRE' in script:
                limit = int(args[0])
                incr = int(args[1])
                current = int(self.store.get(key, 0))

                if (current + incr) > limit:
                    return [0, limit - current]

                new_total = current + incr
                self.store[key] = new_total
                self.expiry[key] = 172800  # 48 hours
                return [1, limit - new_total]

        # Default: return success
        return [1, 0]

    def evalsha(self, sha: str, numkeys: int, *keys_and_args) -> Any:
        """Execute cached Lua script by SHA"""
        # For testing, treat same as eval
        return self.eval("", numkeys, *keys_and_args)

    # Pipeline support
    def pipeline(self, transaction: bool = True):
        """Create a pipeline for batch operations"""
        return FakeRedisPipeline(self)

    # Transaction support
    def multi(self):
        """Start transaction"""
        return self.pipeline()

    def execute(self):
        """Execute pipeline (no-op for non-pipeline)"""
        return []

    # Pub/Sub (minimal mock)
    def publish(self, channel: str, message: str) -> int:
        """Publish message to channel"""
        return 1

    def pubsub(self):
        """Get pubsub object"""
        return FakeRedisPubSub()

    # Info
    def info(self, section: str = None) -> Dict:
        """Get server info"""
        return {
            'redis_version': '7.0.0-fake',
            'connected_clients': 1,
            'used_memory': 1024,
            'used_memory_human': '1K',
        }

    def dbsize(self) -> int:
        """Get number of keys"""
        return len(self.store)

    # Connection management (no-ops for fake)
    def close(self):
        """Close connection (no-op)"""
        pass

    def connection_pool(self):
        """Get connection pool (mock)"""
        return Mock()


class FakeRedisPipeline:
    """Mock Redis pipeline for batch operations"""

    def __init__(self, redis_instance: FakeRedis):
        self.redis = redis_instance
        self.commands = []
        self.results = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def get(self, key: str):
        self.commands.append(('get', key))
        return self

    def set(self, key: str, value: Any, **kwargs):
        self.commands.append(('set', key, value, kwargs))
        return self

    def setex(self, key: str, time: int, value: Any):
        self.commands.append(('setex', key, time, value))
        return self

    def delete(self, *keys):
        self.commands.append(('delete', keys))
        return self

    def incr(self, key: str):
        self.commands.append(('incr', key))
        return self

    def incrby(self, key: str, amount: int):
        self.commands.append(('incrby', key, amount))
        return self

    def expire(self, key: str, time: int):
        self.commands.append(('expire', key, time))
        return self

    def execute(self) -> List:
        """Execute all queued commands"""
        results = []
        for cmd in self.commands:
            op = cmd[0]
            if op == 'get':
                results.append(self.redis.get(cmd[1]))
            elif op == 'set':
                results.append(self.redis.set(cmd[1], cmd[2], **cmd[3]))
            elif op == 'setex':
                results.append(self.redis.setex(cmd[1], cmd[2], cmd[3]))
            elif op == 'delete':
                results.append(self.redis.delete(*cmd[1]))
            elif op == 'incr':
                results.append(self.redis.incr(cmd[1]))
            elif op == 'incrby':
                results.append(self.redis.incrby(cmd[1], cmd[2]))
            elif op == 'expire':
                results.append(self.redis.expire(cmd[1], cmd[2]))
        self.commands = []
        return results


class FakeRedisPubSub:
    """Mock Redis PubSub"""

    def __init__(self):
        self.channels = set()

    def subscribe(self, *channels):
        self.channels.update(channels)

    def unsubscribe(self, *channels):
        for c in channels:
            self.channels.discard(c)

    def get_message(self, ignore_subscribe_messages: bool = False):
        return None

    def listen(self):
        return iter([])


# ============================================================================
# PYTEST FIXTURES
# ============================================================================

@pytest.fixture(autouse=True)
def mock_environment_variables(monkeypatch):
    """
    Mock all environment variables needed for testing.
    Automatically applied to all tests.
    """
    test_vars = {
        # Flask configuration
        'FLASK_ENV': 'testing',
        'SECRET_KEY': 'test-secret-key-do-not-use-in-production',
        'JWT_SECRET_KEY': 'test-jwt-secret-key-do-not-use-in-production',

        # OpenAI configuration (mocked - not real keys)
        'OPENAI_API_KEY': 'sk-test-key-do-not-use',
        'OPENAI_BASE_URL': 'https://api.openai.com/v1',
        'OPENAI_MODEL': 'gpt-3.5-turbo',
        'OPENAI_MAX_TOKENS': '512',
        'OPENAI_TEMPERATURE': '0.6',
        'OPENAI_PROMPT_TOKEN_BUDGET': '2000',
        'OPENAI_USE_JSON_FORMAT': 'false',

        # Quota and cost management
        'USER_DAILY_TOKEN_LIMIT': '100000',
        'PER_REQUEST_COST_LIMIT': '0.30',
        'OPENAI_COST_PER_1K': '0.002',
        'CACHE_TTL': '3600',
        'PREDICTION_CACHE_ENABLED': 'true',

        # Redis configuration
        'REDIS_ENABLED': 'true',
        'REDIS_URL': 'redis://localhost:6379',
        'REDIS_MAX_CONNECTIONS': '10',
        'REDIS_SOCKET_TIMEOUT': '5',
        'REDIS_CONNECT_TIMEOUT': '5',
        'REDIS_CIRCUIT_BREAKER_THRESHOLD': '5',
        'REDIS_CIRCUIT_BREAKER_TIMEOUT': '60',

        # Core wisdom
        'CORE_WISDOM_PATH': '/opt/render/project/src/core_wisdom',

        # Frontend
        'FRONTEND_URL': 'http://localhost:3000',

        # Testing flags
        'TESTING': 'true',
    }

    for key, value in test_vars.items():
        monkeypatch.setenv(key, value)

    yield test_vars


@pytest.fixture
def mock_redis():
    """
    Provide a FakeRedis instance for tests that need explicit Redis mocking.

    Usage:
        def test_something(mock_redis):
            mock_redis.set('key', 'value')
            assert mock_redis.get('key') == 'value'
    """
    return FakeRedis()


@pytest.fixture(autouse=True)
def patch_redis_client(monkeypatch, mock_redis):
    """
    Automatically patch all Redis client getters across the codebase.
    This ensures no test accidentally connects to a real Redis server.
    """
    # Patch ai_quota module
    monkeypatch.setattr(
        'backend.services.ai_quota._get_redis_client',
        lambda: mock_redis,
        raising=False
    )

    # Patch redis_connection module
    def mock_get_redis_manager():
        manager = Mock()
        manager.get_client.return_value = mock_redis
        manager.test_connection.return_value = True
        manager.execute_with_retry = lambda op, *args, **kwargs: op(*args, **kwargs)
        manager.get_metrics.return_value = {
            'enabled': True,
            'available': True,
            'connected': True,
            'circuit_breaker_state': 'CLOSED',
            'connection_attempts': 1,
            'connection_successes': 1,
            'connection_failures': 0,
        }
        return manager

    monkeypatch.setattr(
        'backend.services.redis_connection.get_redis_manager',
        mock_get_redis_manager,
        raising=False
    )
    monkeypatch.setattr(
        'backend.services.redis_connection.get_redis_client',
        lambda: mock_redis,
        raising=False
    )

    # Patch redis module directly for any direct imports
    with patch('redis.Redis', return_value=mock_redis):
        with patch('redis.from_url', return_value=mock_redis):
            yield mock_redis


@pytest.fixture
def client():
    """
    Flask test client for API endpoint testing.

    Usage:
        def test_health_endpoint(client):
            response = client.get('/health')
            assert response.status_code == 200
    """
    # Import here to avoid circular imports. Use the 'backend.' package path —
    # a bare 'from app import app' can resolve to the repo-root 'app/' package
    # (the FastAPI service) depending on sys.path order, silently yielding the
    # Mock fallback below.
    try:
        from backend.app import app
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        with app.test_client() as test_client:
            with app.app_context():
                yield test_client
    except ImportError:
        # Fallback for tests that don't need the full app
        yield Mock()


@pytest.fixture
def sample_birth_data() -> Dict[str, Any]:
    """
    Provide sample birth chart data for prediction tests.

    Returns standard birth data that can be used across multiple test scenarios.
    """
    return {
        'date_of_birth': '1990-01-15',
        'time_of_birth': '14:30',
        'place_of_birth': 'Mumbai, India',
        'latitude': 19.0760,
        'longitude': 72.8777,
        'timezone': 'Asia/Kolkata',
        'zodiac_sign': 'Capricorn',
        'moon_sign': 'Cancer',
        'nakshatra': 'Uttara Ashadha',
        'ascendant': 'Gemini',
        'sun_sign': 'Capricorn',
        'gender': 'male',
    }


@pytest.fixture
def sample_chart_data(sample_birth_data) -> Dict[str, Any]:
    """
    Extended chart data with planetary positions.
    """
    return {
        **sample_birth_data,
        'planetary_positions': {
            'Sun': {'sign': 'Capricorn', 'degree': 24.5, 'house': 8},
            'Moon': {'sign': 'Cancer', 'degree': 12.3, 'house': 2},
            'Mars': {'sign': 'Scorpio', 'degree': 8.7, 'house': 6},
            'Mercury': {'sign': 'Sagittarius', 'degree': 28.1, 'house': 7},
            'Jupiter': {'sign': 'Gemini', 'degree': 5.9, 'house': 1},
            'Venus': {'sign': 'Aquarius', 'degree': 15.2, 'house': 9},
            'Saturn': {'sign': 'Capricorn', 'degree': 19.4, 'house': 8},
            'Rahu': {'sign': 'Aquarius', 'degree': 22.8, 'house': 9},
            'Ketu': {'sign': 'Leo', 'degree': 22.8, 'house': 3},
        },
        'house_positions': {
            '1': 'Gemini', '2': 'Cancer', '3': 'Leo', '4': 'Virgo',
            '5': 'Libra', '6': 'Scorpio', '7': 'Sagittarius', '8': 'Capricorn',
            '9': 'Aquarius', '10': 'Pisces', '11': 'Aries', '12': 'Taurus',
        },
        'dashas': {
            'current': 'Jupiter',
            'sub_dasha': 'Venus',
            'pratyantar': 'Saturn',
        },
    }


@pytest.fixture
def mock_openai_service():
    """
    Mock OpenAI service for prediction tests.

    Returns a mock that simulates OpenAI API responses.
    """
    service = Mock()
    service.enabled = True
    service.api_key = 'sk-test-key'
    service.model = 'gpt-3.5-turbo'
    service.last_error = None

    def mock_generate_prediction(prompt, context=None, return_metadata=False, user_id=None):
        result = {
            'success': True,
            'prediction': 'This is a test prediction based on your birth chart.',
            'model_used': 'gpt-3.5-turbo',
            'tokens_used': 150,
            'source': 'openai',
        }
        if return_metadata:
            result['metadata'] = {
                'prompt_tokens': 50,
                'completion_tokens': 100,
                'total_tokens': 150,
            }
        return result

    service.generate_prediction = Mock(side_effect=mock_generate_prediction)
    return service


@pytest.fixture
def mock_offline_wisdom():
    """
    Mock offline wisdom generator for fallback tests.
    """
    wisdom = Mock()
    wisdom.generate_prediction = Mock(return_value={
        'success': True,
        'prediction': 'Based on ancient Vedic wisdom, your chart indicates...',
        'source': 'offline_wisdom',
    })
    return wisdom


@pytest.fixture
def mock_prediction_orchestrator(mock_openai_service, mock_offline_wisdom):
    """
    Mock prediction orchestrator with all dependencies.
    """
    orchestrator = Mock()
    orchestrator.openai_service = mock_openai_service
    orchestrator.offline_wisdom = mock_offline_wisdom
    orchestrator.core_wisdom = Mock()
    orchestrator.rule_engine = Mock()

    def mock_generate(category, chart_data, mode='hybrid', **kwargs):
        return {
            'success': True,
            'category': category,
            'prediction': f'Test prediction for {category}',
            'mode_used': mode,
            'source': 'mock',
        }

    orchestrator.generate_prediction = Mock(side_effect=mock_generate)
    return orchestrator


# ============================================================================
# TEST UTILITIES
# ============================================================================

def assert_valid_prediction_response(response: Dict[str, Any]):
    """
    Helper to assert that a prediction response has required fields.
    """
    assert 'success' in response
    assert response['success'] is True
    assert 'prediction' in response or 'data' in response
    assert 'source' in response or 'mode_used' in response


def assert_valid_health_response(response: Dict[str, Any]):
    """
    Helper to assert that a health response has required fields.
    """
    assert 'status' in response
    assert response['status'] in ['ok', 'healthy', 'degraded', 'unhealthy', 'error']
    assert 'timestamp' in response


# ============================================================================
# PYTEST CONFIGURATION
# ============================================================================

def pytest_configure(config):
    """
    Configure pytest with custom markers.
    """
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "redis: marks tests that require Redis"
    )


def pytest_collection_modifyitems(config, items):
    """
    Modify test collection to skip certain tests based on environment.
    """
    # Skip slow tests unless explicitly requested
    if not config.getoption("--runslow", default=False):
        skip_slow = pytest.mark.skip(reason="need --runslow option to run")
        for item in items:
            if "slow" in item.keywords:
                item.add_marker(skip_slow)


def pytest_addoption(parser):
    """
    Add custom command line options.
    """
    parser.addoption(
        "--runslow", action="store_true", default=False, help="run slow tests"
    )
    parser.addoption(
        "--runintegration", action="store_true", default=False,
        help="run integration tests"
    )
