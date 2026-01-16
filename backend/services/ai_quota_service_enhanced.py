"""
Enhanced AI Quota Service with Tiered Quotas and Comprehensive Tracking
Features: Tiered quotas, usage analytics, admin functions, cost tracking
"""

import os
import time
import json
import logging
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Try to import redis
try:
    from services.enterprise_redis_client import enterprise_redis_client as redis_client
    REDIS_AVAILABLE = redis_client is not None
except ImportError:
    REDIS_AVAILABLE = False
    redis_client = None
    logger.warning("⚠️ Enterprise Redis client not available - quota service disabled")


@dataclass
class QuotaTier:
    """Quota tier configuration"""
    name: str
    requests_per_day: int
    tokens_per_day: int
    cost_per_day_usd: float
    features: list


# Quota tier definitions
QUOTA_TIERS = {
    'free': QuotaTier(
        name='Free',
        requests_per_day=10,
        tokens_per_day=50000,
        cost_per_day_usd=0.10,
        features=['basic_predictions', 'karmic_journey']
    ),
    'basic': QuotaTier(
        name='Basic',
        requests_per_day=50,
        tokens_per_day=250000,
        cost_per_day_usd=0.50,
        features=['basic_predictions', 'karmic_journey', 'past_lives', 'relationships']
    ),
    'premium': QuotaTier(
        name='Premium',
        requests_per_day=200,
        tokens_per_day=1000000,
        cost_per_day_usd=2.00,
        features=['all_predictions', 'priority_support', 'detailed_analysis']
    ),
    'enterprise': QuotaTier(
        name='Enterprise',
        requests_per_day=-1,  # Unlimited
        tokens_per_day=-1,  # Unlimited
        cost_per_day_usd=0.0,  # Custom pricing
        features=['all_predictions', 'priority_support', 'api_access', 'white_label']
    )
}


class QuotaExceededError(Exception):
    """Raised when user exceeds quota"""
    pass


class AIQuotaServiceEnhanced:
    """Enhanced AI quota management with Redis backend"""

    def __init__(self):
        self.redis = redis_client
        self.enabled = REDIS_AVAILABLE and os.getenv('ENABLE_AI_QUOTA', 'true').lower() == 'true'
        self.window_seconds = 24 * 60 * 60  # 24 hours

        if not self.enabled:
            logger.warning("⚠️ AI Quota service disabled")
        else:
            logger.info("✅ AI Quota service initialized")

    def _get_user_tier(self, user_id: str) -> str:
        """Get user's quota tier from Redis or default to 'free'"""
        if not self.enabled:
            return 'free'

        try:
            tier_key = f"user_tier:{user_id}"
            tier = self.redis.get(tier_key)
            return tier if tier and tier in QUOTA_TIERS else 'free'
        except Exception as e:
            logger.warning(f"Failed to get user tier: {e}")
            return 'free'

    def _set_user_tier(self, user_id: str, tier: str) -> bool:
        """Set user's quota tier"""
        if not self.enabled or tier not in QUOTA_TIERS:
            return False

        try:
            tier_key = f"user_tier:{user_id}"
            return self.redis.set(tier_key, tier)
        except Exception as e:
            logger.error(f"Failed to set user tier: {e}")
            return False

    def _get_quota_key(self, user_id: str, quota_type: str = 'requests') -> str:
        """Generate quota key for current time window"""
        window_start = int(time.time() // self.window_seconds)
        return f"quota:{quota_type}:{user_id}:{window_start}"

    def _get_usage_count(self, quota_key: str) -> int:
        """Get current usage count"""
        if not self.enabled:
            return 0

        try:
            value = self.redis.get(quota_key)
            return int(value) if value else 0
        except Exception as e:
            logger.warning(f"Failed to get usage count: {e}")
            return 0

    def _increment_usage(self, quota_key: str) -> int:
        """Increment usage counter atomically"""
        if not self.enabled:
            return 0

        try:
            # Check if key exists
            exists = self.redis.exists(quota_key)

            # Increment counter
            count = self.redis.incr(quota_key)

            # Set expiry on first use
            if not exists:
                current_time = int(time.time())
                window_end = ((current_time // self.window_seconds) + 1) * self.window_seconds
                ttl = window_end - current_time + 3600  # +1 hour buffer
                self.redis.expire(quota_key, ttl)

            return count
        except Exception as e:
            logger.error(f"Failed to increment usage: {e}")
            return 0

    async def check_quota(self, user_id: str, request_type: str = 'prediction') -> Dict[str, Any]:
        """
        Check if user has quota remaining

        Args:
            user_id: Unique user identifier
            request_type: Type of request ('prediction', 'analysis', etc.)

        Returns:
            Dictionary with quota status:
            - allowed: bool - Whether request is allowed
            - tier: str - User's quota tier
            - usage: int - Current usage
            - limit: int - Daily limit
            - remaining: int - Remaining quota
            - reset_time: str - When quota resets (ISO format)
            - bypass_reason: str (optional) - Reason if bypassed
        """
        if not self.enabled:
            logger.warning("⚠️ Redis unavailable - allowing request with bypass")
            return {
                'allowed': True,
                'bypass_reason': 'redis_unavailable',
                'tier': 'free',
                'usage': 0,
                'remaining': 999,
                'limit': 1000,
                'reset_time': None
            }

        try:
            # Get user's tier
            tier_name = self._get_user_tier(user_id)
            tier = QUOTA_TIERS[tier_name]

            # Get current usage
            quota_key = self._get_quota_key(user_id, 'requests')
            usage = self._get_usage_count(quota_key)

            # Check if unlimited
            if tier.requests_per_day == -1:
                return {
                    'allowed': True,
                    'unlimited': True,
                    'tier': tier_name,
                    'usage': usage,
                    'remaining': float('inf'),
                    'limit': -1
                }

            # Calculate remaining quota
            limit = tier.requests_per_day
            remaining = max(0, limit - usage)
            allowed = remaining > 0

            # Calculate reset time
            window_start = int(time.time() // self.window_seconds) * self.window_seconds
            reset_time = datetime.fromtimestamp(window_start + self.window_seconds)

            result = {
                'allowed': allowed,
                'tier': tier_name,
                'usage': usage,
                'remaining': remaining,
                'limit': limit,
                'reset_time': reset_time.isoformat(),
                'request_type': request_type
            }

            if not allowed:
                logger.warning(f"🚫 Quota exceeded for user {user_id} (tier: {tier_name}, usage: {usage}/{limit})")
                result['error'] = f'Daily quota exceeded. Used {usage}/{limit} requests. Resets at {reset_time.strftime("%Y-%m-%d %H:%M:%S UTC")}'

            return result

        except Exception as e:
            logger.error(f"❌ Quota check failed for user {user_id}: {e}")
            # Allow request on error to avoid blocking users
            return {
                'allowed': True,
                'error': str(e),
                'bypass_reason': 'service_error',
                'tier': 'free',
                'usage': 0,
                'remaining': 999,
                'limit': 1000
            }

    async def record_usage(
        self,
        user_id: str,
        request_type: str = 'prediction',
        tokens_used: int = 0,
        cost_usd: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Record API usage with comprehensive tracking

        Args:
            user_id: Unique user identifier
            request_type: Type of request
            tokens_used: Number of tokens consumed
            cost_usd: Cost in USD
            metadata: Additional metadata to track

        Returns:
            True if recorded successfully, False otherwise
        """
        if not self.enabled:
            logger.warning("⚠️ Redis unavailable - skipping usage recording")
            return False

        try:
            # Record request count
            requests_key = self._get_quota_key(user_id, 'requests')
            new_request_count = self._increment_usage(requests_key)

            # Record tokens if provided
            if tokens_used > 0:
                tokens_key = self._get_quota_key(user_id, 'tokens')
                self._increment_usage(tokens_key)

            # Record detailed usage in hourly buckets
            usage_key = f"usage:{user_id}:{int(time.time() // 3600)}"  # Hourly
            await self._record_detailed_usage(usage_key, request_type, tokens_used, cost_usd)

            # Update user stats
            stats_key = f"stats:{user_id}"
            await self._update_user_stats(stats_key, request_type, tokens_used, cost_usd, metadata)

            logger.info(f"📊 Recorded usage for user {user_id}: {new_request_count} requests today, {tokens_used} tokens")
            return True

        except Exception as e:
            logger.error(f"❌ Usage recording failed for user {user_id}: {e}")
            return False

    async def _record_detailed_usage(
        self,
        usage_key: str,
        request_type: str,
        tokens_used: int,
        cost_usd: float
    ):
        """Record detailed usage statistics in hourly buckets"""
        try:
            # Get minute within hour
            minute = int(time.time() % 3600 // 60)

            # Store usage data as hash
            usage_data = {
                f"type_{minute}": request_type,
                f"tokens_{minute}": str(tokens_used),
                f"cost_{minute}": str(cost_usd),
                f"timestamp_{minute}": str(int(time.time()))
            }

            for field, value in usage_data.items():
                self.redis.hset(usage_key, field, value)

            # Set expiry (48 hours)
            self.redis.expire(usage_key, 172800)

        except Exception as e:
            logger.warning(f"Detailed usage recording failed: {e}")

    async def _update_user_stats(
        self,
        stats_key: str,
        request_type: str,
        tokens_used: int,
        cost_usd: float,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Update comprehensive user statistics"""
        try:
            # Get current stats
            current_stats = self.redis.hgetall(stats_key)

            # Update counters
            total_requests = int(current_stats.get('total_requests', 0)) + 1
            total_tokens = int(current_stats.get('total_tokens', 0)) + tokens_used
            total_cost = float(current_stats.get('total_cost_usd', 0)) + cost_usd
            type_requests = int(current_stats.get(f'{request_type}_requests', 0)) + 1

            # Calculate first seen time
            first_seen = current_stats.get('first_seen', str(int(time.time())))

            # Track active days
            today = datetime.now().strftime('%Y-%m-%d')
            active_days = set(current_stats.get('active_days', '').split(','))
            active_days.add(today)
            active_days_str = ','.join(sorted(active_days))

            # Update stats
            stats_updates = {
                'total_requests': str(total_requests),
                'total_tokens': str(total_tokens),
                'total_cost_usd': str(round(total_cost, 4)),
                f'{request_type}_requests': str(type_requests),
                'last_request': str(int(time.time())),
                'last_request_type': request_type,
                'first_seen': first_seen,
                'active_days': active_days_str
            }

            # Add metadata if provided
            if metadata:
                for key, value in metadata.items():
                    stats_updates[f'meta_{key}'] = str(value)

            # Batch update
            for field, value in stats_updates.items():
                self.redis.hset(stats_key, field, value)

            # Set expiry (90 days)
            self.redis.expire(stats_key, 7776000)

        except Exception as e:
            logger.warning(f"User stats update failed: {e}")

    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user usage statistics"""
        if not self.enabled:
            return {'error': 'redis_unavailable'}

        try:
            stats_key = f"stats:{user_id}"
            stats = self.redis.hgetall(stats_key)

            if not stats:
                return {
                    'user_id': user_id,
                    'total_requests': 0,
                    'message': 'No usage data found'
                }

            # Get current quota status
            quota_info = await self.check_quota(user_id)

            # Calculate days since first use
            first_seen = int(stats.get('first_seen', time.time()))
            days_since_first_use = (time.time() - first_seen) // 86400

            # Parse active days
            active_days = stats.get('active_days', '').split(',')
            active_days_count = len([d for d in active_days if d])

            return {
                'user_id': user_id,
                'tier': quota_info.get('tier', 'free'),
                'quota': quota_info,
                'usage': {
                    'total_requests': int(stats.get('total_requests', 0)),
                    'total_tokens': int(stats.get('total_tokens', 0)),
                    'total_cost_usd': float(stats.get('total_cost_usd', 0)),
                    'karmic_journey_requests': int(stats.get('karmic_journey_requests', 0)),
                    'past_lives_requests': int(stats.get('past_lives_requests', 0)),
                    'present_life_requests': int(stats.get('present_life_requests', 0)),
                    'future_lives_requests': int(stats.get('future_lives_requests', 0)),
                    'karmic_remedies_requests': int(stats.get('karmic_remedies_requests', 0)),
                    'relationships_requests': int(stats.get('relationships_requests', 0)),
                    'life_events_requests': int(stats.get('life_events_requests', 0))
                },
                'activity': {
                    'first_seen': datetime.fromtimestamp(first_seen).isoformat(),
                    'last_request': datetime.fromtimestamp(int(stats.get('last_request', time.time()))).isoformat(),
                    'last_request_type': stats.get('last_request_type', 'unknown'),
                    'days_since_first_use': int(days_since_first_use),
                    'active_days_count': active_days_count,
                    'avg_requests_per_day': round(int(stats.get('total_requests', 0)) / max(1, days_since_first_use), 2)
                },
                'last_updated': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Stats retrieval failed for user {user_id}: {e}")
            return {'error': str(e), 'user_id': user_id}

    async def upgrade_user_tier(self, user_id: str, new_tier: str, admin_user: str) -> Dict[str, Any]:
        """
        Admin function to upgrade user tier

        Args:
            user_id: User to upgrade
            new_tier: New tier ('free', 'basic', 'premium', 'enterprise')
            admin_user: Admin performing the action

        Returns:
            Result dictionary with success status
        """
        if not self.enabled:
            return {'success': False, 'error': 'redis_unavailable'}

        if new_tier not in QUOTA_TIERS:
            return {'success': False, 'error': f'Invalid tier: {new_tier}'}

        try:
            # Get old tier
            old_tier = self._get_user_tier(user_id)

            # Set new tier
            success = self._set_user_tier(user_id, new_tier)

            if success:
                # Log the upgrade
                audit_key = f"audit:tier_upgrade:{user_id}:{int(time.time())}"
                audit_data = {
                    'admin': admin_user,
                    'user_id': user_id,
                    'old_tier': old_tier,
                    'new_tier': new_tier,
                    'timestamp': datetime.now().isoformat(),
                    'reason': 'admin_upgrade'
                }

                self.redis.set(audit_key, json.dumps(audit_data), ex=2592000)  # 30 days

                logger.info(f"🔄 User {user_id} upgraded from {old_tier} to {new_tier} by admin {admin_user}")

                return {
                    'success': True,
                    'user_id': user_id,
                    'old_tier': old_tier,
                    'new_tier': new_tier,
                    'admin': admin_user,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {'success': False, 'error': 'Failed to set tier in Redis'}

        except Exception as e:
            logger.error(f"❌ Tier upgrade failed for user {user_id}: {e}")
            return {'success': False, 'error': str(e)}

    async def reset_user_quota(self, user_id: str, admin_user: str) -> bool:
        """
        Admin function to reset user quota

        Args:
            user_id: User to reset
            admin_user: Admin performing the action

        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False

        try:
            # Log admin action
            audit_key = f"audit:quota_reset:{user_id}:{int(time.time())}"
            audit_data = {
                'admin': admin_user,
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'reason': 'manual_reset'
            }

            self.redis.set(audit_key, json.dumps(audit_data), ex=2592000)  # 30 days

            # Reset quota (delete current window keys)
            current_window = int(time.time() // self.window_seconds)
            requests_key = f"quota:requests:{user_id}:{current_window}"
            tokens_key = f"quota:tokens:{user_id}:{current_window}"

            self.redis.delete(requests_key, tokens_key)

            logger.info(f"🔄 Quota reset for user {user_id} by admin {admin_user}")
            return True

        except Exception as e:
            logger.error(f"❌ Quota reset failed for user {user_id}: {e}")
            return False

    async def get_quota_analytics(self, time_range: str = '24h') -> Dict[str, Any]:
        """
        Get system-wide quota analytics

        Args:
            time_range: Time range ('24h', '7d', '30d')

        Returns:
            Analytics data
        """
        if not self.enabled:
            return {'error': 'redis_unavailable'}

        try:
            # This would scan Redis keys and aggregate statistics
            # For now, return a placeholder structure

            return {
                'time_range': time_range,
                'total_requests': 0,
                'total_tokens': 0,
                'total_cost_usd': 0,
                'unique_users': 0,
                'tier_distribution': {
                    'free': 0,
                    'basic': 0,
                    'premium': 0,
                    'enterprise': 0
                },
                'top_users': [],
                'generated_at': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Analytics retrieval failed: {e}")
            return {'error': str(e)}


# Global instance
ai_quota_service_enhanced = AIQuotaServiceEnhanced()


# Backward compatibility with existing ai_quota.py
async def check_quota(user_id: str) -> Dict[str, Any]:
    """Backward compatible quota check"""
    return await ai_quota_service_enhanced.check_quota(user_id)


async def record_usage(user_id: str, request_type: str = 'prediction') -> bool:
    """Backward compatible usage recording"""
    return await ai_quota_service_enhanced.record_usage(user_id, request_type)
