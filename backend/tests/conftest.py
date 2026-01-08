# backend/tests/conftest.py
import pytest
from unittest.mock import Mock, patch

@pytest.fixture(autouse=True)
def mock_redis():
    """Mock Redis to avoid connection errors in tests"""
    with patch('redis.Redis') as mock_redis_class:
        mock_instance = Mock()
        mock_instance.get.return_value = None
        mock_instance.setex.return_value = True
        mock_instance.incr.return_value = 1
        mock_instance.expire.return_value = True
        mock_instance.delete.return_value = True
        mock_instance.exists.return_value = False
        mock_instance.ping.return_value = True
        mock_redis_class.return_value = mock_instance
        yield mock_instance
