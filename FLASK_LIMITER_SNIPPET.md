# Flask-Limiter Integration Snippet

This document shows how to add Flask-Limiter to your `backend/app.py` for HTTP-level rate limiting as an additional layer of protection beyond the Redis-based quota system.

## Overview

Flask-Limiter provides:
- **HTTP rate limiting** at the route level (e.g., 10 requests per minute)
- **IP-based throttling** to prevent abuse
- **Key function customization** for user-based limiting

The Redis-based quota system provides:
- **Token-based daily quotas** per user
- **Cost management** per request
- **Fine-grained usage tracking**

These two systems complement each other:
- Flask-Limiter prevents rapid-fire request spam
- Redis quota system prevents excessive token consumption over time

## Installation

Flask-Limiter is already installed (see `backend/requirements.txt`):
```
flask-limiter==3.5.0
```

## Implementation

### 1. Add to `backend/app.py` (after Flask app initialization)

Insert this code after line ~150 where the Flask app is created:

```python
# ==================== FLASK-LIMITER INITIALIZATION ====================
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Initialize Flask-Limiter with Redis backend
# This shares the same Redis instance used for quota management
limiter = Limiter(
    app=app,
    key_func=get_remote_address,  # Default: limit by IP address
    storage_uri=os.getenv('REDIS_URL', 'redis://localhost:6379'),
    storage_options={
        'socket_connect_timeout': 5,
        'socket_timeout': 5
    },
    # Default rate limits (can be overridden per route)
    default_limits=[
        "1000 per day",
        "200 per hour"
    ],
    # Return headers showing limit status
    headers_enabled=True,
    # Customize error response
    swallow_errors=True  # Don't crash if Redis is down
)

logger.info("✓ Flask-Limiter initialized with Redis backend")
# ==================== END FLASK-LIMITER INITIALIZATION ====================


# Custom key function for user-based limiting (alternative to IP)
def get_user_id_for_rate_limit():
    """
    Extract user ID from request for user-based rate limiting.
    Falls back to IP address if user not authenticated.
    """
    from flask import request, g
    from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

    try:
        # Try to get authenticated user
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            return f"user:{user_id}"
    except:
        pass

    # Fall back to IP address
    return f"ip:{get_remote_address()}"
```

### 2. Apply Rate Limits to AI Routes

There are two approaches:

#### Approach A: Apply to Specific Routes (Recommended)

Add decorators to individual AI endpoint routes. Example for `backend/routes/ai_routes.py`:

```python
from flask import Blueprint, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Import limiter from app (if using separate blueprint)
# OR apply limits directly in route definitions

@ai_bp.route('/generate-prediction', methods=['POST'])
@limiter.limit("10 per minute")  # Strict limit for expensive AI calls
@limiter.limit("50 per hour")
def generate_prediction():
    """Generate AI prediction with rate limiting"""
    # Your existing code...
    pass


@ai_bp.route('/karmic-journey', methods=['POST'])
@limiter.limit("5 per minute")  # Very strict for expensive operations
@limiter.limit("20 per hour")
def karmic_journey():
    """Generate karmic journey with rate limiting"""
    # Your existing code...
    pass


@ai_bp.route('/past-lives', methods=['POST'])
@limiter.limit("5 per minute")
@limiter.limit("20 per hour")
def past_lives():
    """Generate past lives analysis with rate limiting"""
    # Your existing code...
    pass
```

#### Approach B: Apply to All Routes in a Blueprint

Apply limits to an entire blueprint:

```python
# In backend/routes/ai_routes.py
from flask import Blueprint

ai_bp = Blueprint('ai', __name__)

# Apply rate limits to ALL routes in this blueprint
@ai_bp.before_request
@limiter.limit("10 per minute")
@limiter.limit("100 per hour")
def before_request():
    """Apply rate limits to all AI routes"""
    pass
```

### 3. Customize Rate Limit Error Response (Optional)

Add custom error handler in `backend/app.py`:

```python
from flask_limiter.errors import RateLimitExceeded

@app.errorhandler(RateLimitExceeded)
def handle_rate_limit_exceeded(e):
    """Custom handler for rate limit errors"""
    logger.warning(
        f"Rate limit exceeded: {request.remote_addr} - {request.path}",
        extra={'ip': request.remote_addr, 'path': request.path}
    )

    return jsonify({
        'error': 'rate_limit_exceeded',
        'message': 'Too many requests. Please try again later.',
        'retry_after': e.description  # Includes retry-after info
    }), 429
```

### 4. User-Based Rate Limiting (Advanced)

For authenticated endpoints, rate limit by user ID instead of IP:

```python
from flask_jwt_extended import get_jwt_identity

@ai_bp.route('/generate-prediction', methods=['POST'])
@limiter.limit("10 per minute", key_func=lambda: get_jwt_identity() or get_remote_address())
def generate_prediction():
    """Generate prediction with user-based rate limiting"""
    # Your code...
    pass
```

### 5. Exempt Specific Routes (if needed)

Exempt routes from rate limiting:

```python
@app.route('/health')
@limiter.exempt  # No rate limiting for health checks
def health():
    return jsonify({'status': 'healthy'})
```

## Configuration Options

Set these in your `.env` file:

```bash
# Redis URL (shared with quota system)
REDIS_URL=redis://localhost:6379

# Optional: Customize default limits
# RATELIMIT_DEFAULT="200 per day;50 per hour"

# Enable/disable limiter
# RATELIMIT_ENABLED=true

# Storage type (memory or redis)
# RATELIMIT_STORAGE_URL=redis://localhost:6379
```

## Testing Rate Limits

Test rate limits with curl:

```bash
# Test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:5000/api/generate-prediction \
    -H "Content-Type: application/json" \
    -d '{"prompt": "test"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done

# After 10 requests, you should see 429 responses
```

## Monitoring Rate Limits

Add an admin endpoint to check rate limit status:

```python
@app.route('/admin/rate-limits')
@limiter.limit("10 per minute")
def rate_limits_status():
    """Get current rate limit statistics"""
    # This requires admin authentication in production
    from flask_limiter import Limiter

    stats = {
        'enabled': limiter.enabled,
        'storage_type': str(type(limiter._storage)),
        'default_limits': limiter._default_limits
    }

    return jsonify(stats)
```

## Production Recommendations

1. **Use Redis storage** (not in-memory) for distributed systems
2. **Set conservative limits** initially, then adjust based on metrics
3. **Monitor 429 responses** in logs/Sentry
4. **Use user-based limiting** for authenticated endpoints
5. **Exempt health checks** and monitoring endpoints
6. **Configure retry-after headers** for better client experience

## Rate Limit Tiers by Route Type

Suggested limits:

| Route Type | Per Minute | Per Hour | Per Day |
|------------|------------|----------|---------|
| Health/Status | Exempt | Exempt | Exempt |
| Read/Query | 60 | 500 | 5000 |
| AI Predictions | 10 | 50 | 200 |
| Expensive AI (Past Lives, etc.) | 5 | 20 | 100 |

## Relationship with Redis Quota System

The two systems work together:

```
Request Flow:
1. Flask-Limiter checks: Has user made too many requests recently? (HTTP level)
   ↓ If OK
2. Redis Quota checks: Does user have enough tokens? (Token level)
   ↓ If OK
3. Cost Guard checks: Is this request too expensive? (Cost level)
   ↓ If OK
4. OpenAI API call proceeds
5. Update Redis quota with actual usage
```

**Flask-Limiter**: Fast, rejects spam quickly
**Redis Quota**: Deeper, tracks actual AI usage

## Troubleshooting

### Issue: Rate limits not working

**Solution**: Ensure Redis is running and REDIS_URL is correct

```bash
redis-cli ping  # Should return PONG
```

### Issue: Rate limits too strict

**Solution**: Adjust limits per route or increase defaults

### Issue: 429 errors in production

**Solution**:
1. Check if it's legitimate abuse or normal usage
2. Adjust limits if needed
3. Consider user-based limits instead of IP-based

## Complete Example

Here's a complete example for `backend/routes/ai_routes.py`:

```python
from flask import Blueprint, request, jsonify
from services.openai_service import get_openai_service
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.logger import setup_logger

# Import limiter from app
from app import limiter

logger = setup_logger(__name__)
ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')


@ai_bp.route('/generate-prediction', methods=['POST'])
@jwt_required()  # Require authentication
@limiter.limit("10 per minute", key_func=lambda: get_jwt_identity())  # User-based limit
@limiter.limit("50 per hour", key_func=lambda: get_jwt_identity())
def generate_prediction():
    """
    Generate AI prediction with rate limiting and quota management.

    Rate Limits:
    - 10 requests per minute per user
    - 50 requests per hour per user

    Quota Limits (enforced by ai_quota.py):
    - Daily token quota per user
    - Per-request cost limit
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        prompt = data.get('prompt')
        context = data.get('context', {})

        if not prompt:
            return jsonify({'error': 'prompt is required'}), 400

        # Call OpenAI service (quota checks happen inside)
        service = get_openai_service()
        result = service.generate_prediction(
            prompt=prompt,
            context=context,
            return_metadata=True,
            user_id=user_id  # Pass user_id for quota tracking
        )

        return jsonify({
            'success': True,
            'prediction': result['text'],
            'metadata': result.get('metadata', {})
        }), 200

    except Exception as e:
        logger.error(f"Error generating prediction: {str(e)}")
        return jsonify({
            'error': 'prediction_generation_failed',
            'message': str(e)
        }), 500
```

This provides layered protection:
1. **JWT auth**: Only authenticated users
2. **Flask-Limiter**: Prevents request spam (10/min, 50/hour)
3. **Redis Quota**: Prevents token abuse (daily limit)
4. **Cost Guard**: Prevents expensive requests (per-request limit)
