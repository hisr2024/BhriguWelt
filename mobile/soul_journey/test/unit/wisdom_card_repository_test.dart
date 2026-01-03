import 'package:flutter_test/flutter_test.dart';
import 'package:soul_journey/data/repositories/wisdom_card_repository.dart';
import 'package:soul_journey/data/models/wisdom_card_model.dart';

void main() {
  group('WisdomCardRepository', () {
    late WisdomCardRepository repository;

    setUp(() {
      repository = WisdomCardRepository();
    });

    test('loadDemoCards returns list of wisdom cards', () async {
      final cards = await repository.loadDemoCards();

      expect(cards, isNotEmpty);
      expect(cards.length, greaterThan(0));
      expect(cards.first, isA<WisdomCardModel>());
    });

    test('wisdom cards have required fields', () async {
      final cards = await repository.loadDemoCards();
      final firstCard = cards.first;

      expect(firstCard.tradition, isNotEmpty);
      expect(firstCard.topic, isNotEmpty);
      expect(firstCard.ruleText, isNotEmpty);
      expect(firstCard.outputTemplate, isNotEmpty);
      expect(firstCard.priority, isA<int>());
    });

    test('wisdom cards cover multiple topics', () async {
      final cards = await repository.loadDemoCards();
      final topics = cards.map((c) => c.topic).toSet();

      expect(topics.length, greaterThan(1));
      expect(topics.contains('soul_signature'), true);
    });
  });
}
