import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:soul_journey/core/security/pin_manager.dart';

@GenerateMocks([FlutterSecureStorage])
import 'pin_manager_test.mocks.dart';

void main() {
  group('PinManager', () {
    late MockFlutterSecureStorage mockStorage;
    late PinManager pinManager;

    setUp(() {
      mockStorage = MockFlutterSecureStorage();
      pinManager = PinManager(secureStorage: mockStorage);
    });

    test('isPinSet returns false when no PIN is stored', () async {
      when(mockStorage.read(key: 'soul_journey_pin_hash'))
          .thenAnswer((_) async => null);

      final isSet = await pinManager.isPinSet();

      expect(isSet, false);
    });

    test('isPinSet returns true when PIN is stored', () async {
      when(mockStorage.read(key: 'soul_journey_pin_hash'))
          .thenAnswer((_) async => 'somehash');

      final isSet = await pinManager.isPinSet();

      expect(isSet, true);
    });

    test('setupPin requires 4 digit PIN', () async {
      expect(
        () => pinManager.setupPin('123'),
        throwsArgumentError,
      );

      expect(
        () => pinManager.setupPin('12345'),
        throwsArgumentError,
      );
    });

    test('setupPin requires numeric PIN', () async {
      expect(
        () => pinManager.setupPin('abcd'),
        throwsArgumentError,
      );
    });

    test('setupPin stores hash and salt', () async {
      when(mockStorage.write(key: anyNamed('key'), value: anyNamed('value')))
          .thenAnswer((_) async => {});

      await pinManager.setupPin('1234');

      verify(mockStorage.write(key: 'soul_journey_pin_hash', value: anyNamed('value'))).called(1);
      verify(mockStorage.write(key: 'soul_journey_pin_salt', value: anyNamed('value'))).called(1);
      verify(mockStorage.write(key: 'soul_journey_db_key', value: anyNamed('value'))).called(1);
    });
  });
}
