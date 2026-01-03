# Interpretation Engine Architecture

## Visual Overview

This document provides architectural diagrams and data flow visualizations for the Interpretation Engine.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Soul Journey App                         │
│                        (Flutter Mobile)                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ User Input
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI Layer (Screens)                         │
│  • Profile Creation Screen                                      │
│  • Report Viewer Screen                                         │
│  • PDF Export Screen                                            │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Profile Data
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Domain Layer (Business Logic)                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │         InterpretationEngine                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│    │
│  │  │   Feature    │  │   Wisdom     │  │   Report    ││    │
│  │  │  Extraction  │─▶│     Card     │─▶│ Composition ││    │
│  │  │              │  │   Matching   │  │             ││    │
│  │  └──────────────┘  └──────────────┘  └─────────────┘│    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Generated Report
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer (Persistence)                     │
│  • ProfileRepository                                            │
│  • WisdomCardRepository                                         │
│  • ReportRepository                                             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ SQL Queries
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              SQLCipher Database (AES-256 Encrypted)             │
│  • profiles table                                               │
│  • wisdom_cards table (with FTS5 search)                        │
│  • reports table                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Interpretation Engine Pipeline

```
┌──────────────┐
│ User Profile │
│  Input Data  │
└──────┬───────┘
       │
       │ {name, dob, time, place}
       │
       ▼
┌─────────────────────────────────────────────────┐
│         STAGE 1: Feature Extraction             │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Calculate Derived Features:              │  │
│  │ • Age (from DOB)                         │  │
│  │ • Zodiac Sign (from month/day)           │  │
│  │ • Nakshatra (from day-of-year)           │  │
│  │ • Element (from zodiac)                  │  │
│  │ • Life Phase (from age ranges)           │  │
│  │ • Archetype (from birth pattern)         │  │
│  │ • Karmic Number (numerology)             │  │
│  └──────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Feature Map
                   │ {age: 35, zodiacSign: "Taurus", ...}
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│       STAGE 2: Wisdom Card Matching             │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ For each Wisdom Card:                    │  │
│  │                                          │  │
│  │  1. Evaluate Conditions                  │  │
│  │     • Age range check                    │  │
│  │     • Zodiac/nakshatra check            │  │
│  │     • Element check                      │  │
│  │     • Life phase check                   │  │
│  │     • Custom conditions check            │  │
│  │                                          │  │
│  │  2. If all conditions pass → Match      │  │
│  │                                          │  │
│  │  3. Sort matched cards by priority      │  │
│  └──────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Matched Cards
                   │ [Card1(priority:10), Card2(priority:9), ...]
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│        STAGE 3: Report Composition              │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Generate 7 Pages:                        │  │
│  │                                          │  │
│  │  Page 1: Soul Signature                  │  │
│  │    • Filter cards: soul_signature        │  │
│  │    • Build narrative                     │  │
│  │    • Add highlights & blessings          │  │
│  │                                          │  │
│  │  Page 2: Past Life Threads               │  │
│  │    • Filter cards: past_life             │  │
│  │    • Derive past life indicators         │  │
│  │    • Add warnings                        │  │
│  │                                          │  │
│  │  Page 3: Present Karmic Phase            │  │
│  │    • Filter cards: present/career/health │  │
│  │    • Derive current challenges           │  │
│  │                                          │  │
│  │  Page 4: Future Outlook                  │  │
│  │    • Generate timeline (2024-2032)       │  │
│  │    • Identify peak years                 │  │
│  │                                          │  │
│  │  Page 5: Relationships & Marriage        │  │
│  │    • Filter cards: relationships         │  │
│  │    • Derive compatibility                │  │
│  │                                          │  │
│  │  Page 6: Remedies & Practices            │  │
│  │    • Derive element-based remedies       │  │
│  │    • Generate mantras & rituals          │  │
│  │                                          │  │
│  │  Page 7: Complete Summary                │  │
│  │    • Synthesize all insights             │  │
│  │    • Final Rishi statement               │  │
│  └──────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Complete Report
                   │ {id, pages[7], timestamp}
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│              Report Output                      │
│  • Display in app (paginated viewer)            │
│  • Export to PDF                                │
│  • Save to encrypted database                   │
└─────────────────────────────────────────────────┘
```

---

## 3. Feature Extraction Detail

```
Input: Profile {name, dob:"1990-05-14", time, place}
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   ┌─────────┐           ┌──────────┐
   │  DOB    │           │  Current │
   │ Parser  │           │   Date   │
   └────┬────┘           └─────┬────┘
        │                      │
        │ (1990, 5, 14)        │ (2026, 1, 3)
        │                      │
        └──────────┬───────────┘
                   │
                   ▼
            ┌──────────────┐
            │ Age = 35 yrs │
            └──────┬───────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐
│ Zodiac  │  │ Nakshatra│  │  Karmic  │
│   Sign  │  │   Calc   │  │  Number  │
│  (M/D)  │  │ (DayOfYr)│  │  (Sum)   │
└────┬────┘  └─────┬────┘  └─────┬────┘
     │             │             │
     │ Taurus      │ Ashlesha    │ 11
     │             │             │
     └──────┬──────┴──────┬──────┘
            │             │
            ▼             ▼
      ┌──────────┐  ┌──────────┐
      │ Element  │  │   Life   │
      │  Lookup  │  │  Phase   │
      │  Table   │  │  Lookup  │
      └─────┬────┘  └─────┬────┘
            │             │
            │ Earth       │ Adulthood
            │             │
            └──────┬──────┘
                   │
                   ▼
            ┌──────────────────┐
            │ Archetype Calc   │
            │ (M+D+age%10)%8   │
            └──────┬───────────┘
                   │
                   │ The Mystic Seeker
                   │
                   ▼
        ┌──────────────────────────┐
        │   Complete Feature Map   │
        │  {age, zodiac, element,  │
        │   nakshatra, archetype,  │
        │   karmic, lifePhase}     │
        └──────────────────────────┘
```

---

## 4. Wisdom Card Matching Flow

```
                     Matched Cards (Sorted)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  ┌──────────┐        ┌──────────┐       ┌──────────┐
  │  Card A  │        │  Card B  │       │  Card C  │
  │Priority:│        │Priority:│       │Priority:│
  │   10     │        │    9     │       │    8     │
  └──────────┘        └──────────┘       └──────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
          ┌─────────────┐    ┌─────────────┐
          │  Filter by  │    │  Filter by  │
          │   Topic:    │    │   Topic:    │
          │soul_signature│    │ past_life   │
          └──────┬──────┘    └──────┬──────┘
                 │                  │
        ┌────────┴──────┐  ┌────────┴──────┐
        │  Cards: A, B  │  │   Cards: C    │
        └───────┬───────┘  └───────┬───────┘
                │                  │
                ▼                  ▼
         ┌────────────┐     ┌────────────┐
         │  Page 1:   │     │  Page 2:   │
         │    Soul    │     │    Past    │
         │ Signature  │     │   Lives    │
         └────────────┘     └────────────┘
```

**Matching Logic (Pseudocode):**

```
FOR each card IN wisdomCardLibrary:
    matchScore = 0
    
    // Age check
    IF card.conditions.minAge AND card.conditions.maxAge:
        IF features.age BETWEEN minAge AND maxAge:
            matchScore += 1
        ELSE:
            SKIP card  // Hard constraint
    
    // Element check
    IF card.conditions.elements:
        IF features.element IN card.conditions.elements:
            matchScore += 1
        ELSE:
            SKIP card  // Hard constraint
    
    // Zodiac check
    IF card.conditions.zodiacSigns:
        IF features.zodiacSign IN card.conditions.zodiacSigns:
            matchScore += 1
        ELSE:
            SKIP card  // Hard constraint
    
    // All conditions passed → Add to matched list
    IF matchScore > 0:
        ADD card TO matchedCards WITH priority=card.priority

// Sort by priority
SORT matchedCards BY priority DESC
```

---

## 5. Report Page Generation

```
┌────────────────────────────────────────────────┐
│  Page Generation Function                      │
│                                                │
│  Input:                                        │
│  • Profile data                                │
│  • Extracted features                          │
│  • Matched wisdom cards                        │
│                                                │
│  Process:                                      │
│  1. Filter cards by topic                      │
│  2. Select top N cards by priority             │
│  3. Build narrative sections                   │
│  4. Render card templates with features        │
│  5. Add metadata (bullets, highlights, etc.)   │
│                                                │
│  Output: ReportPage                            │
└────────────────────────────────────────────────┘
```

**Page-Specific Card Selection:**

```
Page 1 (Soul Signature):
  Topics: ["soul_signature", "spiritual"]
  Max cards: 3
  Sort by: priority DESC
  ↓
  Selected: Card A (pri:10), Card B (pri:9), Card C (pri:8)

Page 2 (Past Life):
  Topics: ["past_life"]
  Max cards: 3
  Sort by: priority DESC
  ↓
  Selected: Card D (pri:9), Card E (pri:7)

Page 3 (Present):
  Topics: ["present", "career", "health"]
  Max cards: 4
  Sort by: priority DESC
  ↓
  Selected: Card F (pri:10), Card G (pri:8), ...

... (similar for pages 4-7)
```

---

## 6. Data Flow: End-to-End

```
┌───────────────┐
│     User      │
│     Input     │
└───────┬───────┘
        │
        │ Profile {Arjun, 1990-05-14, 08:15, Delhi}
        │
        ▼
┌─────────────────────────────┐
│  1. Validation              │
│     • DOB format valid?     │
│     • Time format valid?    │
│     • Place resolved?       │
└──────────┬──────────────────┘
           │
           │ ✓ Valid profile
           │
           ▼
┌─────────────────────────────┐
│  2. Feature Extraction      │
│     calculateAge()          │
│     calculateZodiac()       │
│     calculateNakshatra()    │
│     calculateElement()      │
│     calculateLifePhase()    │
│     calculateArchetype()    │
│     calculateKarmicNumber() │
└──────────┬──────────────────┘
           │
           │ Features {age:35, zodiac:"Taurus", ...}
           │
           ▼
┌─────────────────────────────┐
│  3. Load Wisdom Cards       │
│     FROM database           │
│     OR demo_cards.json      │
└──────────┬──────────────────┘
           │
           │ WisdomCard[] (30 cards)
           │
           ▼
┌─────────────────────────────┐
│  4. Match Cards             │
│     FOR each card:          │
│       evaluateConditions()  │
│     SORT by priority        │
└──────────┬──────────────────┘
           │
           │ Matched cards (12 cards)
           │
           ▼
┌─────────────────────────────┐
│  5. Generate Pages          │
│     Page 1: Soul Signature  │
│     Page 2: Past Life       │
│     Page 3: Present         │
│     Page 4: Future          │
│     Page 5: Relationships   │
│     Page 6: Remedies        │
│     Page 7: Summary         │
└──────────┬──────────────────┘
           │
           │ ReportModel {7 pages}
           │
           ▼
┌─────────────────────────────┐
│  6. Persist Report          │
│     Save to database        │
│     (AES-256 encrypted)     │
└──────────┬──────────────────┘
           │
           │ Report ID: abc-123-xyz
           │
           ▼
┌─────────────────────────────┐
│  7. Display Report          │
│     • Paginated viewer      │
│     • PDF export option     │
│     • Share/print options   │
└─────────────────────────────┘
```

---

## 7. Database Schema

```sql
-- Profiles table
CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date_of_birth INTEGER NOT NULL,  -- Unix timestamp
    time_of_birth TEXT NOT NULL,     -- HH:MM format
    place_of_birth TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    timezone TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Wisdom Cards table
CREATE TABLE wisdom_cards (
    id TEXT PRIMARY KEY,
    tradition TEXT NOT NULL,
    topic TEXT NOT NULL,
    tags TEXT NOT NULL,              -- JSON array as string
    conditions_json TEXT NOT NULL,   -- JSON object as string
    rule_text TEXT NOT NULL,
    output_template TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- Full-text search index for wisdom cards
CREATE VIRTUAL TABLE wisdom_cards_fts USING fts5(
    tradition,
    topic,
    tags,
    rule_text,
    output_template,
    content='wisdom_cards'
);

-- Reports table
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    soul_signature TEXT NOT NULL,        -- JSON page
    past_life_threads TEXT NOT NULL,     -- JSON page
    present_karmic_phase TEXT NOT NULL,  -- JSON page
    future_outlook TEXT NOT NULL,        -- JSON page
    relationships_karma TEXT NOT NULL,   -- JSON page
    remedies_practices TEXT NOT NULL,    -- JSON page
    complete_summary TEXT NOT NULL,      -- JSON page
    generated_at INTEGER NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_wisdom_cards_topic ON wisdom_cards(topic);
CREATE INDEX idx_wisdom_cards_priority ON wisdom_cards(priority DESC);
CREATE INDEX idx_reports_profile_id ON reports(profile_id);
CREATE INDEX idx_reports_generated_at ON reports(generated_at DESC);
```

---

## 8. Component Interaction

```
┌────────────────────────────────────────────────────────────┐
│                      UI Components                         │
├────────────────────────────────────────────────────────────┤
│  ProfileCreateScreen ──┐                                   │
│  ReportViewerScreen ───┼─── Riverpod Providers ───┐       │
│  PDFExportScreen ──────┘                           │       │
└─────────────────────────────────────────────┬──────┴───────┘
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────┐
│                   State Management                         │
├────────────────────────────────────────────────────────────┤
│  profileProvider                                           │
│  wisdomCardProvider                                        │
│  reportProvider                                            │
│  interpretationEngineProvider                              │
└─────────────────────────────────────────┬──────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                      │
├────────────────────────────────────────────────────────────┤
│  InterpretationEngine                                      │
│  ├─ extractFeatures()                                      │
│  ├─ matchWisdomCards()                                     │
│  └─ generateReport()                                       │
└─────────────────────────────────────────┬──────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────┐
│                    Repository Layer                        │
├────────────────────────────────────────────────────────────┤
│  ProfileRepository                                         │
│  WisdomCardRepository                                      │
│  ReportRepository                                          │
└─────────────────────────────────────────┬──────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────┐
│                     Data Layer                             │
├────────────────────────────────────────────────────────────┤
│  DatabaseHelper (SQLCipher)                                │
│  ├─ CREATE                                                 │
│  ├─ READ                                                   │
│  ├─ UPDATE                                                 │
│  └─ DELETE                                                 │
└────────────────────────────────────────────────────────────┘
```

---

## 9. Security Architecture

```
┌──────────────────────────────────────────────────────┐
│              User Authentication                     │
│  • PIN (4-digit)                                     │
│  • Biometric (Face ID / Touch ID)                    │
└───────────────────┬──────────────────────────────────┘
                    │
                    │ Authenticated
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│            App Unlock & Encryption Key               │
│  • Retrieve key from iOS Keychain / Android Keystore│
│  • Decrypt SQLCipher database                        │
└───────────────────┬──────────────────────────────────┘
                    │
                    │ Decryption Key
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│         SQLCipher Database (AES-256)                 │
│  • All user data encrypted at rest                   │
│  • Profiles encrypted                                │
│  • Reports encrypted                                 │
│  • Wisdom cards can be plain text (public data)      │
└───────────────────┬──────────────────────────────────┘
                    │
                    │ Decrypted data in memory
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│          Application Memory (Runtime)                │
│  • Sensitive data cleared after use                  │
│  • Auto-lock on background (configurable timeout)    │
│  • Memory dumps protected by OS                      │
└──────────────────────────────────────────────────────┘
```

**Security Layers:**

1. **Authentication**: PIN + optional biometric
2. **Encryption at Rest**: SQLCipher (AES-256)
3. **Key Storage**: iOS Keychain / Android Keystore
4. **Memory Protection**: Clear sensitive data, auto-lock
5. **No Network**: 100% offline, no data transmission

---

## 10. Performance Optimization

**Caching Strategy:**

```
┌─────────────────────────────────────────┐
│  Request: Generate Report               │
└───────────────┬─────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ Check Cache   │
        │ (by profile)  │
        └───┬───────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌────────┐      ┌─────────┐
│ Cache  │      │  Cache  │
│  Hit   │      │  Miss   │
└───┬────┘      └────┬────┘
    │                │
    │                ▼
    │        ┌───────────────┐
    │        │   Generate    │
    │        │     Report    │
    │        └───────┬───────┘
    │                │
    │                ▼
    │        ┌───────────────┐
    │        │  Store in     │
    │        │    Cache      │
    │        └───────┬───────┘
    │                │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │ Return Report  │
    └────────────────┘
```

**Performance Metrics:**

| Operation | Time | Notes |
|-----------|------|-------|
| Feature Extraction | < 1ms | Pure calculation, no I/O |
| Card Matching (100 cards) | < 5ms | In-memory filtering |
| Card Matching (1000 cards) | < 10ms | Scales linearly |
| Page Generation (1 page) | < 15ms | Template rendering |
| Full Report (7 pages) | < 100ms | All pages combined |
| Database Save | < 50ms | SQLCipher encryption overhead |
| PDF Export | < 2s | External library overhead |

---

## 11. Error Handling

```
                Input Validation
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Invalid DOB │ │Invalid Time │ │Invalid Place│
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────┬───────┴───────┬───────┘
               │               │
               ▼               ▼
        ┌────────────┐  ┌────────────┐
        │   Show     │  │    Log     │
        │   Error    │  │   Error    │
        │  Message   │  │  (local)   │
        └────────────┘  └────────────┘
               │
               ▼
        ┌────────────┐
        │  Return to │
        │   Input    │
        │   Screen   │
        └────────────┘
```

**Error Categories:**

1. **Input Validation Errors**
   - Invalid date format
   - Invalid time format
   - Missing required fields
   - → User-friendly error messages

2. **Processing Errors**
   - Feature extraction failure
   - Card matching failure
   - → Fallback to default values, log error

3. **Database Errors**
   - Connection failure
   - Encryption key invalid
   - → Prompt re-authentication, show error

4. **Export Errors**
   - PDF generation failure
   - File system permission denied
   - → Show error, offer retry

---

## 12. Testing Architecture

```
┌─────────────────────────────────────────────────┐
│              Unit Tests                         │
│  • Feature extraction accuracy                  │
│  • Karmic number calculation                    │
│  • Zodiac/nakshatra/element mapping             │
│  • Wisdom card condition evaluation             │
│  • Template variable substitution               │
├─────────────────────────────────────────────────┤
│  Tools: flutter_test, mockito                   │
│  Coverage: 85%+                                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│          Integration Tests                      │
│  • End-to-end report generation                 │
│  • Database CRUD operations                     │
│  • Wisdom card search (FTS5)                    │
│  • PDF export pipeline                          │
├─────────────────────────────────────────────────┤
│  Tools: flutter_test, sqflite_common_ffi        │
│  Coverage: 70%+                                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Widget Tests                          │
│  • Profile creation screen                      │
│  • Report viewer screen                         │
│  • PDF export screen                            │
│  • Navigation flows                             │
├─────────────────────────────────────────────────┤
│  Tools: flutter_test, golden_toolkit            │
│  Coverage: 60%+                                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│        Consistency Tests                        │
│  • Same input → same output (100x)              │
│  • Cross-platform consistency (iOS/Android/Web) │
│  • Deterministic timeline generation            │
├─────────────────────────────────────────────────┤
│  Tools: Custom test harness                     │
│  Pass rate: 100%                                │
└─────────────────────────────────────────────────┘
```

---

## 13. Deployment Architecture

```
┌───────────────────────────────────────────────────┐
│          Development Environment                  │
│  • Flutter SDK 3.2+                               │
│  • Dart 3.0+                                      │
│  • Android Studio / VS Code                       │
│  • iOS Simulator / Android Emulator              │
└───────────────────┬───────────────────────────────┘
                    │
                    │ flutter build
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   iOS Build     │     │  Android Build  │
│                 │     │                 │
│  • Xcode        │     │  • Gradle       │
│  • .ipa         │     │  • .apk / .aab  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  App Store      │     │  Google Play    │
│  Distribution   │     │  Distribution   │
└─────────────────┘     └─────────────────┘
```

**Build Variants:**

1. **Development**: Debug mode, verbose logging
2. **Staging**: Release mode, test encryption keys
3. **Production**: Release mode, production keys, code obfuscation

---

## 14. Monitoring & Analytics

```
┌────────────────────────────────────────┐
│      Local Analytics (No Network)      │
│                                        │
│  • Report generation count             │
│  • Average generation time             │
│  • Most matched wisdom card topics     │
│  • User engagement (page views)        │
│  • Export count (PDF)                  │
│                                        │
│  Stored in: Local SQLite database      │
│  Privacy: No external transmission     │
└────────────────────────────────────────┘
```

**Metrics Tracked (locally only):**

- Total profiles created
- Total reports generated
- Average report generation time
- Most used features
- Error rates (by type)

**Privacy-First:**
- All analytics stored locally
- No external transmission
- User can view/export/delete analytics data
- Fully GDPR compliant

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-03  
**Author:** BhriguWelt Development Team
