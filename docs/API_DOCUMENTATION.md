# BhriguWelt API Documentation

## Overview

The BhriguWelt API provides comprehensive Vedic astrology predictions, birth chart calculations, and personalized insights based on the ancient Bhrigu Samhita tradition.

**Base URL:** `https://api.bhriguwelt.com` (Production)
**Version:** v1
**Authentication:** API Key (Required for authenticated endpoints; optional for public health/prediction endpoints)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Rate Limiting](#rate-limiting)
4. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Birth Chart](#birth-chart)
   - [Predictions](#predictions)
   - [Bhrigu Predictions](#bhrigu-predictions)
5. [Data Models](#data-models)
6. [Security](#security)

---

## Authentication

Authenticated endpoints require an API key in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

Public endpoints include `/health` and `/api/predictions/*` (unless your deployment config requires auth).

---

## Error Handling

All API responses follow a consistent format:

### Success Response

```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-01-16T12:00:00Z"
}
```

### Error Response

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "User-friendly error message",
  "details": { "field": "date_of_birth" },
  "retryable": false,
  "correlation_id": "uuid-v4",
  "timestamp": "2026-01-16T12:00:00Z"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Missing or invalid auth |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |
| 503  | Service Unavailable |

---

## Rate Limiting

Default rate limits (configured in the backend) are:

- **General API:** 200 requests/day and 50 requests/hour per IP
- **Prediction endpoints:** 10 requests/minute per IP
- **AI endpoints:** 10 requests/minute per user (when enabled)

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642329600
```

---

## Endpoints

### Health Check

Check API health and status.

**Endpoint:** `GET /health` (root health)
**Endpoint:** `GET /api/predictions/health` (predictions feature health)
**Authentication:** Not required

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2026-01-16T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai": "available"
  }
}
```

---

### Birth Chart

Calculate and retrieve a detailed Vedic birth chart.

**Endpoint:** `POST /api/astrology/birth-chart`
**Authentication:** Optional

#### Request Body

```json
{
  "date_of_birth": "1990-01-15",
  "time_of_birth": "14:30:00",
  "place_of_birth": "New Delhi, India",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "timezone": "Asia/Kolkata"
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date_of_birth | string | Yes | Date in YYYY-MM-DD format |
| time_of_birth | string | Yes | Time in HH:MM:SS format (24-hour) |
| place_of_birth | string | Conditional | Birth location name (required if no coords) |
| latitude | number | Conditional | Latitude (-90 to 90) |
| longitude | number | Conditional | Longitude (-180 to 180) |
| timezone | string | No | IANA timezone (auto-detected if not provided) |

**Note:** Either `place_of_birth` OR both `latitude` and `longitude` must be provided.

#### Response

```json
{
  "success": true,
  "data": {
    "birth_details": {
      "date": "1990-01-15",
      "time": "14:30:00",
      "place": "New Delhi, India",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "timezone": "Asia/Kolkata"
    },
    "planetary_positions": {
      "Sun": { "sign": "Capricorn", "degree": 0.5, "house": 10 },
      "Moon": { "sign": "Taurus", "degree": 15.2, "house": 2 },
      ...
    },
    "houses": [
      { "house": 1, "sign": "Aries", "lord": "Mars" },
      ...
    ],
    "dashas": {
      "maha_dasha": "Venus",
      "antar_dasha": "Sun",
      "start_date": "2025-06-10",
      "end_date": "2026-04-10"
    }
  },
  "timestamp": "2026-01-16T12:00:00Z"
}
```

---

### Predictions

Generate personalized astrology predictions.

**Endpoint:** `POST /api/predictions/<category>`
**Authentication:** Optional

#### Categories

- `karmic_journey`
- `past_lives`
- `future_lives`
- `present_life`
- `life_events`
- `karmic_remedies`
- `relationships`
- `predictions`
- `cosmic_blueprint_overview`
- `soul_purpose`
- `karmic_debts`
- `dharmic_path`
- `spiritual_evolution`
- `moksha_indicators`

#### Request Body

```json
{
  "date_of_birth": "1990-01-15",
  "time_of_birth": "14:30:00",
  "place_of_birth": "New Delhi, India",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "question": "What does my career hold in the next 6 months?",
  "force_regenerate": false
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date_of_birth | string | Yes | Date in YYYY-MM-DD format |
| time_of_birth | string | Yes | Time in HH:MM:SS format |
| place_of_birth | string | Conditional | Birth location |
| latitude | number | Conditional | Latitude |
| longitude | number | Conditional | Longitude |
| question | string | No | Specific question (max 500 chars) |
| force_regenerate | boolean | No | Bypass cache (default: false) |

#### Response

```json
{
  "success": true,
  "prediction": {
    "summary": "Brief overview of prediction...",
    "astrological_analysis": "Detailed astrological analysis...",
    "remedy": "Recommended remedies and actions...",
    "confidence_score": 0.95,
    "processing_time_seconds": 2.3
  },
  "metadata": {
    "category": "career",
    "from_cache": false,
    "generated_at": "2026-01-16T12:00:00Z"
  },
  "timestamp": "2026-01-16T12:00:00Z"
}
```

---

### Bhrigu Predictions

Advanced predictions based on the Bhrigu Samhita tradition.

**Endpoint:** `POST /api/bhrigu-predictions/<category>`
**Authentication:** Required

#### Categories

Examples include:
- `karmic-journey`
- `past-lives`
- `future-lives`
- `present-life`
- `life-events`
- `karmic-remedies`
- `relationships`
- `predictions`
- `comprehensive`

#### Request Body

Same as regular predictions endpoint.

#### Response

```json
{
  "success": true,
  "prediction": {
    "summary": "Comprehensive prediction summary...",
    "karmic_analysis": "Analysis of karmic patterns...",
    "planetary_influences": {
      "favorable": ["Venus", "Jupiter"],
      "challenging": ["Saturn", "Rahu"]
    },
    "timing_analysis": "Timing and dasha analysis...",
    "remedies": [
      {
        "type": "mantra",
        "description": "Chant Gayatri Mantra 108 times daily",
        "duration": "40 days"
      },
      {
        "type": "gemstone",
        "description": "Wear Yellow Sapphire in gold",
        "weight": "5-7 carats"
      }
    ],
    "confidence_score": 0.97,
    "processing_time_seconds": 3.8
  },
  "metadata": {
    "category": "karma",
    "bhrigu_reference": "BH-2024-001234",
    "from_cache": false,
    "generated_at": "2026-01-16T12:00:00Z"
  },
  "timestamp": "2026-01-16T12:00:00Z"
}
```

---

## Data Models

### BirthDetails

```typescript
interface BirthDetails {
  date_of_birth: string;      // YYYY-MM-DD
  time_of_birth: string;      // HH:MM:SS
  place_of_birth?: string;    // Location name
  latitude?: number;          // -90 to 90
  longitude?: number;         // -180 to 180
  timezone?: string;          // IANA timezone
}
```

### Prediction

```typescript
interface Prediction {
  summary: string;
  astrological_analysis: string;
  remedy: string;
  confidence_score: number;   // 0-1
  processing_time_seconds: number;
}
```

### BhriguPrediction

Extends Prediction with:

```typescript
interface BhriguPrediction extends Prediction {
  karmic_analysis?: string;
  planetary_influences?: {
    favorable: string[];
    challenging: string[];
  };
  timing_analysis?: string;
  remedies?: Remedy[];
}

interface Remedy {
  type: 'mantra' | 'gemstone' | 'charity' | 'ritual' | 'lifestyle';
  description: string;
  duration?: string;
  weight?: string;
  frequency?: string;
}
```

---

## Security

### Input Validation

All inputs are validated and sanitized:
- Date/time formats verified
- Coordinates range-checked
- Text inputs sanitized for XSS/injection
- Request size limited to 1MB

### Data Privacy

- Data in transit is protected with HTTPS/TLS
- Store user-sensitive data with database-level encryption (e.g., SQLCipher or managed DB encryption at rest)
- Personal data is not shared with third parties
- Users can request data deletion via `/api/users/delete`

### HTTPS Only

All API requests must use HTTPS. HTTP requests are redirected.

### CORS Policy

CORS is enabled for whitelisted domains only. Contact support to whitelist your domain.

### Content Security Policy (CSP)

The backend applies a CSP header by default to reduce XSS risks and restrict allowed origins.

---

## Support

- **Email:** api-support@bhriguwelt.com
- **Documentation:** https://docs.bhriguwelt.com
- **Status Page:** https://status.bhriguwelt.com

---

## Changelog

### v1.0.0 (2026-01-16)
- Initial API release
- Birth chart calculations
- Basic predictions
- Bhrigu Samhita predictions
- Rate limiting and authentication

---

© 2026 BhriguWelt. All rights reserved.
