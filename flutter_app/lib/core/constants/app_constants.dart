import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'device_id.dart';

class AppConstants {
  static String get apiBaseUrl {
    final env = dotenv.env['API_BASE_URL'];
    if (env != null && env.isNotEmpty) return env;
    return kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000';
  }

  static String get mapboxToken => dotenv.env['MAPBOX_TOKEN'] ?? '';

  static String get googleMapsKey => dotenv.env['GOOGLE_MAPS_KEY'] ?? '';

  static String get locale => 'hi';

  static const int syncIntervalMs = 30000;

  static const int maxRetryCount = 5;

  static const int batchSize = 50;

  static String _deviceId = '';

  static Future<String> getDeviceId() async {
    if (_deviceId.isNotEmpty) return _deviceId;
    try {
      _deviceId = await const DeviceIdResolver().resolve();
    } catch (_) {
      _deviceId = 'unknown-device';
    }
    return _deviceId;
  }

  static String get deviceId => _deviceId;
}
