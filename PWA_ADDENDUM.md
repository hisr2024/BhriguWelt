# Offline-First PWA Architecture - Addendum to README

## 🌐 Progressive Web App (PWA) Version

In addition to the native **Flutter mobile app**, BhriguWelt now offers a **Progressive Web App** version that runs in any modern web browser with the same offline-first, privacy-focused approach.

### PWA Features

- 🔐 **Passcode Protection** - 4-6 digit passcode with strength indicator
- 💾 **Encrypted Storage** - AES-256-GCM encryption using WebCrypto API
- 📱 **Installable** - Add to home screen on mobile and desktop
- 🔄 **Service Worker** - Aggressive caching for offline functionality
- 🎨 **Responsive Design** - Works on all screen sizes
- 🌙 **Auto-Lock** - Configurable inactivity timeout
- 🔀 **Three AI Modes**:
  - **Offline Only**: Zero network, traditional calculations
  - **Hybrid**: Minimal data transmission, AI-enhanced insights
  - **AI Chatbot**: Full interactive AI assistant

### Quick Start (PWA)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Access the PWA

- **Production**: https://your-app.vercel.app
- **Local Development**: http://localhost:3000

## Architecture Comparison

### Mobile App (Flutter)
- **Best for**: Native mobile experience, maximum performance
- **Platform**: iOS, Android, Web (Flutter Web)
- **Storage**: SQLCipher (encrypted SQLite)
- **Auth**: PIN + Biometric (Face ID, Touch ID, Fingerprint)
- **Offline**: 100%, no backend required
- **Distribution**: App Store, Google Play, Web

### PWA (Next.js)
- **Best for**: Cross-platform web experience, easy updates
- **Platform**: Any modern web browser (Chrome, Firefox, Safari, Edge)
- **Storage**: IndexedDB with AES-256-GCM encryption
- **Auth**: Passcode + Auto-lock
- **Offline**: 100%, optional backend for AI features
- **Distribution**: Web URL, installable via browser

## Shared Features

Both versions share the same core features:

| Feature | Mobile App | PWA |
|---------|-----------|-----|
| Offline-First | ✅ | ✅ |
| Encrypted Storage | ✅ (SQLCipher) | ✅ (IndexedDB) |
| Birth Chart Calculations | ✅ | ✅ |
| Soul Journey Reports | ✅ | ✅ |
| Wisdom Cards | ✅ | ✅ |
| City Database (Offline) | ✅ (50+ cities) | ✅ (50+ cities) |
| PDF Export | ✅ | ✅ |
| Optional AI Integration | ❌ | ✅ (Sarvam AI) |
| Biometric Auth | ✅ | ⏳ (Future) |
| Multi-Profile | ✅ | ✅ |
| Auto-Lock | ✅ | ✅ |
| Import/Export Data | ✅ | ✅ |

## Choosing Between Mobile App and PWA

### Choose Mobile App if you want:
- Native platform integration (notifications, widgets)
- Biometric authentication (Face ID, Touch ID)
- Maximum performance and polish
- App Store/Google Play distribution
- Offline-only with no backend dependency

### Choose PWA if you want:
- Cross-platform without app stores
- Easy updates without app review process
- Optional AI enhancements (Sarvam AI)
- Web-based access from any device
- Quick deployment to Vercel

## Installation

### Mobile App

**iOS:**
1. Download from App Store (coming soon)
2. Or build from source (see main README)

**Android:**
1. Download from Google Play (coming soon)
2. Or install APK from releases
3. Or build from source

### PWA

**Desktop (Chrome, Edge, Brave):**
1. Visit https://your-app.vercel.app
2. Click the install icon in the address bar (⊕)
3. Click "Install"

**Mobile (iOS Safari):**
1. Visit https://your-app.vercel.app
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

**Mobile (Android Chrome):**
1. Visit https://your-app.vercel.app
2. Tap the menu (⋮)
3. Tap "Add to Home screen"
4. Tap "Add"

## Security

Both versions use the same security principles:

### Encryption
- **Algorithm**: AES-256-GCM (mobile), AES-256-GCM (PWA)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Passcode**: 4-6 digits (mobile), 4-6 digits (PWA)

### Threat Model
Refer to [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) for complete threat model documentation.

### Compliance
- **GDPR**: Full compliance, local-first data processing
- **CCPA**: Full compliance
- **Data Portability**: Export/Import in JSON format
- **Right to Erasure**: Clear all data feature

## Backend (Optional)

The PWA can optionally connect to a Python Flask backend for AI-powered predictions:

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run locally
python app.py

# Deploy to Render
git push render main
```

### Backend Features
- 🤖 AI-powered predictions via Sarvam AI
- 🛡️ Security headers and CORS protection
- 🚦 Rate limiting (100 req/min general, 10 req/min AI)
- 🧹 Request sanitization (removes PII)
- 📊 Usage quota tracking
- 🔐 JWT authentication

## Documentation

- **Main README**: [README.md](README.md) - Mobile app documentation
- **PWA Architecture**: [PWA_IMPLEMENTATION.md](PWA_IMPLEMENTATION.md) - PWA details
- **Security**: [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) - Security model
- **Sarvam AI Integration**: [SARVAM_AI_INTEGRATION.md](SARVAM_AI_INTEGRATION.md) - AI guidelines
- **Migration Guide**: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Cloud to offline-first
- **Deployment**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment instructions

## Development

### Mobile App
```bash
cd mobile/soul_journey
flutter pub get
flutter run
```

### PWA
```bash
cd frontend
npm install
npm run dev
```

### Backend (Optional)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Roadmap

### Mobile App
- [ ] Voice-guided meditation for remedies
- [ ] Dasha calculations
- [ ] Compatibility matching
- [ ] Apple Watch companion app
- [ ] Internationalization (Hindi, Sanskrit)

### PWA
- [ ] Biometric authentication (WebAuthn)
- [ ] End-to-end encrypted sync
- [ ] Offline maps for birth locations
- [ ] Desktop notifications
- [ ] Keyboard shortcuts

### Backend
- [ ] Advanced rate limiting strategies
- [ ] Cost optimization algorithms
- [ ] Multi-model AI support
- [ ] Webhook integrations

## Support

- **GitHub Issues**: https://github.com/hisr2024/BhriguWelt/issues
- **Email**: support@bhriguwelt.com
- **Security**: security@bhriguwelt.com
- **Documentation**: https://docs.bhriguwelt.com

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](LICENSE) file.

---

**ॐ शान्तिः शान्तिः शान्तिः**

*(Om Shanti Shanti Shanti - Peace, Peace, Peace)*

May both versions of this app bring wisdom, clarity, and spiritual growth to all users. 🌟
