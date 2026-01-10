import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'ui/theme/app_theme.dart';
import 'ui/screens/home_screen.dart';
import 'ui/screens/onboarding_screen.dart';
import 'ui/screens/pin_screen.dart';
import 'ui/screens/profile_create_screen.dart';
import 'ui/screens/profile_list_screen.dart';
import 'ui/screens/wisdom_library_screen.dart';
import 'ui/widgets/animated_logo.dart';
import 'core/constants/app_constants.dart';
import 'core/security/app_lock_manager.dart';
import 'core/security/pin_manager.dart';

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
      routes: {
        '/home': (context) => const HomeScreen(),
        '/onboarding': (context) => const OnboardingScreen(),
        '/pin': (context) => const PinScreen(),
        '/profiles': (context) => const ProfileListScreen(),
        '/profiles/create': (context) => const ProfileCreateScreen(),
        '/wisdom': (context) => const WisdomLibraryScreen(),
      },
    );
  }
}

/// Splash Screen with animated logo
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigateToHome();
  }

  Future<void> _navigateToHome() async {
    // Wait for splash duration
    await Future.delayed(AppConstants.splashDuration);

    const secureStorage = FlutterSecureStorage();
    final pinManager = PinManager(secureStorage: secureStorage);
    final isPinSet = await pinManager.isPinSet();
    final firstLaunchFlag =
        await secureStorage.read(key: AppConstants.firstLaunchKey);
    final isFirstLaunch =
        !isPinSet || firstLaunchFlag == null || firstLaunchFlag == 'true';
    final isLocked = ref.read(appLockManagerProvider).isLocked;

    Widget destination;

    if (isFirstLaunch) {
      destination = const OnboardingScreen();
    } else if (isLocked) {
      destination = const PinScreen();
    } else {
      destination = const HomeScreen();
    }

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => destination,
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
