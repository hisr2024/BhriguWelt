import 'dart:convert';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';

part 'report_model.freezed.dart';
part 'report_model.g.dart';

/// Soul Journey Report with 7 pages
@freezed
class ReportModel with _$ReportModel {
  const ReportModel._();

  const factory ReportModel({
    required String id,
    required String profileId,
    required ReportPage soulSignature,
    required ReportPage pastLifeThreads,
    required ReportPage presentKarmicPhase,
    required ReportPage futureOutlook,
    required ReportPage relationshipsKarma,
    required ReportPage remediesPractices,
    required ReportPage completeSummary,
    required DateTime generatedAt,
  }) = _ReportModel;

  factory ReportModel.create({
    required String profileId,
    required ReportPage soulSignature,
    required ReportPage pastLifeThreads,
    required ReportPage presentKarmicPhase,
    required ReportPage futureOutlook,
    required ReportPage relationshipsKarma,
    required ReportPage remediesPractices,
    required ReportPage completeSummary,
  }) {
    return ReportModel(
      id: const Uuid().v4(),
      profileId: profileId,
      soulSignature: soulSignature,
      pastLifeThreads: pastLifeThreads,
      presentKarmicPhase: presentKarmicPhase,
      futureOutlook: futureOutlook,
      relationshipsKarma: relationshipsKarma,
      remediesPractices: remediesPractices,
      completeSummary: completeSummary,
      generatedAt: DateTime.now(),
    );
  }

  factory ReportModel.fromJson(Map<String, dynamic> json) =>
      _$ReportModelFromJson(json);

  /// Convert to database map
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'profile_id': profileId,
      'soul_signature': soulSignature.toJsonString(),
      'past_life_threads': pastLifeThreads.toJsonString(),
      'present_karmic_phase': presentKarmicPhase.toJsonString(),
      'future_outlook': futureOutlook.toJsonString(),
      'relationships_karma': relationshipsKarma.toJsonString(),
      'remedies_practices': remediesPractices.toJsonString(),
      'complete_summary': completeSummary.toJsonString(),
      'generated_at': generatedAt.millisecondsSinceEpoch,
    };
  }

  /// Create from database map
  static ReportModel fromDatabase(Map<String, dynamic> map) {
    return ReportModel(
      id: map['id'] as String,
      profileId: map['profile_id'] as String,
      soulSignature: ReportPage.fromJsonString(map['soul_signature'] as String),
      pastLifeThreads: ReportPage.fromJsonString(map['past_life_threads'] as String),
      presentKarmicPhase: ReportPage.fromJsonString(map['present_karmic_phase'] as String),
      futureOutlook: ReportPage.fromJsonString(map['future_outlook'] as String),
      relationshipsKarma: ReportPage.fromJsonString(map['relationships_karma'] as String),
      remediesPractices: ReportPage.fromJsonString(map['remedies_practices'] as String),
      completeSummary: ReportPage.fromJsonString(map['complete_summary'] as String),
      generatedAt: DateTime.fromMillisecondsSinceEpoch(map['generated_at'] as int),
    );
  }

  /// Get all pages as a list
  List<ReportPage> get allPages => [
        soulSignature,
        pastLifeThreads,
        presentKarmicPhase,
        futureOutlook,
        relationshipsKarma,
        remediesPractices,
        completeSummary,
      ];
}

/// Single page of a Soul Journey Report
@freezed
class ReportPage with _$ReportPage {
  const ReportPage._();

  const factory ReportPage({
    required String title,
    required String content,
    List<String>? bulletPoints,
    Map<String, String>? highlights,
    List<TimelineEvent>? timeline,
    List<String>? warnings,
    List<String>? blessings,
  }) = _ReportPage;

  factory ReportPage.fromJson(Map<String, dynamic> json) =>
      _$ReportPageFromJson(json);

  /// Convert to JSON string for database storage
  String toJsonString() {
    return jsonEncode(toJson());
  }

  /// Create from JSON string
  static ReportPage fromJsonString(String jsonString) {
    return ReportPage.fromJson(jsonDecode(jsonString) as Map<String, dynamic>);
  }
}

/// Timeline event for Future Outlook page
@freezed
class TimelineEvent with _$TimelineEvent {
  const factory TimelineEvent({
    required int year,
    required String title,
    required String description,
    @Default(false) bool isPositive,
    List<String>? recommendations,
  }) = _TimelineEvent;

  factory TimelineEvent.fromJson(Map<String, dynamic> json) =>
      _$TimelineEventFromJson(json);
}
