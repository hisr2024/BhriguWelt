# BhriguWelt API Documentation

## Version 2.0.0

Complete API reference for the BhriguWelt Vedic Astrology Platform

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Status Endpoints](#health--status-endpoints)
3. [Prediction Endpoints](#prediction-endpoints)
4. [Birth Chart Endpoints](#birth-chart-endpoints)
5. [Matchmaking Endpoints](#matchmaking-endpoints)
6. [Data Models](#data-models)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Security](#security)

---

## Authentication

### CSRF Protection

All POST/PUT/DELETE requests require CSRF token.

**Get CSRF Token:**
```http
GET /api/csrf-token
```

**Response:**
```json
{
  "csrf_token": "ImFiY2RlZjEyMzQ1Njc4OTAi..."
}
```

**Usage:**
Include token in request headers:
```
X-CSRF-Token: ImFiY2RlZjEyMzQ1Njc4OTAi...
```

---

## Health & Status Endpoints

### Simple Status Check

**Endpoint:** `GET /api/health/status`

**Description:** Quick health check for load balancers

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-11T10:30:00Z",
  "service": "BhriguWelt-API",
  "version": "2.0.0"
}
```

### Detailed Health Check

**Endpoint:** `GET /api/health/detailed`

**Description:** Comprehensive system status with all subsystems

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-11T10:30:00Z",
  "version": "2.0.0",
  "uptime": {
    "seconds": 3600,
    "human_readable": "1h 0m 0s"
  },
  "services": {
    "prediction_orchestrator": {
      "status": "operational",
      "concurrent_safe": true,
      "online_available": true,
      "offline_available": true
    },
    "openai": {
      "status": "operational",
      "api_key_configured": true,
      "default_model": "gpt-4"
    }
  },
  "vedic_systems": {
    "calculation_engine": {
      "status": "operational",
      "vimshottari_periods_count": 9,
      "nakshatras_count": 27,
      "sign_lords_count": 12
    },
    "offline_wisdom": {
      "status": "operational",
      "zodiac_traits_count": 12,
      "nakshatra_traits_count": 27,
      "bhrigu_corpus_loaded": true,
      "nadi_corpus_loaded": true
    },
    "astrology_calculator": {
      "status": "operational",
      "ephemeris": "Swiss Ephemeris",
      "ayanamsa": "Lahiri",
      "nominatim_geocoding": "operational",
      "mapbox_geocoding": "operational"
    }
  },
  "infrastructure": {
    "database": {
      "status": "operational",
      "wisdom_entries": 150,
      "cached_predictions": 1234,
      "db_type": "sqlite"
    },
    "corpus_files": {
      "bhrigu_samhita": {
        "available": true,
        "size_kb": 47.5
      },
      "nadi_jyotisha": {
        "available": true,
        "size_kb": 9.7
      }
    },
    "system": {
      "python_version": "3.11.0",
      "platform": "linux",
      "environment": "production"
    }
  }
}
```

### Prediction Service Health

**Endpoint:** `GET /api/health/predictions`

**Description:** Check status of all prediction categories

**Response:**
```json
{
  "status": "operational",
  "timestamp": "2026-01-11T10:30:00Z",
  "categories": {
    "karmic_journey": {
      "status": "available",
      "online_mode": true,
      "offline_mode": true
    },
    "past_lives": {
      "status": "available",
      "online_mode": true,
      "offline_mode": true
    }
  },
  "summary": {
    "total_categories": 8,
    "available_categories": 8,
    "online_mode_ready": true,
    "offline_mode_ready": true,
    "guaranteed_response": true
  }
}
```

### Database Health

**Endpoint:** `GET /api/health/database`

**Description:** Database connectivity and table statistics

### Corpus Health

**Endpoint:** `GET /api/health/corpus`

**Description:** Vedic wisdom corpus files status

### Readiness Probe

**Endpoint:** `GET /api/health/readiness`

**Description:** Kubernetes-style readiness check

### Liveness Probe

**Endpoint:** `GET /api/health/liveness`

**Description:** Kubernetes-style liveness check

---

## Prediction Endpoints

### Generate Prediction

**Endpoint:** `POST /api/bhrigu-predictions/{category}`

**Categories:**
- `karmic_journey` - Soul path and karmic analysis
- `past_lives` - Previous incarnations
- `future_lives` - Future incarnations guidance
- `present_life` - Current life situation
- `life_events` - Major life events timing
- `karmic_remedies` - Remedial measures
- `relationships` - Relationship compatibility
- `predictions` - General predictions/horoscope

**Request:**
```json
{
  "date": "1990-05-15",
  "time": "14:30",
  "location": "New Delhi, India",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "timezone": "Asia/Kolkata",
  "name": "John Doe",
  "question": "What is my soul purpose?"
}
```

**Required Fields:**
- `date`: Birth date (YYYY-MM-DD)
- `time`: Birth time (HH:MM or HH:MM:SS)
- `location`: Birth place name

**Optional Fields:**
- `latitude`: Latitude (if known, for accuracy)
- `longitude`: Longitude (if known, for accuracy)
- `timezone`: Timezone (auto-detected if not provided)
- `name`: Person's name (for personalization)
- `question`: Specific question (for focused reading)

**Response:**
```json
{
  "prediction": "## Soul Purpose Analysis\n\nYour birth chart reveals...",
  "metadata": {
    "category": "karmic_journey",
    "mode": "online",
    "zodiac_sign": "Taurus",
    "moon_sign": "Cancer",
    "nakshatra": "Pushya",
    "ascendant": "Leo",
    "cached": false,
    "timestamp": "2026-01-11T10:30:00Z"
  },
  "sections": {
    "soul_purpose": "...",
    "karmic_lessons": "...",
    "life_path": "..."
  }
}
```

**Error Response:**
```json
{
  "error": "Validation failed",
  "errors": {
    "date": "Invalid date format",
    "time": "Time required"
  },
  "error_code": "VALIDATION_ERROR"
}
```

---

## Birth Chart Endpoints

### Calculate Birth Chart

**Endpoint:** `POST /api/astrology/birth-chart`

**Request:**
```json
{
  "date": "1990-05-15",
  "time": "14:30",
  "location": "New Delhi, India",
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Response:**
```json
{
  "ascendant": "Leo",
  "moon_sign": "Cancer",
  "sun_sign": "Taurus",
  "nakshatra": "Pushya",
  "planets": {
    "Sun": {
      "sign": "Taurus",
      "house": 10,
      "degree": 24.5,
      "retrograde": false
    },
    "Moon": {
      "sign": "Cancer",
      "house": 12,
      "degree": 8.2,
      "retrograde": false
    }
  },
  "houses": {
    "1": {"sign": "Leo", "degree": 15.3},
    "2": {"sign": "Virgo", "degree": 10.1}
  },
  "yogas": [
    {
      "name": "Gajakesari Yoga",
      "type": "raja_yoga",
      "strength": "strong"
    }
  ],
  "dashas": {
    "current_dasha": "Venus",
    "dasha_start": "2020-01-01",
    "dasha_end": "2040-01-01"
  }
}
```

### Get Yogas

**Endpoint:** `POST /api/astrology/yogas`

**Description:** Calculate all 108+ yogas from birth chart

**Request:** Same as birth chart

**Response:**
```json
{
  "raja_yogas": [...],
  "dhana_yogas": [...],
  "mahapurusha_yogas": [...],
  "chandra_yogas": [...],
  "summary": {
    "total_benefic": 15,
    "total_malefic": 3,
    "net_strength": 12,
    "most_powerful": "Hamsa Yoga"
  }
}
```

---

## Matchmaking Endpoints

### Calculate Compatibility

**Endpoint:** `POST /api/matchmaking/calculate`

**Request:**
```json
{
  "person1": {
    "date": "1990-05-15",
    "time": "14:30",
    "location": "New Delhi, India"
  },
  "person2": {
    "date": "1992-08-20",
    "time": "10:15",
    "location": "Mumbai, India"
  }
}
```

**Response:**
```json
{
  "compatibility_score": 28,
  "max_score": 36,
  "percentage": 77.8,
  "recommendation": "Excellent match",
  "guna_milan": {
    "varna": {"score": 1, "max": 1},
    "vashya": {"score": 2, "max": 2},
    "tara": {"score": 3, "max": 3},
    "yoni": {"score": 4, "max": 4},
    "graha_maitri": {"score": 5, "max": 5},
    "gana": {"score": 6, "max": 6},
    "bhakut": {"score": 7, "max": 7},
    "nadi": {"score": 0, "max": 8}
  },
  "doshas": {
    "mangal_dosha_person1": false,
    "mangal_dosha_person2": true,
    "kuja_dosha_cancelled": true
  },
  "analysis": "Detailed compatibility analysis...",
  "strengths": [
    "Strong emotional compatibility",
    "Good communication"
  ],
  "challenges": [
    "Different temperaments",
    "Need patience"
  ],
  "remedies": [
    "Mangal shanti puja",
    "Wear red coral"
  ]
}
```

---

## Data Models

### Birth Data Model

```typescript
interface BirthData {
  date: string;           // YYYY-MM-DD
  time: string;           // HH:MM or HH:MM:SS
  location: string;       // Place name
  latitude?: number;      // -90 to 90
  longitude?: number;     // -180 to 180
  timezone?: string;      // IANA timezone
  name?: string;          // Person name
  question?: string;      // Specific question
}
```

### Prediction Response Model

```typescript
interface PredictionResponse {
  prediction: string;     // Markdown formatted
  metadata: {
    category: string;
    mode: 'online' | 'offline' | 'hybrid';
    zodiac_sign: string;
    moon_sign: string;
    nakshatra: string;
    ascendant: string;
    cached: boolean;
    timestamp: string;
  };
  sections?: {
    [key: string]: string;
  };
}
```

### Yoga Model

```typescript
interface Yoga {
  name: string;
  type: 'raja_yoga' | 'dhana_yoga' | 'mahapurusha_yoga' | 'arishta_yoga';
  description: string;
  strength: 'very_strong' | 'strong' | 'medium' | 'weak';
  effects: string;
  active: boolean;
  planets?: string[];
  house?: number;
  sign?: string;
  remedies?: string[];
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "error_code": "ERROR_CODE",
  "message": "Detailed explanation",
  "errors": {
    "field": "Field-specific error"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `MISSING_DATA` | 400 | Required data not provided |
| `INVALID_QUESTION` | 422 | Question validation failed |
| `CSRF_TOKEN_MISSING` | 403 | CSRF token not provided |
| `CSRF_VALIDATION_FAILED` | 403 | Invalid CSRF token |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

---

## Rate Limiting

### Default Limits

- **Health endpoints**: No limit
- **Prediction endpoints**: 100 requests/hour per IP
- **Matchmaking endpoints**: 50 requests/hour per IP
- **Birth chart endpoints**: 200 requests/hour per IP

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 3600,
  "message": "Please wait 1 hour before making more requests"
}
```

---

## Security

### HTTPS Required

All production requests must use HTTPS.

### CORS Policy

**Allowed Origins:**
- `https://bhriguwelt.com`
- `https://www.bhriguwelt.com`
- `http://localhost:3000` (development)

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization, X-CSRF-Token

### Input Validation

All inputs are validated for:
- SQL injection patterns
- XSS attack patterns
- Format validity
- Length constraints
- Type correctness

### Data Privacy

- Birth data is hashed before caching
- No PII is logged
- All predictions are anonymized in analytics
- GDPR compliant

---

## Best Practices

### 1. Use CSRF Tokens

Always include CSRF token for POST/PUT/DELETE requests:

```javascript
// Get token
const tokenResponse = await fetch('/api/csrf-token');
const { csrf_token } = await tokenResponse.json();

// Use token
const response = await fetch('/api/bhrigu-predictions/karmic_journey', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf_token
  },
  body: JSON.stringify(birthData)
});
```

### 2. Handle Errors Gracefully

```javascript
try {
  const response = await fetch('/api/bhrigu-predictions/predictions', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error_code, error.message);
    // Show user-friendly message
  }

  const result = await response.json();
  // Process result

} catch (error) {
  console.error('Network error:', error);
  // Show offline message
}
```

### 3. Cache Responses Appropriately

Birth chart calculations are deterministic and can be cached:

```javascript
const cacheKey = `birth-chart-${date}-${time}-${location}`;
let chart = localStorage.getItem(cacheKey);

if (!chart) {
  const response = await fetch('/api/astrology/birth-chart', {...});
  chart = await response.json();
  localStorage.setItem(cacheKey, JSON.stringify(chart));
}
```

### 4. Implement Retry Logic

For transient failures:

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      if (response.status === 429) {
        // Rate limited - wait and retry
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }

      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### 5. Use Appropriate Timeouts

Predictions can take time:

```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
  const response = await fetch('/api/bhrigu-predictions/karmic_journey', {
    method: 'POST',
    body: JSON.stringify(data),
    signal: controller.signal
  });

  clearTimeout(timeout);
  // Process response

} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timeout');
  }
}
```

---

## Support

For API support:
- Email: api@bhriguwelt.com
- GitHub: https://github.com/hisr2024/BhriguWelt/issues
- Documentation: https://docs.bhriguwelt.com

---

## Changelog

### Version 2.0.0 (2026-01-11)
- Added comprehensive health monitoring endpoints
- Implemented 108+ Vedic yogas calculation
- Enhanced validation and security
- Added offline prediction mode
- Improved error handling
- Added Kubernetes probes

### Version 1.0.0 (2025-12-01)
- Initial API release
- 8 prediction categories
- Birth chart calculations
- Matchmaking system
