"""
Rate limiting middleware for BhriguWelt backend
Protects against API abuse and ensures fair usage
"""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import request
import os


def get_rate_limit_key():
    """
    Get rate limit key from request
    Uses IP address as default, but can be extended to use user ID
    """
    # Try to get user ID from JWT token if available
    try:
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            return f"user:{user_id}"
    except:
        pass
    
    # Fallback to IP address
    return get_remote_address()


def setup_rate_limiter(app):
    """
    Configure and attach rate limiter to Flask app
    
    Rate limits:
    - General API: 100 requests/minute per IP
    - AI endpoints: 10 requests/minute per user
    - Sync endpoints: 60 requests/hour per user
    - Backup: 5 requests/day per user
    """
    # Use Redis if available, otherwise in-memory storage
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    try:
        limiter = Limiter(
            app=app,
            key_func=get_rate_limit_key,
            default_limits=["100 per minute"],
            storage_uri=redis_url,
            strategy="fixed-window",
            headers_enabled=True,
            swallow_errors=True  # Don't fail if Redis is unavailable
        )
    except Exception as e:
        # Fallback to in-memory storage
        print(f"Warning: Redis not available, using in-memory rate limiting: {e}")
        limiter = Limiter(
            app=app,
            key_func=get_rate_limit_key,
            default_limits=["100 per minute"],
            storage_uri="memory://",
            strategy="fixed-window",
            headers_enabled=True
        )
    
    # Custom rate limit exceeded handler
    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return {
            'error': 'Rate limit exceeded',
            'message': str(e.description),
            'retry_after': e.description
        }, 429
    
    return limiter


# Rate limit decorators for specific endpoint types
def ai_rate_limit():
    """Rate limit for AI-powered endpoints (10 req/min)"""
    def decorator(f):
        from flask_limiter import Limiter
        limiter = Limiter.limit("10 per minute")(f)
        return limiter
    return decorator


def sync_rate_limit():
    """Rate limit for sync endpoints (60 req/hour)"""
    def decorator(f):
        from flask_limiter import Limiter
        limiter = Limiter.limit("60 per hour")(f)
        return limiter
    return decorator


def backup_rate_limit():
    """Rate limit for backup endpoints (5 req/day)"""
    def decorator(f):
        from flask_limiter import Limiter
        limiter = Limiter.limit("5 per day")(f)
        return limiter
    return decorator


class QuotaManager:
    """
    Manage daily/monthly quotas for AI usage
    Tracks usage beyond rate limiting for cost control
    """
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.daily_limit = int(os.getenv('DAILY_AI_QUOTA', 1000))
        self.monthly_limit = int(os.getenv('MONTHLY_AI_QUOTA', 30000))
    
    def check_daily_quota(self, user_id: str) -> bool:
        """Check if user has daily quota remaining"""
        if not self.redis:
            return True  # No Redis, allow request
        
        from datetime import date
        key = f"quota:daily:{user_id}:{date.today()}"
        current = self.redis.get(key)
        
        if current is None:
            return True
        
        return int(current) < self.daily_limit
    
    def check_monthly_quota(self, user_id: str) -> bool:
        """Check if user has monthly quota remaining"""
        if not self.redis:
            return True
        
        from datetime import date
        year_month = date.today().strftime('%Y-%m')
        key = f"quota:monthly:{user_id}:{year_month}"
        current = self.redis.get(key)
        
        if current is None:
            return True
        
        return int(current) < self.monthly_limit
    
    def increment_daily(self, user_id: str):
        """Increment daily usage counter"""
        if not self.redis:
            return
        
        from datetime import date
        key = f"quota:daily:{user_id}:{date.today()}"
        self.redis.incr(key)
        self.redis.expire(key, 86400)  # 24 hours
    
    def increment_monthly(self, user_id: str):
        """Increment monthly usage counter"""
        if not self.redis:
            return
        
        from datetime import date
        year_month = date.today().strftime('%Y-%m')
        key = f"quota:monthly:{user_id}:{year_month}"
        self.redis.incr(key)
        self.redis.expire(key, 2592000)  # 30 days
    
    def get_remaining(self, user_id: str) -> dict:
        """Get remaining quota for user"""
        if not self.redis:
            return {
                'daily': self.daily_limit,
                'monthly': self.monthly_limit
            }
        
        from datetime import date
        daily_key = f"quota:daily:{user_id}:{date.today()}"
        monthly_key = f"quota:monthly:{user_id}:{date.today().strftime('%Y-%m')}"
        
        daily_used = int(self.redis.get(daily_key) or 0)
        monthly_used = int(self.redis.get(monthly_key) or 0)
        
        return {
            'daily': max(0, self.daily_limit - daily_used),
            'monthly': max(0, self.monthly_limit - monthly_used),
            'daily_used': daily_used,
            'monthly_used': monthly_used
        }
