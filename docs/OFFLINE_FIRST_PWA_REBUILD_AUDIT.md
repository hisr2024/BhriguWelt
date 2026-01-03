# BhriguWelt: Offline-First PWA Rebuild - Audit & Architecture Proposal

**Date**: 2026-01-03
**Author**: Principal Architect
**Branch**: `claude/offline-first-pwa-rebuild-eT3mn`
**Status**: ARCHITECTURE PHASE - AWAITING APPROVAL

---

## EXECUTIVE SUMMARY

BhriguWelt is a Vedic astrology application that generates comprehensive "journey reports" from user birth data and wisdom cards. The current deployment has:

- **Frontend**: Next.js 14 PWA on Vercel
- **Backend**: Flask API on Render
- **Mobile**: Flutter app (fully offline)

**Good News**: The groundwork for offline-first PWA has ALREADY BEEN LAID:
- ✅ IndexedDB with AES-256-GCM encryption (frontend/lib/storage.ts, crypto.ts)
- ✅ Service worker with caching (frontend/public/sw.js)
- ✅ PWA manifest (frontend/public/manifest.json)
- ✅ Passcode authentication UI (PasscodeSetup, PasscodeUnlock components)
- ✅ Domain models defined (Profile, Report, WisdomCard in lib/types.ts)

**Challenge**: The frontend still depends heavily on backend APIs for:
- Birth chart calculations (Swiss Ephemeris)
- AI-enhanced predictions (Sarvam AI, OpenAI, Anthropic)
- All report generation logic

**Mission**: Rebuild the PWA to be truly **offline-first**, with backend as an **optional enhancement** for AI features only.

---

## PART 1: CURRENT ARCHITECTURE AUDIT

### 1.1 FRONTEND TECHNOLOGY STACK

#### Core Framework
```json
{
  "framework": "Next.js 14.1.0",
  "react": "18.2.0",
  "language": "TypeScript 5.3.3",
  "styling": "Tailwind CSS 3.4.1"
}
```

#### Key Dependencies
| Package | Version | Purpose | Offline Compatible? |
|---------|---------|---------|---------------------|
| `axios` | 1.6.5 | HTTP client for backend API | ❌ Network required |
| `framer-motion` | 11.0.3 | Animations | ✅ Yes |
| `lucide-react` | 0.312.0 | Icons | ✅ Yes |
| `date-fns` | 3.2.0 | Date utilities | ✅ Yes |
| `react-hook-form` | 7.49.3 | Form management | ✅ Yes |
| `zustand` | 4.5.0 | State management (not used yet) | ✅ Yes |
| `@radix-ui/*` | Various | UI components | ✅ Yes |

#### Routing Structure (Next.js App Router)
```
/app
├── page.tsx                    # Landing page
├── birth-chart/               # Birth chart generation (uses backend)
├── daily-insights/            # Daily predictions (uses backend)
├── dashboard/                 # User dashboard
├── get-started/              # Onboarding
├── horoscope/                # Horoscope readings (uses backend)
├── matchmaking/              # Compatibility (uses backend)
├── offline/                  # Offline fallback page
└── profile/                  # User profiles
```

#### Storage & Security (ALREADY IMPLEMENTED!)
```typescript
// frontend/lib/storage.ts - IndexedDB wrapper
Object Stores:
  - profiles       (encrypted, indexed by name, createdAt)
  - reports        (encrypted, indexed by profileId, type, createdAt)
  - wisdomCards    (encrypted, indexed by category, tags)
  - settings       (plain)
  - metadata       (encryption salt, test data)

// frontend/lib/crypto.ts - AES-256-GCM encryption
Algorithm: AES-GCM (256-bit)
Key Derivation: PBKDF2 (100,000 iterations, SHA-256)
Salt: 16 bytes random (per installation)
IV: 12 bytes random (per operation)
Passcode: 4-6 digits (user-defined)
```

#### State Management
- **Current**: Mostly React hooks + Context
- **Available**: Zustand (installed but not utilized)
- **Custom Hooks**:
  - `useEncryptedStorage.ts` - Wrapper for encrypted IndexedDB operations
  - Hooks for profiles, reports, wisdom cards

#### PWA Infrastructure (ALREADY PRESENT!)
```javascript
// frontend/public/sw.js - Service Worker
Cache Strategy: Network-first with cache fallback
App Shell: /, /offline, /manifest.json
Runtime Cache: bhriguwelt-runtime-v1
Features: Background sync, push notifications (infrastructure only)
Auto-update: Checks every minute
```

```json
// frontend/public/manifest.json
{
  "name": "BhriguWelt - Soul Journey",
  "display": "standalone",
  "theme_color": "#00d9ff",
  "background_color": "#0a0118",
  "icons": [72, 96, 192, 512],
  "shortcuts": ["Birth Chart", "Daily Insights"]
}
```

---

### 1.2 BACKEND TECHNOLOGY STACK

#### Core Framework
```python
Framework: Flask 3.0.0
Database: SQLAlchemy (SQLite dev, PostgreSQL prod)
Auth: Flask-JWT-Extended 4.6.0
Server: Gunicorn 21.2.0
CORS: Flask-CORS 4.0.0
```

#### Astrology Calculation Dependencies
| Package | Version | Purpose | Can Port to Frontend? |
|---------|---------|---------|----------------------|
| `swisseph` | 2.10.3.1 | Swiss Ephemeris calculations | ❌ Python-only (C library) |
| `ephem` | 4.1.5 | Astronomical calculations | ❌ Python-only |
| `geopy` | 2.4.1 | Geocoding | ⚠️ API-dependent |
| `timezonefinder` | 8.1.0 | Timezone lookup | ⚠️ Large dataset |
| `pytz` | 2024.1 | Timezone handling | ✅ Use browser Intl API |

#### AI Integration Dependencies
| Package | Purpose | Required Offline? |
|---------|---------|-------------------|
| `openai` 1.12.0 | OpenAI API | ❌ Optional (AI mode only) |
| `anthropic` 0.18.0 | Claude API | ❌ Optional (AI mode only) |
| Sarvam AI (custom) | Vedic AI predictions | ❌ Optional (AI mode only) |

#### Data Processing
- `pandas` 2.2.0, `numpy` 1.26.4 - Heavy numerical processing
- `marshmallow` 3.21.0, `pydantic` 2.6.0 - Data validation

#### Backend Routes (ALL require network)
```
/api/astrology/*            - Birth charts, planetary positions
/api/karmic-journey/*       - Soul purpose, evolution
/api/past-lives/*           - Karmic patterns, traumas
/api/future-lives/*         - Evolution path, missions
/api/present-life/*         - Career, relationships, health
/api/life-events/*          - Milestones, timings
/api/karmic-remedies/*      - Mantras, gemstones, rituals
/api/predictions/*          - Daily/weekly/monthly forecasts
/api/users/*                - User authentication
```

---

### 1.3 INTERNET DEPENDENCIES ANALYSIS

#### CRITICAL (App Cannot Function Without)
1. **Backend API** (`NEXT_PUBLIC_API_URL`)
   - Birth chart calculations (Swiss Ephemeris)
   - All Vedic astrology logic (Nakshatras, Dashas, Houses)
   - Report generation (karmic journey, past lives, etc.)
   - Wisdom card matching logic

2. **Geocoding** (via backend → geopy)
   - Convert place names to lat/lon coordinates

3. **Timezone Resolution** (via backend → timezonefinder)
   - Determine timezone from lat/lon for birth time accuracy

#### OPTIONAL (Enhancement Features)
1. **Sarvam AI** (`SARVAM_AI_API_KEY`)
   - AI-enhanced predictions
   - Personalized insights
   - Used in "hybrid" and "chatbot" AI modes

2. **OpenAI API** (fallback)
   - Alternative AI provider

3. **Anthropic API** (fallback)
   - Alternative AI provider

#### FRONTEND-ONLY (No Network)
- Static assets (icons, manifest)
- Service worker caching
- IndexedDB storage
- Encryption/decryption (WebCrypto API)

---

### 1.4 SECRETS & API KEYS LOCATION

#### Backend Secrets (.env)
```bash
# backend/.env.example
SECRET_KEY=your-secret-key-here              # Flask session secret
JWT_SECRET_KEY=your-jwt-secret-key-here      # JWT signing
SARVAM_AI_API_KEY=your-sarvam-ai-api-key-here # AI service
DATABASE_URL=postgresql://...                # Database connection
REDIS_URL=redis://localhost:6379/0          # Optional cache
```

**Security Analysis**:
- ✅ Keys stored server-side only
- ✅ Not exposed to frontend
- ✅ `.env` in `.gitignore`
- ⚠️ Keys deployed via environment variables (Render dashboard)

#### Frontend Environment Variables
```bash
# frontend/.env.example
NEXT_PUBLIC_API_URL=https://backend.onrender.com  # Backend URL (PUBLIC!)
NEXT_PUBLIC_APP_NAME=BhriguWelt
NEXT_PUBLIC_APP_DESCRIPTION=...
```

**Security Analysis**:
- ✅ Only public config (no secrets)
- ⚠️ Backend URL exposed (expected for public API)
- ✅ No API keys in frontend

#### Encryption Keys (Frontend)
- ❌ **NOT stored anywhere** - derived from user passcode on-demand
- ✅ Salt stored in IndexedDB metadata (not a secret)
- ✅ Keys never leave browser memory
- ✅ Keys are non-extractable CryptoKey objects

---

### 1.5 CURRENT DATA MODELS (ALREADY DEFINED!)

The domain model is **already well-designed** in `frontend/lib/types.ts`:

#### Profile
```typescript
interface Profile {
  id?: number;
  name: string;
  dateOfBirth: string;        // ISO date
  timeOfBirth: string;        // HH:mm format
  placeOfBirth: string;       // City name
  latitude?: number;          // Geocoded
  longitude?: number;         // Geocoded
  timezone?: string;          // IANA timezone
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Report
```typescript
interface Report {
  id?: number;
  profileId: number;          // Foreign key
  type: ReportType;           // birth-chart | karmic-journey | past-lives | etc.
  title: string;
  data: any;                  // Report-specific data
  generatedAt: string;
  aiMode?: 'offline' | 'hybrid' | 'chatbot';
  createdAt: string;
  updatedAt: string;
}

type ReportType =
  | 'birth-chart'
  | 'karmic-journey'
  | 'past-lives'
  | 'future-lives'
  | 'present-life'
  | 'life-events'
  | 'karmic-remedies'
  | 'daily-prediction'
  | 'weekly-prediction'
  | 'monthly-prediction';
```

#### WisdomCard
```typescript
interface WisdomCard {
  id?: number;
  title: string;
  content: string;            // Markdown or plain text
  category: WisdomCategory;   // vedic-wisdom | spiritual-practice | mantras | etc.
  tags: string[];             // Multi-entry index
  source?: string;            // Bhrigu Samhita, Nadi Jyotisha, etc.
  author?: string;
  isFavorite?: boolean;
  readCount?: number;
  createdAt: string;
  updatedAt: string;
}

type WisdomCategory =
  | 'vedic-wisdom'
  | 'spiritual-practice'
  | 'karmic-healing'
  | 'meditation'
  | 'mantras'
  | 'remedies'
  | 'astrology'
  | 'philosophy'
  | 'general';
```

#### Birth Chart Data
```typescript
interface BirthChart {
  birthDetails: {
    date: string;
    time: string;
    place: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  zodiacSign: string;         // Aries, Taurus, etc.
  moonSign: string;           // Chandra Rashi
  ascendant: string;          // Lagna
  nakshatra: string;          // Birth star (1-27)
  element: string;            // Fire, Earth, Air, Water
  planets: Record<string, any>; // Planetary positions
  houses: string[];           // 12 houses
  karmicNumber: number;       // Derived from birth date
  soulNumber: number;         // Derived from name
  dashaPeriod: {
    mahaDasha: string;        // Current planetary period
    yearsRemaining: number;
  };
}
```

#### App Settings
```typescript
interface AppSettings {
  key: 'appSettings';
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  aiMode?: 'offline' | 'hybrid' | 'chatbot';  // KEY SETTING!
  autoLockTimeout?: number;   // Minutes
  biometricEnabled?: boolean; // Future: Web Authentication API
  notificationsEnabled?: boolean;
  syncEnabled?: boolean;      // Future: P2P sync
  lastSyncAt?: string;
  updatedAt: string;
}
```

---

### 1.6 MOBILE APP REFERENCE (Flutter)

The **Flutter mobile app** (`/mobile/soul_journey/`) is **fully offline** and provides a reference implementation:

#### What Works Offline in Mobile App
✅ Birth chart calculations (native Dart implementation)
✅ Nakshatra calculations
✅ Dasha period calculations
✅ Report generation (7-page Soul Journey)
✅ Wisdom card matching
✅ PDF export
✅ SQLCipher encryption (AES-256)
✅ PIN + biometric authentication
✅ Offline city database (50+ cities)

#### Key Insight
The mobile app proves that **Vedic astrology calculations CAN be done offline** with a pure Dart interpretation engine. We need a similar **JavaScript interpretation engine** for the PWA.

---

## PART 2: TARGET ARCHITECTURE PROPOSAL

### 2.1 ARCHITECTURE PRINCIPLES

1. **Offline-First**: App MUST work without internet after initial load
2. **Privacy by Default**: All data encrypted locally, zero telemetry
3. **AI as Optional Enhancement**: Backend proxy for AI only, never required
4. **Progressive Enhancement**: Basic features offline, enhanced features online
5. **Zero Lock-In**: User data exportable, no vendor dependencies

---

### 2.2 PROPOSED ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    PWA FRONTEND                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │  Next.js   │  │  Service   │  │  IndexedDB │        │  │
│  │  │  React UI  │  │  Worker    │  │  Storage   │        │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │      OFFLINE-FIRST CORE LAYER                   │    │  │
│  │  │  ┌──────────────┐  ┌─────────────────────────┐ │    │  │
│  │  │  │ Astrology    │  │ Report Generation       │ │    │  │
│  │  │  │ Engine (JS)  │  │ Engine (Templates)      │ │    │  │
│  │  │  │              │  │                         │ │    │  │
│  │  │  │ - Zodiac     │  │ - Birth Chart Report    │ │    │  │
│  │  │  │ - Nakshatra  │  │ - Karmic Journey        │ │    │  │
│  │  │  │ - Dashas     │  │ - Past/Future Lives     │ │    │  │
│  │  │  │ - Houses     │  │ - Remedies              │ │    │  │
│  │  │  │ - Planetary  │  │ - Daily Predictions     │ │    │  │
│  │  │  └──────────────┘  └─────────────────────────┘ │    │  │
│  │  │                                                 │    │  │
│  │  │  ┌──────────────────────────────────────────┐  │    │  │
│  │  │  │ Wisdom Card Matching Engine              │  │    │  │
│  │  │  │ - Rule-based matching (tags, conditions) │  │    │  │
│  │  │  │ - Template interpolation                 │  │    │  │
│  │  │  └──────────────────────────────────────────┘  │    │  │
│  │  │                                                 │    │  │
│  │  │  ┌──────────────────────────────────────────┐  │    │  │
│  │  │  │ Static Data Libraries (Bundled)          │  │    │  │
│  │  │  │ - Cities DB (1000+ cities, lat/lon, tz)  │  │    │  │
│  │  │  │ - Wisdom Cards (100+ pre-seeded)         │  │    │  │
│  │  │  │ - Nakshatra data, House meanings         │  │    │  │
│  │  │  │ - Planetary significations              │  │    │  │
│  │  │  └──────────────────────────────────────────┘  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │      ENCRYPTION & SECURITY LAYER                │    │  │
│  │  │  - AES-256-GCM (WebCrypto API)                  │    │  │
│  │  │  - PBKDF2 key derivation (100k iterations)      │    │  │
│  │  │  - Passcode authentication                      │    │  │
│  │  │  - Auto-lock on idle                            │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            OPTIONAL ONLINE FEATURES                      │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │ AI Enhancement │  │ Geocoding API  │                 │  │
│  │  │ (opt-in)       │  │ (fallback)     │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ (OPTIONAL)
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Render)                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  /api/ai/enhance-report (POST)                         │    │
│  │    - Input: Basic report data (anonymized)             │    │
│  │    - Output: AI-enhanced insights                      │    │
│  │    - Providers: Sarvam AI, OpenAI, Anthropic           │    │
│  │                                                         │    │
│  │  /api/geocode (POST)                                   │    │
│  │    - Input: Place name                                 │    │
│  │    - Output: {lat, lon, timezone}                      │    │
│  │    - Fallback for places not in bundled DB             │    │
│  │                                                         │    │
│  │  /api/health (GET)                                     │    │
│  │    - Service availability check                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.3 SECURITY BOUNDARIES

```
┌──────────────────────────────────────────────────────────────┐
│  TRUST BOUNDARY: USER'S DEVICE (FULL TRUST)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Encrypted Local Storage (IndexedDB)                   │ │
│  │  - User profiles (birth data)                          │ │
│  │  - Generated reports                                   │ │
│  │  - Personal wisdom cards                               │ │
│  │  - Settings                                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  In-Memory Processing Only                             │ │
│  │  - Astrology calculations                              │ │
│  │  - Report generation                                   │ │
│  │  - Wisdom matching                                     │ │
│  │  - Encryption keys (never persisted)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Threat Model:                                               │
│  ✅ Protects against: Device theft, physical access          │
│  ✅ Protects against: Data breaches (no server storage)      │
│  ✅ Protects against: Man-in-the-middle (no sensitive data   │
│     transmitted)                                             │
│  ⚠️ Cannot protect against: Malicious browser extensions,    │
│     device malware, shoulder surfing during passcode entry   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  TRUST BOUNDARY: BACKEND API (ZERO TRUST)                   │
│                                                              │
│  Assumptions:                                                │
│  ❌ Backend may be unavailable (offline, rate-limited)       │
│  ❌ Backend may be compromised                               │
│  ❌ Network may be monitored                                 │
│                                                              │
│  Data Transmission Rules:                                    │
│  ✅ NEVER send full birth data (only anonymized features)    │
│  ✅ NEVER send user names or identifiable info              │
│  ✅ NEVER send raw reports (only summaries for enhancement)  │
│  ✅ ALWAYS use HTTPS (enforced by CSP)                       │
│  ✅ ALWAYS make AI enhancement opt-in                        │
│  ✅ ALWAYS provide offline alternative                       │
│                                                              │
│  Example AI Enhancement Request (anonymized):                │
│  {                                                           │
│    "reportType": "karmic-journey",                           │
│    "features": {                                             │
│      "zodiacSign": "Aries",                                  │
│      "nakshatra": "Ashwini",                                 │
│      "element": "Fire",                                      │
│      "karmicNumber": 7                                       │
│    },                                                        │
│    "context": "Soul purpose guidance"                        │
│  }                                                           │
│  ❌ NO names, dates, times, places sent!                     │
└──────────────────────────────────────────────────────────────┘
```

---

### 2.4 FRONTEND RESPONSIBILITIES (CORE)

#### 1. UI/UX Layer
- Next.js pages and components
- Responsive design (mobile-first)
- Accessibility (WCAG 2.1 AA)
- Animations (Framer Motion)
- Form validation

#### 2. Offline-First Data Layer
- IndexedDB operations (storage.ts - already implemented)
- AES-256-GCM encryption (crypto.ts - already implemented)
- Passcode management
- Auto-lock functionality
- Data export/import (backup)

#### 3. Astrology Calculation Engine (NEW - to be built)
```typescript
// lib/astrology/engine.ts (to create)
class AstrologyEngine {
  // Zodiac calculation from birth date
  calculateZodiacSign(date: Date): ZodiacSign

  // Moon sign calculation
  calculateMoonSign(date: Date, time: string, lat: number, lon: number): MoonSign

  // Nakshatra (birth star) calculation
  calculateNakshatra(date: Date, time: string, lat: number, lon: number): Nakshatra

  // Ascendant (Lagna) calculation
  calculateAscendant(date: Date, time: string, lat: number, lon: number): Ascendant

  // Planetary positions (simplified, no Swiss Ephemeris)
  calculatePlanetaryPositions(date: Date, time: string): PlanetaryPositions

  // Dasha period calculation (Vimshottari Dasha)
  calculateDashaPeriod(date: Date): DashaPeriod

  // House system (Placidus or Whole Sign)
  calculateHouses(date: Date, time: string, lat: number, lon: number): House[]

  // Karmic number (from birth date numerology)
  calculateKarmicNumber(date: Date): number

  // Soul number (from name numerology)
  calculateSoulNumber(name: string): number
}
```

**Implementation Strategy**:
- Port simplified algorithms from Flutter app (`mobile/soul_journey/lib/domain/engine/`)
- Use astronomy.js or similar lightweight JS library for planetary positions
- Implement Vedic-specific calculations (Nakshatras, Dashas) from first principles
- Bundle ephemeris data for 1900-2100 (approx. 50KB compressed)

#### 4. Report Generation Engine (NEW - to be built)
```typescript
// lib/reports/generator.ts (to create)
class ReportGenerator {
  // Generate birth chart report
  generateBirthChartReport(profile: Profile, chart: BirthChart): Report

  // Generate karmic journey report
  generateKarmicJourneyReport(profile: Profile, chart: BirthChart): Report

  // Generate past lives report
  generatePastLivesReport(profile: Profile, chart: BirthChart): Report

  // Generate future lives report
  generateFutureLivesReport(profile: Profile, chart: BirthChart): Report

  // Generate present life report
  generatePresentLifeReport(profile: Profile, chart: BirthChart): Report

  // Generate life events timeline
  generateLifeEventsReport(profile: Profile, chart: BirthChart, years: number): Report

  // Generate karmic remedies
  generateKarmicRemediesReport(profile: Profile, chart: BirthChart): Report

  // Generate daily/weekly/monthly predictions
  generatePredictionReport(profile: Profile, chart: BirthChart, period: Period): Report
}
```

**Implementation Strategy**:
- Use template-based generation (Mustache or Handlebars)
- Match wisdom cards to chart features (tags, conditions)
- Implement rule-based interpretation (if-then logic)
- Store templates in wisdom cards database
- Support markdown formatting

#### 5. Wisdom Card Matching Engine (NEW - to be built)
```typescript
// lib/wisdom/matcher.ts (to create)
class WisdomMatcher {
  // Match wisdom cards to birth chart features
  matchCards(chart: BirthChart, category?: WisdomCategory): WisdomCard[]

  // Find cards by tags
  findByTags(tags: string[]): WisdomCard[]

  // Find cards by conditions (e.g., element: Fire)
  findByConditions(conditions: Record<string, any>): WisdomCard[]

  // Rank cards by relevance score
  rankByRelevance(cards: WisdomCard[], chart: BirthChart): WisdomCard[]
}
```

#### 6. Static Data Libraries (NEW - to be bundled)
```typescript
// lib/data/cities.ts - Pre-seeded city database
interface CityData {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA timezone
}
// ~1000-2000 cities, ~100-200KB compressed

// lib/data/nakshatras.ts - Nakshatra information
interface NakshatraData {
  name: string;
  lord: string;
  deity: string;
  symbol: string;
  range: [number, number]; // Degrees
  element: string;
  quality: string;
  significations: string[];
}

// lib/data/planets.ts - Planetary significations
// lib/data/houses.ts - House meanings
// lib/data/zodiac.ts - Zodiac sign data
```

---

### 2.5 BACKEND RESPONSIBILITIES (OPTIONAL)

#### 1. AI Enhancement Proxy (ONLY)
```python
# Simplified backend structure
/api
├── /ai
│   ├── /enhance-report (POST)       # AI-enhance a report
│   ├── /ask-question (POST)         # Chatbot mode
│   └── /generate-insight (POST)     # Hybrid mode insights
├── /geocode (POST)                  # Fallback geocoding
└── /health (GET)                    # Health check
```

**Key Changes**:
- ❌ Remove ALL astrology calculation endpoints
- ❌ Remove user authentication (no user accounts)
- ❌ Remove database (stateless API)
- ✅ Keep AI service integration only
- ✅ Add anonymization middleware
- ✅ Add rate limiting

#### 2. AI Enhancement Logic
```python
# backend/services/ai_enhancer.py (new simplified service)
class AIEnhancer:
    def enhance_report(self, report_type: str, features: dict, context: str) -> dict:
        """
        Enhance a report with AI insights (no birth data, only features)

        Input:
          report_type: "karmic-journey" | "past-lives" | etc.
          features: { "zodiacSign": "Aries", "element": "Fire", ... }
          context: "Soul purpose guidance"

        Output:
          { "enhanced_content": "...", "ai_insights": [...] }
        """
        pass
```

#### 3. Geocoding Fallback
```python
# backend/services/geocoder.py (keep simple version)
class Geocoder:
    def geocode(self, place_name: str) -> dict:
        """
        Fallback geocoding for places not in bundled DB

        Input: "Mumbai, India"
        Output: { "lat": 19.0760, "lon": 72.8777, "timezone": "Asia/Kolkata" }
        """
        pass
```

#### 4. Deployment
- **Platform**: Keep Render (or move to Vercel Serverless Functions)
- **Cost**: Minimal (only AI requests, no storage)
- **Scaling**: Auto-scale on AI usage only

---

### 2.6 DATA FLOW DIAGRAMS

#### Offline Mode Flow (AI Mode: Offline)
```
User Input (Name, DOB, TOB, Place)
         ↓
1. Validate & Sanitize Input
         ↓
2. Lookup City in Bundled DB
   (or prompt user for lat/lon)
         ↓
3. Calculate Birth Chart (Astrology Engine)
   - Zodiac, Moon Sign, Nakshatra
   - Ascendant, Houses
   - Planetary Positions
   - Dasha Period
         ↓
4. Generate Report (Report Generator)
   - Select report template
   - Match wisdom cards
   - Interpolate data
         ↓
5. Encrypt & Store Report (IndexedDB)
         ↓
6. Display Report to User
```

#### Hybrid Mode Flow (AI Mode: Hybrid)
```
[Steps 1-4 same as Offline Mode]
         ↓
5. Anonymize Report Data
   - Extract features only (zodiac, element, etc.)
   - Remove all PII (name, exact DOB, place)
         ↓
6. Call Backend API (OPTIONAL)
   POST /api/ai/enhance-report
   Body: { reportType, features, context }
         ↓
7a. If Backend Available:
    - Receive AI-enhanced insights
    - Merge with offline report
    - Display "AI-Enhanced" badge
         ↓
7b. If Backend Unavailable:
    - Show offline report only
    - Display "Offline Mode" notice
         ↓
8. Encrypt & Store Report (IndexedDB)
         ↓
9. Display Report to User
```

#### Chatbot Mode Flow (AI Mode: Chatbot)
```
User Asks Question
         ↓
1. Load Profile & Birth Chart from IndexedDB
         ↓
2. Anonymize Context
   - Chart features only
   - No PII
         ↓
3. Call Backend API
   POST /api/ai/ask-question
   Body: { question, features, chatHistory }
         ↓
4a. If Backend Available:
    - Stream AI response
    - Display in chat UI
    - Store in chat history (encrypted)
         ↓
4b. If Backend Unavailable:
    - Show error: "Chatbot requires internet"
    - Suggest switching to Offline mode
         ↓
5. User Can Export Chat (encrypted)
```

---

## PART 3: CLEAN DOMAIN MODEL DESIGN

### 3.1 CORE ENTITIES

The existing models in `lib/types.ts` are **already well-designed**. Proposed enhancements:

#### Profile (Enhanced)
```typescript
interface Profile {
  // Identity
  id?: number;                // Auto-increment (IndexedDB)
  name: string;               // Display name

  // Birth Data
  dateOfBirth: string;        // ISO 8601 date (YYYY-MM-DD)
  timeOfBirth: string;        // 24-hour format (HH:mm)
  placeOfBirth: string;       // City, Country
  latitude: number;           // Decimal degrees
  longitude: number;          // Decimal degrees
  timezone: string;           // IANA timezone (Asia/Kolkata)

  // Optional Metadata
  gender?: 'male' | 'female' | 'other';
  notes?: string;             // User notes
  avatar?: string;            // Base64 or emoji

  // Timestamps
  createdAt: string;          // ISO 8601
  updatedAt: string;

  // Computed (cached for performance)
  _cached?: {
    zodiacSign: string;
    moonSign: string;
    nakshatra: string;
    ascendant: string;
  };
}
```

#### Report (Enhanced)
```typescript
interface Report {
  // Identity
  id?: number;
  profileId: number;          // Foreign key to Profile

  // Report Metadata
  type: ReportType;
  title: string;
  subtitle?: string;

  // Report Data
  data: ReportData;           // Typed by report type

  // Generation Context
  generatedAt: string;
  aiMode: 'offline' | 'hybrid' | 'chatbot';
  aiEnhanced: boolean;        // True if AI insights included

  // Versioning
  version: string;            // Semantic versioning (1.0.0)
  engineVersion: string;      // Astrology engine version

  // Status
  status: 'draft' | 'completed' | 'archived';

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Report-specific data types
type ReportData =
  | BirthChartReport
  | KarmicJourneyReport
  | PastLivesReport
  | FutureLivesReport
  | PresentLifeReport
  | LifeEventsReport
  | KarmicRemediesReport
  | PredictionReport;

interface BirthChartReport {
  chart: BirthChart;
  interpretation: {
    overview: string;
    strengths: string[];
    challenges: string[];
    lifeTheme: string;
  };
  wisdomCards: WisdomCard[];
}

interface KarmicJourneyReport {
  soulPurpose: string;
  karmicLessons: string[];
  soulEvolution: string;
  dharmicPath: string;
  karmicDebts: string[];
  soulGroupConnections: string[];
  wisdomCards: WisdomCard[];
}

// ... (similar for other report types)
```

#### WisdomCard (Enhanced)
```typescript
interface WisdomCard {
  // Identity
  id?: number;

  // Content
  title: string;
  content: string;            // Markdown supported
  summary?: string;           // Short excerpt

  // Taxonomy
  category: WisdomCategory;
  tags: string[];             // Free-form tags
  tradition?: string;         // Bhrigu Samhita, Nadi Jyotisha, etc.
  topic?: string;             // soul_signature, past_lives, etc.

  // Matching Logic
  conditions?: CardCondition; // When to show this card
  priority?: number;          // 1-100, higher = more important

  // Template Support
  template?: string;          // Mustache template (optional)
  outputTemplate?: string;    // How to render in report

  // Attribution
  source?: string;            // Book, chapter, verse
  author?: string;
  translatedBy?: string;

  // User Interaction
  isFavorite?: boolean;
  readCount?: number;
  lastReadAt?: string;
  userNotes?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Metadata
  isDefault?: boolean;        // Pre-seeded vs user-created
  language?: string;          // en, hi, sa
}

interface CardCondition {
  zodiacSigns?: string[];     // Match if zodiac in list
  elements?: string[];        // Match if element in list
  nakshatras?: string[];      // Match if nakshatra in list
  planets?: string[];         // Match if planet prominent
  houses?: number[];          // Match if house emphasized
  karmicNumbers?: number[];   // Match if karmic number in list
  // Custom conditions (advanced)
  customRule?: string;        // JavaScript expression
}
```

#### ReportPage (NEW - for multi-page reports)
```typescript
interface ReportPage {
  id?: number;
  reportId: number;           // Foreign key to Report
  pageNumber: number;         // 1, 2, 3, ...
  title: string;              // "Soul Signature", "Past Life Threads", etc.
  content: string;            // Markdown or HTML
  wisdomCards: WisdomCard[];  // Cards for this page
  metadata?: {
    wordCount: number;
    readingTime: number;      // Minutes
    illustrations?: string[]; // Base64 or URLs
  };
  createdAt: string;
  updatedAt: string;
}
```

---

### 3.2 VALUE OBJECTS

```typescript
// Birth Chart Components
interface BirthChart {
  // Birth Details
  birthDetails: BirthDetails;

  // Core Chart Elements
  zodiacSign: ZodiacSign;
  moonSign: ZodiacSign;
  ascendant: ZodiacSign;
  nakshatra: Nakshatra;
  element: Element;

  // Planetary Positions
  planets: PlanetaryPositions;

  // House System
  houses: House[];

  // Numerology
  karmicNumber: number;       // 1-9
  soulNumber: number;         // 1-9
  destinyNumber?: number;     // 1-9

  // Dasha System
  dashaPeriod: DashaPeriod;

  // Aspects & Yogas
  aspects?: Aspect[];
  yogas?: Yoga[];
}

interface BirthDetails {
  date: string;               // ISO 8601
  time: string;               // HH:mm
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  julianDay?: number;         // For calculations
}

type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

type Nakshatra =
  | 'Ashwini' | 'Bharani' | 'Krittika' | 'Rohini'
  | 'Mrigashira' | 'Ardra' | 'Punarvasu' | 'Pushya'
  | 'Ashlesha' | 'Magha' | 'Purva Phalguni' | 'Uttara Phalguni'
  | 'Hasta' | 'Chitra' | 'Swati' | 'Vishakha'
  | 'Anuradha' | 'Jyeshtha' | 'Mula' | 'Purva Ashadha'
  | 'Uttara Ashadha' | 'Shravana' | 'Dhanishta' | 'Shatabhisha'
  | 'Purva Bhadrapada' | 'Uttara Bhadrapada' | 'Revati';

type Element = 'Fire' | 'Earth' | 'Air' | 'Water';

interface PlanetaryPositions {
  sun: PlanetPosition;
  moon: PlanetPosition;
  mercury: PlanetPosition;
  venus: PlanetPosition;
  mars: PlanetPosition;
  jupiter: PlanetPosition;
  saturn: PlanetPosition;
  rahu: PlanetPosition;        // North Node
  ketu: PlanetPosition;        // South Node
  // Optional: Uranus, Neptune, Pluto (Western astrology)
}

interface PlanetPosition {
  longitude: number;           // 0-360 degrees
  sign: ZodiacSign;
  house: number;               // 1-12
  nakshatra: Nakshatra;
  isRetrograde?: boolean;
  dignity?: 'exalted' | 'debilitated' | 'own' | 'friend' | 'enemy' | 'neutral';
}

interface House {
  number: number;              // 1-12
  cusp: number;                // Degree (0-360)
  sign: ZodiacSign;
  lord: string;                // Ruling planet
  planets: string[];           // Planets in this house
  significations: string[];    // Life areas
}

interface DashaPeriod {
  system: 'Vimshottari' | 'Yogini' | 'Ashtottari';
  mahaDasha: string;           // Current major period (planet)
  antarDasha?: string;         // Sub-period
  pratyantarDasha?: string;    // Sub-sub-period
  yearsRemaining: number;
  startDate: string;
  endDate: string;
}

interface Aspect {
  planet1: string;
  planet2: string;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  angle: number;
  strength: 'strong' | 'moderate' | 'weak';
}

interface Yoga {
  name: string;                // E.g., "Gaja Kesari Yoga"
  description: string;
  planets: string[];
  strength: 'strong' | 'moderate' | 'weak';
  effects: string[];
}
```

---

### 3.3 SERVICES & REPOSITORIES

```typescript
// Storage layer (already exists in lib/storage.ts)
interface StorageRepository<T> {
  create(item: T): Promise<T>;
  read(id: number): Promise<T | null>;
  update(id: number, item: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
  list(): Promise<T[]>;
  count(): Promise<number>;
}

// Specialized repositories
class ProfileRepository implements StorageRepository<Profile> {
  // ... CRUD operations on profiles store
  findByName(name: string): Promise<Profile[]>;
}

class ReportRepository implements StorageRepository<Report> {
  // ... CRUD operations on reports store
  findByProfileId(profileId: number): Promise<Report[]>;
  findByType(type: ReportType): Promise<Report[]>;
}

class WisdomCardRepository implements StorageRepository<WisdomCard> {
  // ... CRUD operations on wisdomCards store
  findByCategory(category: WisdomCategory): Promise<WisdomCard[]>;
  findByTags(tags: string[]): Promise<WisdomCard[]>;
  search(query: string): Promise<WisdomCard[]>; // Full-text search
}

// Business logic services
class AstrologyService {
  constructor(
    private engine: AstrologyEngine,
    private profileRepo: ProfileRepository
  ) {}

  async calculateBirthChart(profileId: number): Promise<BirthChart>;
}

class ReportService {
  constructor(
    private generator: ReportGenerator,
    private reportRepo: ReportRepository,
    private wisdomRepo: WisdomCardRepository,
    private aiService?: AIService
  ) {}

  async generateReport(
    profileId: number,
    type: ReportType,
    options: { aiMode: AIMode }
  ): Promise<Report>;

  async exportReport(reportId: number, format: 'pdf' | 'docx' | 'html'): Promise<Blob>;
}

class AIService {
  constructor(private apiUrl: string) {}

  async enhanceReport(
    reportType: ReportType,
    features: Record<string, any>,
    context: string
  ): Promise<{ enhancedContent: string; aiInsights: string[] }>;

  async askQuestion(
    question: string,
    features: Record<string, any>,
    chatHistory: ChatMessage[]
  ): Promise<string>;
}
```

---

## PART 4: OFFLINE-FIRST FLOW END-TO-END

### 4.1 FIRST-TIME USER ONBOARDING

```
Step 1: PWA Installation
┌──────────────────────────────────────────────────┐
│  User visits https://bhriguwelt.vercel.app       │
│         ↓                                        │
│  Service Worker registers                        │
│  PWA manifest loaded                             │
│  "Install App" prompt shown (browser native)     │
│         ↓                                        │
│  User clicks "Install"                           │
│         ↓                                        │
│  App added to home screen / app drawer           │
│  Offline assets cached (app shell, JS, CSS)      │
└──────────────────────────────────────────────────┘

Step 2: Passcode Setup
┌──────────────────────────────────────────────────┐
│  App launches → Check if encryption setup        │
│         ↓                                        │
│  isEncryptionSetup() → false                     │
│         ↓                                        │
│  Show PasscodeSetup screen                       │
│  - Enter 4-6 digit passcode                      │
│  - Confirm passcode                              │
│         ↓                                        │
│  setupEncryption(passcode)                       │
│  - Generate salt (16 bytes random)               │
│  - Derive key (PBKDF2, 100k iterations)          │
│  - Store salt in IndexedDB metadata              │
│  - Encrypt test data to verify                   │
│         ↓                                        │
│  Navigate to Dashboard                           │
└──────────────────────────────────────────────────┘

Step 3: First Profile Creation
┌──────────────────────────────────────────────────┐
│  User clicks "Create Profile"                    │
│         ↓                                        │
│  Show ProfileForm                                │
│  - Name: "John Doe"                              │
│  - Date of Birth: 1990-05-15                     │
│  - Time of Birth: 14:30                          │
│  - Place of Birth: "Mumbai, India"               │
│         ↓                                        │
│  Lookup city in bundled cities DB                │
│  - Found: Mumbai                                 │
│  - Latitude: 19.0760                             │
│  - Longitude: 72.8777                            │
│  - Timezone: Asia/Kolkata                        │
│         ↓                                        │
│  Create Profile object                           │
│         ↓                                        │
│  Encrypt & store in IndexedDB                    │
│  profileRepo.create(profile)                     │
│         ↓                                        │
│  Show success: "Profile created!"                │
│  Navigate to Profile Dashboard                   │
└──────────────────────────────────────────────────┘

Step 4: First Report Generation (Offline Mode)
┌──────────────────────────────────────────────────┐
│  User clicks "Generate Birth Chart"              │
│         ↓                                        │
│  Load profile from IndexedDB                     │
│         ↓                                        │
│  Calculate Birth Chart (Astrology Engine)        │
│  - Zodiac: Taurus (Sun at 25° Taurus)           │
│  - Moon Sign: Scorpio                            │
│  - Nakshatra: Mrigashira                         │
│  - Ascendant: Virgo                              │
│  - Element: Earth                                │
│  - Karmic Number: 7                              │
│  - Dasha: Jupiter Maha Dasha (12 years left)     │
│         ↓                                        │
│  Generate Report (Report Generator)              │
│  - Select birth-chart template                   │
│  - Match wisdom cards (tags: earth, stability)   │
│  - Interpolate chart data into template          │
│  - Create multi-page report structure            │
│         ↓                                        │
│  Create Report object                            │
│  report = {                                      │
│    type: 'birth-chart',                          │
│    aiMode: 'offline',                            │
│    aiEnhanced: false,                            │
│    data: { chart, interpretation, wisdomCards }  │
│  }                                               │
│         ↓                                        │
│  Encrypt & store in IndexedDB                    │
│  reportRepo.create(report)                       │
│         ↓                                        │
│  Display Report (multi-page view)                │
│  - Page 1: Birth Chart Summary                   │
│  - Page 2: Personality Traits                    │
│  - Page 3: Life Purpose                          │
│  - Page 4: Strengths & Challenges                │
│  - Page 5: Wisdom Cards                          │
│         ↓                                        │
│  User can navigate pages, export PDF, etc.       │
└──────────────────────────────────────────────────┘
```

---

### 4.2 RETURNING USER FLOW

```
Step 1: App Launch
┌──────────────────────────────────────────────────┐
│  User opens PWA (offline, no internet)           │
│         ↓                                        │
│  Service Worker serves cached assets             │
│  App loads instantly from cache                  │
│         ↓                                        │
│  Check encryption setup                          │
│  isEncryptionSetup() → true                      │
│         ↓                                        │
│  Show PasscodeUnlock screen                      │
│  - Enter passcode                                │
│         ↓                                        │
│  Verify passcode                                 │
│  verifyEncryptionKey(passcode) → true            │
│         ↓                                        │
│  Derive encryption key                           │
│  key = getEncryptionKey(passcode)                │
│  Store in session (memory only)                  │
│         ↓                                        │
│  Navigate to Dashboard                           │
└──────────────────────────────────────────────────┘

Step 2: View Existing Reports
┌──────────────────────────────────────────────────┐
│  Dashboard loads                                 │
│         ↓                                        │
│  Load profiles & reports from IndexedDB          │
│  profiles = await profileRepo.list()             │
│  reports = await reportRepo.list()               │
│         ↓                                        │
│  Decrypt data using session key                  │
│         ↓                                        │
│  Display in UI                                   │
│  - 3 profiles                                    │
│  - 15 reports (5 per profile)                    │
│         ↓                                        │
│  User clicks on a report                         │
│         ↓                                        │
│  Load full report from IndexedDB                 │
│  report = await reportRepo.read(reportId)        │
│         ↓                                        │
│  Render report pages                             │
└──────────────────────────────────────────────────┘

Step 3: Generate New Report (Hybrid Mode)
┌──────────────────────────────────────────────────┐
│  User changes AI mode to "Hybrid"                │
│  settings.aiMode = 'hybrid'                      │
│         ↓                                        │
│  User clicks "Generate Karmic Journey"           │
│         ↓                                        │
│  [Steps same as offline mode for calculation]    │
│  Calculate birth chart → Generate base report    │
│         ↓                                        │
│  Anonymize report data                           │
│  features = {                                    │
│    zodiacSign: 'Taurus',                         │
│    element: 'Earth',                             │
│    nakshatra: 'Mrigashira',                      │
│    karmicNumber: 7                               │
│  }                                               │
│  (NO name, DOB, place sent!)                     │
│         ↓                                        │
│  Call backend API (with timeout)                 │
│  try {                                           │
│    response = await aiService.enhanceReport(     │
│      'karmic-journey', features, 'Soul purpose'  │
│    )                                             │
│  } catch (NetworkError) {                        │
│    // Backend unavailable                        │
│    response = null                               │
│  }                                               │
│         ↓                                        │
│  If response received:                           │
│    - Merge AI insights into base report          │
│    - Mark report as AI-enhanced                  │
│    - Show "Enhanced by AI" badge                 │
│  If no response:                                 │
│    - Use offline report only                     │
│    - Show "Offline Mode" notice                  │
│         ↓                                        │
│  Encrypt & store report                          │
│         ↓                                        │
│  Display report                                  │
└──────────────────────────────────────────────────┘

Step 4: Auto-Lock
┌──────────────────────────────────────────────────┐
│  User idle for 5 minutes                         │
│         ↓                                        │
│  Auto-lock timer fires                           │
│         ↓                                        │
│  Clear encryption key from memory                │
│  sessionStorage.clear()                          │
│         ↓                                        │
│  Redirect to PasscodeUnlock screen               │
│         ↓                                        │
│  User must re-enter passcode                     │
└──────────────────────────────────────────────────┘
```

---

### 4.3 DATA EXPORT/IMPORT FLOW

```
Export Flow
┌──────────────────────────────────────────────────┐
│  User clicks "Export Data"                       │
│         ↓                                        │
│  Prompt for passcode (re-authentication)         │
│         ↓                                        │
│  Export all data from IndexedDB                  │
│  data = {                                        │
│    profiles: [...],                              │
│    reports: [...],                               │
│    wisdomCards: [...],                           │
│    settings: {...}                               │
│  }                                               │
│         ↓                                        │
│  Encrypt export data (separate password)         │
│  exportPassword = prompt("Set export password")  │
│  encryptedBlob = await encryptForExport(         │
│    data, exportPassword                          │
│  )                                               │
│         ↓                                        │
│  Download as .bhrigu file                        │
│  filename: bhriguwelt-backup-2026-01-03.bhrigu   │
│         ↓                                        │
│  Show success: "Data exported securely!"         │
└──────────────────────────────────────────────────┘

Import Flow
┌──────────────────────────────────────────────────┐
│  User clicks "Import Data"                       │
│         ↓                                        │
│  Prompt for .bhrigu file                         │
│  User selects file                               │
│         ↓                                        │
│  Prompt for export password                      │
│  exportPassword = prompt("Enter export password")│
│         ↓                                        │
│  Decrypt export data                             │
│  data = await decryptFromExport(                 │
│    encryptedBlob, exportPassword                 │
│  )                                               │
│         ↓                                        │
│  Validate data structure                         │
│  if (!isValidBackup(data)) {                     │
│    throw new Error("Invalid backup file")        │
│  }                                               │
│         ↓                                        │
│  Prompt user: Merge or Replace?                  │
│  - Merge: Keep existing + add imported           │
│  - Replace: Delete existing, import only         │
│         ↓                                        │
│  Import data into IndexedDB                      │
│  (re-encrypt with current passcode)              │
│         ↓                                        │
│  Show success: "Data imported successfully!"     │
│  Reload dashboard                                │
└──────────────────────────────────────────────────┘
```

---

### 4.4 OFFLINE-FIRST EDGE CASES

#### Case 1: User Creates Profile Offline, Goes Online Later
```
Offline:
  - Profile created and stored locally
  - All reports generated offline

Online (if Hybrid mode enabled):
  - User can regenerate reports with AI enhancement
  - Original offline reports remain unchanged
  - New AI-enhanced versions saved separately
```

#### Case 2: Backend API Down / Rate Limited
```
User Action:
  - User requests AI-enhanced report

Flow:
  1. Generate base report offline (always works)
  2. Attempt AI enhancement:
     - Call backend with 5-second timeout
     - If timeout or error: Fallback to offline report
     - Show notice: "AI service unavailable. Showing offline report."
  3. User can retry AI enhancement later from report menu
```

#### Case 3: User Switches Devices
```
Device A:
  - User generates reports
  - Exports data (.bhrigu file)
  - Sends file via email/cloud (user's choice)

Device B:
  - User installs PWA
  - Sets up new passcode
  - Imports .bhrigu file
  - All data available offline on new device
```

#### Case 4: User Forgets Passcode
```
IMPORTANT: Passcode is NOT recoverable!

If passcode forgotten:
  1. Show warning: "Passcode cannot be recovered"
  2. Options:
     a) Try again (3 attempts)
     b) Reset app (DELETE ALL DATA)
  3. If user chooses reset:
     - Clear all IndexedDB data
     - Clear service worker cache
     - Restart onboarding

Privacy-first design means NO backdoor recovery.
```

---

## PART 5: PHASED REBUILD PLAN

### PHASE 1: FOUNDATION (Week 1-2)

#### Goal: Establish offline-first infrastructure

**Tasks**:
1. ✅ **Verify Existing Infrastructure**
   - [x] IndexedDB storage (lib/storage.ts) - DONE
   - [x] Encryption (lib/crypto.ts) - DONE
   - [x] Service worker (public/sw.js) - DONE
   - [x] PWA manifest (public/manifest.json) - DONE
   - [x] Passcode UI (PasscodeSetup, PasscodeUnlock) - DONE
   - [ ] **Test end-to-end encryption flow**

2. **Enhance Storage Layer**
   - [ ] Add full-text search to WisdomCard store (IndexedDB FTS or lunr.js)
   - [ ] Add caching layer (LRU cache for frequently accessed data)
   - [ ] Add data migration utilities (schema versioning)

3. **Bundle Static Data**
   - [ ] Create `lib/data/cities.ts` - 1000+ cities with lat/lon/timezone
     - Source: GeoNames or Natural Earth Data
     - Format: JSON, ~200KB compressed
   - [ ] Create `lib/data/nakshatras.ts` - 27 Nakshatra definitions
   - [ ] Create `lib/data/planets.ts` - Planetary significations
   - [ ] Create `lib/data/houses.ts` - House meanings
   - [ ] Create `lib/data/zodiac.ts` - Zodiac sign data

4. **Setup State Management**
   - [ ] Initialize Zustand stores
     - `useAuthStore` - Session, passcode status
     - `useProfileStore` - Current profile, profile list
     - `useReportStore` - Report generation state
     - `useSettingsStore` - App settings, AI mode

**Deliverables**:
- ✅ Verified encryption system working
- [ ] Static data libraries bundled
- [ ] Zustand stores configured
- [ ] Unit tests for storage layer (80% coverage)

**Testing**:
- [ ] Create, read, update, delete profiles (encrypted)
- [ ] Create, read, update, delete reports (encrypted)
- [ ] Passcode setup and unlock flow
- [ ] Auto-lock after timeout
- [ ] Export/import data with encryption

---

### PHASE 2: ASTROLOGY ENGINE (Week 3-4)

#### Goal: Build pure JavaScript astrology calculation engine

**Tasks**:
1. **Research & Design**
   - [ ] Review Flutter app implementation (`mobile/soul_journey/lib/domain/engine/`)
   - [ ] Select JavaScript astronomy library (astronomy-engine, astronomia, or build custom)
   - [ ] Design API surface for AstrologyEngine

2. **Implement Core Calculations**
   - [ ] `calculateZodiacSign(date)` - Tropical zodiac from date
   - [ ] `calculateMoonSign(date, time, lat, lon)` - Moon's position in zodiac
   - [ ] `calculateAscendant(date, time, lat, lon)` - Rising sign
   - [ ] `calculateNakshatra(date, time, lat, lon)` - Birth star (27 divisions)
   - [ ] `calculatePlanetaryPositions(date, time)` - Sun, Moon, planets
   - [ ] `calculateHouses(date, time, lat, lon)` - 12 house cusps
   - [ ] `calculateDashaPeriod(date)` - Vimshottari Dasha
   - [ ] `calculateKarmicNumber(date)` - Numerology
   - [ ] `calculateSoulNumber(name)` - Name numerology

3. **Implement Vedic-Specific Logic**
   - [ ] Nakshatra lord calculation
   - [ ] Planetary dignities (exaltation, debilitation)
   - [ ] Aspect calculations (Vedic aspects, not Western)
   - [ ] Yoga detection (Gaja Kesari, Raj Yoga, etc.)
   - [ ] Dosha analysis (Manglik, Kaal Sarp, etc.)

4. **Bundle Ephemeris Data**
   - [ ] Extract planetary positions 1900-2100
   - [ ] Format as lookup tables (JSON)
   - [ ] Compress and bundle (~50-100KB)

**Deliverables**:
- [ ] `lib/astrology/engine.ts` - Complete astrology engine
- [ ] `lib/astrology/ephemeris.json` - Bundled planetary data
- [ ] Unit tests for all calculations (90% coverage)
- [ ] Accuracy validation (compare with Swiss Ephemeris)

**Testing**:
- [ ] Compare results with backend Python implementation
- [ ] Test edge cases (leap years, DST transitions, polar regions)
- [ ] Benchmark performance (target: <100ms for full chart)

---

### PHASE 3: REPORT GENERATION ENGINE (Week 5-6)

#### Goal: Build template-based report generation system

**Tasks**:
1. **Design Report Templates**
   - [ ] Create Mustache/Handlebars templates for each report type
   - [ ] Define template variables and structure
   - [ ] Store templates as wisdom cards or separate store

2. **Implement Report Generator**
   - [ ] `generateBirthChartReport(profile, chart)` - Birth chart interpretation
   - [ ] `generateKarmicJourneyReport(profile, chart)` - Soul purpose
   - [ ] `generatePastLivesReport(profile, chart)` - Past life analysis
   - [ ] `generateFutureLivesReport(profile, chart)` - Future predictions
   - [ ] `generatePresentLifeReport(profile, chart)` - Current life guidance
   - [ ] `generateLifeEventsReport(profile, chart, years)` - Timeline
   - [ ] `generateKarmicRemediesReport(profile, chart)` - Remedies
   - [ ] `generatePredictionReport(profile, chart, period)` - Daily/weekly/monthly

3. **Implement Wisdom Card Matcher**
   - [ ] Rule-based matching engine
   - [ ] Condition evaluation (zodiac, element, nakshatra, etc.)
   - [ ] Relevance scoring algorithm
   - [ ] Template interpolation

4. **Multi-Page Report Structure**
   - [ ] Split reports into logical pages
   - [ ] Navigation between pages
   - [ ] Table of contents generation
   - [ ] Markdown rendering

**Deliverables**:
- [ ] `lib/reports/generator.ts` - Report generation engine
- [ ] `lib/wisdom/matcher.ts` - Wisdom card matcher
- [ ] Report templates (Mustache/Handlebars)
- [ ] Pre-seeded wisdom cards (100+ cards)

**Testing**:
- [ ] Generate all report types for test profiles
- [ ] Verify wisdom card matching logic
- [ ] Test template rendering edge cases
- [ ] Validate report structure and formatting

---

### PHASE 4: UI/UX REBUILD (Week 7-8)

#### Goal: Rebuild frontend UI to use offline engines

**Tasks**:
1. **Refactor Existing Pages**
   - [ ] `/birth-chart` - Use local astrology engine
   - [ ] `/horoscope` - Use local report generator
   - [ ] `/karmic-journey` - Use local report generator
   - [ ] `/past-lives` - Use local report generator
   - [ ] `/future` - Use local report generator
   - [ ] `/remedies` - Use local report generator
   - [ ] `/daily-insights` - Use local prediction generator

2. **Remove Backend Dependencies**
   - [ ] Replace axios calls with local engine calls
   - [ ] Remove `lib/api.ts` (or keep only for AI enhancement)
   - [ ] Update error handling (no network errors in offline mode)

3. **Add AI Mode Toggle**
   - [ ] Settings page: AI mode selector (Offline/Hybrid/Chatbot)
   - [ ] Visual indicators for AI-enhanced reports
   - [ ] Network status indicator
   - [ ] Graceful fallback when backend unavailable

4. **Enhance Report Viewer**
   - [ ] Multi-page navigation
   - [ ] Bookmark/favorite pages
   - [ ] Print-friendly view
   - [ ] Share report (encrypted export)

**Deliverables**:
- [ ] Fully functional offline UI
- [ ] AI mode toggle working
- [ ] All report types generating offline
- [ ] No errors when network unavailable

**Testing**:
- [ ] Test all flows with airplane mode enabled
- [ ] Test AI enhancement (online)
- [ ] Test fallback when backend down
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)

---

### PHASE 5: BACKEND SIMPLIFICATION (Week 9)

#### Goal: Simplify backend to AI proxy only

**Tasks**:
1. **Remove Unnecessary Endpoints**
   - [ ] Delete `/api/astrology/*` (all calculation endpoints)
   - [ ] Delete `/api/karmic-journey/*` (except AI enhancement)
   - [ ] Delete `/api/past-lives/*` (except AI enhancement)
   - [ ] Delete `/api/future-lives/*` (except AI enhancement)
   - [ ] Delete `/api/present-life/*` (except AI enhancement)
   - [ ] Delete `/api/life-events/*` (except AI enhancement)
   - [ ] Delete `/api/karmic-remedies/*` (except AI enhancement)
   - [ ] Delete `/api/predictions/*` (except AI enhancement)
   - [ ] Delete `/api/users/*` (no user accounts)

2. **Implement AI Enhancement Endpoints**
   - [ ] `POST /api/ai/enhance-report` - AI-enhance a report
   - [ ] `POST /api/ai/ask-question` - Chatbot mode
   - [ ] `POST /api/geocode` - Fallback geocoding (keep simple version)
   - [ ] `GET /api/health` - Health check

3. **Add Security Middleware**
   - [ ] Anonymization middleware (strip PII from requests)
   - [ ] Rate limiting (prevent abuse)
   - [ ] CORS configuration (frontend origin only)
   - [ ] Input validation (no user data stored)

4. **Optimize Deployment**
   - [ ] Remove database (stateless)
   - [ ] Remove authentication (no user accounts)
   - [ ] Reduce Docker image size
   - [ ] Switch to serverless functions (optional)

**Deliverables**:
- [ ] Simplified backend (3 endpoints only)
- [ ] Stateless API (no database)
- [ ] Security middleware configured
- [ ] Deployment size reduced by 80%+

**Testing**:
- [ ] Test AI enhancement endpoint
- [ ] Test chatbot endpoint
- [ ] Test rate limiting
- [ ] Test anonymization middleware

---

### PHASE 6: POLISH & OPTIMIZATION (Week 10)

#### Goal: Production-ready PWA

**Tasks**:
1. **Performance Optimization**
   - [ ] Code splitting (lazy load reports)
   - [ ] Tree shaking (remove unused code)
   - [ ] Bundle size optimization (target: <500KB initial)
   - [ ] Image optimization (WebP format)
   - [ ] Service worker optimization (precache critical assets only)

2. **Accessibility**
   - [ ] Screen reader support (ARIA labels)
   - [ ] Keyboard navigation
   - [ ] Focus management
   - [ ] Color contrast (WCAG 2.1 AA)
   - [ ] Reduced motion support

3. **Progressive Enhancement**
   - [ ] Works without JavaScript (basic HTML)
   - [ ] Works on slow networks (3G)
   - [ ] Works on low-end devices
   - [ ] Works across browsers (polyfills)

4. **Security Hardening**
   - [ ] Content Security Policy (CSP)
   - [ ] Subresource Integrity (SRI)
   - [ ] HTTPS enforcement
   - [ ] Clickjacking protection
   - [ ] XSS protection

5. **Documentation**
   - [ ] User guide (how to use app)
   - [ ] Privacy policy (data storage, encryption)
   - [ ] FAQ (common questions)
   - [ ] Developer docs (architecture, API)

**Deliverables**:
- [ ] Lighthouse score: 90+ (all categories)
- [ ] Bundle size: <500KB initial, <2MB total
- [ ] Accessibility audit: 100% compliant
- [ ] Security audit: All best practices followed
- [ ] Complete documentation

**Testing**:
- [ ] Lighthouse audit
- [ ] WebPageTest audit
- [ ] Accessibility audit (axe, WAVE)
- [ ] Security audit (OWASP checklist)
- [ ] Cross-device testing (mobile, tablet, desktop)

---

### PHASE 7: LAUNCH & MONITORING (Week 11-12)

#### Goal: Deploy to production and monitor

**Tasks**:
1. **Pre-Launch Checklist**
   - [ ] All tests passing (unit, integration, e2e)
   - [ ] All documentation complete
   - [ ] All security checks passed
   - [ ] All performance benchmarks met
   - [ ] Beta testing complete

2. **Deployment**
   - [ ] Deploy frontend to Vercel (or Cloudflare Pages)
   - [ ] Deploy backend to Render (or Vercel Serverless)
   - [ ] Configure CDN (Cloudflare)
   - [ ] Setup monitoring (Sentry, LogRocket)
   - [ ] Setup analytics (privacy-first: Plausible, Fathom)

3. **Soft Launch**
   - [ ] Invite beta testers (10-20 users)
   - [ ] Collect feedback
   - [ ] Fix critical bugs
   - [ ] Iterate on UX

4. **Public Launch**
   - [ ] Announce on social media
   - [ ] Submit to app directories (PWA Directory, etc.)
   - [ ] Write launch blog post
   - [ ] Prepare support channels

**Deliverables**:
- [ ] Live production deployment
- [ ] Monitoring dashboards configured
- [ ] Support documentation published
- [ ] Launch announcement

**Post-Launch**:
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Respond to user feedback
- [ ] Plan next iteration

---

## APPENDIX A: TECHNOLOGY ALTERNATIVES

### Astrology Calculation Libraries (JavaScript)

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| **astronomy-engine** | Very accurate, NASA algorithms, TypeScript | Western astrology focus | ⚠️ Use for planetary positions |
| **astronomia** | Lightweight, Meeus algorithms | Limited Vedic support | ⚠️ Use as reference |
| **swisseph-js** | WebAssembly port of Swiss Ephemeris | Large bundle (~2MB) | ❌ Too large |
| **Custom Implementation** | Full control, Vedic-specific | More development time | ✅ **RECOMMENDED** |

**Recommendation**: Use astronomy-engine for core planetary calculations, implement Vedic-specific logic (Nakshatras, Dashas) custom.

### Template Engines

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| **Mustache** | Logic-less, simple, fast | Limited features | ✅ **RECOMMENDED** |
| **Handlebars** | Helpers, partials, rich features | Slightly larger | ⚠️ Alternative |
| **Template literals** | Native, zero dependencies | Mixed code/content | ❌ Not clean |

**Recommendation**: Use Mustache for simplicity and separation of concerns.

### Static Data Sources

| Data | Source | Size | License |
|------|--------|------|---------|
| **Cities** | GeoNames | ~200KB | CC BY 4.0 |
| **Timezones** | IANA TZ Database | ~50KB | Public Domain |
| **Planetary Positions** | DE421 Ephemeris (subset) | ~100KB | Public Domain |
| **Wisdom Cards** | Custom/Public Domain | ~50KB | MIT |

---

## APPENDIX B: SECURITY CONSIDERATIONS

### Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| **Device theft** | Medium | High | Passcode lock, encryption |
| **Data exfiltration** | Low | High | No cloud storage, local only |
| **Man-in-the-middle** | Medium | Low | HTTPS, minimal data transmission |
| **Malicious browser extension** | Low | Medium | CSP, read-only data |
| **Passcode brute force** | Low | High | Rate limiting, auto-wipe option |
| **Backend compromise** | Medium | Low | Anonymized data only |

### Privacy Guarantees

✅ **Guaranteed**:
- All user data encrypted at rest (AES-256-GCM)
- No data transmitted to backend (offline mode)
- No analytics or telemetry by default
- No user accounts or authentication
- No cookies (except session for passcode)

⚠️ **Opt-In Only**:
- AI enhancement (anonymized data only)
- Geocoding fallback (place name only, no user data)

❌ **Never**:
- Full birth data to backend
- User names to backend
- Raw reports to backend
- Tracking or profiling

---

## APPENDIX C: COST ANALYSIS

### Current Deployment Costs (Monthly)

| Service | Cost | Usage |
|---------|------|-------|
| Vercel (Frontend) | $0 | Hobby plan, <100k requests |
| Render (Backend) | $7 | Starter plan, 512MB RAM |
| **Total** | **$7/mo** | |

### Post-Rebuild Costs (Monthly)

| Service | Cost | Usage |
|---------|------|-------|
| Vercel (Frontend) | $0 | Hobby plan, mostly cached |
| Render (Backend) | $0-7 | Free tier (AI proxy only) |
| **Total** | **$0-7/mo** | |

**Cost Savings**: Up to $7/mo (100% if backend on free tier)

### Scaling Costs (10,000 users)

**Current**:
- Backend: $25/mo (Standard plan, 2GB RAM)
- Database: $7/mo (PostgreSQL)
- Total: $32/mo

**Post-Rebuild**:
- Backend: $0-7/mo (AI enhancement only, stateless)
- Database: $0 (no database)
- Total: $0-7/mo

**Savings**: $25-32/mo (78-100%)

---

## CONCLUSION

### Summary

The BhriguWelt PWA rebuild is **highly feasible** because:

1. ✅ **Strong Foundation**: Encryption, storage, and PWA infrastructure already implemented
2. ✅ **Proven Feasibility**: Flutter mobile app demonstrates offline astrology works
3. ✅ **Clear Architecture**: Offline-first core with optional AI enhancement
4. ✅ **Privacy-First**: No user data leaves device (except opt-in AI)
5. ✅ **Cost-Effective**: Reduced infrastructure costs by 80-100%

### Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Astrology calculation accuracy** | Port from Flutter app, validate against Swiss Ephemeris |
| **Bundle size too large** | Code splitting, lazy loading, compression |
| **Browser compatibility** | Polyfills, progressive enhancement |
| **User expects AI features** | Clear messaging, offline mode as default |

### Success Criteria

- [ ] App works 100% offline (no network required)
- [ ] All reports generate offline (birth chart, karmic journey, etc.)
- [ ] Encryption secure (AES-256-GCM, PBKDF2)
- [ ] Performance fast (Lighthouse 90+)
- [ ] User-friendly (can export/import data)
- [ ] Privacy-first (no data leaks)

---

## NEXT STEPS

### Immediate Actions (Awaiting Approval)

1. **Review this document** - Stakeholder sign-off
2. **Prioritize features** - What must ship in v1.0?
3. **Set timeline** - Allocate resources for 12-week plan
4. **Begin Phase 1** - Test existing infrastructure

### Questions for Stakeholders

1. **Feature Scope**: Should v1.0 include ALL report types or start with Birth Chart only?
2. **AI Strategy**: Is AI enhancement a must-have or nice-to-have?
3. **Timeline**: Is 12 weeks acceptable or do we need to accelerate?
4. **Resources**: How many developers allocated to this project?
5. **Quality Bar**: What is acceptable vs. perfect (MVP vs. polish)?

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Status**: PENDING APPROVAL

Once approved, we will begin implementation following the phased plan outlined above.
