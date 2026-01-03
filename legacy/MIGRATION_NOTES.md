# Cloud Components Migration Notes

**Date:** 2026-01-03
**Migration:** Cloud Architecture → Offline-First Mobile App

## What Was Moved

This directory contains the original cloud-based architecture components that are **no longer required for core functionality**. The BhriguWelt project has pivoted to a **100% offline-first Flutter mobile application**.

### Moved Components

#### 1. Backend (`/legacy/backend/`)
- **Technology:** Python 3.11 + Flask HTTP API
- **Original Deployment:** Render.com
- **Purpose:** REST API for astrology calculations, user profiles, chat functionality
- **Database:** SQLite (`profiles.db`) with optional Redis caching
- **Status:** ⚠️ **LEGACY** - Not required for mobile app operation

**Key Endpoints:**
- `POST /horoscope` - Generate horoscope
- `POST /past-life` - Past life readings
- `POST /future` - Future predictions
- `POST /matchmaking` - Compatibility analysis
- `POST /chat` - Chatbot interaction
- `POST /profiles` - User profile management

#### 2. Frontend (`/legacy/frontend/`)
- **Technology:** Next.js 16 + React 19 + TypeScript
- **Original Deployment:** Vercel
- **Purpose:** Web-based UI consuming the backend API
- **Status:** ⚠️ **LEGACY** - Not required for mobile app operation

**Features:**
- Horoscope generation forms
- Birth chart visualization
- Chat interface
- Analytics dashboard
- Multi-language support (English/Hindi)

#### 3. Deployment Configurations
- `render.yaml` - Render backend deployment
- `railway.toml` - Railway alternative deployment
- `docker-compose.yml` - Local development stack
- `start.sh` - Backend startup script

## Why These Components Are No Longer Needed

The new **Soul Journey Flutter app** (`/mobile/soul_journey/`) implements all core functionality **100% offline**:

✅ **Replaced Backend Features:**
- Astrological calculations → Native Dart engine (`interpretation_engine.dart`)
- User profiles → Encrypted local SQLite (SQLCipher)
- Wisdom cards → Bundled JSON + local database
- City database → Bundled offline JSON
- Report generation → Local computation and rendering
- Data persistence → Encrypted local storage

✅ **No Network Requirement:**
- All data stays on device
- No API calls for core features
- Works completely offline
- Privacy-first architecture

## Optional Migration Path

If you have **existing user data** in the cloud backend:

### One-Time Data Export (Manual)

1. **Export from Backend:**
   ```bash
   cd legacy/backend
   PYTHONPATH="$(pwd)/src" python -c "
   from bhriguwelt.profiles import list_profiles
   import json
   profiles = list_profiles()
   with open('exported_profiles.json', 'w') as f:
       json.dump(profiles, f, indent=2)
   "
   ```

2. **Import to Mobile App:**
   - The exported JSON can be imported via the mobile app's "Import Data" feature
   - Requires PIN re-authentication
   - Data will be encrypted locally with SQLCipher

### No Automatic Sync

⚠️ The mobile app does **NOT** automatically sync with the legacy cloud backend. This is intentional for:
- Privacy (no data leaves device)
- Security (no network attack surface)
- Reliability (works without internet)
- Simplicity (no sync conflicts)

## Can I Still Use the Cloud Components?

**Yes, but it's not recommended.** The cloud components are archived for reference only. If you want to run them:

### Running Legacy Backend Locally
```bash
cd legacy/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH="$(pwd)/src"
python -m bhriguwelt.api
```

### Running Legacy Frontend Locally
```bash
cd legacy/frontend
npm install
export NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
npm run dev
```

### Deploying Legacy Components
- Backend: Use `legacy/render.yaml` or `legacy/railway.toml`
- Frontend: Use `legacy/frontend/vercel.json`

**Note:** These deployments are independent of the mobile app and serve no purpose for mobile users.

## Future Cloud Sync (Optional)

If you want to add **optional cloud backup/sync** in the future:

1. Implement behind a feature flag: `cloudSyncEnabled = false` (default)
2. Add explicit user consent flow
3. Encrypt data end-to-end before upload
4. Document clearly that sync is optional
5. Keep offline-first as the primary mode

## Security Considerations

### Legacy Backend Security Issues
- Profiles stored in plaintext SQLite by default (unless `BHRIGUWELT_PROFILE_ENCRYPTION_KEY` set)
- No built-in HTTPS (relies on Render/Railway reverse proxy)
- JWT tokens stored in browser localStorage
- Optional Redis for session storage

### Mobile App Security (Superior)
- ✅ All data encrypted with SQLCipher (AES-256)
- ✅ Encryption keys in iOS Keychain / Android Keystore
- ✅ PIN required for access
- ✅ Optional biometric unlock
- ✅ Auto-lock on background
- ✅ No network exposure

## Preservation Rationale

These components are preserved in `/legacy/` for:
1. **Historical Reference** - Understanding the original architecture
2. **Data Recovery** - Exporting user data from cloud deployments
3. **Code Reuse** - Porting algorithms to other platforms
4. **Documentation** - API contracts and business logic
5. **Compliance** - Audit trail for architectural decisions

## Decommissioning Cloud Services

When you're ready to shut down cloud deployments:

### Render/Railway Backend
1. Export all data from `profiles.db`
2. Archive the SQLite database file
3. Delete the Render/Railway service
4. Revoke any API keys or secrets

### Vercel Frontend
1. Download build logs (if needed)
2. Archive any analytics data
3. Delete the Vercel project
4. Update DNS if using custom domain

### Data Retention
- Keep exported `profiles.db` for 90 days minimum
- Provide users notice to migrate to mobile app
- Delete cloud data after retention period

## Support

For questions about the migration:
- Read `/mobile/soul_journey/README.md` for mobile app documentation
- See `/mobile/soul_journey/IMPLEMENTATION_GUIDE.md` for architecture details
- Check the main `/README.md` for updated project overview

---

**The future is offline-first, privacy-focused, and user-owned. 🔐✨**

*ॐ शान्तिः शान्तिः शान्तिः*
*(Om Shanti Shanti Shanti - Peace, Peace, Peace)*
