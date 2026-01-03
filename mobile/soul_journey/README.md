# Soul Journey - Offline-First Astrology App

![Flutter](https://img.shields.io/badge/Flutter-3.2+-blue.svg)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-green.svg)
![License](https://img.shields.io/badge/License-MIT-orange.svg)

A production-ready, offline-first astrology application inspired by **Nadi Jyotisa** and **Bhrigu Samhita** traditions. Generate comprehensive Soul Journey reports with complete privacy and security - all data stays encrypted on your device.

## ✨ Features

### Core Functionality
- 🔐 **PIN & Biometric Authentication** - Secure app lock with optional biometric unlock
- 📱 **100% Offline** - No internet required for any functionality
- 🗄️ **Encrypted Storage** - SQLCipher encryption for all user data
- 🔮 **Soul Journey Reports** - 7-page comprehensive astrological reports
- 🌆 **Offline City Database** - 50+ major cities worldwide
- 📚 **Wisdom Cards System** - Customizable ancient wisdom database (30 demo cards included)
- 📄 **PDF Export** - Generate beautiful multi-page PDF reports
- 🎨 **Beautiful UI** - Animated sacred geometry logo matching web frontend
- 🌓 **Cross-Platform** - Works on iOS, Android, and Web

### Report Pages
1. **Soul Signature** - Core essence, zodiac, nakshatra, karmic number
2. **Past Life Threads** - Karmic patterns from previous incarnations
3. **Present Karmic Phase** - Current life challenges and opportunities
4. **Future Outlook** - Year-by-year timeline (2024-2032)
5. **Relationships & Marriage Karma** - Partnership guidance and soul mate indicators
6. **Remedies & Practices** - Mantras, rituals, and daily practices
7. **Complete Soul Journey Summary** - Integrated wisdom and final Rishi statement

## 🏗️ Architecture

### Clean Architecture Layers

```
lib/
├── core/                    # Core utilities, constants, security
│   ├── constants/          # App constants
│   ├── utils/              # Helper functions
│   └── security/           # Security utilities
├── data/                    # Data layer
│   ├── database/           # SQLCipher database setup
│   ├── models/             # Data models (Freezed)
│   └── repositories/       # Data access repositories
├── domain/                  # Business logic layer
│   ├── entities/           # Domain entities
│   ├── engine/             # Interpretation engine
│   └── use_cases/          # Business use cases
└── ui/                      # Presentation layer
    ├── screens/            # Screen widgets
    ├── widgets/            # Reusable widgets
    └── theme/              # Theme and styling
```

### Tech Stack

- **Framework**: Flutter 3.2+ (Dart)
- **State Management**: Riverpod 2.4+
- **Database**: SQLCipher (encrypted SQLite)
- **Storage**: Flutter Secure Storage (Keychain/Keystore)
- **Search**: SQLite FTS5 (Full-Text Search)
- **PDF**: pdf + printing packages
- **Animations**: flutter_animate
- **Auth**: local_auth (biometrics)
- **Models**: freezed + json_serializable

## 🔒 Security Model

### Encryption
- **Database**: Full database encryption using SQLCipher
- **Key Storage**: Encryption keys stored in platform secure storage
  - **iOS**: Keychain (with `kSecAttrAccessibleAfterFirstUnlock`)
  - **Android**: EncryptedSharedPreferences backed by Keystore
- **Algorithm**: AES-256 encryption via SQLCipher

### Authentication
- **PIN**: Required 4-digit PIN on first launch
- **Biometric**: Optional fingerprint/Face ID support
- **Auto-lock**: Configurable timeout (default: 5 minutes)

### Data Privacy
- **100% Offline**: No network requests for core functionality
- **Local Only**: All data remains on device
- **No Analytics**: No telemetry or tracking
- **User Control**: Import/export functionality requires PIN re-authentication

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Device theft | PIN/biometric lock + encrypted database |
| Data extraction | SQLCipher encryption + secure key storage |
| Memory dumps | Sensitive data cleared from memory after use |
| Backup exposure | Encryption keys not included in backups |
| Unauthorized export | PIN re-auth required for import/export |

## 🚀 Getting Started

### Prerequisites

- Flutter 3.2 or higher
- Dart 3.0 or higher
- iOS 13+ / Android 6.0+ / Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   cd mobile/soul_journey
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate code (Freezed & Riverpod)**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Run the app**
   ```bash
   # iOS Simulator
   flutter run -d "iPhone 14"

   # Android Emulator
   flutter run -d emulator-5554

   # Web
   flutter run -d chrome

   # Physical device
   flutter run
   ```

### Build for Production

#### iOS
```bash
flutter build ios --release
# Open ios/Runner.xcworkspace in Xcode to archive
```

#### Android
```bash
flutter build apk --release
# Or for app bundle (Google Play):
flutter build appbundle --release
```

#### Web
```bash
flutter build web --release
# Deploy the build/web directory to your hosting
```

## 🧪 Testing

### Run all tests
```bash
flutter test
```

### Run specific test
```bash
flutter test test/unit/interpretation_engine_test.dart
```

### Coverage
```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

## 📚 Wisdom Cards System

### Structure
Each Wisdom Card contains:
- **tradition**: Source tradition (Bhrigu Samhita, Nadi Jyotisha, Vedic)
- **topic**: Category (soul_signature, past_life, present, future, marriage, remedies, spiritual)
- **tags**: Keywords for search
- **conditions**: Matching rules (age range, elements, zodiac, karmic number, etc.)
- **rule_text**: Internal description
- **output_template**: Text with {{variables}} for rendering
- **priority**: Higher priority cards shown first (0-10)

### Example Card
```json
{
  "tradition": "Bhrigu Samhita",
  "topic": "soul_signature",
  "tags": ["fire", "leadership", "courage"],
  "conditions": {
    "elements": ["Fire"]
  },
  "rule_text": "Fire souls are born leaders",
  "output_template": "Your {{element}} nature makes you a natural leader...",
  "priority": 10
}
```

### Adding Custom Cards

1. Navigate to **Wisdom Library** in the app
2. Tap **Add New Card**
3. Fill in the fields
4. Save (requires PIN re-authentication)

### Import/Export
- Export cards as JSON for backup
- Import cards from JSON file
- Both operations require PIN re-authentication

## 🎨 UI Components

### Animated Logo
The sacred geometry logo features:
- Om symbol in center
- Concentric circles (cosmic boundary)
- Upward triangle (Shiva energy)
- Downward triangle (Shakti energy)
- Central hexagram
- Smooth rotation and pulse animations
- Matches the web frontend design

### Color Scheme
```dart
Cyan:   #4DEEEA
Purple: #8A5CF6
Lime:   #BEF264
Yellow: #FACC15
Pink:   #EC4899
```

### Animations
- Staggered card entry animations
- Logo rotation (6s cycle)
- Pulse effects on icons
- Smooth page transitions

## 📖 API Reference

### InterpretationEngine

```dart
class InterpretationEngine {
  /// Generate complete Soul Journey report
  Future<ReportModel> generateReport(
    ProfileModel profile,
    List<WisdomCardModel> wisdomCards,
  );
}
```

### DatabaseHelper

```dart
class DatabaseHelper {
  /// Get encrypted database instance
  Future<Database> get database;

  /// Full-text search in Wisdom Cards
  Future<List<Map<String, dynamic>>> searchWisdomCards(String query);

  /// Close database
  Future<void> close();

  /// Optimize database (VACUUM)
  Future<void> optimizeDatabase();
}
```

### ProfileRepository

```dart
class ProfileRepository {
  /// Create a new profile
  Future<void> createProfile(ProfileModel profile);

  /// Get all profiles
  Future<List<ProfileModel>> getAllProfiles();

  /// Get profile by ID
  Future<ProfileModel?> getProfileById(String id);

  /// Update profile
  Future<void> updateProfile(ProfileModel profile);

  /// Delete profile
  Future<void> deleteProfile(String id);

  /// Search profiles by name
  Future<List<ProfileModel>> searchProfiles(String query);
}
```

## 🗂️ File Structure

```
soul_journey/
├── assets/
│   ├── cities/
│   │   └── cities.json              # Offline city database (50 cities)
│   ├── wisdom_cards/
│   │   └── demo_cards.json          # 30 demo Wisdom Cards
│   └── fonts/                        # Devanagari fonts for Om symbol
├── lib/
│   ├── core/
│   │   ├── constants/
│   │   │   └── app_constants.dart    # App-wide constants
│   │   ├── utils/                    # Utility functions
│   │   └── security/                 # Security helpers
│   ├── data/
│   │   ├── database/
│   │   │   └── database_helper.dart  # SQLCipher setup with FTS5
│   │   ├── models/
│   │   │   ├── profile_model.dart    # User profile model
│   │   │   ├── wisdom_card_model.dart # Wisdom Card model
│   │   │   └── report_model.dart     # Soul Journey report model
│   │   └── repositories/
│   │       ├── profile_repository.dart
│   │       ├── report_repository.dart
│   │       └── wisdom_card_repository.dart
│   ├── domain/
│   │   ├── entities/                 # Domain entities
│   │   ├── engine/
│   │   │   └── interpretation_engine.dart # Core report generation logic
│   │   └── use_cases/                # Business use cases
│   ├── ui/
│   │   ├── screens/
│   │   │   ├── home_screen.dart      # Main home screen
│   │   │   ├── onboarding_screen.dart # PIN setup & intro
│   │   │   ├── profile_create_screen.dart
│   │   │   ├── profile_list_screen.dart
│   │   │   ├── report_viewer_screen.dart
│   │   │   ├── wisdom_library_screen.dart
│   │   │   └── settings_screen.dart
│   │   ├── widgets/
│   │   │   ├── animated_logo.dart    # Sacred geometry logo
│   │   │   ├── city_search_widget.dart
│   │   │   └── report_page_widget.dart
│   │   └── theme/
│   │       └── app_theme.dart        # Theme & color definitions
│   └── main.dart                      # App entry point
├── test/
│   ├── unit/
│   │   ├── interpretation_engine_test.dart
│   │   └── wisdom_card_test.dart
│   └── widget/
│       └── home_screen_test.dart
├── android/                           # Android-specific files
├── ios/                               # iOS-specific files
├── web/                               # Web-specific files
├── pubspec.yaml                       # Dependencies
└── README.md                          # This file
```

## 🔧 Configuration

### App Constants
Edit `lib/core/constants/app_constants.dart`:
- `lockTimeoutSeconds` - Auto-lock timeout (default: 300s)
- `futureTimelineStartYear` / `futureTimelineEndYear` - Timeline range
- `pinLength` - PIN length (default: 4)

### Database
The database is automatically created on first launch with:
- `profiles` table
- `reports` table
- `wisdom_cards` table
- `wisdom_cards_fts` FTS5 virtual table for search
- Automatic triggers to keep FTS in sync

## 🌐 Internationalization (Future)

The app is designed to support i18n. To add translations:
1. Add `flutter_localizations` to `pubspec.yaml`
2. Create `lib/l10n/` directory
3. Add ARB files (app_en.arb, app_hi.arb, etc.)
4. Update `MaterialApp` with localization delegates

## 📱 Platform-Specific Notes

### iOS
- Requires iOS 13+
- Biometric authentication requires Face ID/Touch ID setup
- Keychain access configured in `ios/Runner/Info.plist`
- Add NSFaceIDUsageDescription for Face ID

### Android
- Minimum SDK 23 (Android 6.0)
- Biometric authentication requires device support
- EncryptedSharedPreferences requires SDK 23+
- Add USE_BIOMETRIC permission in AndroidManifest.xml

### Web
- SQLite runs via sql.js (WebAssembly)
- Biometric auth not available on web
- Limited secure storage (uses browser storage)
- Consider IndexedDB for production web deployment

## 🐛 Known Issues

1. **Freezed Code Generation**: Run `flutter pub run build_runner build` if you see missing generated files
2. **SQLCipher on iOS**: Requires minimum iOS 13 for proper encryption support
3. **Web Encryption**: Limited compared to mobile - use web version for demo only

## 🛠️ Troubleshooting

### Build errors with Freezed
```bash
flutter pub run build_runner clean
flutter pub run build_runner build --delete-conflicting-outputs
```

### Database errors
```dart
// Reset database (development only)
await DatabaseHelper().deleteDatabase();
```

### Biometric not working
- Ensure device has biometric hardware
- Check permissions in platform manifest files
- Verify user has enrolled biometrics on device

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the ancient wisdom of **Bhrigu Samhita** and **Nadi Jyotisha** traditions
- Sacred geometry design influenced by Sri Yantra
- Built with love and reverence for the ancient Vedic sciences

## 📞 Support

For issues, feature requests, or contributions:
- Open an issue on GitHub
- Follow the contribution guidelines in CONTRIBUTING.md

## 🚧 Roadmap

- [ ] Voice-guided meditation for remedies
- [ ] Dasha (planetary period) calculations
- [ ] Compatibility matching between profiles
- [ ] Export reports to multiple formats (DOCX, HTML)
- [ ] Internationalization (Hindi, Sanskrit, Tamil)
- [ ] Widget for daily mantra reminder
- [ ] Apple Watch / Wear OS companion app

---

**ॐ शान्तिः शान्तिः शान्तिः**
*(Om Shanti Shanti Shanti - Peace, Peace, Peace)*

May your journey through this app bring wisdom, clarity, and spiritual growth.
