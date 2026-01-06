# Testing and Validation Guide

## Overview

This document provides testing procedures for the secure offline-first PWA architecture implementation. It covers both automated tests and manual validation steps.

## Phase 4: Testing & Validation Checklist

### 1. Encryption/Decryption Flows ✅

#### Automated Tests
```bash
# Frontend encryption tests (to be implemented)
cd frontend
npm test -- crypto.test.ts
```

#### Manual Validation
1. **Setup Encryption**
   - [ ] Open app in browser
   - [ ] Enter 4-digit passcode (e.g., "1234")
   - [ ] Confirm passcode matches
   - [ ] Verify encryption setup completes successfully
   - [ ] Check browser DevTools > Application > IndexedDB > metadata for `encryptionSalt`

2. **Data Encryption**
   - [ ] Create a test profile with name "Test User"
   - [ ] Check IndexedDB > profiles store
   - [ ] Verify data is encrypted (looks like base64 gibberish, not plain JSON)
   - [ ] Lock the app
   - [ ] Unlock with correct passcode
   - [ ] Verify profile loads correctly

3. **Decryption Failure**
   - [ ] Lock the app
   - [ ] Try unlocking with wrong passcode
   - [ ] Verify error message appears
   - [ ] Verify failed attempts counter increases
   - [ ] After 3 failed attempts, verify warning appears

**Expected Results:**
- ✅ Data stored in encrypted format
- ✅ Correct passcode decrypts data successfully
- ✅ Wrong passcode shows error and doesn't decrypt
- ✅ Salt stored separately in metadata

### 2. Offline-First Functionality ✅

#### Manual Validation
1. **Install PWA**
   - [ ] Visit app URL in Chrome/Edge
   - [ ] Click install button (⊕ icon in address bar)
   - [ ] Verify app installs to home screen/app menu
   - [ ] Launch installed app
   - [ ] Verify opens in standalone mode (no browser UI)

2. **Service Worker Registration**
   - [ ] Open DevTools > Application > Service Workers
   - [ ] Verify service worker status: "activated and is running"
   - [ ] Check scope: "/" (root)
   - [ ] Verify version: v1.1

3. **Offline Mode**
   - [ ] With app running, open DevTools > Network
   - [ ] Enable "Offline" checkbox
   - [ ] Navigate to different pages
   - [ ] Create/view profiles
   - [ ] Verify all core features work offline
   - [ ] Check DevTools > Application > Cache Storage for cached resources

4. **Data Caching**
   - [ ] Clear browser cache
   - [ ] Visit app online
   - [ ] Wait for service worker to cache resources
   - [ ] Go offline
   - [ ] Verify cities data loads (check /data/cities.json)
   - [ ] Verify wisdom cards load (check /data/wisdom_cards.json)

**Expected Results:**
- ✅ PWA installs successfully
- ✅ Service worker activates and caches resources
- ✅ App works completely offline (no network requests)
- ✅ Critical data (cities, wisdom cards) cached automatically

### 3. Rate Limiting & Abuse Protection ✅

#### Automated Tests
```bash
# Backend rate limiting tests
cd backend
pytest tests/test_rate_limiting.py -v
```

#### Manual Validation
1. **General Rate Limit (100 req/min)**
   ```bash
   # Test with curl
   for i in {1..105}; do
     curl -X GET http://localhost:8000/api/astrology/health
     echo "Request $i"
   done
   ```
   - [ ] First 100 requests succeed (200 OK)
   - [ ] Requests 101-105 fail (429 Too Many Requests)
   - [ ] Wait 60 seconds
   - [ ] Verify requests succeed again

2. **AI Endpoint Rate Limit (10 req/min)**
   ```bash
   # Test AI endpoint
   for i in {1..12}; do
     curl -X POST http://localhost:8000/api/predictions/daily \
       -H "Content-Type: application/json" \
       -d '{"zodiac_sign": "Aries", "nakshatra": "Ashwini"}'
     echo "AI Request $i"
   done
   ```
   - [ ] First 10 requests succeed
   - [ ] Requests 11-12 fail with 429
   - [ ] Response includes `retry_after` header

3. **Security Headers**
   ```bash
   curl -I http://localhost:8000/api/health
   ```
   - [ ] Verify `Content-Security-Policy` header present
   - [ ] Verify `X-Frame-Options: DENY` header
   - [ ] Verify `X-Content-Type-Options: nosniff` header
   - [ ] Verify `Strict-Transport-Security` header (if HTTPS)

**Expected Results:**
- ✅ Rate limits enforce correctly
- ✅ 429 errors returned after limit exceeded
- ✅ Security headers present on all responses
- ✅ Limits reset after time window

### 4. OpenAI Integration Security ✅

#### Manual Validation
1. **PII Sanitization**
   - [ ] Create profile with name "John Doe", location "New York"
   - [ ] Enable AI mode in settings
   - [ ] Generate AI-powered prediction
   - [ ] Check backend logs
   - [ ] Verify name and exact location NOT in API request
   - [ ] Verify only zodiac sign, nakshatra sent to AI

2. **API Key Security**
   - [ ] Check frontend bundle (DevTools > Sources)
   - [ ] Search for "OPENAI_API_KEY"
   - [ ] Verify NOT found in any frontend file
   - [ ] Check backend code
   - [ ] Verify key loaded from environment variable only

3. **Fallback Behavior**
   - [ ] Disconnect internet or stop backend
   - [ ] Try generating AI prediction
   - [ ] Verify graceful error message (not stack trace)
   - [ ] Verify app suggests using offline mode
   - [ ] Switch to offline mode
   - [ ] Verify traditional predictions work

**Expected Results:**
- ✅ No PII transmitted to AI API
- ✅ API key never exposed to frontend
- ✅ Graceful degradation when AI unavailable
- ✅ Offline mode works independently

### 5. PWA Installation & Caching ✅

#### Manual Validation
1. **Desktop Chrome/Edge**
   - [ ] Visit app URL
   - [ ] Wait for install prompt or click ⊕ in address bar
   - [ ] Click "Install"
   - [ ] Verify app opens in window without browser chrome
   - [ ] Check Start Menu/Applications for app icon

2. **Mobile Safari (iOS)**
   - [ ] Open app in Safari
   - [ ] Tap Share button
   - [ ] Tap "Add to Home Screen"
   - [ ] Enter app name
   - [ ] Tap "Add"
   - [ ] Verify icon appears on home screen
   - [ ] Launch from home screen
   - [ ] Verify opens in full screen mode

3. **Mobile Chrome (Android)**
   - [ ] Open app in Chrome
   - [ ] Tap menu (⋮)
   - [ ] Tap "Add to Home screen"
   - [ ] Confirm
   - [ ] Verify icon on home screen
   - [ ] Launch app
   - [ ] Verify standalone mode

4. **Cache Validation**
   ```javascript
   // In DevTools Console
   caches.keys().then(keys => console.log('Caches:', keys));
   caches.open('bhriguwelt-v1.1').then(cache => 
     cache.keys().then(keys => console.log('Cached:', keys.length))
   );
   ```
   - [ ] Verify cache names: `bhriguwelt-v1.1`, `runtime`, `data`
   - [ ] Verify app shell cached (/, /offline, /manifest.json)
   - [ ] Verify data files cached (cities.json, wisdom_cards.json)

**Expected Results:**
- ✅ PWA installs on all major platforms
- ✅ Standalone mode works (no browser UI)
- ✅ App shell and critical assets cached
- ✅ Manifest parsed correctly

### 6. Auto-Lock & Session Management ✅

#### Manual Validation
1. **Auto-Lock Timeout**
   - [ ] Unlock app
   - [ ] Set auto-lock timeout to 1 minute (Settings)
   - [ ] Leave app idle for 1 minute
   - [ ] Verify app locks automatically
   - [ ] Verify requires passcode to unlock

2. **Lock on Background**
   - [ ] Unlock app
   - [ ] Enable "Lock on Background" (Settings)
   - [ ] Switch to another tab/window
   - [ ] Switch back to app
   - [ ] Verify app is locked
   - [ ] Disable "Lock on Background"
   - [ ] Switch tabs again
   - [ ] Verify app stays unlocked

3. **Session Persistence**
   - [ ] Unlock app
   - [ ] Disable auto-lock
   - [ ] Reload page (F5)
   - [ ] Verify app is locked (session not persisted)
   - [ ] Unlock again
   - [ ] Verify data loads correctly

4. **Failed Attempts**
   - [ ] Lock app
   - [ ] Enter wrong passcode 3 times
   - [ ] Verify warning appears
   - [ ] Continue entering wrong passcode
   - [ ] Verify no account lockout (just warnings)
   - [ ] Enter correct passcode
   - [ ] Verify unlocks successfully

**Expected Results:**
- ✅ Auto-lock works after configured timeout
- ✅ Lock on background works when enabled
- ✅ Sessions don't persist across page reloads
- ✅ Failed attempts tracked with warnings

### 7. Wisdom Cards & Cities Databases ✅

#### Manual Validation
1. **Cities Database**
   - [ ] Create new profile
   - [ ] Click birth location field
   - [ ] Type "New" (partial search)
   - [ ] Verify suggestions appear (New York, New Delhi, etc.)
   - [ ] Select "New York"
   - [ ] Verify coordinates auto-filled
   - [ ] Verify timezone set correctly

2. **Offline Cities Search**
   - [ ] Go offline (DevTools > Network > Offline)
   - [ ] Search for "London"
   - [ ] Verify search works without network
   - [ ] Verify 50+ cities available
   - [ ] Check console for errors (should be none)

3. **Wisdom Cards Seeding**
   - [ ] First app launch after setup
   - [ ] Check DevTools Console
   - [ ] Verify message: "Seeded X wisdom cards"
   - [ ] Check IndexedDB > wisdomCards store
   - [ ] Verify 15+ cards stored
   - [ ] Verify cards are encrypted

4. **Wisdom Card Matching**
   - [ ] Create profile with Aries zodiac
   - [ ] Generate report
   - [ ] View wisdom section
   - [ ] Verify Fire element card appears
   - [ ] Create profile with Cancer zodiac
   - [ ] Verify Water element card appears

**Expected Results:**
- ✅ Cities search works offline
- ✅ Fuzzy search returns relevant results
- ✅ Wisdom cards seed automatically
- ✅ Cards match based on chart features

## Security Testing

### Encryption Security
```bash
# Test encryption strength
openssl rand -base64 32  # Generate test data
# Encrypt in app, export encrypted data
# Verify cannot be decrypted without passcode
```

### Network Security
```bash
# Test HTTPS enforcement
curl http://your-backend.com/api/health
# Should redirect to https:// in production

# Test CORS
curl -H "Origin: https://malicious-site.com" \
  http://your-backend.com/api/health
# Should be blocked
```

### Penetration Testing
- [ ] SQL injection attempts (not applicable - no SQL queries)
- [ ] XSS attempts (React auto-escaping + CSP)
- [ ] CSRF (no state-changing GET requests)
- [ ] Rate limit bypass attempts
- [ ] Passcode brute force (PBKDF2 makes this slow)

## Performance Testing

### Load Testing
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 http://localhost:8000/api/health

# Expected: < 100ms avg response time
```

### Frontend Performance
```javascript
// In DevTools Console
performance.measure('app-load');
console.log('Load time:', performance.getEntriesByType('navigation')[0].duration);

// Expected: < 2000ms initial load
```

### Encryption Performance
```javascript
// Test encryption speed
const start = performance.now();
await encryptForStorage(largeData, key);
const end = performance.now();
console.log('Encryption time:', end - start);

// Expected: < 100ms for typical profile
```

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome 90+ (Windows, macOS, Linux)
- [ ] Firefox 88+ (Windows, macOS, Linux)
- [ ] Safari 14+ (macOS)
- [ ] Edge 90+ (Windows)

### Mobile Browsers
- [ ] Safari 14.5+ (iOS)
- [ ] Chrome 90+ (Android)
- [ ] Samsung Internet 14+ (Android)

### Feature Detection
```javascript
// Check required features
const hasServiceWorker = 'serviceWorker' in navigator;
const hasWebCrypto = 'crypto' in window && 'subtle' in crypto;
const hasIndexedDB = 'indexedDB' in window;

console.log({ hasServiceWorker, hasWebCrypto, hasIndexedDB });
// All should be true
```

## Deployment Validation

### Frontend (Vercel)
- [ ] Deploy to staging
- [ ] Verify HTTPS enabled
- [ ] Test PWA installation
- [ ] Check service worker loads
- [ ] Verify environment variables set
- [ ] Test offline functionality
- [ ] Deploy to production

### Backend (Render)
- [ ] Deploy to staging
- [ ] Verify HTTPS enabled
- [ ] Test rate limiting
- [ ] Check security headers
- [ ] Verify environment variables set
- [ ] Test OpenAI connection (if configured)
- [ ] Monitor logs for errors
- [ ] Deploy to production

## Continuous Monitoring

### Metrics to Track
1. **PWA Installation Rate**: % of users who install
2. **Offline Usage**: % of requests served from cache
3. **Encryption Errors**: Failed encrypt/decrypt operations
4. **Rate Limit Hits**: How often users hit limits
5. **Service Worker Errors**: Installation/activation failures

### Alerting
- Set up alerts for:
  - Service worker installation failures > 5%
  - Encryption errors > 1%
  - API rate limit violations > 10/hour
  - Backend response time > 1s

## Test Evidence

Document test results:
```
Date: 2026-01-03
Tester: [Your Name]
Environment: Chrome 120, macOS 14

✅ Encryption/Decryption: PASS
✅ Offline Functionality: PASS
✅ Rate Limiting: PASS
✅ OpenAI Security: PASS
✅ PWA Installation: PASS
✅ Auto-Lock: PASS
✅ Wisdom Cards: PASS

Issues Found: None
```

## Troubleshooting Tests

If tests fail, refer to `TROUBLESHOOTING.md` for solutions.

---

**Version**: 1.0  
**Last Updated**: 2026-01-03  
**Status**: Ready for Testing
