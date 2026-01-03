import 'dart:convert';
import 'package:flutter/services.dart';

/// Model for city data
class CityModel {
  final String name;
  final String country;
  final double latitude;
  final double longitude;
  final String timezone;

  CityModel({
    required this.name,
    required this.country,
    required this.latitude,
    required this.longitude,
    required this.timezone,
  });

  factory CityModel.fromJson(Map<String, dynamic> json) {
    return CityModel(
      name: json['name'] as String,
      country: json['country'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      timezone: json['timezone'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'country': country,
      'latitude': latitude,
      'longitude': longitude,
      'timezone': timezone,
    };
  }

  String get displayName => '$name, $country';
}

/// Repository for offline city database search
class CityRepository {
  List<CityModel>? _cities;

  /// Load cities from bundled JSON asset
  Future<List<CityModel>> loadCities() async {
    if (_cities != null) {
      return _cities!;
    }

    try {
      final jsonString = await rootBundle.loadString('assets/cities/cities.json');
      final List<dynamic> jsonList = json.decode(jsonString);
      _cities = jsonList.map((json) => CityModel.fromJson(json)).toList();
      return _cities!;
    } catch (e) {
      throw Exception('Failed to load cities: $e');
    }
  }

  /// Search cities by name (case-insensitive, prefix match)
  Future<List<CityModel>> searchCities(String query) async {
    final cities = await loadCities();

    if (query.trim().isEmpty) {
      return cities;
    }

    final lowerQuery = query.toLowerCase().trim();

    return cities.where((city) {
      final cityName = city.name.toLowerCase();
      final countryName = city.country.toLowerCase();

      // Match by city name or country name
      return cityName.contains(lowerQuery) || countryName.contains(lowerQuery);
    }).toList();
  }

  /// Get city by exact name match
  Future<CityModel?> getCityByName(String name, {String? country}) async {
    final cities = await loadCities();

    try {
      return cities.firstWhere(
        (city) {
          final nameMatch = city.name.toLowerCase() == name.toLowerCase();
          if (country != null) {
            return nameMatch && city.country.toLowerCase() == country.toLowerCase();
          }
          return nameMatch;
        },
      );
    } catch (e) {
      return null;
    }
  }

  /// Get all cities for a country
  Future<List<CityModel>> getCitiesByCountry(String country) async {
    final cities = await loadCities();

    return cities.where((city) {
      return city.country.toLowerCase() == country.toLowerCase();
    }).toList();
  }

  /// Get all unique countries
  Future<List<String>> getAllCountries() async {
    final cities = await loadCities();

    final countries = cities.map((city) => city.country).toSet().toList();
    countries.sort();
    return countries;
  }

  /// Get popular cities (first 10 in the list, typically major cities)
  Future<List<CityModel>> getPopularCities() async {
    final cities = await loadCities();
    return cities.take(10).toList();
  }

  /// Get total city count
  Future<int> getCityCount() async {
    final cities = await loadCities();
    return cities.length;
  }

  /// Clear cached cities (force reload on next access)
  void clearCache() {
    _cities = null;
  }
}
