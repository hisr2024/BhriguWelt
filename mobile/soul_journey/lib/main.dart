import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'ui/theme/app_theme.dart';
import 'ui/screens/home_screen.dart';
import 'core/constants/app_constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations (portrait only for better UX)
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: AppColors.background,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    const ProviderScope(
      child: SoulJourneyApp(),
    ),
  );
}

class SoulJourneyApp extends StatelessWidget {
  const SoulJourneyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}

/// Splash Screen with animated logo
class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigateToHome();
  }

  Future<void> _navigateToHome() async {
    // Wait for splash duration
    await Future.delayed(AppConstants.splashDuration);

    // TODO: Check if first launch, show onboarding
    // TODO: Check if app is locked, show PIN screen
    // For now, navigate directly to home

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => const HomeScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animated Logo
            const AnimatedLogo(size: 180),

            const SizedBox(height: 32),

            // App Name with Gradient
            const GradientText(
              text: 'Soul Journey',
              style: TextStyle(
                fontSize: 42,
                fontWeight: FontWeight.w800,
              ),
            ),

            const SizedBox(height: 12),

            // Tagline
            Text(
              'Your Path to Self-Discovery',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.purple,
                    fontWeight: FontWeight.w600,
                  ),
            ),

            const SizedBox(height: 48),

            // Loading indicator
            const SizedBox(
              width: 40,
              height: 40,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.purple),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Import AnimatedLogo
import 'ui/widgets/animated_logo.dart';
