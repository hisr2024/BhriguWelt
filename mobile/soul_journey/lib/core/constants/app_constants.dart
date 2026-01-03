/// Application-wide constants for the Soul Journey app
class AppConstants {
  AppConstants._();

  // App Info
  static const String appName = 'Soul Journey';
  static const String appVersion = '1.0.0';

  // Database
  static const String databaseName = 'soul_journey.db';
  static const int databaseVersion = 1;

  // Security
  static const String pinKey = 'app_pin';
  static const String biometricEnabledKey = 'biometric_enabled';
  static const String encryptionKeyAlias = 'soul_journey_encryption_key';
  static const int lockTimeoutSeconds = 300; // 5 minutes

  // Storage Keys
  static const String firstLaunchKey = 'first_launch';
  static const String lastActiveKey = 'last_active';

  // Wisdom Cards
  static const int defaultWisdomCardCount = 30;
  static const String wisdomCardsAsset = 'assets/wisdom_cards/demo_cards.json';

  // Cities
  static const String citiesAsset = 'assets/cities/cities.json';

  // Report Generation
  static const List<String> reportPages = [
    'Soul Signature',
    'Past Life Threads',
    'Present Karmic Phase',
    'Future Outlook',
    'Relationships & Marriage Karma',
    'Remedies & Practices',
    'Complete Soul Journey Summary',
  ];

  // Astrological Constants
  static const List<String> zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  static const List<String> nakshatras = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
  ];

  static const List<String> elements = [
    'Fire', 'Earth', 'Air', 'Water', 'Ether'
  ];

  static const List<String> lifePhases = [
    'Childhood (0-12)', 'Youth (13-24)', 'Adulthood (25-48)',
    'Maturity (49-72)', 'Wisdom (73+)'
  ];

  // Future Timeline Years
  static const int futureTimelineStartYear = 2024;
  static const int futureTimelineEndYear = 2032;

  // Validation
  static const int minAge = 0;
  static const int maxAge = 150;
  static const int pinLength = 4;

  // UI
  static const Duration animationDuration = Duration(milliseconds: 300);
  static const Duration splashDuration = Duration(seconds: 3);
  static const double cardBorderRadius = 12.0;
  static const double buttonBorderRadius = 8.0;

  // Error Messages
  static const String genericError = 'Something went wrong. Please try again.';
  static const String networkError = 'No internet connection required. All features work offline.';
  static const String databaseError = 'Database error occurred. Please restart the app.';
  static const String invalidPinError = 'Invalid PIN. Please try again.';
  static const String biometricError = 'Biometric authentication failed.';
}
