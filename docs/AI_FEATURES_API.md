# AI Features API Documentation

## Overview

BhriguWelt provides optional AI-powered features to enhance astrological predictions while maintaining strong privacy and security controls. All AI features are opt-in and require explicit user consent.

## Security Model

### Three Integration Modes

#### 1. Offline Only (Default) ✅
- **Privacy**: Maximum
- **Network**: Zero transmission
- **Processing**: 100% local
- **Consent Required**: No
- All calculations performed on device
- Fastest response times
- Recommended for privacy-conscious users

#### 2. Hybrid Mode ⚖️
- **Privacy**: High
- **Network**: Minimal transmission
- **Processing**: Local + AI insights
- **Consent Required**: Yes
- Only astrological data transmitted (no PII)
- AI enhances local calculations
- Balanced approach

#### 3. Conversational Mode 🤖
- **Privacy**: Moderate
- **Network**: Full interaction
- **Processing**: AI-powered dialogue
- **Consent Required**: Yes
- Interactive AI assistant
- Context-aware recommendations
- Natural language queries

## API Endpoints

### Base URL
```
Production: https://api.bhriguwelt.com
Development: http://localhost:8000
```

### Authentication
All AI endpoints require:
- `X-AI-Consent: granted` header
- `X-AI-Mode: hybrid|conversational` header
- Valid content type: `application/json`

### Endpoints

#### 1. Get AI Status
```http
GET /api/ai/status
```

Check if AI services are available.

**Response:**
```json
{
  "status": "success",
  "data": {
    "ai_available": true,
    "service_operational": true,
    "endpoints": {
      "compose": "/api/ai/compose",
      "chat": "/api/ai/chat",
      "summarize": "/api/ai/summarize",
      "consent": "/api/ai/consent"
    }
  }
}
```

#### 2. Get Consent Information
```http
GET /api/ai/consent
```

Get detailed information about consent requirements and what data is transmitted.

**Response:**
```json
{
  "status": "success",
  "data": {
    "consent_required": true,
    "modes": {
      "offline": {
        "name": "Offline Only",
        "description": "100% local processing",
        "privacy": "Maximum",
        "requires_consent": false
      },
      "hybrid": {
        "name": "Hybrid Refine",
        "description": "AI enhances local calculations",
        "privacy": "High",
        "requires_consent": true,
        "data_transmitted": ["zodiac_sign", "nakshatra", "planetary_positions"]
      },
      "conversational": {
        "name": "AI Chatbot",
        "description": "Interactive AI assistant",
        "privacy": "Moderate",
        "requires_consent": true,
        "data_transmitted": ["zodiac_sign", "nakshatra", "conversation_context"]
      }
    },
    "data_never_transmitted": [
      "name", "email", "phone_number", "exact_birth_time",
      "birth_location", "address", "any_personal_identifiers"
    ]
  }
}
```

#### 3. Compose/Refine Report Section
```http
POST /api/ai/compose
```

Refine existing report sections using AI.

**Headers:**
- `X-AI-Consent: granted`
- `X-AI-Mode: hybrid`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "report_section": "karmic_journey",
  "birth_data": {
    "zodiac_sign": "Aries",
    "nakshatra": "Ashwini",
    "moon_sign": "Taurus",
    "ascendant": "Gemini",
    "planetary_positions": {
      "sun": {"degree": 15, "sign": "Aries"},
      "moon": {"degree": 28, "sign": "Taurus"}
    }
  }
}
```

**Valid Report Sections:**
- `karmic_journey`
- `past_lives`
- `present_life`
- `remedies`

**Response:**
```json
{
  "status": "success",
  "data": {
    "refined_section": "Enhanced astrological insights...",
    "section_type": "karmic_journey",
    "ai_enhanced": true,
    "mode": "hybrid",
    "privacy_note": "No personal information was transmitted"
  }
}
```

#### 4. Chat About Report
```http
POST /api/ai/chat
```

Have conversational Q&A about astrological reports.

**Headers:**
- `X-AI-Consent: granted`
- `X-AI-Mode: conversational`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "message": "What does my moon sign say about relationships?",
  "birth_data": {
    "zodiac_sign": "Aries",
    "nakshatra": "Ashwini",
    "moon_sign": "Taurus"
  },
  "conversation_history": [
    {
      "role": "user",
      "content": "Tell me about my birth chart"
    },
    {
      "role": "assistant",
      "content": "Your Aries zodiac sign indicates..."
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "response": "Your Taurus moon sign suggests...",
    "ai_enhanced": true,
    "mode": "conversational",
    "privacy_note": "No personal information was transmitted"
  }
}
```

#### 5. Summarize Report
```http
POST /api/ai/summarize
```

Generate AI-powered summaries of reports.

**Headers:**
- `X-AI-Consent: granted`
- `X-AI-Mode: hybrid`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "report_data": "Full report text to summarize...",
  "birth_data": {
    "zodiac_sign": "Aries",
    "nakshatra": "Ashwini"
  },
  "summary_type": "overview"
}
```

**Valid Summary Types:**
- `overview` - Brief overview
- `key_insights` - Bullet point insights
- `action_items` - Actionable recommendations
- `detailed` - Comprehensive summary

**Response:**
```json
{
  "status": "success",
  "data": {
    "summary": "Your astrological report highlights...",
    "summary_type": "overview",
    "ai_enhanced": true,
    "privacy_note": "No personal information was transmitted"
  }
}
```

## Error Responses

### 403 Forbidden - Consent Required
```json
{
  "error": "Consent required",
  "message": "AI features require explicit user consent"
}
```

### 400 Bad Request - Invalid Mode
```json
{
  "error": "Invalid AI mode",
  "message": "AI mode must be 'hybrid' or 'conversational'"
}
```

### 503 Service Unavailable - AI Not Configured
```json
{
  "error": "AI features not configured",
  "message": "AI integration is not available"
}
```

### 429 Too Many Requests - Rate Limited
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": "60 seconds"
}
```

## Rate Limits

| Endpoint | Rate Limit | Scope |
|----------|------------|-------|
| `/api/ai/compose` | 10 requests/minute | Per IP/User |
| `/api/ai/chat` | 10 requests/minute | Per IP/User |
| `/api/ai/summarize` | 10 requests/minute | Per IP/User |
| `/api/ai/status` | 100 requests/minute | Per IP |
| `/api/ai/consent` | 100 requests/minute | Per IP |

## Data Privacy

### Data Transmitted to AI

**Allowed Fields:**
- `zodiac_sign`
- `nakshatra`
- `moon_sign`
- `ascendant`
- `planetary_positions`
- `houses`
- `dasha_period`
- `yogas`
- `doshas`
- `elements`
- `qualities`
- `karmic_number`

**Never Transmitted:**
- Name
- Email
- Phone number
- Exact birth date/time
- Birth location (city, coordinates)
- Address
- Any personal identifiers

### Security Measures

1. **PII Redaction**: All personal information automatically stripped before AI transmission
2. **Consent Enforcement**: Explicit user consent required via headers
3. **Rate Limiting**: Prevents abuse and ensures fair usage
4. **Response Sanitization**: AI responses sanitized to prevent XSS attacks
5. **TLS Encryption**: All data encrypted in transit
6. **No Long-term Storage**: Data processed in real-time and discarded

## Frontend Integration

### Using the AI API

```typescript
import { aiAPI } from '@/lib/api';
import { getAIMode } from '@/lib/ai-preferences';

// Check if AI is available
const status = await aiAPI.getStatus();

// Get consent information
const consentInfo = await aiAPI.getConsentInfo();

// Compose report with AI (requires consent)
const aiMode = getAIMode();
const result = await aiAPI.composeReport({
  report_section: 'karmic_journey',
  birth_data: {
    zodiac_sign: 'Aries',
    nakshatra: 'Ashwini'
  }
}, aiMode);

// Chat with AI
const chatResponse = await aiAPI.chat({
  message: 'Tell me about my chart',
  birth_data: { zodiac_sign: 'Aries' }
}, aiMode);
```

### Managing User Consent

```typescript
import {
  grantAIConsent,
  revokeAIConsent,
  getAIPreferences,
  isAIEnabled
} from '@/lib/ai-preferences';

// Grant consent
const prefs = grantAIConsent('hybrid');

// Check if enabled
if (isAIEnabled()) {
  // Use AI features
}

// Revoke consent
revokeAIConsent();
```

## Testing

### Running Tests

```bash
# Backend security tests
cd backend
python tests/test_ai_security.py

# Full test suite (requires dependencies)
pytest tests/test_ai_endpoints.py -v
```

### Example Test

```python
def test_pii_removal():
    """Ensure PII is removed before AI transmission"""
    data = {
        'name': 'John',
        'email': 'john@example.com',
        'zodiac_sign': 'Aries'
    }
    
    sanitized = RequestSanitizer.sanitize_for_ai(data)
    
    assert 'name' not in sanitized
    assert 'email' not in sanitized
    assert sanitized['zodiac_sign'] == 'Aries'
```

## Environment Configuration

### Backend (.env)

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1

# AI Features
AI_FEATURES_ENABLED=true
DAILY_AI_QUOTA=1000
MONTHLY_AI_QUOTA=30000

# Rate Limiting (requires Redis)
REDIS_URL=redis://localhost:6379/0
```

### Frontend (.env.local)

```bash
# Backend API URL (no AI keys in frontend!)
NEXT_PUBLIC_API_URL=https://api.bhriguwelt.com
```

## Deployment Checklist

- [ ] API key stored in environment variables
- [ ] PII sanitization tested
- [ ] Rate limiting configured
- [ ] Consent flow implemented
- [ ] Privacy policy updated
- [ ] Error handling with fallbacks
- [ ] TLS/HTTPS enforced
- [ ] Monitoring and alerts set up
- [ ] Security tests passing
- [ ] Documentation complete

## Support

For issues or questions:
- **Security Issues**: security@bhriguwelt.com
- **API Support**: api-support@bhriguwelt.com
- **Documentation**: See `OPENAI_INTEGRATION.md`

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-03  
**Status**: Production Ready
