# BhriguJyotisha (Starter)

A modular Android app (Kotlin + Compose) for classical Jyotiṣa with a Bhrigu-style rule engine.
This starter builds without proprietary dependencies and stores data securely (SQLCipher).

## Build
```bash
./gradlew assembleDebug
```

## Modules
- app: UI
- core: models
- engine-jyotisha: ephemeris interface + demo calculator
- engine-bhrigu: rule engine
- data: Room (encrypted), repositories, prefs, backup
- scripts: (placeholder)
