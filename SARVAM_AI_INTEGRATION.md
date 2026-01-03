# Sarvam AI Integration Guidelines

## Overview

BhriguWelt integrates with Sarvam AI to provide enhanced astrological predictions and insights. This document outlines the security guidelines, best practices, and compliance requirements for the Sarvam AI integration.

## Security Model

### Three Integration Modes

#### 1. Offline Only (Default) ✅
**Privacy**: Maximum  
**Network**: Zero transmission  
**Processing**: 100% local

- No data leaves the device
- Traditional Vedic astrology calculations
- No AI enhancements
- Fastest response times
- Works completely offline
- Recommended for privacy-conscious users

#### 2. Hybrid Mode ⚖️
**Privacy**: High  
**Network**: Minimal transmission  
**Processing**: Local + AI insights

- Birth data transmitted (sanitized)
- No personal identifiers sent
- AI enhances local calculations
- Opt-in by user
- Requires internet connection
- Balanced approach

**Data Transmitted**:
```json
{
  "zodiac_sign": "Aries",
  "nakshatra": "Ashwini",
  "moon_sign": "Taurus",
  "ascendant": "Gemini",
  "planetary_positions": {
    "sun": {"degree": 15, "sign": "Aries"},
    "moon": {"degree": 28, "sign": "Taurus"}
  }
}
```

**Data NOT Transmitted**:
- Name
- Email address
- Exact birth time
- Birth location (city/coordinates)
- Phone number
- Any other PII

#### 3. AI Chatbot Mode 🤖
**Privacy**: Moderate  
**Network**: Full interaction  
**Processing**: AI-powered dialogue

- Interactive AI assistant
- Context-aware recommendations
- Natural language queries
- Requires explicit user consent
- Full disclosure of data transmission
- Session-based, no long-term storage

**Data Transmitted**:
- User questions (text)
- Birth chart summary
- Previous conversation context (session only)
- Preferences and settings (anonymized)

## API Key Management

### Storage
**✅ DO:**
- Store API key in environment variables
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Rotate keys every 90 days
- Monitor key usage and set alerts

**❌ DON'T:**
- Hard-code API keys in source code
- Commit keys to version control
- Share keys via email or chat
- Store keys in frontend code or bundle
- Use the same key across environments

### Environment Variables

#### Backend (.env)
```bash
# Sarvam AI Configuration
SARVAM_AI_API_KEY=your-api-key-here
SARVAM_AI_BASE_URL=https://api.sarvam.ai/v1
SARVAM_AI_MODEL=sarvam-1
SARVAM_AI_MAX_TOKENS=1000
SARVAM_AI_TEMPERATURE=0.7
SARVAM_AI_TIMEOUT=30

# Rate Limiting
SARVAM_AI_RATE_LIMIT=10  # requests per minute
SARVAM_AI_DAILY_LIMIT=1000  # requests per day
```

#### Frontend (.env.local)
```bash
# NO SARVAM AI KEYS IN FRONTEND!
# Only backend proxy URL
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Key Rotation

1. **Generate new key** from Sarvam AI dashboard
2. **Update backend environment** variable
3. **Test with new key** in staging
4. **Deploy to production** with zero downtime
5. **Revoke old key** after 24-hour grace period
6. **Document rotation** in security log

## Request/Response Flow

### Architecture

```
User Device (Frontend)
    ↓
    | HTTPS (TLS 1.3)
    ↓
Backend Proxy (Flask/Python)
    ↓
    | API Key Injection
    | Request Sanitization
    | Rate Limiting
    ↓
    | HTTPS (TLS 1.3)
    ↓
Sarvam AI API
    ↓
    | AI Processing
    ↓
Backend Proxy
    ↓
    | Response Validation
    | Sanitization
    | Caching
    ↓
User Device (Frontend)
```

### Request Sanitization

```python
def sanitize_for_sarvam_ai(birth_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove all PII before sending to Sarvam AI
    Only send astrological data points
    """
    # Allowed fields only
    allowed_fields = [
        'zodiac_sign', 'nakshatra', 'moon_sign', 
        'ascendant', 'planetary_positions', 'houses',
        'dasha_period', 'yogas', 'doshas'
    ]
    
    sanitized = {}
    for field in allowed_fields:
        if field in birth_data:
            sanitized[field] = birth_data[field]
    
    return sanitized

def validate_request(data: Dict[str, Any]) -> bool:
    """
    Validate request before sending to AI
    """
    required_fields = ['zodiac_sign', 'nakshatra']
    
    # Check required fields
    for field in required_fields:
        if field not in data:
            return False
    
    # Check field types
    if not isinstance(data.get('zodiac_sign'), str):
        return False
    
    # Check field values
    valid_signs = ['Aries', 'Taurus', 'Gemini', ...]
    if data['zodiac_sign'] not in valid_signs:
        return False
    
    return True
```

### Response Validation

```python
def sanitize_ai_response(response: str) -> str:
    """
    Sanitize AI response to prevent XSS
    """
    # Remove potentially dangerous content
    response = re.sub(r'<script.*?</script>', '', response, flags=re.DOTALL)
    response = re.sub(r'on\w+="[^"]*"', '', response)
    response = re.sub(r'javascript:', '', response)
    
    # HTML entity encoding
    response = html.escape(response)
    
    return response

def validate_response(response: Dict[str, Any]) -> bool:
    """
    Validate AI API response structure
    """
    # Check response structure
    if 'choices' not in response:
        return False
    
    if not isinstance(response['choices'], list):
        return False
    
    if len(response['choices']) == 0:
        return False
    
    # Check content
    choice = response['choices'][0]
    if 'message' not in choice:
        return False
    
    if 'content' not in choice['message']:
        return False
    
    return True
```

## Rate Limiting

### Implementation

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per minute"],
    storage_uri="redis://localhost:6379"
)

@app.route('/api/predictions/ai', methods=['POST'])
@limiter.limit("10 per minute")  # Sarvam AI specific limit
def ai_prediction():
    """AI-powered prediction with rate limiting"""
    # ... implementation
```

### Rate Limits by Endpoint

| Endpoint | Rate Limit | Window | Notes |
|----------|------------|--------|-------|
| `/api/predictions/daily` | 10/min | Per IP | AI-powered |
| `/api/predictions/ai-chat` | 5/min | Per user | Chatbot mode |
| `/api/karmic-journey` | 10/min | Per IP | AI-powered |
| `/api/sync/backup` | 5/hour | Per user | Data sync |
| `/api/*` (general) | 100/min | Per IP | All other endpoints |

### Quota Management

```python
class QuotaManager:
    """Manage daily/monthly quotas for AI usage"""
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def check_quota(self, user_id: str, quota_type: str) -> bool:
        """Check if user has quota remaining"""
        key = f"quota:{user_id}:{quota_type}:{date.today()}"
        current = self.redis.get(key) or 0
        limit = self.get_limit(quota_type)
        return int(current) < limit
    
    def increment_quota(self, user_id: str, quota_type: str):
        """Increment usage counter"""
        key = f"quota:{user_id}:{quota_type}:{date.today()}"
        self.redis.incr(key)
        self.redis.expire(key, 86400)  # 24 hours
```

## Error Handling & Fallbacks

### Graceful Degradation

```python
class SarvamAIService:
    def generate_prediction(self, prompt: str, context: Dict = None) -> str:
        try:
            # Attempt AI prediction
            return self._call_sarvam_api(prompt, context)
        
        except requests.exceptions.Timeout:
            # Timeout - fallback to cache or traditional
            logger.warning("Sarvam AI timeout, using fallback")
            return self._fallback_prediction(prompt, context)
        
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                # Rate limited - inform user
                logger.error("Sarvam AI rate limit exceeded")
                return self._rate_limit_message()
            elif e.response.status_code >= 500:
                # Server error - fallback
                logger.error(f"Sarvam AI server error: {e}")
                return self._fallback_prediction(prompt, context)
            else:
                raise
        
        except Exception as e:
            # Unknown error - fallback
            logger.exception(f"Unexpected error in Sarvam AI: {e}")
            return self._fallback_prediction(prompt, context)
    
    def _fallback_prediction(self, prompt: str, context: Dict) -> str:
        """Traditional Vedic astrology prediction without AI"""
        # Use local calculation engine
        return traditional_vedic_analysis(context)
```

### User Feedback

```python
def format_ai_response(response: str, ai_used: bool) -> Dict[str, Any]:
    """Format response with metadata for frontend"""
    return {
        'prediction': response,
        'metadata': {
            'ai_enhanced': ai_used,
            'source': 'sarvam-ai' if ai_used else 'traditional',
            'timestamp': datetime.utcnow().isoformat(),
            'confidence': 'high' if ai_used else 'medium'
        }
    }
```

## Monitoring & Logging

### Metrics to Track

1. **API Usage**
   - Requests per minute/hour/day
   - Response times (p50, p95, p99)
   - Error rates by endpoint
   - Token consumption

2. **Quota Status**
   - Daily quota usage
   - Users hitting limits
   - Cost per request
   - Projected monthly cost

3. **Performance**
   - API latency
   - Cache hit rate
   - Fallback frequency
   - User satisfaction scores

### Logging Best Practices

```python
import logging
from pythonjsonlogger import jsonlogger

# Structured logging
logger = logging.getLogger('sarvam_ai')
handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
handler.setFormatter(formatter)
logger.addHandler(handler)

# Log AI requests (without PII)
logger.info('sarvam_ai_request', extra={
    'endpoint': '/api/predictions/daily',
    'mode': 'hybrid',
    'zodiac_sign': 'Aries',  # OK to log
    'response_time_ms': 1250,
    'tokens_used': 450,
    'success': True
})

# DON'T log sensitive data
# ❌ logger.info(f"Request for {user_name} born in {city}")
# ✅ logger.info('sarvam_ai_request', extra={'mode': 'hybrid'})
```

## Cost Optimization

### Caching Strategy

```python
from functools import lru_cache
import hashlib

class CachedSarvamAI:
    """Cache AI responses to reduce API calls"""
    
    def __init__(self, redis_client, ttl=3600):
        self.redis = redis_client
        self.ttl = ttl
    
    def get_or_generate(self, prompt: str, context: Dict) -> str:
        # Create cache key from prompt + context
        cache_key = self._make_cache_key(prompt, context)
        
        # Try cache first
        cached = self.redis.get(cache_key)
        if cached:
            logger.info('sarvam_ai_cache_hit')
            return cached.decode()
        
        # Generate new prediction
        logger.info('sarvam_ai_cache_miss')
        prediction = self.ai_service.generate_prediction(prompt, context)
        
        # Cache result
        self.redis.setex(cache_key, self.ttl, prediction)
        
        return prediction
    
    def _make_cache_key(self, prompt: str, context: Dict) -> str:
        """Generate cache key from input"""
        data = f"{prompt}:{json.dumps(context, sort_keys=True)}"
        return f"sarvam_ai:{hashlib.sha256(data.encode()).hexdigest()}"
```

### Batch Requests

For multiple predictions, batch them when possible:

```python
def batch_predictions(requests: List[Dict]) -> List[str]:
    """Batch multiple predictions into one API call"""
    # Combine prompts
    combined_prompt = "\n\n---\n\n".join([r['prompt'] for r in requests])
    
    # Single API call
    response = sarvam_ai.generate_prediction(combined_prompt)
    
    # Split response
    predictions = response.split("\n\n---\n\n")
    
    return predictions
```

## User Consent & Privacy

### Consent Flow

```typescript
// Frontend consent component
interface ConsentState {
  mode: 'offline' | 'hybrid' | 'chatbot';
  consentGiven: boolean;
  consentTimestamp: string;
}

function AIConsentDialog() {
  return (
    <Dialog>
      <DialogTitle>Enable AI Insights?</DialogTitle>
      <DialogContent>
        <p>
          BhriguWelt can use AI to enhance your predictions.
          This requires sending your birth chart data (not personal info)
          to our secure backend, which forwards it to Sarvam AI.
        </p>
        
        <h3>What we send:</h3>
        <ul>
          <li>✅ Zodiac sign and nakshatra</li>
          <li>✅ Planetary positions</li>
          <li>✅ Chart calculations</li>
        </ul>
        
        <h3>What we DON'T send:</h3>
        <ul>
          <li>❌ Your name or email</li>
          <li>❌ Birth location or time</li>
          <li>❌ Any personal identifiers</li>
        </ul>
        
        <p>
          You can change this setting anytime in Settings.
          Learn more in our <a href="/privacy">Privacy Policy</a>.
        </p>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDecline}>Stay Offline</Button>
        <Button onClick={handleAccept}>Enable AI</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Privacy Policy Update

Include in your Privacy Policy:

```markdown
## AI Integration

When you enable AI features (Hybrid or Chatbot mode):

1. **Data Sent**: We transmit your astrological chart data (zodiac sign,
   nakshatra, planetary positions) to Sarvam AI for enhanced predictions.

2. **No PII**: We do NOT send your name, email, birth location, exact birth
   time, or any other personally identifiable information.

3. **Encryption**: All data is encrypted in transit using TLS 1.3.

4. **No Storage**: Sarvam AI does not store your data long-term. Requests
   are processed in real-time and discarded.

5. **Opt-Out**: You can disable AI features anytime by switching to
   "Offline Only" mode in Settings.

6. **Third-Party**: Review Sarvam AI's privacy policy at sarvam.ai/privacy
```

## Testing & Validation

### Security Tests

```python
# test_sarvam_ai_security.py
import pytest
from services.sarvam_ai import sanitize_for_sarvam_ai

def test_pii_removed():
    """Ensure PII is stripped before sending to AI"""
    birth_data = {
        'name': 'John Doe',  # PII
        'email': 'john@example.com',  # PII
        'zodiac_sign': 'Aries',  # OK
        'birth_location': 'New York',  # PII
        'nakshatra': 'Ashwini'  # OK
    }
    
    sanitized = sanitize_for_sarvam_ai(birth_data)
    
    # Verify PII removed
    assert 'name' not in sanitized
    assert 'email' not in sanitized
    assert 'birth_location' not in sanitized
    
    # Verify astro data present
    assert sanitized['zodiac_sign'] == 'Aries'
    assert sanitized['nakshatra'] == 'Ashwini'

def test_api_key_not_exposed():
    """Ensure API key never reaches frontend"""
    from backend.app import app
    
    with app.test_client() as client:
        response = client.get('/api/config')
        data = response.get_json()
        
        # Check response doesn't contain key
        assert 'SARVAM_AI_API_KEY' not in str(data)
        assert 'api_key' not in str(data).lower()

def test_rate_limiting():
    """Verify rate limiting works"""
    from backend.app import app
    
    with app.test_client() as client:
        # Make 11 requests (limit is 10/min)
        for i in range(11):
            response = client.post('/api/predictions/ai', json={
                'zodiac_sign': 'Aries'
            })
            
            if i < 10:
                assert response.status_code == 200
            else:
                assert response.status_code == 429  # Too Many Requests
```

### Load Testing

```bash
# Use Apache Bench to test rate limiting
ab -n 100 -c 10 -H "Content-Type: application/json" \
   -p request.json \
   https://your-backend.onrender.com/api/predictions/ai

# Use locust for comprehensive load testing
locust -f locustfile.py --host=https://your-backend.onrender.com
```

## Compliance Checklist

### Pre-Production
- [ ] API key stored in environment variables only
- [ ] PII sanitization implemented and tested
- [ ] Rate limiting configured on all AI endpoints
- [ ] Error handling with graceful fallbacks
- [ ] Logging excludes sensitive data
- [ ] HTTPS enforced for all API calls
- [ ] User consent flow implemented
- [ ] Privacy policy updated
- [ ] Cost monitoring and alerts set up
- [ ] Security tests passing

### Production
- [ ] API key rotated from development key
- [ ] Rate limits tested under load
- [ ] Monitoring dashboards configured
- [ ] Alert thresholds set for quotas
- [ ] Backup keys available for rotation
- [ ] Incident response plan documented
- [ ] Security audit completed
- [ ] Penetration testing performed

## Troubleshooting

### Common Issues

**Issue**: 429 Too Many Requests
**Solution**: 
- Check rate limit configuration
- Implement request queuing
- Add caching layer
- Consider upgrading Sarvam AI plan

**Issue**: Slow response times
**Solution**:
- Enable response caching
- Reduce max_tokens in request
- Implement timeout with fallback
- Check network latency

**Issue**: API key invalid
**Solution**:
- Verify key in environment variables
- Check key format (no extra spaces)
- Confirm key is active in Sarvam dashboard
- Rotate key if compromised

**Issue**: Unexpected AI responses
**Solution**:
- Review prompt engineering
- Add response validation
- Increase temperature for variety
- Check model version

## Support & Resources

### Sarvam AI Documentation
- API Reference: https://docs.sarvam.ai/api-reference
- Authentication: https://docs.sarvam.ai/authentication
- Rate Limits: https://docs.sarvam.ai/rate-limits
- Best Practices: https://docs.sarvam.ai/best-practices

### BhriguWelt Resources
- Security Architecture: `SECURITY_ARCHITECTURE.md`
- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- API Documentation: `backend/README.md`

### Contact
- Security Issues: security@bhriguwelt.com
- API Support: api-support@bhriguwelt.com
- General: support@bhriguwelt.com

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-03  
**Status**: Production Ready
