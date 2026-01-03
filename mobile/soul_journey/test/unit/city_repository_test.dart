import 'package:flutter_test/flutter_test.dart';
import 'package:soul_journey/data/repositories/city_repository.dart';

void main() {
  group('CityRepository', () {
    late CityRepository repository;

    setUp(() {
      repository = CityRepository();
    });

    test('loadCities returns list of cities', () async {
      final cities = await repository.loadCities();

      expect(cities, isNotEmpty);
      expect(cities.length, greaterThanOrEqualTo(50));
    });

    test('cities have required fields', () async {
      final cities = await repository.loadCities();
      final firstCity = cities.first;

      expect(firstCity.name, isNotEmpty);
      expect(firstCity.country, isNotEmpty);
      expect(firstCity.timezone, isNotEmpty);
      expect(firstCity.latitude, isA<double>());
      expect(firstCity.longitude, isA<double>());
    });

    test('searchCities filters by name', () async {
      final results = await repository.searchCities('New');

      expect(results, isNotEmpty);
      for (final city in results) {
        final nameMatch = city.name.toLowerCase().contains('new');
        final countryMatch = city.country.toLowerCase().contains('new');
        expect(nameMatch || countryMatch, true);
      }
    });

    test('searchCities returns all cities for empty query', () async {
      final all = await repository.loadCities();
      final results = await repository.searchCities('');

      expect(results.length, all.length);
    });

    test('getAllCountries returns unique countries', () async {
      final countries = await repository.getAllCountries();

      expect(countries, isNotEmpty);
      expect(countries.toSet().length, countries.length);
    });
  });
}
