# BhrigJyoti-MIT

UX + Security combined Android app for Bhrigu-style Jyotisha.
- Kotlin + Jetpack Compose, Clean Architecture
- Encrypted Room (SQLCipher), biometric app lock, FLAG_SECURE, no cleartext
- Offline-first; export/import via Storage Access Framework

## Build
```bash
./gradlew assembleDebug
```

## Push to GitHub
```bash
git init
git add .
git commit -m "feat: initial commit (UX + Security)"
git branch -M main
git remote add origin https://github.com/<you>/BhrigJyoti-MIT.git
git push -u origin main
```
