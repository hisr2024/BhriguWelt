import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../widgets/animated_logo.dart';
import '../../core/security/pin_manager.dart';
import '../../core/security/app_lock_manager.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';

/// Onboarding screen with PIN setup (4-digit numeric input)
///
/// Features:
/// - Animated hero section with app logo
/// - PIN setup with 4-digit numeric input
/// - PIN confirmation
/// - Error handling and validation
/// - Secure PIN storage
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  late PinManager _pinManager;
  final _firstPinController = TextEditingController();
  final _confirmPinController = TextEditingController();
  bool _showFirstPin = false;
  bool _showConfirmPin = false;
  bool _isLoading = false;
  String? _errorMessage;
  bool _pinSetupComplete = false;

  @override
  void initState() {
    super.initState();
    _pinManager = PinManager(secureStorage: const FlutterSecureStorage());
  }

  @override
  void dispose() {
    _firstPinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  Future<void> _setupPin() async {
    setState(() => _isLoading = true);
    setState(() => _errorMessage = null);

    try {
      final firstPin = _firstPinController.text.trim();
      final confirmPin = _confirmPinController.text.trim();

      // Validate
      if (firstPin.isEmpty || confirmPin.isEmpty) {
        throw 'Please enter PIN in both fields';
      }

      if (firstPin.length != 4 || confirmPin.length != 4) {
        throw 'PIN must be exactly 4 digits';
      }

      if (firstPin != confirmPin) {
        throw 'PINs do not match';
      }

      // Setup PIN
      await _pinManager.setupPin(firstPin);
      await const FlutterSecureStorage().write(
        key: AppConstants.firstLaunchKey,
        value: 'false',
      );
      ref.read(appLockManagerProvider).unlock();

      setState(() => _pinSetupComplete = true);

      // Wait for animation, then navigate to home
      await Future.delayed(const Duration(milliseconds: 500));

      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
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
                // Hero Section
                _buildHeroSection()
                    .animate()
                    .fadeIn(duration: 800.ms, delay: 100.ms)
                    .scale(begin: const Offset(0.8, 0.8), end: const Offset(1, 1)),

                const SizedBox(height: 48),

                // Title
                Text(
                  'Secure Your Journey',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    color: AppColors.purple,
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                )
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 300.ms)
                    .slideY(begin: 0.2, end: 0),

                const SizedBox(height: 12),

                // Subtitle
                Text(
                  'Set up a 4-digit PIN to protect your mystical insights',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                )
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 400.ms),

                const SizedBox(height: 40),

                // PIN Setup Form
                if (!_pinSetupComplete)
                  _buildPinForm(context)
                      .animate()
                      .fadeIn(duration: 600.ms, delay: 500.ms)
                      .slideY(begin: 0.2, end: 0),

                // Success Message
                if (_pinSetupComplete)
                  _buildSuccessMessage(context)
                      .animate()
                      .fadeIn(duration: 600.ms)
                      .scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1)),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    return Column(
      children: [
        const AnimatedLogo(size: 120)
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
            ),
      ],
    );
  }

  Widget _buildPinForm(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // First PIN Field
        Text(
          'Enter PIN',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        _buildPinField(
          controller: _firstPinController,
          hint: '••••',
          obscure: !_showFirstPin,
          onChanged: (value) => setState(() {}),
          onToggleVisibility: () {
            setState(() => _showFirstPin = !_showFirstPin);
          },
        ),

        const SizedBox(height: 24),

        // Confirm PIN Field
        Text(
          'Confirm PIN',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        _buildPinField(
          controller: _confirmPinController,
          hint: '••••',
          obscure: !_showConfirmPin,
          onChanged: (value) => setState(() {}),
          onToggleVisibility: () {
            setState(() => _showConfirmPin = !_showConfirmPin);
          },
        ),

        // PIN Match Indicator
        if (_firstPinController.text.isNotEmpty &&
            _confirmPinController.text.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Row(
              children: [
                Icon(
                  _firstPinController.text == _confirmPinController.text
                      ? Icons.check_circle
                      : Icons.cancel,
                  color: _firstPinController.text == _confirmPinController.text
                      ? AppColors.success
                      : AppColors.error,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  _firstPinController.text == _confirmPinController.text
                      ? 'PINs match'
                      : 'PINs do not match',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: _firstPinController.text == _confirmPinController.text
                        ? AppColors.success
                        : AppColors.error,
                  ),
                ),
              ],
            ),
          ),

        // Error Message
        if (_errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                border: Border.all(color: AppColors.error.withOpacity(0.3)),
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
            ),
          ),

        const SizedBox(height: 32),

        // Continue Button
        ElevatedButton(
          onPressed: _isLoading ? null : _setupPin,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: _isLoading
              ? const SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          )
              : const Text('Continue'),
        ),

        const SizedBox(height: 16),

        // Info Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.cyan.withOpacity(0.1),
            border: Border.all(
              color: AppColors.cyan.withOpacity(0.3),
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Security Note',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppColors.purple,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Your PIN is securely encrypted and stored. It cannot be recovered if forgotten.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPinField({
    required TextEditingController controller,
    required String hint,
    required bool obscure,
    required Function(String) onChanged,
    required Function() onToggleVisibility,
  }) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      maxLength: 4,
      obscureText: obscure,
      onChanged: onChanged,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
      ],
      textAlign: TextAlign.center,
      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
        letterSpacing: 8,
        fontWeight: FontWeight.w600,
      ),
      decoration: InputDecoration(
        counterText: '',
        hintText: hint,
        hintStyle: Theme.of(context).textTheme.headlineSmall?.copyWith(
          color: AppColors.gray300,
        ),
        suffixIcon: IconButton(
          icon: Icon(
            obscure ? Icons.visibility_off : Icons.visibility,
            color: AppColors.textSecondary,
          ),
          onPressed: onToggleVisibility,
        ),
      ),
    );
  }

  Widget _buildSuccessMessage(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0x144DEEEA), Color(0x148A5CF6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.cyan.withOpacity(0.3),
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle,
              size: 48,
              color: AppColors.success,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'PIN Set Successfully!',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: AppColors.purple,
              fontWeight: FontWeight.w700,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            'Your Soul Journey is now protected',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/services.dart';
