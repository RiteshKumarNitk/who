import 'package:flutter_test/flutter_test.dart';
import 'package:who_gis_surveillance/core/models/user.dart';
import 'package:who_gis_surveillance/core/models/survey.dart';
import 'package:who_gis_surveillance/core/models/dashboard_stats.dart';
import 'package:who_gis_surveillance/core/models/disease_case.dart';

void main() {
  group('User model', () {
    test('fromJson creates User correctly', () {
      final json = {
        'id': '123',
        'email': 'admin@who-gis.org',
        'phone': '9999999999',
        'name': 'Super Admin',
        'role': 'SUPER_ADMIN',
        'language': 'en',
        'isActive': true,
      };
      final user = User.fromJson(json);
      expect(user.id, '123');
      expect(user.email, 'admin@who-gis.org');
      expect(user.role, 'SUPER_ADMIN');
      expect(user.language, 'en');
      expect(user.isActive, true);
    });

    test('toJson produces correct map', () {
      final user = User(
        id: '1', email: 'a@b.com', phone: '123', name: 'Test',
        role: 'STATE_ADMIN',
      );
      final json = user.toJson();
      expect(json['email'], 'a@b.com');
      expect(json['role'], 'STATE_ADMIN');
    });
  });

  group('Survey model', () {
    test('fromJson creates Survey correctly', () {
      final json = {
        'id': 's1',
        'ashaId': 'a1',
        'date': '2025-01-15T10:00:00.000Z',
        'status': 'COMPLETED',
        'type': 'ROUTINE',
      };
      final survey = Survey.fromJson(json);
      expect(survey.id, 's1');
      expect(survey.status, 'COMPLETED');
      expect(survey.displayName, contains('ROUTINE'));
    });
  });

  group('DashboardStats model', () {
    test('fromJson handles null values', () {
      final stats = DashboardStats.fromJson({});
      expect(stats.totalAshaAreas, 0);
      expect(stats.totalHouseholds, 0);
    });

    test('fromJson parses values correctly', () {
      final stats = DashboardStats.fromJson({
        'totalAshaAreas': 10,
        'totalHouseholds': 100,
        'totalChildren': 250,
        'vaccinatedCount': 180,
      });
      expect(stats.totalAshaAreas, 10);
      expect(stats.totalHouseholds, 100);
      expect(stats.totalChildren, 250);
      expect(stats.vaccinatedCount, 180);
    });
  });

  group('DiseaseCase model', () {
    test('fromJson creates DiseaseCase correctly', () {
      final json = {
        'id': 'dc1',
        'diseaseType': 'MEASLES',
        'status': 'SUSPECTED',
        'severity': 'MODERATE',
        'patientName': 'John Doe',
        'patientAge': 5,
        'patientGender': 'MALE',
        'latitude': 20.5,
        'longitude': 78.9,
        'address': 'Test Address',
        'symptoms': ['Fever', 'Rash'],
        'onsetDate': '2025-01-10T00:00:00.000Z',
      };
      final dc = DiseaseCase.fromJson(json);
      expect(dc.diseaseType, 'MEASLES');
      expect(dc.patientName, 'John Doe');
      expect(dc.symptoms.length, 2);
      expect(dc.location, contains('20.5'));
    });
  });
}
