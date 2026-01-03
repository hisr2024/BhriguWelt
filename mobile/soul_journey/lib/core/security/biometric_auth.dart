import 'package:local_auth/local_auth.dart';
import 'package:flutter/services.dart';

/// Manages biometric authentication (Face ID, Touch ID, Fingerprint)
///
/// Biometric unlock is optional and complements PIN security.
/// Even with biometric enabled, PIN is still required for sensitive operations.
class BiometricAuth {
  final LocalAuthentication _localAuth;

  BiometricAuth({LocalAuthentication? localAuth})
      : _localAuth = localAuth ?? LocalAuthentication();

  /// Check if device supports biometric authentication
  Future<bool> isSupported() async {
    try {
      return await _localAuth.canCheckBiometrics;
    } on PlatformException {
      return false;
    }
  }

  /// Check if biometric authentication is available
  /// (device supports it AND user has enrolled biometrics)
  Future<bool> isAvailable() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      if (!canCheck) return false;

      final availableBiometrics = await _localAuth.getAvailableBiometrics();
      return availableBiometrics.isNotEmpty;
    } on PlatformException {
      return false;
    }
  }

  /// Get list of available biometric types
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } on PlatformException {
      return [];
    }
  }

  /// Authenticate user with biometrics
  ///
  /// Returns true if authentication successful, false otherwise
  Future<bool> authenticate({
    String localizedReason = 'Authenticate to access Soul Journey',
    bool useErrorDialogs = true,
    bool stickyAuth = true,
  }) async {
    try {
      final isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return false;
      }

      return await _localAuth.authenticate(
        localizedReason: localizedReason,
        options: AuthenticationOptions(
          useErrorDialogs: useErrorDialogs,
          stickyAuth: stickyAuth,
          biometricOnly: true,
        ),
      );
    } on PlatformException catch (e) {
      // Handle specific errors
      if (e.code == 'NotAvailable') {
        return false;
      }
      if (e.code == 'LockedOut' || e.code == 'PermanentlyLockedOut') {
        // User locked out due to too many attempts
        return false;
      }
      return false;
    }
  }

  /// Stop biometric authentication (if in progress)
  Future<void> stopAuthentication() async {
    try {
      await _localAuth.stopAuthentication();
    } on PlatformException {
      // Ignore errors when stopping
    }
  }

  /// Get user-friendly name for biometric type
  String getBiometricTypeName(List<BiometricType> types) {
    if (types.isEmpty) return 'Biometric';

    if (types.contains(BiometricType.face)) {
      return 'Face ID';
    } else if (types.contains(BiometricType.fingerprint)) {
      return 'Fingerprint';
    } else if (types.contains(BiometricType.iris)) {
      return 'Iris';
    } else if (types.contains(BiometricType.strong)) {
      return 'Biometric';
    } else if (types.contains(BiometricType.weak)) {
      return 'Biometric';
    }

    return 'Biometric';
  }

  /// Check if device has face recognition
  Future<bool> hasFaceId() async {
    final types = await getAvailableBiometrics();
    return types.contains(BiometricType.face);
  }

  /// Check if device has fingerprint scanner
  Future<bool> hasFingerprint() async {
    final types = await getAvailableBiometrics();
    return types.contains(BiometricType.fingerprint);
  }
}
