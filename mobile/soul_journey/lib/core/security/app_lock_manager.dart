import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Manages app lock state and auto-lock timeout
///
/// Features:
/// - Auto-lock after configurable timeout (default: 5 minutes)
/// - Lock on app background
/// - Lock state persistence
/// - Biometric preference storage
class AppLockManager extends ChangeNotifier {
  static const String _biometricEnabledKey = 'biometric_unlock_enabled';
  static const String _lockTimeoutKey = 'lock_timeout_seconds';
  static const int _defaultLockTimeoutSeconds = 300; // 5 minutes

  final FlutterSecureStorage _secureStorage;
  Timer? _lockTimer;
  DateTime? _lastActiveTime;
  bool _isLocked = true;
  bool _biometricEnabled = false;
  int _lockTimeoutSeconds = _defaultLockTimeoutSeconds;

  AppLockManager({FlutterSecureStorage? secureStorage})
      : _secureStorage = secureStorage ?? const FlutterSecureStorage() {
    _loadSettings();
  }

  bool get isLocked => _isLocked;
  bool get biometricEnabled => _biometricEnabled;
  int get lockTimeoutSeconds => _lockTimeoutSeconds;

  /// Load settings from secure storage
  Future<void> _loadSettings() async {
    final biometricStr = await _secureStorage.read(key: _biometricEnabledKey);
    _biometricEnabled = biometricStr == 'true';

    final timeoutStr = await _secureStorage.read(key: _lockTimeoutKey);
    if (timeoutStr != null) {
      _lockTimeoutSeconds = int.tryParse(timeoutStr) ?? _defaultLockTimeoutSeconds;
    }

    notifyListeners();
  }

  /// Unlock the app (called after successful PIN/biometric authentication)
  void unlock() {
    _isLocked = false;
    _lastActiveTime = DateTime.now();
    _startLockTimer();
    notifyListeners();
  }

  /// Lock the app immediately
  void lock() {
    _isLocked = true;
    _cancelLockTimer();
    _lastActiveTime = null;
    notifyListeners();
  }

  /// Update last active time (call this on user interaction)
  void updateActivity() {
    if (!_isLocked) {
      _lastActiveTime = DateTime.now();
      _restartLockTimer();
    }
  }

  /// Enable/disable biometric unlock
  Future<void> setBiometricEnabled(bool enabled) async {
    _biometricEnabled = enabled;
    await _secureStorage.write(
      key: _biometricEnabledKey,
      value: enabled.toString(),
    );
    notifyListeners();
  }

  /// Set auto-lock timeout in seconds
  Future<void> setLockTimeout(int seconds) async {
    if (seconds < 30) {
      throw ArgumentError('Lock timeout must be at least 30 seconds');
    }
    _lockTimeoutSeconds = seconds;
    await _secureStorage.write(
      key: _lockTimeoutKey,
      value: seconds.toString(),
    );
    _restartLockTimer();
    notifyListeners();
  }

  /// Handle app lifecycle changes
  void handleAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
        // App going to background - lock immediately
        lock();
        break;
      case AppLifecycleState.resumed:
        // App coming to foreground - check if timeout exceeded
        if (_lastActiveTime != null) {
          final elapsed = DateTime.now().difference(_lastActiveTime!);
          if (elapsed.inSeconds > _lockTimeoutSeconds) {
            lock();
          }
        }
        break;
      case AppLifecycleState.hidden:
        // Hidden state (new in Flutter 3.13+)
        lock();
        break;
    }
  }

  /// Start auto-lock timer
  void _startLockTimer() {
    _cancelLockTimer();
    _lockTimer = Timer(Duration(seconds: _lockTimeoutSeconds), () {
      lock();
    });
  }

  /// Restart auto-lock timer (on user activity)
  void _restartLockTimer() {
    _startLockTimer();
  }

  /// Cancel auto-lock timer
  void _cancelLockTimer() {
    _lockTimer?.cancel();
    _lockTimer = null;
  }

  @override
  void dispose() {
    _cancelLockTimer();
    super.dispose();
  }
}

/// Riverpod provider for AppLockManager
final appLockManagerProvider = ChangeNotifierProvider<AppLockManager>((ref) {
  return AppLockManager();
});

/// Provider for lock state
final isLockedProvider = Provider<bool>((ref) {
  return ref.watch(appLockManagerProvider).isLocked;
});

/// Provider for biometric enabled state
final biometricEnabledProvider = Provider<bool>((ref) {
  return ref.watch(appLockManagerProvider).biometricEnabled;
});
