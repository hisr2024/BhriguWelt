# AI Features Implementation Guide

## Overview

This document describes the implementation of secure, privacy-first AI features for BhriguWelt's offline-first Progressive Web App (PWA).

## Core Principles

1. **Privacy First**: No PII transmitted to AI services
2. **Consent Required**: Explicit user consent for all AI features
3. **Offline by Default**: Core functionality works without AI
4. **Graceful Degradation**: Fallback to offline mode on errors
5. **Transparent**: Clear warnings about data transmission

## Architecture

### Three-Tier Security Model

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (PWA)                     │
│  - Offline calculations (default)                   │
│  - Consent management                               │
│  - AI mode selector                                 │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTPS (TLS 1.3)
                  │ + Consent Headers
                  │
┌─────────────────▼───────────────────────────────────┐
│            Backend Proxy (Flask)                     │
│  - PII redaction                                    │
│  - Rate limiting                                    │
│  - Request validation                               │
│  - Response sanitization                            │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTPS (TLS 1.3)
                  │ + API Key
                  │
┌─────────────────▼───────────────────────────────────┐
│              OpenAI API                          │
│  - AI processing                                    │
│  - No data retention                                │
└─────────────────────────────────────────────────────┘
```

## Implementation Details

### Backend Components

#### 1. AI Routes (`backend/routes/ai_routes.py`)

Handles three main endpoints:
- `/api/ai/compose` - Refine report sections
- `/api/ai/chat` - Conversational Q&A
- `/api/ai/summarize` - Generate summaries

Key features:
- Consent validation via headers
- PII detection and rejection
- Error handling with fallbacks

#### 2. AI Service (`backend/services/ai_service.py`)

Business logic for AI features:
- Prompt engineering for different sections
- PII validation before API calls
- Response sanitization
- Offline fallback generation

#### 3. Request Sanitizer (`backend/middleware/sanitizer.py`)

Security layer:
- `sanitize_for_ai()` - Removes all PII
- `sanitize_ai_response()` - XSS prevention
- Field whitelisting
- Input validation

#### 4. Rate Limiter (`backend/middleware/rate_limiter.py`)

Abuse prevention:
- 10 requests/minute for AI endpoints
- Per-IP and per-user tracking
- Redis-backed or in-memory
- Graceful degradation if Redis unavailable

### Frontend Components

#### 1. AI Preferences (`frontend/lib/ai-preferences.ts`)

Local storage management:
- Mode selection (offline/hybrid/conversational)
- Consent tracking
- Timestamp logging
- Mode switching logic

#### 2. AI API Client (`frontend/lib/api.ts`)

Type-safe API integration:
- `aiAPI.composeReport()`
- `aiAPI.chat()`
- `aiAPI.summarize()`
- Automatic consent header injection
- Error handling

#### 3. AI Consent Dialog (`frontend/app/components/AIConsentDialog.tsx`)

User consent flow:
- Displays data transmitted/not transmitted
- Privacy guarantees
- Acknowledgment checkbox
- Mode-specific information

#### 4. AI Mode Selector (`frontend/app/components/AIModeSelector.tsx`)

Mode switching UI:
- Three mode cards
- Visual indicators
- Consent status display
- Privacy notices

## Data Flow

### Example: AI-Enhanced Report Generation

1. **User Action**: Clicks "Enable AI Insights"
2. **Frontend**: Shows consent dialog
3. **User**: Reviews privacy info, checks acknowledgment
4. **Frontend**: Calls `grantAIConsent('hybrid')`
5. **Storage**: Saves consent with timestamp
6. **User**: Requests enhanced report
7. **Frontend**: Prepares birth data
8. **AI API**: Sanitizes data (removes PII)
9. **Backend**: Receives request with consent header
10. **Validation**: Checks consent and AI mode
11. **Sanitization**: Double-checks no PII present
12. **AI Service**: Builds prompt with sanitized data
13. **OpenAI**: Processes request
14. **Backend**: Sanitizes AI response (XSS prevention)
15. **Frontend**: Displays enhanced insights
16. **UI**: Shows "AI Enhanced" badge

## Security Measures

### 1. PII Redaction

**Blocked Fields:**
- name
- email
- phone
- address
- birth_location
- place_of_birth
- date_of_birth
- time_of_birth
- latitude
- longitude
- city
- country

**Allowed Fields:**
- zodiac_sign
- nakshatra
- moon_sign
- ascendant
- planetary_positions
- houses
- dasha_period
- yogas
- doshas

### 2. Consent Enforcement

All AI endpoints require:
```
X-AI-Consent: granted
X-AI-Mode: hybrid|conversational
```

Without these headers → 403 Forbidden

### 3. Rate Limiting

```python
# AI-specific limits
@limiter.limit("10 per minute")
def ai_endpoint():
    pass
```

### 4. Response Sanitization

```python
# Remove XSS vectors
sanitized = RequestSanitizer.sanitize_ai_response(response)
# Removes: <script>, onclick, javascript:
```

## Testing

### Security Tests

Run security validation:
```bash
cd backend
python tests/test_ai_security.py
```

Tests cover:
- ✅ PII removal
- ✅ Field whitelisting
- ✅ Zodiac validation
- ✅ Nakshatra validation
- ✅ XSS prevention
- ✅ String sanitization
- ✅ Nested structure preservation

### Integration Tests

```bash
cd backend
pytest tests/test_ai_endpoints.py -v
```

Tests cover:
- Consent requirement
- Rate limiting
- Input validation
- Error handling

## Deployment

### Environment Variables

**Backend:**
```bash
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
AI_FEATURES_ENABLED=true
DAILY_AI_QUOTA=1000
MONTHLY_AI_QUOTA=30000
REDIS_URL=redis://localhost:6379/0
```

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=https://api.bhriguwelt.com
# NO AI KEYS IN FRONTEND!
```

### Render.com Configuration

1. Add environment variables in Render dashboard
2. Enable Redis add-on for rate limiting
3. Set health check endpoint: `/health`
4. Configure auto-deploy from main branch

### Vercel Configuration

1. Set `NEXT_PUBLIC_API_URL` environment variable
2. Enable automatic deployments
3. Configure preview deployments

## Monitoring

### Key Metrics

Track these metrics:
- AI request count (per mode)
- Consent grant/revoke events
- PII detection incidents (should be 0)
- Rate limit hits
- Error rates
- Fallback activations

### Logging

Use structured logging:
```python
logger.info('ai_request', extra={
    'mode': 'hybrid',
    'endpoint': 'compose',
    'zodiac_sign': 'Aries',  # OK to log
    'response_time_ms': 1250
})
```

**Never log:**
- Names, emails, phones
- Birth locations
- Exact times/dates
- Any PII

## User Experience

### Consent Flow

1. User encounters AI feature
2. System checks `getAIPreferences()`
3. If no consent → show consent dialog
4. User reviews privacy information
5. User checks acknowledgment
6. User clicks "Enable AI"
7. System calls `grantAIConsent(mode)`
8. Consent saved with timestamp
9. Feature now available

### Mode Indicators

- **Offline Mode**: 🔒 Green badge
- **Hybrid Mode**: ⚖️ Blue badge
- **Conversational Mode**: 🤖 Purple badge

### Privacy Notices

Every AI response includes:
```json
"privacy_note": "No personal information was transmitted"
```

## Troubleshooting

### Issue: Consent not persisting

**Solution:** Check localStorage is enabled
```typescript
if (typeof window !== 'undefined') {
  // Safe to use localStorage
}
```

### Issue: Rate limit exceeded

**Solution:** Implement request queuing or increase limits
```python
DAILY_AI_QUOTA=2000  # Increase quota
```

### Issue: AI API timeout

**Solution:** Graceful fallback already implemented
```python
except requests.exceptions.Timeout:
    return self._offline_fallback(section_type, data)
```

## Future Enhancements

### Phase 2 Features

- [ ] AI-powered chart comparison
- [ ] Personalized remedy recommendations
- [ ] Multi-language support via AI translation
- [ ] Voice-based queries
- [ ] Cached AI responses for common queries

### Security Improvements

- [ ] Token-based authentication
- [ ] Request signing
- [ ] Anomaly detection
- [ ] Advanced rate limiting (per-user quotas)

## References

- [API Documentation](./AI_FEATURES_API.md)
- [OpenAI Integration Guide](../OPENAI_INTEGRATION.md)
- [Security Architecture](../SECURITY_ARCHITECTURE.md)
- [Privacy Policy](https://bhriguwelt.com/privacy)

## Support

- **Security Issues**: security@bhriguwelt.com
- **Technical Support**: support@bhriguwelt.com
- **GitHub Issues**: https://github.com/hisr2024/BhriguWelt/issues

---

**Implementation Status**: ✅ Complete  
**Security Review**: ✅ Passed  
**Documentation**: ✅ Complete  
**Version**: 1.0.0  
**Date**: 2026-01-03
