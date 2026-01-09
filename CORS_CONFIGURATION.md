# CORS Configuration Documentation

## Overview

This document describes the CORS (Cross-Origin Resource Sharing) configuration for the BhriguWelt backend API.

## Status: ✅ FULLY CONFIGURED

**Contrary to previous reports, CORS was already configured.** This update optimizes and simplifies the existing configuration.

## Current Configuration

### 1. Allowed Origins

**Production (FLASK_ENV=production):**
- `https://bhrigu-welt.vercel.app` (primary)
- `https://bhriguwelt.vercel.app` (alternative)
- Additional origin from `FRONTEND_URL` env var (optional)

**Development:**
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- Plus all production URLs (for testing)

### 2. Allowed Headers

All custom headers used by the frontend are allowed:

```
Content-Type
Authorization
Accept
Origin
X-Requested-With
X-AI-Consent           # AI feature consent tracking
X-AI-Mode              # AI enhancement mode
X-Client-Online        # Client online/offline status
X-Uncompressed-Content-Length  # For gzip compression
Content-Encoding       # For gzip support
```

### 3. Allowed Methods

- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update resources
- `DELETE` - Delete resources
- `OPTIONS` - Preflight requests (automatic)
- `PATCH` - Partial updates

### 4. Credentials Support

- ✅ `Access-Control-Allow-Credentials: true`
- Cookies, authorization headers, and TLS client certificates are supported

### 5. Preflight Caching

- `max_age: 86400` (24 hours)
- Reduces preflight overhead for repeated requests

## Architecture

### Three-Layer CORS Implementation

#### Layer 1: Flask-CORS Library (Primary)
- **Location:** `backend/app.py` lines 140-162
- **Purpose:** Automatic CORS handling for all routes
- **Features:**
  - Automatic OPTIONS preflight handling
  - Resource-specific configuration (`/api/.*` vs `/.*`)
  - Origin validation
  - Header management

#### Layer 2: After-Request Middleware (Fallback)
- **Location:** `backend/app.py` lines 251-296
- **Purpose:** Ensures CORS headers are present, supplements Flask-CORS
- **Features:**
  - Case-insensitive header merging (HTTP spec compliance)
  - Fallback headers if Flask-CORS didn't apply them
  - Correlation ID injection for request tracking
  - `Vary: Origin` header for CDN/proxy caching

#### Layer 3: Error Handlers (Completeness)
- **Location:** `backend/app.py` lines 442-490
- **Purpose:** CORS headers on error responses (404, 500, etc.)
- **Features:**
  - Ensures CORS works even for error responses
  - Prevents opaque CORS errors in browser

### Case-Insensitive Header Handling

**Why it matters:**
- HTTP headers are case-insensitive per RFC 7230
- Different browsers/clients may send different cases
- Frontend sends `X-Client-Online`, but some proxies might transform to `x-client-online`

**Implementation:**
- Helper function `_merge_cors_headers_case_insensitive()` (lines 184-206)
- Normalizes header names to lowercase for comparison
- Preserves original casing for client compatibility
- Merges dynamically requested headers with standard headers

## Changes Made (2026-01-09)

### Optimizations

1. **Eliminated Redundant Preflight Handler**
   - **Removed:** Manual `@app.before_request` OPTIONS handler
   - **Reason:** Flask-CORS handles preflight automatically
   - **Impact:** Reduced code complexity, eliminated potential conflicts

2. **Created Reusable Header Merging Function**
   - **Added:** `_merge_cors_headers_case_insensitive()` helper
   - **Reason:** DRY principle, consistent behavior
   - **Impact:** Easier maintenance, single source of truth

3. **Simplified After-Request Handler**
   - **Changed:** Only adds headers if Flask-CORS didn't
   - **Reason:** Avoid duplicate header values
   - **Impact:** Faster response time, cleaner headers

4. **Improved Documentation**
   - **Added:** Comprehensive inline comments
   - **Added:** Architecture explanation
   - **Impact:** Easier onboarding, better maintainability

5. **Added Standard Headers Constant**
   - **Added:** `STANDARD_CORS_HEADERS` list (lines 118-130)
   - **Reason:** Single source of truth for allowed headers
   - **Impact:** Consistent configuration across all CORS layers

### Before vs After

**Before:**
- Triple-layer handling with overlap
- Manual preflight duplicated Flask-CORS work
- Header lists repeated 3+ times
- 100+ lines of CORS code

**After:**
- Cooperative three-layer architecture
- Flask-CORS handles preflight automatically
- Single `STANDARD_CORS_HEADERS` list
- ~80 lines with better clarity

## Testing

### Manual Testing Checklist

**Preflight Request (OPTIONS):**
```bash
curl -X OPTIONS 'https://bhriguwelt.onrender.com/api/chart/calculate' \
  -H 'Origin: https://bhrigu-welt.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type, X-Client-Online' \
  -v
```

**Expected Response:**
```
< Access-Control-Allow-Origin: https://bhrigu-welt.vercel.app
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
< Access-Control-Allow-Headers: Content-Type, ..., X-Client-Online
< Access-Control-Allow-Credentials: true
< Access-Control-Max-Age: 86400
< Vary: Origin
```

**Actual Request (POST):**
```bash
curl -X POST 'https://bhriguwelt.onrender.com/api/chart/calculate' \
  -H 'Origin: https://bhrigu-welt.vercel.app' \
  -H 'Content-Type: application/json' \
  -H 'X-Client-Online: true' \
  -d '{"date_of_birth": "1990-01-01", "time_of_birth": "12:00"}' \
  -v
```

**Expected Response:**
```
< Access-Control-Allow-Origin: https://bhrigu-welt.vercel.app
< Access-Control-Allow-Credentials: true
< Vary: Origin
< Content-Type: application/json
```

### Browser Testing

1. Open https://bhrigu-welt.vercel.app
2. Open DevTools → Network tab
3. Filter: XHR
4. Trigger API request (e.g., birth chart calculation)
5. Check request/response headers:
   - Preflight (OPTIONS) should succeed with status 204/200
   - Actual request should succeed with status 200
   - No CORS errors in console

### Common Issues

**Issue 1: "CORS policy: No 'Access-Control-Allow-Origin' header"**
- **Cause:** Origin not in `allowed_origins` list
- **Fix:** Add origin to `PRODUCTION_FRONTEND_URLS` or `FRONTEND_URL` env var

**Issue 2: "CORS policy: Request header field X-Client-Online is not allowed"**
- **Cause:** Header not in `STANDARD_CORS_HEADERS`
- **Fix:** This should NOT happen with current config (header is included)
- **Debug:** Check if backend is running latest code

**Issue 3: "CORS policy: The value of the 'Access-Control-Allow-Credentials' header is empty"**
- **Cause:** Missing `supports_credentials=True` in CORS config
- **Fix:** This should NOT happen with current config (credentials enabled)

**Issue 4: Preflight cache not working (OPTIONS on every request)**
- **Cause:** `max_age` not set or too low
- **Fix:** Current config sets `max_age: 86400` (24 hours)
- **Note:** Browser may ignore cache during DevTools inspection

## Deployment Verification

After deploying to Render, verify CORS is working:

```bash
# Check backend is running
curl https://bhriguwelt.onrender.com/health

# Test CORS preflight
curl -X OPTIONS 'https://bhriguwelt.onrender.com/api/chart/calculate' \
  -H 'Origin: https://bhrigu-welt.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type, X-Client-Online' \
  -I
```

**Expected:** Status 200/204 with CORS headers

## Environment Variables

**Required in Production:**
- `FLASK_ENV=production` - Enables production mode
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key
- `OPENAI_API_KEY` - OpenAI API access

**Optional:**
- `FRONTEND_URL` - Additional allowed origin (automatically includes Vercel URLs)

## Security Notes

1. **Origin Whitelist:** Only specified origins are allowed (no wildcards)
2. **Credentials:** Credentials are enabled, which requires exact origin match
3. **HTTPS Enforcement:** Production requires HTTPS via security middleware
4. **Header Validation:** Only whitelisted headers are allowed
5. **Method Restriction:** Only necessary HTTP methods are enabled

## Future Improvements

1. **Dynamic Origin Configuration:**
   - Store allowed origins in database
   - Admin panel to manage origins
   - Support for regex patterns (carefully)

2. **CORS Metrics:**
   - Track preflight request count
   - Monitor rejected CORS requests
   - Alert on unusual CORS patterns

3. **Rate Limiting:**
   - Separate rate limits for preflight vs actual requests
   - Prevent CORS-based DoS attacks

4. **CDN Integration:**
   - Configure CDN to cache preflight responses
   - Reduce load on origin server

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Flask-CORS Documentation](https://flask-cors.readthedocs.io/)
- [RFC 7230: HTTP/1.1 (Header case-insensitivity)](https://tools.ietf.org/html/rfc7230#section-3.2)
- [CORS Specification](https://fetch.spec.whatwg.org/#http-cors-protocol)

## Support

For CORS-related issues:
1. Check browser console for specific error message
2. Verify origin is in `allowed_origins` list
3. Check backend logs for rejected requests
4. Test with curl to isolate browser vs server issues
5. Review this documentation for common issues

---

**Last Updated:** 2026-01-09
**Configuration Status:** ✅ Optimized and Tested
**Deployment Status:** Ready for Production
