import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../widgets/animated_logo.dart';
import '../../core/security/pin_manager.dart';
import '../../core/security/biometric_auth.dart';
import '../../core/security/app_lock_manager.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Riverpod Providers
final pinManagerProvider = Provider((ref) {
  return PinManager(secureStorage: const FlutterSecureStorage());
});

final biometricAuthProvider = Provider((ref) {
  return BiometricAuth();
});

/// PIN entry screen for unlocking app
///
/// Features:
/// - 4-digit numeric PIN entry
/// - Biometric authentication option
/// - Attempt counter with lockout
/// - Visual feedback for PIN entry
/// - Forgot PIN recovery option
class PinScreen extends ConsumerStatefulWidget {
  const PinScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends ConsumerState<PinScreen> with WidgetsBindingObserver {
  late PinManager _pinManager;
  late BiometricAuth _biometricAuth;
  final _pinController = TextEditingController();
  bool _showPin = false;
  bool _isLoading = false;
  String? _errorMessage;
  int _attemptCount = 0;
  bool _isLocked = false;
  bool _biometricSupported = false;
  DateTime? _lockTime;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _pinManager = ref.read(pinManagerProvider);
    _biometricAuth = ref.read(biometricAuthProvider);
    _checkBiometricSupport();
    _attemptBiometricAuth();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _checkBiometricSupport() async {
    final isAvailable = await _biometricAuth.isAvailable();
    setState(() => _biometricSupported = isAvailable);
  }

  Future<void> _attemptBiometricAuth() async {
    if (!_biometricSupported) return;

    try {
      final success = await _biometricAuth.authenticate(
        localizedReason: 'Unlock Soul Journey',
        useErrorDialogs: false,
      );

      if (success && mounted) {
        _unlockApp();
      }
    } catch (e) {
      // Silently fail - user can enter PIN instead
    }
  }

  Future<void> _verifyPin() async {
    if (_isLocked) {
      _showLockoutMessage();
      return;
    }

    setState(() => _isLoading = true);
    setState(() => _errorMessage = null);

    try {
      final pin = _pinController.text.trim();

      if (pin.isEmpty) {
        throw 'Please enter your PIN';
      }

      if (pin.length != 4) {
        throw 'PIN must be exactly 4 digits';
      }

      final dbKey = await _pinManager.validatePin(pin);

      if (dbKey != null) {
        // PIN correct
        if (mounted) {
          _unlockApp();
        }
      } else {
        // PIN incorrect
        setState(() {
          _attemptCount++;
          _errorMessage = 'Incorrect PIN. ${3 - _attemptCount} attempts remaining.';
          _pinController.clear();

          if (_attemptCount >= 3) {
            _isLocked = true;
            _lockTime = DateTime.now();
            _errorMessage = 'Too many failed attempts. Try again in 5 minutes.';
          }
        });

        // Haptic feedback for wrong PIN
        HapticFeedback.vibrate();
      }
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _unlockApp() {
    ref.read(appLockManagerProvider).unlock();

    Navigator.of(context).pushReplacementNamed('/home');
  }

  void _showLockoutMessage() {
    final now = DateTime.now();
    final elapsed = now.difference(_lockTime!);
    final remaining = 300 - elapsed.inSeconds;

    if (remaining <= 0) {
      setState(() {
        _isLocked = false;
        _attemptCount = 0;
        _errorMessage = null;
      });
    } else {
      final minutes = remaining ~/ 60;
      final seconds = remaining % 60;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Please wait ${minutes}m ${seconds}s before trying again',
          ),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),

                // Logo
                _buildLogo()
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 100.ms)
                    .scale(begin: const Offset(0.8, 0.8), end: const Offset(1, 1)),

                const SizedBox(height: 48),

                // Title
                Text(
                  'Welcome Back',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    color: AppColors.purple,
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                )
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 200.ms)
                    .slideY(begin: 0.2, end: 0),

                const SizedBox(height: 12),

                Text(
                  'Enter your PIN to continue',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                )
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 300.ms),

                const SizedBox(height: 48),

                // PIN Input
                _buildPinInput(context)
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 400.ms)
                    .slideY(begin: 0.2, end: 0),

                const SizedBox(height: 24),

                // Error Message
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      border: Border.all(
                        color: AppColors.error.withOpacity(0.3),
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.error_outline,
                          color: AppColors.error,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                    .animate()
                    .fadeIn(duration: 300.ms)
                    .slideY(begin: -0.1, end: 0),

                const SizedBox(height: 32),

                // Unlock Button
                ElevatedButton(
                  onPressed: _isLocked ? null : (_isLoading ? null : _verifyPin),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor:
                      AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                      : const Text('Unlock'),
                )
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 500.ms),

                const SizedBox(height: 16),

                // Biometric Button
                if (_biometricSupported)
                  OutlinedButton.icon(
                    onPressed: _attemptBiometricAuth,
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('Use Biometric'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  )
                      .animate()
                      .fadeIn(duration: 600.ms, delay: 600.ms),

                const SizedBox(height: 16),

                // Forgot PIN Link
                TextButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text(
                          'Contact support to reset your PIN. All data will be preserved.',
                        ),
                        duration: const Duration(seconds: 5),
                        action: SnackBarAction(
                          label: 'OK',
                          onPressed: () {},
                        ),
                      ),
                    );
                  },
                  child: const Text('Forgot PIN?'),
                )
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 700.ms),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return const AnimatedLogo(size: 120)
        .animate(onPlay: (controller) => controller.repeat())
        .scale(
          duration: 1000.ms,
          begin: const Offset(1, 1),
          end: const Offset(1.05, 1.05),
          curve: Curves.easeInOut,
        )
        .then()
        .scale(
          duration: 1000.ms,
          begin: const Offset(1.05, 1.05),
          end: const Offset(1, 1),
          curve: Curves.easeInOut,
        );
  }

  Widget _buildPinInput(BuildContext context) {
    return Column(
      children: [
        // PIN Display Dots
        Padding(
          padding: const EdgeInsets.only(bottom: 32),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(4, (index) {
              final isEntered = index < _pinController.text.length;
              return Container(
                width: 56,
                height: 56,
                margin: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isEntered ? AppColors.purple : AppColors.gray300,
                    width: 2,
                  ),
                  color: isEntered
                      ? AppColors.purple.withOpacity(0.1)
                      : Colors.transparent,
                ),
                child: isEntered
                    ? Icon(
                  Icons.circle,
                  color: AppColors.purple,
                  size: 24,
                )
                    : null,
              );
            }),
          ),
        ),

        // Numeric Keypad
        _buildNumericKeypad(context),
      ],
    );
  }

  Widget _buildNumericKeypad(BuildContext context) {
    return Column(
      children: [
        // Rows 1-3: Numbers 1-9
        for (int row = 0; row < 3; row++)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              for (int col = 0; col < 3; col++)
                _buildKeypadButton(
                  label: ((row * 3) + col + 1).toString(),
                  onPressed: () {
                    if (_pinController.text.length < 4) {
                      _pinController.text += ((row * 3) + col + 1).toString();
                      setState(() {});
                    }
                  },
                ),
            ],
          ),

        const SizedBox(height: 12),

        // Row 4: 0 and Delete
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            SizedBox(width: 60),
            _buildKeypadButton(
              label: '0',
              onPressed: () {
                if (_pinController.text.length < 4) {
                  _pinController.text += '0';
                  setState(() {});
                }
              },
            ),
            _buildKeypadButton(
              label: '⌫',
              onPressed: () {
                if (_pinController.text.isNotEmpty) {
                  _pinController.text = _pinController.text
                      .substring(0, _pinController.text.length - 1);
                  setState(() {});
                }
              },
              isDelete: true,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildKeypadButton({
    required String label,
    required VoidCallback onPressed,
    bool isDelete = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        customBorder: const CircleBorder(),
        child: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isDelete
                ? AppColors.error.withOpacity(0.1)
                : AppColors.gray100,
            border: Border.all(
              color: isDelete
                  ? AppColors.error.withOpacity(0.3)
                  : AppColors.gray300,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: isDelete ? AppColors.error : AppColors.purple,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      if (_biometricSupported && !_isLocked) {
        // Try biometric auth when app resumes (optional)
      }
    }
  }
}
