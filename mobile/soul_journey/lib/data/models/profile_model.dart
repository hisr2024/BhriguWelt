import 'dart:convert';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';

part 'profile_model.freezed.dart';
part 'profile_model.g.dart';

/// User profile with birth details
@freezed
class ProfileModel with _$ProfileModel {
  const ProfileModel._();

  const factory ProfileModel({
    required String id,
    required String name,
    required DateTime dateOfBirth,
    required String timeOfBirth,
    required String placeOfBirth,
    required CityData cityData,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _ProfileModel;

  factory ProfileModel.create({
    required String name,
    required DateTime dateOfBirth,
    required String timeOfBirth,
    required String placeOfBirth,
    required CityData cityData,
  }) {
    final now = DateTime.now();
    return ProfileModel(
      id: const Uuid().v4(),
      name: name,
      dateOfBirth: dateOfBirth,
      timeOfBirth: timeOfBirth,
      placeOfBirth: placeOfBirth,
      cityData: cityData,
      createdAt: now,
      updatedAt: now,
    );
  }

  factory ProfileModel.fromJson(Map<String, dynamic> json) =>
      _$ProfileModelFromJson(json);

  /// Convert to database map
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'name': name,
      'date_of_birth': dateOfBirth.toIso8601String(),
      'time_of_birth': timeOfBirth,
      'place_of_birth': placeOfBirth,
      'city_data': cityData.toJsonString(),
      'created_at': createdAt.millisecondsSinceEpoch,
      'updated_at': updatedAt.millisecondsSinceEpoch,
    };
  }

  /// Create from database map
  static ProfileModel fromDatabase(Map<String, dynamic> map) {
    return ProfileModel(
      id: map['id'] as String,
      name: map['name'] as String,
      dateOfBirth: DateTime.parse(map['date_of_birth'] as String),
      timeOfBirth: map['time_of_birth'] as String,
      placeOfBirth: map['place_of_birth'] as String,
      cityData: CityData.fromJsonString(map['city_data'] as String),
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
      updatedAt: DateTime.fromMillisecondsSinceEpoch(map['updated_at'] as int),
    );
  }

  /// Get age from date of birth
  int get age {
    final now = DateTime.now();
    int age = now.year - dateOfBirth.year;
    if (now.month < dateOfBirth.month ||
        (now.month == dateOfBirth.month && now.day < dateOfBirth.day)) {
      age--;
    }
    return age;
  }
}

/// City location data
@freezed
class CityData with _$CityData {
  const CityData._();

  const factory CityData({
    required String name,
    required String country,
    required double latitude,
    required double longitude,
    required String timezone,
  }) = _CityData;

  factory CityData.fromJson(Map<String, dynamic> json) =>
      _$CityDataFromJson(json);

  /// Convert to JSON string for database storage
  String toJsonString() {
    return jsonEncode(toJson());
  }

  /// Create from JSON string
  static CityData fromJsonString(String jsonString) {
    return CityData.fromJson(jsonDecode(jsonString) as Map<String, dynamic>);
  }
}
