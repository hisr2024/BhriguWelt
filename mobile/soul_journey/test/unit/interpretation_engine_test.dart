import 'package:flutter_test/flutter_test.dart';
import 'package:soul_journey/domain/engine/interpretation_engine.dart';
import 'package:soul_journey/data/models/profile_model.dart';
import 'package:soul_journey/data/models/wisdom_card_model.dart';

void main() {
  late InterpretationEngine engine;

  setUp(() {
    engine = InterpretationEngine();
  });

  group('InterpretationEngine', () {
    test('generateReport creates a complete 7-page report', () async {
      // Arrange
      final profile = ProfileModel.create(
        name: 'Test Seeker',
        dateOfBirth: DateTime(1990, 5, 15),
        timeOfBirth: '14:30',
        placeOfBirth: 'Mumbai, India',
        cityData: const CityData(
          name: 'Mumbai',
          country: 'India',
          latitude: 19.0760,
          longitude: 72.8777,
          timezone: 'Asia/Kolkata',
        ),
      );

      final wisdomCards = <WisdomCardModel>[
        WisdomCardModel.create(
          tradition: 'Bhrigu Samhita',
          topic: 'soul_signature',
          tags: ['fire', 'leadership'],
          conditions: const CardConditions(
            elements: ['Fire'],
          ),
          ruleText: 'Fire souls are natural leaders',
          outputTemplate: 'Your {{element}} nature makes you a leader.',
          priority: 10,
        ),
        WisdomCardModel.create(
          tradition: 'Nadi Jyotisha',
          topic: 'past_life',
          tags: ['karma', 'past'],
          conditions: const CardConditions(
            minAge: 25,
            maxAge: 60,
          ),
          ruleText: 'Past life imprints',
          outputTemplate: 'You carry past life memories.',
          priority: 8,
        ),
      ];

      // Act
      final report = await engine.generateReport(profile, wisdomCards);

      // Assert
      expect(report.profileId, equals(profile.id));
      expect(report.soulSignature.title, equals('Soul Signature'));
      expect(report.pastLifeThreads.title, equals('Past Life Threads'));
      expect(report.presentKarmicPhase.title, equals('Present Karmic Phase'));
      expect(report.futureOutlook.title, equals('Future Outlook'));
      expect(report.relationshipsKarma.title, equals('Relationships & Marriage Karma'));
      expect(report.remediesPractices.title, equals('Remedies & Practices'));
      expect(report.completeSummary.title, equals('Complete Soul Journey Summary'));

      // Verify content is not empty
      expect(report.soulSignature.content.isNotEmpty, isTrue);
      expect(report.pastLifeThreads.content.isNotEmpty, isTrue);
      expect(report.presentKarmicPhase.content.isNotEmpty, isTrue);
      expect(report.futureOutlook.content.isNotEmpty, isTrue);
      expect(report.relationshipsKarma.content.isNotEmpty, isTrue);
      expect(report.remediesPractices.content.isNotEmpty, isTrue);
      expect(report.completeSummary.content.isNotEmpty, isTrue);
    });

    test('calculateZodiacSign returns correct sign for Taurus birth date', () {
      // Arrange
      final profile = ProfileModel.create(
        name: 'Taurus Test',
        dateOfBirth: DateTime(1990, 5, 15), // May 15 - Taurus
        timeOfBirth: '14:30',
        placeOfBirth: 'Mumbai',
        cityData: const CityData(
          name: 'Mumbai',
          country: 'India',
          latitude: 19.0760,
          longitude: 72.8777,
          timezone: 'Asia/Kolkata',
        ),
      );

      // Act
      final report = engine.generateReport(profile, []);

      // Assert - Taurus is an Earth sign
      report.then((r) {
        expect(r.soulSignature.content.contains('Taurus'), isTrue);
      });
    });

    test('futureOutlook generates timeline from 2024 to 2032', () async {
      // Arrange
      final profile = ProfileModel.create(
        name: 'Future Test',
        dateOfBirth: DateTime(1990, 1, 1),
        timeOfBirth: '12:00',
        placeOfBirth: 'Delhi',
        cityData: const CityData(
          name: 'Delhi',
          country: 'India',
          latitude: 28.7041,
          longitude: 77.1025,
          timezone: 'Asia/Kolkata',
        ),
      );

      // Act
      final report = await engine.generateReport(profile, []);

      // Assert
      expect(report.futureOutlook.timeline, isNotNull);
      expect(report.futureOutlook.timeline!.length, equals(9)); // 2024-2032 = 9 years
      expect(report.futureOutlook.timeline!.first.year, equals(2024));
      expect(report.futureOutlook.timeline!.last.year, equals(2032));
    });

    test('wisdomCards are matched based on conditions', () {
      // Arrange
      final fireCard = WisdomCardModel.create(
        tradition: 'Test',
        topic: 'test',
        tags: ['fire'],
        conditions: const CardConditions(
          elements: ['Fire'],
        ),
        ruleText: 'Fire test',
        outputTemplate: 'Fire output',
        priority: 10,
      );

      final waterCard = WisdomCardModel.create(
        tradition: 'Test',
        topic: 'test',
        tags: ['water'],
        conditions: const CardConditions(
          elements: ['Water'],
        ),
        ruleText: 'Water test',
        outputTemplate: 'Water output',
        priority: 10,
      );

      // Act
      final fireMatches = fireCard.matches({'element': 'Fire'});
      final waterMatches = waterCard.matches({'element': 'Fire'});

      // Assert
      expect(fireMatches, isTrue);
      expect(waterMatches, isFalse);
    });

    test('karmicNumber calculation is deterministic', () async {
      // Arrange
      final profile1 = ProfileModel.create(
        name: 'Test 1',
        dateOfBirth: DateTime(1990, 5, 15),
        timeOfBirth: '14:30',
        placeOfBirth: 'Mumbai',
        cityData: const CityData(
          name: 'Mumbai',
          country: 'India',
          latitude: 19.0760,
          longitude: 72.8777,
          timezone: 'Asia/Kolkata',
        ),
      );

      final profile2 = ProfileModel.create(
        name: 'Test 2',
        dateOfBirth: DateTime(1990, 5, 15),
        timeOfBirth: '14:30',
        placeOfBirth: 'Mumbai',
        cityData: const CityData(
          name: 'Mumbai',
          country: 'India',
          latitude: 19.0760,
          longitude: 72.8777,
          timezone: 'Asia/Kolkata',
        ),
      );

      // Act
      final report1 = await engine.generateReport(profile1, []);
      final report2 = await engine.generateReport(profile2, []);

      // Assert - Same birth date should produce identical karmic insights
      expect(
        report1.soulSignature.content,
        equals(report2.soulSignature.content),
      );
    });
  });

  group('WisdomCardModel', () {
    test('matches returns true when all conditions are met', () {
      // Arrange
      final card = WisdomCardModel.create(
        tradition: 'Test',
        topic: 'test',
        tags: ['test'],
        conditions: const CardConditions(
          minAge: 25,
          maxAge: 50,
          elements: ['Fire'],
          zodiacSigns: ['Aries'],
        ),
        ruleText: 'Test rule',
        outputTemplate: 'Test output',
        priority: 5,
      );

      // Act
      final matches = card.matches({
        'age': 30,
        'element': 'Fire',
        'zodiacSign': 'Aries',
      });

      // Assert
      expect(matches, isTrue);
    });

    test('matches returns false when age is out of range', () {
      // Arrange
      final card = WisdomCardModel.create(
        tradition: 'Test',
        topic: 'test',
        tags: ['test'],
        conditions: const CardConditions(
          minAge: 25,
          maxAge: 50,
        ),
        ruleText: 'Test rule',
        outputTemplate: 'Test output',
        priority: 5,
      );

      // Act
      final matchesTooYoung = card.matches({'age': 20});
      final matchesTooOld = card.matches({'age': 60});

      // Assert
      expect(matchesTooYoung, isFalse);
      expect(matchesTooOld, isFalse);
    });

    test('render replaces template variables correctly', () {
      // Arrange
      final card = WisdomCardModel.create(
        tradition: 'Test',
        topic: 'test',
        tags: ['test'],
        conditions: const CardConditions(),
        ruleText: 'Test',
        outputTemplate: 'Hello {{name}}, you are {{age}} years old.',
        priority: 5,
      );

      // Act
      final rendered = card.render({'name': 'John', 'age': 30});

      // Assert
      expect(rendered, equals('Hello John, you are 30 years old.'));
    });
  });

  group('ProfileModel', () {
    test('age is calculated correctly', () {
      // Arrange - Create profile with birth date 30 years ago
      final birthDate = DateTime.now().subtract(const Duration(days: 365 * 30));
      final profile = ProfileModel.create(
        name: 'Age Test',
        dateOfBirth: birthDate,
        timeOfBirth: '12:00',
        placeOfBirth: 'Test City',
        cityData: const CityData(
          name: 'Test',
          country: 'Test',
          latitude: 0,
          longitude: 0,
          timezone: 'UTC',
        ),
      );

      // Act
      final age = profile.age;

      // Assert
      expect(age, equals(30));
    });
  });
}
