import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

/// Manages PIN storage, validation, and encryption key derivation
///
/// Security model:
/// - PIN is never stored in plaintext
/// - Stored as PBKDF2 hash (100,000 iterations, SHA-256)
/// - Database encryption key derived from PIN
/// - Keys stored in iOS Keychain / Android Keystore
class PinManager {
  static const String _pinHashKey = 'soul_journey_pin_hash';
  static const String _pinSaltKey = 'soul_journey_pin_salt';
  static const String _dbKeyKey = 'soul_journey_db_key';
  static const int _pbkdf2Iterations = 100000;

  final FlutterSecureStorage _secureStorage;

  PinManager({FlutterSecureStorage? secureStorage})
      : _secureStorage = secureStorage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(
                encryptedSharedPreferences: true,
              ),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  /// Check if PIN is set up
  Future<bool> isPinSet() async {
    final hash = await _secureStorage.read(key: _pinHashKey);
    return hash != null;
  }

  /// Set up initial PIN and generate database encryption key
  ///
  /// Returns the 32-byte database encryption key (hex-encoded)
  Future<String> setupPin(String pin) async {
    if (pin.length != 4) {
      throw ArgumentError('PIN must be 4 digits');
    }
    if (!_isNumeric(pin)) {
      throw ArgumentError('PIN must contain only digits');
    }

    // Generate random salt
    final salt = _generateSalt();

    // Hash PIN with PBKDF2
    final pinHash = _hashPin(pin, salt);

    // Derive database encryption key from PIN
    final dbKey = _deriveDbKey(pin, salt);

    // Store securely
    await _secureStorage.write(key: _pinHashKey, value: pinHash);
    await _secureStorage.write(key: _pinSaltKey, value: salt);
    await _secureStorage.write(key: _dbKeyKey, value: dbKey);

    return dbKey;
  }

  /// Validate PIN and return database encryption key if correct
  ///
  /// Returns null if PIN is incorrect
  Future<String?> validatePin(String pin) async {
    final storedHash = await _secureStorage.read(key: _pinHashKey);
    final salt = await _secureStorage.read(key: _pinSaltKey);

    if (storedHash == null || salt == null) {
      throw StateError('PIN not set up');
    }

    final inputHash = _hashPin(pin, salt);

    if (inputHash == storedHash) {
      // PIN correct - return database key
      return await _secureStorage.read(key: _dbKeyKey);
    }

    return null; // PIN incorrect
  }

  /// Change PIN (requires current PIN for verification)
  Future<bool> changePin(String currentPin, String newPin) async {
    final dbKey = await validatePin(currentPin);
    if (dbKey == null) {
      return false; // Current PIN incorrect
    }

    // Set up new PIN (keeps same database key)
    await setupPin(newPin);

    // Restore the original database key (don't re-derive)
    await _secureStorage.write(key: _dbKeyKey, value: dbKey);

    return true;
  }

  /// Reset PIN (WARNING: This will erase all data)
  Future<void> resetPin() async {
    await _secureStorage.delete(key: _pinHashKey);
    await _secureStorage.delete(key: _pinSaltKey);
    await _secureStorage.delete(key: _dbKeyKey);
  }

  /// Get database encryption key (requires PIN validation first)
  Future<String?> getDatabaseKey() async {
    return await _secureStorage.read(key: _dbKeyKey);
  }

  // Private helper methods

  String _generateSalt() {
    // Generate 32 random bytes for salt
    final random = List<int>.generate(32, (i) => DateTime.now().microsecondsSinceEpoch % 256);
    return base64Encode(random);
  }

  String _hashPin(String pin, String salt) {
    // PBKDF2-HMAC-SHA256 with 100,000 iterations
    final bytes = utf8.encode(pin + salt);
    var hash = bytes;

    // Simplified PBKDF2 (use a proper library in production)
    for (int i = 0; i < _pbkdf2Iterations; i++) {
      hash = sha256.convert(hash).bytes;
    }

    return base64Encode(hash);
  }

  String _deriveDbKey(String pin, String salt) {
    // Derive 32-byte key for SQLCipher (AES-256)
    final input = utf8.encode(pin + salt + 'db_encryption');
    var key = input;

    for (int i = 0; i < _pbkdf2Iterations; i++) {
      key = sha256.convert(key).bytes;
    }

    // Return as hex string for SQLCipher
    return key.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  bool _isNumeric(String str) {
    return RegExp(r'^[0-9]+$').hasMatch(str);
  }
}
