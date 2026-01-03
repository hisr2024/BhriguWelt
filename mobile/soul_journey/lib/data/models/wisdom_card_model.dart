import 'dart:convert';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';

part 'wisdom_card_model.freezed.dart';
part 'wisdom_card_model.g.dart';

/// Wisdom Card for interpretation engine
///
/// Represents a single piece of ancient wisdom that can be
/// matched based on birth chart features and conditions
@freezed
class WisdomCardModel with _$WisdomCardModel {
  const WisdomCardModel._();

  const factory WisdomCardModel({
    required String id,
    required String tradition, // 'Bhrigu Samhita', 'Nadi Jyotisha', 'Vedic'
    required String topic, // 'career', 'marriage', 'health', 'spiritual', etc.
    required List<String> tags,
    required CardConditions conditions,
    required String ruleText,
    required String outputTemplate,
    @Default(0) int priority,
    required DateTime createdAt,
  }) = _WisdomCardModel;

  factory WisdomCardModel.create({
    required String tradition,
    required String topic,
    required List<String> tags,
    required CardConditions conditions,
    required String ruleText,
    required String outputTemplate,
    int priority = 0,
  }) {
    return WisdomCardModel(
      id: const Uuid().v4(),
      tradition: tradition,
      topic: topic,
      tags: tags,
      conditions: conditions,
      ruleText: ruleText,
      outputTemplate: outputTemplate,
      priority: priority,
      createdAt: DateTime.now(),
    );
  }

  factory WisdomCardModel.fromJson(Map<String, dynamic> json) =>
      _$WisdomCardModelFromJson(json);

  /// Convert to database map
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'tradition': tradition,
      'topic': topic,
      'tags': jsonEncode(tags),
      'conditions_json': conditions.toJsonString(),
      'rule_text': ruleText,
      'output_template': outputTemplate,
      'priority': priority,
      'created_at': createdAt.millisecondsSinceEpoch,
    };
  }

  /// Create from database map
  static WisdomCardModel fromDatabase(Map<String, dynamic> map) {
    return WisdomCardModel(
      id: map['id'] as String,
      tradition: map['tradition'] as String,
      topic: map['topic'] as String,
      tags: List<String>.from(jsonDecode(map['tags'] as String) as List),
      conditions: CardConditions.fromJsonString(map['conditions_json'] as String),
      ruleText: map['rule_text'] as String,
      outputTemplate: map['output_template'] as String,
      priority: map['priority'] as int,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
    );
  }

  /// Check if this card matches the given features
  bool matches(Map<String, dynamic> features) {
    return conditions.matches(features);
  }

  /// Render output with template variables
  String render(Map<String, dynamic> variables) {
    String output = outputTemplate;
    variables.forEach((key, value) {
      output = output.replaceAll('{{$key}}', value.toString());
    });
    return output;
  }
}

/// Conditions for matching a Wisdom Card
@freezed
class CardConditions with _$CardConditions {
  const CardConditions._();

  const factory CardConditions({
    int? minAge,
    int? maxAge,
    List<String>? zodiacSigns,
    List<String>? nakshatras,
    List<String>? elements,
    List<String>? lifePhases,
    Map<String, dynamic>? customConditions,
  }) = _CardConditions;

  factory CardConditions.fromJson(Map<String, dynamic> json) =>
      _$CardConditionsFromJson(json);

  /// Convert to JSON string for database storage
  String toJsonString() {
    return jsonEncode(toJson());
  }

  /// Create from JSON string
  static CardConditions fromJsonString(String jsonString) {
    return CardConditions.fromJson(jsonDecode(jsonString) as Map<String, dynamic>);
  }

  /// Check if features match conditions
  bool matches(Map<String, dynamic> features) {
    // Age check
    if (minAge != null) {
      final age = features['age'] as int?;
      if (age == null || age < minAge!) return false;
    }

    if (maxAge != null) {
      final age = features['age'] as int?;
      if (age == null || age > maxAge!) return false;
    }

    // Zodiac sign check
    if (zodiacSigns != null && zodiacSigns!.isNotEmpty) {
      final sign = features['zodiacSign'] as String?;
      if (sign == null || !zodiacSigns!.contains(sign)) return false;
    }

    // Nakshatra check
    if (nakshatras != null && nakshatras!.isNotEmpty) {
      final nakshatra = features['nakshatra'] as String?;
      if (nakshatra == null || !nakshatras!.contains(nakshatra)) return false;
    }

    // Element check
    if (elements != null && elements!.isNotEmpty) {
      final element = features['element'] as String?;
      if (element == null || !elements!.contains(element)) return false;
    }

    // Life phase check
    if (lifePhases != null && lifePhases!.isNotEmpty) {
      final phase = features['lifePhase'] as String?;
      if (phase == null || !lifePhases!.contains(phase)) return false;
    }

    // Custom conditions check
    if (customConditions != null) {
      for (final entry in customConditions!.entries) {
        final featureValue = features[entry.key];
        final conditionValue = entry.value;

        if (conditionValue is List) {
          if (!conditionValue.contains(featureValue)) return false;
        } else {
          if (featureValue != conditionValue) return false;
        }
      }
    }

    return true;
  }
}
