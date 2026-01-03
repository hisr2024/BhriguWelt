# Legacy Component Migration Notes

**Date:** 2026-01-03  
**Migration:** Cloud-Based Architecture → Offline-First PWA/Mobile Architecture

---

## Executive Summary

This document explains the archival of legacy cloud-based components and the transition to a modern, offline-first architecture that prioritizes privacy, security, and user data ownership.

## What Changed

### 1. Legacy Components Archived

All legacy cloud-based components have been moved to the `/archive` directory:

- **`/archive/legacy_backend/`** - Original Python/Flask REST API backend
- **`/archive/legacy_frontend/`** - Original Next.js web frontend  
- **`/archive/render.yaml`** - Render.com deployment configuration
- **`/archive/railway.toml`** - Railway.app deployment configuration
- **`/archive/docker-compose.yml`** - Local development Docker setup
- **`/archive/start.sh`** - Backend startup script
- **`/archive/MIGRATION_NOTES.md`** - Detailed legacy component documentation

### 2. Stale Configurations Removed

The following configurations were removed as they referenced archived components:

- **Root `vercel.json`** - Was pointing to `legacy/frontend` build path
- **Legacy workspace in `package.json`** - Removed `legacy/frontend` from npm workspaces
- **Legacy npm scripts** - Removed `dev:legacy` and `build:legacy` scripts

### 3. Current Architecture

The project now has a clean, modern architecture:

```
BhriguWelt/
├── frontend/              ← Current Next.js 14 PWA (offline-first)
├── backend/               ← Current Flask backend (secure, rate-limited)
├── mobile/soul_journey/   ← Primary Flutter mobile app (100% offline)
├── archive/               ← Archived legacy components
│   ├── legacy_backend/    ← OLD: Python 3.11 REST API
│   ├── legacy_frontend/   ← OLD: Next.js 16 web app
│   └── *.yaml, *.toml     ← OLD: Deployment configs
└── docs/                  ← Project documentation
```

---

## Why This Migration?

### Legacy Architecture Issues

The archived components had several problems:

#### **Legacy Frontend (`/archive/legacy_frontend/`)**
- ⚠️ **Always-online dependencies** - Required constant backend connectivity
- ⚠️ **Plaintext data risks** - Local storage not encrypted by default
- ⚠️ **Outdated deployment** - Vercel config pointing to legacy paths
- ⚠️ **No PWA support** - Limited offline functionality

#### **Legacy Backend (`/archive/legacy_backend/`)**
- ⚠️ **Plaintext SQLite storage** - User profiles stored unencrypted
- ⚠️ **No built-in HTTPS** - Relied on reverse proxy (Render/Railway)
- ⚠️ **Local JWT storage** - Tokens in browser localStorage (XSS risk)
- ⚠️ **No rate limiting** - Vulnerable to abuse and DoS attacks

### Current Architecture Benefits

The modern architecture addresses all legacy issues:

#### **Current Frontend (`/frontend/`)**
- ✅ **Offline-first PWA** - Full functionality without internet
- ✅ **Service Worker caching** - Assets and API responses cached
- ✅ **Encrypted IndexedDB** - Local data encrypted with WebCrypto API
- ✅ **Session management** - Auto-lock and timeout protection
- ✅ **Security headers** - CSP, HSTS, and secure cookies

#### **Current Backend (`/backend/`)**
- ✅ **Rate limiting** - 100 req/min general, 10 req/min for AI endpoints
- ✅ **Security middleware** - CSP, HSTS, X-Content-Type-Options headers
- ✅ **Request sanitization** - PII removal and input validation
- ✅ **CORS strict origins** - Prevents unauthorized API access
- ✅ **Optional AI integration** - Sarvam AI proxy with cost optimization

#### **Mobile App (`/mobile/soul_journey/`)**
- ✅ **100% offline operation** - No internet required for core features
- ✅ **SQLCipher encryption** - AES-256 encryption for all user data
- ✅ **Secure key storage** - iOS Keychain / Android Keystore
- ✅ **PIN + Biometric auth** - 4-digit PIN with optional Face ID/Touch ID
- ✅ **Auto-lock** - Configurable timeout and background lock
- ✅ **No telemetry** - Zero analytics or tracking

---

## Technical Details

### What Was in Legacy Components

#### Legacy Backend Features
- REST API for astrology calculations
- User profile management (SQLite database)
- Chat functionality
- Matchmaking/compatibility analysis
- Redis caching (optional)

**Key Endpoints:**
- `POST /horoscope` - Generate horoscope
- `POST /past-life` - Past life readings
- `POST /future` - Future predictions
- `POST /matchmaking` - Compatibility analysis
- `POST /chat` - Chatbot interaction
- `POST /profiles` - User profile CRUD

#### Legacy Frontend Features
- Birth chart visualization
- Horoscope generation forms
- Chat interface
- Analytics dashboard
- Multi-language support (English/Hindi)

### Current Feature Replacement

| Legacy Feature | Current Implementation |
|----------------|------------------------|
| Cloud calculations | Native Dart engine in Flutter app |
| Cloud user profiles | Encrypted local SQLite (SQLCipher) |
| Cloud wisdom cards | Bundled JSON + local database |
| Cloud city database | Offline JSON with 50+ cities |
| Cloud report generation | Local computation and PDF export |
| Cloud persistence | Encrypted device-local storage |

---

## Migration Path for Existing Users

If you have **existing user data** in legacy cloud deployments:

### One-Time Data Export

1. **Export from Legacy Backend:**
   ```bash
   cd archive/legacy_backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   export PYTHONPATH="$(pwd)/src"
   python -c "
   from bhriguwelt.profiles import list_profiles
   import json
   profiles = list_profiles()
   with open('exported_profiles.json', 'w') as f:
       json.dump(profiles, f, indent=2)
   "
   ```

2. **Import to Mobile App:**
   - Use the mobile app's "Import Data" feature
   - Requires PIN re-authentication
   - Data will be encrypted locally with SQLCipher

### No Automatic Sync

⚠️ The mobile and PWA apps do **NOT** automatically sync with legacy cloud backends. This is intentional for:
- **Privacy** - No data leaves device without explicit user action
- **Security** - No network attack surface
- **Reliability** - Works without internet
- **Simplicity** - No sync conflicts or merge issues

---

## Running Legacy Components (Not Recommended)

The legacy components are archived for reference only. If you need to run them:

### Running Legacy Backend

```bash
cd archive/legacy_backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH="$(pwd)/src"
python -m bhriguwelt.api
# Server runs on http://localhost:8000
```

### Running Legacy Frontend

```bash
cd archive/legacy_frontend
npm install
export NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
npm run dev
# Frontend runs on http://localhost:3000
```

### Deploying Legacy Components

- **Backend:** Use `archive/render.yaml` or `archive/railway.toml`
- **Frontend:** Use `archive/legacy_frontend/vercel.json`

⚠️ **Warning:** Legacy deployments are independent of current apps and provide no value to modern users. They have known security issues and are not maintained.

---

## Security Comparison

### Legacy Architecture Security Issues

| Issue | Impact | Severity |
|-------|--------|----------|
| Plaintext SQLite | Data readable if device compromised | 🔴 HIGH |
| No built-in HTTPS | Man-in-the-middle attacks possible | 🔴 HIGH |
| localStorage JWT | XSS attack surface | 🟡 MEDIUM |
| No rate limiting | DoS and abuse vulnerability | 🟡 MEDIUM |
| Optional encryption | Users may not enable it | 🟡 MEDIUM |

### Current Architecture Security

| Feature | Benefit | Status |
|---------|---------|--------|
| SQLCipher encryption | AES-256 database encryption | ✅ IMPLEMENTED |
| iOS Keychain/Android Keystore | Secure key storage | ✅ IMPLEMENTED |
| PIN + Biometric | Multi-factor authentication | ✅ IMPLEMENTED |
| Auto-lock | Prevents unauthorized access | ✅ IMPLEMENTED |
| No network calls | Zero attack surface for core features | ✅ IMPLEMENTED |
| Service Worker | Offline caching and security | ✅ IMPLEMENTED |
| CSP/HSTS headers | Web security hardening | ✅ IMPLEMENTED |
| Rate limiting | DoS protection | ✅ IMPLEMENTED |

---

## Documentation

For more information about the current architecture:

- **Mobile App:** See `/mobile/soul_journey/README.md`
- **Security:** See `SECURITY_ARCHITECTURE.md`
- **PWA Implementation:** See `PWA_IMPLEMENTATION_COMPLETE.md`
- **AI Integration:** See `SARVAM_AI_INTEGRATION.md`
- **Testing:** See `TESTING_VALIDATION.md`
- **Legacy Details:** See `/archive/MIGRATION_NOTES.md`

---

## Decommissioning Legacy Cloud Services

When ready to shut down legacy cloud deployments:

### Checklist

- [ ] Export all user data from `profiles.db`
- [ ] Archive SQLite database files
- [ ] Notify users to migrate to mobile/PWA apps
- [ ] Wait for migration period (recommended: 90 days)
- [ ] Delete Render/Railway backend services
- [ ] Delete Vercel frontend projects
- [ ] Revoke API keys and secrets
- [ ] Update DNS if using custom domains
- [ ] Delete cloud data after retention period

### Data Retention

- Keep exported `profiles.db` for at least 90 days
- Provide users advance notice to migrate
- Document the decommissioning timeline
- Offer data export options

---

## Future Considerations

### Optional Cloud Sync (Future Enhancement)

If cloud backup/sync is desired in the future:

1. **Implement behind feature flag:** Default to disabled
2. **Explicit user consent:** Clear opt-in flow
3. **End-to-end encryption:** Encrypt before upload
4. **Privacy-preserving:** No PII in cloud
5. **Offline-first remains primary:** Cloud sync is optional enhancement

### Principles

- **Privacy First:** No data collection without explicit consent
- **Offline First:** Core features always work without internet
- **Security First:** Encryption and authentication by default
- **User Ownership:** Users control their data

---

## Compliance & Audit Trail

This migration was performed to:

1. **Improve Security:** Address known vulnerabilities in legacy architecture
2. **Enhance Privacy:** Eliminate unnecessary cloud dependencies
3. **Modernize Stack:** Update to current best practices
4. **Reduce Costs:** Eliminate cloud hosting for offline-capable features
5. **Improve Reliability:** Remove single points of failure

All changes are tracked in git history for audit purposes.

---

## Support & Questions

For questions about this migration:

- **Issue Tracker:** [GitHub Issues](https://github.com/hisr2024/BhriguWelt/issues)
- **Documentation:** See repository `/docs` directory
- **Security Concerns:** See `SECURITY.md`

---

**The future is offline-first, privacy-focused, and user-owned. 🔐✨**

*ॐ शान्तिः शान्तिः शान्तिः*  
*(Om Shanti Shanti Shanti - Peace, Peace, Peace)*
