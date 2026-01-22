"""
Intelligent Prediction Caching Service

This service provides caching for AI-generated predictions to reduce duplicate
API calls and save costs. Predictions are cached based on a hash of the birth
data and category, with configurable TTL.

Key features:
- Deterministic cache key generation from birth data
- Configurable TTL per category
- Cache hit/miss statistics
- Graceful fallback when Redis unavailable

Usage:
    from services.prediction_cache import PredictionCache

    # Check cache before calling OpenAI
    cached = PredictionCache.get_cached_prediction(category, birth_data)
    if cached:
        return cached

    # Generate prediction from OpenAI...
    prediction = openai_service.generate(...)

    # Cache the result
    PredictionCache.cache_prediction(category, birth_data, prediction)
"""
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from utils.logger import setup_logger

logger = setup_logger(__name__)


class PredictionCache:
    """
    Intelligent caching service for AI predictions.

    Reduces duplicate API calls by caching predictions based on
    birth data similarity and category.
    """

    # Default TTL in seconds (1 hour)
    DEFAULT_TTL = int(os.getenv('CACHE_TTL', '3600'))

    # Category-specific TTL overrides (in seconds)
    CATEGORY_TTL: Dict[str, int] = {
        'daily_insights': 86400,      # 24 hours (daily refresh)
        'predictions': 3600,          # 1 hour
        'karmic_journey': 86400 * 7,  # 7 days (rarely changes)
        'past_lives': 86400 * 7,      # 7 days
        'future_lives': 86400 * 7,    # 7 days
        'present_life': 86400,        # 24 hours
        'life_events': 86400,         # 24 hours
        'karmic_remedies': 86400 * 3, # 3 days
        'relationships': 86400,       # 24 hours
        'matchmaking': 86400 * 7,     # 7 days
        'horoscope': 86400,           # 24 hours
    }

    # Fields used for cache key generation (order matters for consistency)
    CACHE_KEY_FIELDS: List[str] = [
        'date_of_birth',
        'time_of_birth',
        'place_of_birth',
        'zodiac_sign',
        'moon_sign',
        'nakshatra',
        'ascendant',
    ]

    # Statistics tracking
    _stats = {
        'hits': 0,
        'misses': 0,
        'writes': 0,
        'errors': 0,
    }

    @classmethod
    def _get_redis_client(cls) -> Optional[Any]:
        """
        Get Redis client with graceful fallback.
        """
        cache_enabled = os.getenv('PREDICTION_CACHE_ENABLED', 'true').lower() == 'true'
        if not cache_enabled:
            return None

        try:
            from services.redis_connection import get_redis_client
            return get_redis_client()
        except Exception as e:
            logger.debug(f"Redis unavailable for caching: {e}")
            return None

    @classmethod
    def generate_cache_key(cls, category: str, birth_data: Dict[str, Any]) -> str:
        """
        Generate a deterministic cache key from birth data.

        The key is based on a hash of normalized birth data fields,
        ensuring the same birth data always produces the same key.

        Args:
            category: Prediction category
            birth_data: Birth chart data

        Returns:
            Cache key string in format "pred:{category}:{hash}"
        """
        # Extract and normalize key fields
        normalized: Dict[str, str] = {}
        for field in cls.CACHE_KEY_FIELDS:
            value = birth_data.get(field, '')
            if value is not None:
                # Normalize string representation
                normalized[field] = str(value).lower().strip()
            else:
                normalized[field] = ''

        # Create deterministic JSON string (sorted keys)
        data_str = json.dumps(normalized, sort_keys=True)

        # Generate MD5 hash (sufficient for cache keys)
        hash_obj = hashlib.md5(data_str.encode())
        hash_str = hash_obj.hexdigest()

        return f"pred:{category}:{hash_str}"

    @classmethod
    def get_ttl_for_category(cls, category: str) -> int:
        """
        Get TTL for a specific category.

        Args:
            category: Prediction category

        Returns:
            TTL in seconds
        """
        return cls.CATEGORY_TTL.get(category, cls.DEFAULT_TTL)

    @classmethod
    def get_cached_prediction(
        cls,
        category: str,
        birth_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached prediction if available.

        Args:
            category: Prediction category
            birth_data: Birth chart data

        Returns:
            Cached prediction data or None if not found
        """
        try:
            redis_client = cls._get_redis_client()
            if redis_client is None:
                cls._stats['misses'] += 1
                return None

            cache_key = cls.generate_cache_key(category, birth_data)
            cached_data = redis_client.get(cache_key)

            if cached_data:
                cls._stats['hits'] += 1
                try:
                    data = json.loads(cached_data)
                    data['_cache_hit'] = True
                    data['_cache_key'] = cache_key
                    logger.debug(f"Cache HIT for {category}: {cache_key[:30]}...")
                    return data
                except json.JSONDecodeError:
                    # Invalid cache data, treat as miss
                    redis_client.delete(cache_key)

            cls._stats['misses'] += 1
            logger.debug(f"Cache MISS for {category}: {cache_key[:30]}...")
            return None

        except Exception as e:
            cls._stats['errors'] += 1
            logger.warning(f"Cache read error: {e}")
            return None

    @classmethod
    def cache_prediction(
        cls,
        category: str,
        birth_data: Dict[str, Any],
        prediction: str,
        metadata: Optional[Dict[str, Any]] = None,
        ttl_override: Optional[int] = None
    ) -> bool:
        """
        Cache a prediction result.

        Args:
            category: Prediction category
            birth_data: Birth chart data
            prediction: The prediction text to cache
            metadata: Optional metadata to store with prediction
            ttl_override: Optional TTL override in seconds

        Returns:
            True if caching successful, False otherwise
        """
        try:
            redis_client = cls._get_redis_client()
            if redis_client is None:
                return False

            cache_key = cls.generate_cache_key(category, birth_data)
            ttl = ttl_override or cls.get_ttl_for_category(category)

            cache_data = {
                'prediction': prediction,
                'category': category,
                'cached_at': datetime.now(timezone.utc).isoformat(),
                'ttl_seconds': ttl,
            }

            if metadata:
                cache_data['metadata'] = metadata

            # Store in Redis with TTL
            redis_client.setex(
                cache_key,
                ttl,
                json.dumps(cache_data)
            )

            cls._stats['writes'] += 1
            logger.debug(f"Cached prediction for {category}: {cache_key[:30]}... (TTL: {ttl}s)")
            return True

        except Exception as e:
            cls._stats['errors'] += 1
            logger.warning(f"Cache write error: {e}")
            return False

    @classmethod
    def invalidate_cache(cls, category: str, birth_data: Dict[str, Any]) -> bool:
        """
        Invalidate (delete) a cached prediction.

        Args:
            category: Prediction category
            birth_data: Birth chart data

        Returns:
            True if deletion successful
        """
        try:
            redis_client = cls._get_redis_client()
            if redis_client is None:
                return False

            cache_key = cls.generate_cache_key(category, birth_data)
            result = redis_client.delete(cache_key)
            logger.debug(f"Invalidated cache for {category}: {cache_key[:30]}...")
            return bool(result)

        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")
            return False

    @classmethod
    def invalidate_user_cache(cls, birth_data: Dict[str, Any]) -> int:
        """
        Invalidate all cached predictions for a user's birth data.

        Args:
            birth_data: Birth chart data

        Returns:
            Number of cache entries deleted
        """
        deleted = 0
        for category in cls.CATEGORY_TTL.keys():
            if cls.invalidate_cache(category, birth_data):
                deleted += 1
        return deleted

    @classmethod
    def get_cache_stats(cls) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary with hit/miss rates and counts
        """
        total = cls._stats['hits'] + cls._stats['misses']
        hit_rate = (cls._stats['hits'] / total * 100) if total > 0 else 0

        return {
            'hits': cls._stats['hits'],
            'misses': cls._stats['misses'],
            'writes': cls._stats['writes'],
            'errors': cls._stats['errors'],
            'total_requests': total,
            'hit_rate_percent': round(hit_rate, 2),
            'cache_enabled': os.getenv('PREDICTION_CACHE_ENABLED', 'true').lower() == 'true',
            'default_ttl': cls.DEFAULT_TTL,
        }

    @classmethod
    def reset_stats(cls) -> None:
        """Reset cache statistics."""
        cls._stats = {
            'hits': 0,
            'misses': 0,
            'writes': 0,
            'errors': 0,
        }

    @classmethod
    def warm_cache(
        cls,
        category: str,
        birth_data_list: List[Dict[str, Any]],
        prediction_generator
    ) -> int:
        """
        Pre-warm cache with predictions for multiple users.

        Useful for batch processing or scheduled cache warming.

        Args:
            category: Prediction category
            birth_data_list: List of birth data dictionaries
            prediction_generator: Callable that generates predictions

        Returns:
            Number of predictions cached
        """
        cached = 0
        for birth_data in birth_data_list:
            try:
                # Check if already cached
                if cls.get_cached_prediction(category, birth_data) is None:
                    # Generate and cache
                    prediction = prediction_generator(category, birth_data)
                    if prediction:
                        cls.cache_prediction(category, birth_data, prediction)
                        cached += 1
            except Exception as e:
                logger.warning(f"Cache warming error: {e}")
                continue

        logger.info(f"Cache warmed with {cached} predictions for {category}")
        return cached


# Convenience functions for direct use
def get_cached_prediction(category: str, birth_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Get cached prediction using class method."""
    return PredictionCache.get_cached_prediction(category, birth_data)


def cache_prediction(
    category: str,
    birth_data: Dict[str, Any],
    prediction: str,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """Cache prediction using class method."""
    return PredictionCache.cache_prediction(category, birth_data, prediction, metadata)
