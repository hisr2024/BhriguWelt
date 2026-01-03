# BhriguWelt - Offline-First Soul Journey App 🔐✨

![Flutter](https://img.shields.io/badge/Flutter-3.2+-blue.svg)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-green.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Security](https://img.shields.io/badge/Security-SQLCipher%20AES--256-red.svg)

**🎯 Mission:** Privacy-first mobile astrology app inspired by ancient Vedic wisdom - **100% offline, fully encrypted, no cloud dependency.**

---

## 📱 Soul Journey Mobile App

The **Soul Journey** Flutter app is a production-ready, offline-first astrology application that generates comprehensive Soul Journey reports with complete privacy and security. All data stays encrypted on your device.

### ✨ Features

- 🔐 **PIN & Biometric Authentication** - Secure app lock with optional Face ID/Touch ID
- 📱 **100% Offline** - No internet required for any functionality
- 🗄️ **Encrypted Storage** - SQLCipher encryption (AES-256) for all user data
- 🔮 **7-Page Soul Journey Reports** - Comprehensive astrological insights
- 🌆 **Offline City Database** - 50+ major cities worldwide with search
- 📚 **Wisdom Cards System** - Customizable ancient wisdom database (30 demo cards)
- 📄 **Multi-Page PDF Export** - Beautiful, shareable PDF reports
- 🎨 **Sacred Geometry UI** - Animated Om logo matching spiritual traditions
- 🌓 **Cross-Platform** - Works on iOS, Android, and Web

### 🔒 Security Model

**Privacy-First Architecture:**
- All data encrypted at rest with SQLCipher (AES-256)
- Encryption keys stored in iOS Keychain / Android Keystore
- PIN required (4 digits) + optional biometric unlock
- Auto-lock on background and configurable timeout
- No network requests - 100% local processing
- No analytics or telemetry

**Threat Model:**
| Threat | Mitigation |
|--------|-----------|
| Device theft | PIN/biometric lock + encrypted database |
| Data extraction | SQLCipher encryption + secure key storage |
| Memory dumps | Sensitive data cleared after use |
| Backup exposure | Keys excluded from device backups |
| Unauthorized export | PIN re-auth required for data import/export |

---

## 🚀 Quick Start

### Prerequisites
- Flutter 3.2+ and Dart 3.0+
- iOS 13+ / Android 6.0+ / Modern browser

### Installation

```bash
# Navigate to mobile app
cd mobile/soul_journey

# Install dependencies
flutter pub get

# Generate code (Freezed & Riverpod)
flutter pub run build_runner build --delete-conflicting-outputs

# Run on iOS Simulator
flutter run -d "iPhone 14"

# Run on Android
flutter run -d emulator-5554

# Run on Web
flutter run -d chrome
```

### Build for Production

```bash
# iOS (requires Xcode)
flutter build ios --release
# Then open ios/Runner.xcworkspace to archive

# Android APK
flutter build apk --release

# Android App Bundle (Google Play)
flutter build appbundle --release

# Web
flutter build web --release
```

---

## 📂 Project Structure

```
BhriguWelt/
├── mobile/soul_journey/     ← 🎯 PRIMARY: Offline Flutter app
│   ├── lib/
│   │   ├── core/           # Security, constants, utils
│   │   ├── data/           # Database, models, repositories
│   │   ├── domain/         # Business logic, interpretation engine
│   │   └── ui/             # Screens, widgets, theme
│   ├── assets/             # Cities DB, wisdom cards, fonts
│   └── test/               # Unit and widget tests
├── legacy/                  ← ⚠️ ARCHIVED: Cloud components (optional)
│   ├── backend/            # Python Flask API (Render)
│   ├── frontend/           # Next.js web UI (Vercel)
│   └── MIGRATION_NOTES.md  # Cloud decommissioning guide
└── docs/                    # Documentation
```

---

## 🎓 Architecture

### Mobile App: Clean Architecture

```
lib/
├── core/
│   ├── constants/          # App constants
│   ├── security/           # PIN, biometric, app lock
│   └── utils/              # PDF generator, date utils
├── data/
│   ├── database/           # SQLCipher setup
│   ├── models/             # Profile, WisdomCard, Report (Freezed)
│   └── repositories/       # Profile, Report, WisdomCard, City repos
├── domain/
│   ├── entities/           # Domain entities
│   └── engine/             # InterpretationEngine (report generation)
└── ui/
    ├── screens/            # Onboarding, PIN, Profile, Report, Settings
    ├── widgets/            # Animated logo, reusable components
    └── theme/              # App theme and colors
```

### Tech Stack

- **Framework:** Flutter 3.2+ (Dart)
- **State Management:** Riverpod 2.4+
- **Database:** SQLCipher (encrypted SQLite)
- **Storage:** Flutter Secure Storage (Keychain/Keystore)
- **Search:** SQLite FTS5 (full-text search)
- **PDF:** pdf + printing packages
- **Animations:** flutter_animate
- **Auth:** local_auth (biometrics)
- **Models:** freezed + json_serializable

---

## 📖 How It Works

### 1. First Launch: Onboarding
- Set up 4-digit PIN (required)
- PIN hashed with PBKDF2 (100,000 iterations)
- Database encryption key derived from PIN
- Keys stored in secure platform storage

### 2. Create Profile
- Enter name, date of birth, time of birth
- Search offline city database for birth place
- Profile encrypted and saved locally

### 3. Generate Soul Journey Report
- Interpretation engine calculates:
  - Zodiac sign, nakshatra, elements
  - Karmic number, soul signature
  - Past life patterns
  - Future timeline (year-by-year)
- Wisdom cards matched based on profile features
- 7 report pages generated:
  1. **Soul Signature** - Core essence and identity
  2. **Past Life Threads** - Karmic patterns from previous lives
  3. **Present Karmic Phase** - Current challenges and gifts
  4. **Future Outlook** - Year-by-year predictions (2024-2032)
  5. **Relationships & Marriage Karma** - Partnership guidance
  6. **Remedies & Practices** - Mantras, rituals, daily practices
  7. **Complete Soul Journey Summary** - Integrated wisdom

### 4. Export to PDF
- Multi-page PDF with sacred geometry design
- Share or print from device
- Requires PIN re-authentication

---

## 🧪 Testing

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html

# Run specific test
flutter test test/unit/interpretation_engine_test.dart
```

---

## 🗂️ Legacy Cloud Components (Optional)

The `/legacy/` directory contains the original cloud-based architecture (Python backend + Next.js frontend) that was deployed to Render and Vercel. **These components are no longer required for the mobile app.**

### Why Legacy?

The mobile app provides all functionality **100% offline**:
- ✅ Astrological calculations → Native Dart engine
- ✅ User profiles → Encrypted local SQLite
- ✅ Wisdom cards → Bundled JSON + local DB
- ✅ Reports → Local generation and rendering
- ✅ Data persistence → Encrypted local storage

### Migrating from Cloud

If you have existing user data in the legacy backend:

1. Export from backend: `cd legacy/backend && python scripts/export_profiles.py`
2. Import to mobile app: Use "Import Data" feature (requires PIN)

See `/legacy/MIGRATION_NOTES.md` for detailed migration guide.

---

## 🔧 Configuration

### App Constants

Edit `mobile/soul_journey/lib/core/constants/app_constants.dart`:

```dart
class AppConstants {
  static const int lockTimeoutSeconds = 300;     // 5 minutes
  static const int pinLength = 4;                // 4-digit PIN
  static const int futureTimelineStartYear = 2024;
  static const int futureTimelineEndYear = 2032;
}
```

### Wisdom Cards

Add custom wisdom cards via:
1. **In-app:** Wisdom Library → Add New Card (requires PIN)
2. **JSON import:** Export/import JSON files
3. **Seed data:** Modify `assets/wisdom_cards/demo_cards.json`

**Card Structure:**
```json
{
  "tradition": "Bhrigu Samhita",
  "topic": "soul_signature",
  "tags": ["fire", "leadership"],
  "conditions": {"elements": ["Fire"]},
  "rule_text": "Fire souls are natural leaders",
  "output_template": "Your {{element}} nature makes you...",
  "priority": 10
}
```

---

## 🎨 Customization

### Colors

Edit `mobile/soul_journey/lib/ui/theme/app_theme.dart`:

```dart
Cyan:   #4DEEEA  (accent, highlights)
Purple: #8A5CF6  (primary, mystical)
Lime:   #BEF264  (energy, growth)
Yellow: #FACC15  (wisdom, light)
Pink:   #EC4899  (compassion, feminine)
```

### City Database

Add cities to `assets/cities/cities.json`:

```json
{
  "name": "New Delhi",
  "country": "India",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "timezone": "Asia/Kolkata"
}
```

---

## 🌐 Deployment

### iOS App Store

1. Build: `flutter build ios --release`
2. Open `ios/Runner.xcworkspace` in Xcode
3. Archive and upload to App Store Connect
4. Submit for review

### Google Play Store

1. Build: `flutter build appbundle --release`
2. Upload to Google Play Console
3. Complete store listing
4. Submit for review

### Web (Optional - Demo Only)

```bash
flutter build web --release
# Deploy build/web directory to any static host
```

**⚠️ Note:** Web version has limited encryption compared to mobile. Use for demo only.

---

## 📱 Platform-Specific Setup

### iOS Requirements

- iOS 13+
- Xcode 14+
- Add to `ios/Runner/Info.plist`:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Unlock Soul Journey with Face ID</string>
```

### Android Requirements

- Android 6.0+ (API 23)
- Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC"/>
```

---

## 🐛 Troubleshooting

### Build Errors with Freezed

```bash
flutter pub run build_runner clean
flutter pub run build_runner build --delete-conflicting-outputs
```

### Database Not Encrypted

Ensure PIN is set on first launch. Delete and reinstall app to reset.

### Biometric Not Working

- Verify device has biometric hardware
- Check user has enrolled Face ID/Touch ID/Fingerprint
- Review platform-specific permissions

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

- Inspired by **Bhrigu Samhita** and **Nadi Jyotisha** ancient wisdom traditions
- Sacred geometry design influenced by Sri Yantra
- Built with reverence for Vedic sciences

---

## 🛣️ Roadmap

- [ ] Voice-guided meditation for remedies
- [ ] Dasha (planetary period) calculations
- [ ] Compatibility matching between profiles
- [ ] Export to DOCX/HTML formats
- [ ] Internationalization (Hindi, Sanskrit, Tamil)
- [ ] Daily mantra reminder widget
- [ ] Apple Watch / Wear OS companion app

---

## 📞 Support

- **Documentation:** See `/mobile/soul_journey/README.md`
- **Issues:** Open a GitHub issue
- **Contributions:** See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**ॐ शान्तिः शान्तिः शान्तिः**

*(Om Shanti Shanti Shanti - Peace, Peace, Peace)*

May your journey through this app bring wisdom, clarity, and spiritual growth. 🌟
