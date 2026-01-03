import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../../core/security/pin_manager.dart';
import '../../core/security/biometric_auth.dart';
import '../../core/security/app_lock_manager.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';

/// Riverpod Providers
final pinManagerProvider = Provider((ref) {
  return PinManager(secureStorage: const FlutterSecureStorage());
});

final biometricAuthProvider = Provider((ref) {
  return BiometricAuth();
});

/// Settings screen for app configuration
///
/// Features:
/// - Biometric authentication toggle
/// - Auto-lock timeout settings
/// - Change PIN
/// - About section
/// - App version
class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late PinManager _pinManager;
  late BiometricAuth _biometricAuth;
  late AppLockManager _appLockManager;

  bool _biometricEnabled = false;
  bool _biometricAvailable = false;
  int _lockTimeoutSeconds = 300;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _pinManager = ref.read(pinManagerProvider);
    _biometricAuth = ref.read(biometricAuthProvider);
    _appLockManager = ref.read(appLockManagerProvider);

    _biometricEnabled = _appLockManager.biometricEnabled;
    _lockTimeoutSeconds = _appLockManager.lockTimeoutSeconds;
    _checkBiometricAvailability();
  }

  Future<void> _checkBiometricAvailability() async {
    final available = await _biometricAuth.isAvailable();
    setState(() => _biometricAvailable = available);
  }

  Future<void> _toggleBiometric(bool enabled) async {
    setState(() => _isLoading = true);

    try {
      if (enabled) {
        // Try biometric auth to verify
        final authenticated = await _biometricAuth.authenticate(
          localizedReason: 'Enable biometric unlock',
          useErrorDialogs: true,
        );

        if (!authenticated) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Biometric authentication failed'),
                backgroundColor: AppColors.error,
              ),
            );
          }
          setState(() => _isLoading = false);
          return;
        }
      }

      await _appLockManager.setBiometricEnabled(enabled);
      setState(() => _biometricEnabled = enabled);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              enabled
                  ? 'Biometric unlock enabled'
                  : 'Biometric unlock disabled',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _changeLockTimeout(int seconds) async {
    setState(() => _isLoading = true);

    try {
      await _appLockManager.setLockTimeout(seconds);
      setState(() => _lockTimeoutSeconds = seconds);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Auto-lock timeout set to ${seconds ~/ 60} minutes',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _showChangePinDialog() async {
    final currentPinController = TextEditingController();
    final newPinController = TextEditingController();
    final confirmPinController = TextEditingController();
    bool showCurrentPin = false;
    bool showNewPin = false;
    bool showConfirmPin = false;
    String? errorMessage;

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: const Text('Change PIN'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Current PIN
                  Text(
                    'Current PIN',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: currentPinController,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    obscureText: !showCurrentPin,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                    ],
                    decoration: InputDecoration(
                      counterText: '',
                      hintText: '••••',
                      suffixIcon: IconButton(
                        icon: Icon(
                          showCurrentPin
                              ? Icons.visibility
                              : Icons.visibility_off,
                        ),
                        onPressed: () {
                          setState(() => showCurrentPin = !showCurrentPin);
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // New PIN
                  Text(
                    'New PIN',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: newPinController,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    obscureText: !showNewPin,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                    ],
                    decoration: InputDecoration(
                      counterText: '',
                      hintText: '••••',
                      suffixIcon: IconButton(
                        icon: Icon(
                          showNewPin ? Icons.visibility : Icons.visibility_off,
                        ),
                        onPressed: () {
                          setState(() => showNewPin = !showNewPin);
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Confirm PIN
                  Text(
                    'Confirm New PIN',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: confirmPinController,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    obscureText: !showConfirmPin,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                    ],
                    decoration: InputDecoration(
                      counterText: '',
                      hintText: '••••',
                      suffixIcon: IconButton(
                        icon: Icon(
                          showConfirmPin
                              ? Icons.visibility
                              : Icons.visibility_off,
                        ),
                        onPressed: () {
                          setState(() => showConfirmPin = !showConfirmPin);
                        },
                      ),
                    ),
                  ),

                  // Error Message
                  if (errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.1),
                        border: Border.all(
                          color: AppColors.error.withOpacity(0.3),
                        ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.error_outline,
                            color: AppColors.error,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              errorMessage!,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                color: AppColors.error,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  setState(() => errorMessage = null);

                  try {
                    // Validate
                    if (currentPinController.text.isEmpty ||
                        newPinController.text.isEmpty ||
                        confirmPinController.text.isEmpty) {
                      setState(
                        () => errorMessage = 'All fields required',
                      );
                      return;
                    }

                    if (newPinController.text != confirmPinController.text) {
                      setState(
                        () => errorMessage = 'New PINs do not match',
                      );
                      return;
                    }

                    // Change PIN
                    final success = await _pinManager.changePin(
                      currentPinController.text,
                      newPinController.text,
                    );

                    if (!success) {
                      setState(
                        () => errorMessage = 'Current PIN is incorrect',
                      );
                      return;
                    }

                    if (mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('PIN changed successfully'),
                        ),
                      );
                    }
                  } catch (e) {
                    setState(
                      () => errorMessage = 'Error: ${e.toString()}',
                    );
                  }
                },
                child: const Text('Change PIN'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Settings'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Security Section
              _buildSection(
                context,
                title: 'Security',
                icon: Icons.lock_outline,
                children: [
                  // Biometric Toggle
                  if (_biometricAvailable)
                    _buildSettingItem(
                      context,
                      title: 'Biometric Unlock',
                      subtitle: 'Use fingerprint or face ID to unlock',
                      trailing: Switch(
                        value: _biometricEnabled,
                        onChanged: _isLoading ? null : _toggleBiometric,
                        activeColor: AppColors.purple,
                      ),
                    ),

                  if (_biometricAvailable) const Divider(height: 1),

                  // Change PIN
                  _buildSettingItem(
                    context,
                    title: 'Change PIN',
                    subtitle: 'Update your 4-digit PIN',
                    onTap: _isLoading ? null : _showChangePinDialog,
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  ),

                  const Divider(height: 1),

                  // Auto-Lock Timeout
                  _buildSettingItem(
                    context,
                    title: 'Auto-Lock Timeout',
                    subtitle: 'Lock app after inactivity',
                    trailing: _buildTimeoutDropdown(),
                  ),
                ],
              )
                  .animate()
                  .fadeIn(duration: 600.ms, delay: 100.ms)
                  .slideY(begin: 0.2, end: 0),

              const SizedBox(height: 24),

              // Privacy Section
              _buildSection(
                context,
                title: 'Privacy',
                icon: Icons.privacy_tip_outline,
                children: [
                  _buildSettingItem(
                    context,
                    title: 'Data Storage',
                    subtitle: 'All data is stored locally on your device',
                  ),
                  const Divider(height: 1),
                  _buildSettingItem(
                    context,
                    title: 'Encryption',
                    subtitle: 'AES-256 encryption enabled',
                  ),
                ],
              )
                  .animate()
                  .fadeIn(duration: 600.ms, delay: 200.ms)
                  .slideY(begin: 0.2, end: 0),

              const SizedBox(height: 24),

              // About Section
              _buildSection(
                context,
                title: 'About',
                icon: Icons.info_outline,
                children: [
                  _buildSettingItem(
                    context,
                    title: 'App Version',
                    subtitle: AppConstants.appVersion,
                  ),
                  const Divider(height: 1),
                  _buildSettingItem(
                    context,
                    title: 'Soul Journey',
                    subtitle: 'Offline-first astrology app',
                  ),
                  const Divider(height: 1),
                  _buildSettingItem(
                    context,
                    title: 'Inspired by',
                    subtitle: 'Bhrigu Samhita & Nadi Jyotisha',
                  ),
                ],
              )
                  .animate()
                  .fadeIn(duration: 600.ms, delay: 300.ms)
                  .slideY(begin: 0.2, end: 0),

              const SizedBox(height: 32),

              // Info Card
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.cyan.withOpacity(0.1),
                  border: Border.all(color: AppColors.cyan.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Privacy Promise',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.purple,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your birth data and astrological insights are generated locally on your device and never transmitted over the internet. Soul Journey is fully offline-capable.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Icon(icon, color: AppColors.purple, size: 20),
              const SizedBox(width: 12),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.purple,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gray300),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildSettingItem(
    BuildContext context, {
    required String title,
    required String subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: 12),
                trailing,
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimeoutDropdown() {
    final timeoutOptions = {
      60: '1 minute',
      300: '5 minutes',
      600: '10 minutes',
      1800: '30 minutes',
    };

    return DropdownButton<int>(
      value: _lockTimeoutSeconds,
      underline: const SizedBox(),
      items: timeoutOptions.entries.map((entry) {
        return DropdownMenuItem(
          value: entry.key,
          child: Text(entry.value),
        );
      }).toList(),
      onChanged: (value) {
        if (value != null) {
          _changeLockTimeout(value);
        }
      },
    );
  }
}

import 'package:flutter/services.dart';
