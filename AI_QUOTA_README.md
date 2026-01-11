# AI Quota and Cost Management System

## Overview

This system provides comprehensive quota and cost management for OpenAI API usage in the BhriguWelt Flask backend. It includes:

- **Daily per-user token quotas** backed by Redis
- **Per-request cost limits** to prevent runaway expenses
- **Conservative token estimation** with upgrade path to tiktoken
- **Automatic fallback** to offline wisdom when limits are exceeded
- **Security-focused logging** that redacts API keys
- **Comprehensive testing** with unit and integration tests

## Features

### 1. Token Quota Management
- Daily token limits per user (e.g., 100,000 tokens/day)
- Redis-backed atomic operations prevent race conditions
- Automatic key expiry (48 hours) for cleanup
- Graceful degradation when Redis is unavailable

### 2. Cost Control
- Per-request cost estimation and limits
- Configurable cost per 1000 tokens
- Prevents expensive requests before they happen
- Tracks actual costs from OpenAI responses

### 3. Security
- API key redaction in logs (replaces `sk-*` patterns)
- Log output truncation (default 256 chars)
- No sensitive data in error messages

### 4. Fallback System
- Automatic fallback to offline wisdom when:
  - Daily quota exceeded
  - Per-request cost limit exceeded
  - OpenAI API returns 429 (rate limit)
  - OpenAI API returns insufficient_quota error

## Environment Variables

Add these to your `.env` file:

```bash
# ============================================================
# Redis Configuration (Required)
# ============================================================
# Redis URL for quota tracking and caching
REDIS_URL=redis://localhost:6379

# Optional: Redis password if authentication is enabled
# REDIS_PASSWORD=your_redis_password

# Optional: Redis connection settings
# REDIS_MAX_CONNECTIONS=50
# REDIS_SOCKET_TIMEOUT=5
# REDIS_CONNECT_TIMEOUT=5

# ============================================================
# OpenAI Configuration (Existing)
# ============================================================
# Your OpenAI API key
OPENAI_API_KEY=sk-your-api-key-here

# OpenAI base URL (default: https://api.openai.com/v1)
OPENAI_BASE_URL=https://api.openai.com/v1

# Model to use (e.g., gpt-4o-mini, gpt-3.5-turbo, gpt-4)
OPENAI_MODEL=gpt-4o-mini

# Maximum tokens in response (default: 4000)
OPENAI_MAX_TOKENS=4000

# Temperature for generation (default: 0.7)
OPENAI_TEMPERATURE=0.7

# ============================================================
# Quota Management (New)
# ============================================================
# Daily token limit per user (default: 100000)
# Example values:
#   10000 = 10K tokens/day (very restrictive, ~2-3 long requests)
#   50000 = 50K tokens/day (moderate, ~10-15 medium requests)
#   100000 = 100K tokens/day (generous, ~20-30 requests)
#   500000 = 500K tokens/day (very generous)
USER_DAILY_TOKEN_LIMIT=100000

# Cost per 1000 tokens in USD (varies by model)
# Check OpenAI pricing: https://openai.com/pricing
# Examples:
#   gpt-3.5-turbo: $0.0015 input, $0.002 output (avg: 0.00175)
#   gpt-4o-mini: $0.00015 input, $0.0006 output (avg: 0.000375)
#   gpt-4o: $0.005 input, $0.015 output (avg: 0.01)
#   gpt-4-turbo: $0.01 input, $0.03 output (avg: 0.02)
OPENAI_COST_PER_1K=0.000375

# Maximum cost per single request in USD (default: 1.0)
# This prevents individual expensive requests
# Examples:
#   0.01 = 1 cent per request (very restrictive)
#   0.10 = 10 cents per request (moderate)
#   1.00 = 1 dollar per request (generous)
#   5.00 = 5 dollars per request (very generous)
PER_REQUEST_COST_LIMIT=1.0

# ============================================================
# Rate Limiting (Optional - for Flask-Limiter)
# ============================================================
# Enable/disable Flask-Limiter
RATELIMIT_ENABLED=true

# Default rate limits (format: "X per Y")
# Example: "200 per day;50 per hour;10 per minute"
# RATELIMIT_DEFAULT="200 per day;50 per hour"

# Storage URL for Flask-Limiter (uses same Redis as quotas)
# RATELIMIT_STORAGE_URL=redis://localhost:6379
```

## Installation

### 1. Install Dependencies

All required dependencies are already in `backend/requirements.txt`:

```bash
cd backend
pip install -r requirements.txt
```

Key dependencies:
- `redis==5.0.1` - Redis client
- `flask-limiter==3.5.0` - HTTP rate limiting
- `pytest==8.0.0` - Testing framework
- `fakeredis==2.21.1` - Redis mocking for tests

### 2. Start Redis

#### Using Docker (Recommended):
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

#### Using Local Redis:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

### 3. Configure Environment Variables

Copy the example above to your `.env` file and adjust values:

```bash
# Edit .env
nano backend/.env

# Or create from template
cat >> backend/.env << 'EOF'
REDIS_URL=redis://localhost:6379
USER_DAILY_TOKEN_LIMIT=100000
OPENAI_COST_PER_1K=0.000375
PER_REQUEST_COST_LIMIT=1.0
EOF
```

### 4. Apply the Patch

Follow the instructions in `OPENAI_SERVICE_PATCH.md` to integrate quota management into `backend/services/openai_service.py`.

## Usage

### Basic Usage

```python
from services.openai_service import get_openai_service

# Get service instance
service = get_openai_service()

# Generate prediction with quota tracking
result = service.generate_prediction(
    prompt="Generate a brief astrological reading",
    context={'zodiac_sign': 'Aries', 'nakshatra': 'Ashwini'},
    return_metadata=True,
    user_id='user_123'  # Required for quota tracking
)

print(result['text'])
print(f"Fallback used: {result['metadata'].get('fallback', False)}")
```

### Check User Quota Status

```python
from services.ai_quota import get_user_quota_status

# Get quota status for a user
status = get_user_quota_status('user_123')

print(f"Used: {status['used']}/{status['limit']} tokens")
print(f"Remaining: {status['remaining']} tokens")
print(f"Usage: {status['percentage_used']}%")
```

### Manual Quota Check

```python
from services.ai_quota import (
    check_daily_quota_and_reserve,
    QuotaExceededError
)

try:
    allowed, remaining = check_daily_quota_and_reserve('user_123', 5000)
    if allowed:
        print(f"Quota OK. Remaining: {remaining} tokens")
        # Proceed with OpenAI call
except QuotaExceededError as e:
    print(f"Quota exceeded: {e}")
    # Use fallback response
```

### Cost Estimation

```python
from services.ai_quota import estimate_tokens, estimate_cost

# Estimate tokens
prompt = "Your long prompt here..."
prompt_tokens = estimate_tokens(prompt)

# Estimate cost
expected_response_tokens = 4000
cost = estimate_cost(prompt_tokens, expected_response_tokens)

print(f"Estimated cost: ${cost:.4f}")

# Check against limit
import os
limit = float(os.getenv('PER_REQUEST_COST_LIMIT', '1.0'))
if cost > limit:
    print(f"Cost ${cost:.4f} exceeds limit ${limit:.4f}")
```

## Testing

### Run Unit Tests

```bash
# Test the quota module
pytest backend/services/ai_quota.py -v

# Test integration
pytest backend/tests/test_ai_quota_integration.py -v

# Run all tests with coverage
pytest backend/tests/ --cov=backend/services/ai_quota -v
```

### Run Specific Tests

```bash
# Test token estimation
pytest backend/services/ai_quota.py::TestTokenEstimation -v

# Test quota management
pytest backend/services/ai_quota.py::TestQuotaManagement -v

# Test integration with OpenAI mocks
pytest backend/tests/test_ai_quota_integration.py::TestOpenAIIntegrationWithQuota -v
```

### Manual Testing

```bash
# Test with curl
curl -X POST http://localhost:5000/api/ai/generate-prediction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "Provide a brief prediction",
    "context": {
      "zodiac_sign": "Aries",
      "nakshatra": "Ashwini"
    }
  }'

# Test quota status endpoint (if implemented)
curl http://localhost:5000/api/quota/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Monitoring

### Check Redis Keys

```bash
# Connect to Redis
redis-cli

# List all quota keys
KEYS ai_usage:*

# Check specific user's usage
GET ai_usage:user_123:2026-01-11

# Check TTL (time to live)
TTL ai_usage:user_123:2026-01-11

# Monitor quota operations in real-time
MONITOR
```

### Log Monitoring

Quota operations are logged with these patterns:

```
# Successful quota check
INFO: Quota reserved for user user_123: reserved=5000, remaining=95000/100000

# Quota exceeded
WARNING: Quota exceeded for user user_123: needed=10000, remaining=5000, limit=100000

# Cost limit exceeded
WARNING: Cost limit exceeded: estimated=$1.5000, limit=$1.0000

# Fallback triggered
WARNING: Quota limit reached, using fallback: Daily token quota exceeded...
```

### Application Metrics

Track these metrics in your monitoring system:

- **Quota exceeded events**: How often users hit their limits
- **Cost limit exceeded events**: How often requests are too expensive
- **Fallback usage rate**: Percentage of requests using fallback
- **Average tokens per request**: Monitor token consumption patterns
- **Average cost per request**: Monitor spending patterns

## Configuration Recommendations

### Development Environment

```bash
# Generous limits for testing
USER_DAILY_TOKEN_LIMIT=500000
PER_REQUEST_COST_LIMIT=5.0
OPENAI_COST_PER_1K=0.000375  # gpt-4o-mini
```

### Staging Environment

```bash
# Moderate limits for testing
USER_DAILY_TOKEN_LIMIT=100000
PER_REQUEST_COST_LIMIT=1.0
OPENAI_COST_PER_1K=0.000375
```

### Production Environment

```bash
# Conservative limits to control costs
USER_DAILY_TOKEN_LIMIT=50000   # ~10-15 requests/day
PER_REQUEST_COST_LIMIT=0.50    # 50 cents max per request
OPENAI_COST_PER_1K=0.000375    # gpt-4o-mini

# Or for paid users
USER_DAILY_TOKEN_LIMIT=200000  # ~40-50 requests/day
PER_REQUEST_COST_LIMIT=2.0     # $2 max per request
```

### Model-Specific Costs (as of Jan 2025)

Update `OPENAI_COST_PER_1K` based on your model:

| Model | Input | Output | Average | Setting |
|-------|-------|--------|---------|---------|
| gpt-4o-mini | $0.00015 | $0.0006 | $0.000375 | `0.000375` |
| gpt-3.5-turbo | $0.0015 | $0.002 | $0.00175 | `0.00175` |
| gpt-4o | $0.005 | $0.015 | $0.01 | `0.01` |
| gpt-4-turbo | $0.01 | $0.03 | $0.02 | `0.02` |

**Note**: Use average of input/output prices as a conservative estimate. For more accuracy, consider implementing separate input/output pricing.

## Troubleshooting

### Issue: Quota checks always succeed

**Cause**: Redis not running or `REDIS_URL` incorrect

**Solution**:
```bash
# Check Redis connection
redis-cli ping

# Verify REDIS_URL in .env
echo $REDIS_URL

# Check logs for Redis warnings
grep -i redis backend/logs/app.log
```

### Issue: All requests return fallback

**Cause**: Quota limits too low or cost limits too restrictive

**Solution**:
```bash
# Check current settings
grep USER_DAILY_TOKEN_LIMIT .env
grep PER_REQUEST_COST_LIMIT .env

# Increase limits temporarily
export USER_DAILY_TOKEN_LIMIT=500000
export PER_REQUEST_COST_LIMIT=10.0

# Check user's current usage
redis-cli GET "ai_usage:user_123:$(date +%Y-%m-%d)"
```

### Issue: "Redis unavailable" warnings in logs

**Cause**: Redis connection issues

**Solution**:
```bash
# Check if Redis is running
systemctl status redis  # Linux
brew services list | grep redis  # macOS

# Test connection
redis-cli -u $REDIS_URL ping

# Check firewall/network
telnet localhost 6379
```

### Issue: Quota not resetting daily

**Cause**: Keys not expiring properly

**Solution**:
```bash
# Check TTL on keys
redis-cli TTL "ai_usage:user_123:2026-01-11"

# Should return ~172800 (48 hours in seconds)
# If -1 (no expiry) or -2 (doesn't exist), keys aren't being set correctly

# Manually expire old keys
redis-cli --scan --pattern "ai_usage:*" | xargs -L 1 redis-cli EXPIRE 172800
```

### Issue: Tests failing with Redis errors

**Cause**: Tests trying to connect to real Redis instead of fakeredis

**Solution**: Tests use mocked Redis by default. If issues persist:
```bash
# Install fakeredis
pip install fakeredis==2.21.1

# Run tests with fakeredis
pytest backend/tests/test_ai_quota_integration.py -v
```

## Security Considerations

### 1. API Key Protection
- API keys are **never** logged in full
- Pattern `sk-*` is automatically redacted to `[REDACTED_API_KEY]`
- Log output is truncated to 256 characters by default

### 2. Redis Security
- Use Redis password authentication in production:
  ```bash
  REDIS_PASSWORD=your_secure_password
  ```
- Use Redis ACLs to restrict access
- Consider Redis over TLS for production

### 3. User ID Validation
- Always pass authenticated user IDs
- Long user IDs (>64 chars) are automatically hashed
- Anonymous users use shared 'anonymous' quota

### 4. Rate Limiting Layers
Multiple layers of protection:
1. **Flask-Limiter**: HTTP request rate limiting (10-60/min)
2. **Redis Quotas**: Daily token limits (100K tokens/day)
3. **Cost Guards**: Per-request cost limits ($0.50-$5.00)
4. **OpenAI**: Their own rate limits

## Upgrading Token Estimation

The current system uses a simple character-based estimation (`len(text) // 4`). For production accuracy, consider upgrading to `tiktoken`:

### Install tiktoken
```bash
pip install tiktoken
```

### Update ai_quota.py
```python
import tiktoken

def estimate_tokens(text: str, model: str = "gpt-4") -> int:
    """Accurate token estimation using tiktoken"""
    if not text:
        return 0

    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception:
        # Fallback to character-based estimation
        return max(1, len(text) // 4)
```

This provides 99%+ accuracy but adds a dependency on `tiktoken`.

## API Integration Examples

### Flask Route Example

```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.openai_service import get_openai_service
from services.ai_quota import QuotaExceededError, get_user_quota_status

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict():
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        service = get_openai_service()
        result = service.generate_prediction(
            prompt=data['prompt'],
            context=data.get('context', {}),
            return_metadata=True,
            user_id=user_id
        )

        return jsonify({
            'success': True,
            'prediction': result['text'],
            'fallback': result['metadata'].get('fallback', False),
            'reason': result['metadata'].get('reason')
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/quota', methods=['GET'])
@jwt_required()
def quota_status():
    user_id = get_jwt_identity()
    status = get_user_quota_status(user_id)

    return jsonify(status)
```

## Cost Estimation Examples

### Monthly Budget Planning

```python
# Calculate monthly costs
daily_users = 100
requests_per_user_per_day = 10
avg_tokens_per_request = 5000
cost_per_1k_tokens = 0.000375

daily_tokens = daily_users * requests_per_user_per_day * avg_tokens_per_request
daily_cost = (daily_tokens / 1000) * cost_per_1k_tokens
monthly_cost = daily_cost * 30

print(f"Estimated monthly cost: ${monthly_cost:.2f}")
# Output: Estimated monthly cost: $56.25
```

### Per-User Cost Analysis

```python
from services.ai_quota import get_user_quota_status, estimate_cost

# Get user's usage
status = get_user_quota_status('user_123')
tokens_used = status['used']

# Estimate cost
cost = (tokens_used / 1000) * float(os.getenv('OPENAI_COST_PER_1K'))

print(f"User has spent ~${cost:.4f} today")
```

## Support

For issues or questions:

1. Check logs: `tail -f backend/logs/app.log`
2. Verify Redis: `redis-cli ping`
3. Run tests: `pytest backend/tests/test_ai_quota_integration.py -v`
4. Check GitHub issues: [BhriguWelt Issues](https://github.com/hisr2024/BhriguWelt/issues)

## License

This quota management system is part of the BhriguWelt project and follows the same license.
