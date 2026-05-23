import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive/hive.dart';
import 'package:dio/dio.dart';
import '../constants/app_constants.dart';

class OfflineSyncService {
  static const String _queueBoxName = 'syncQueue';
  static Dio? _authenticatedDio;

  static void setDio(Dio dio) {
    _authenticatedDio = dio;
  }

  static Future<void> enqueue({
    required String entityType,
    required String operation,
    required Map<String, dynamic> payload,
  }) async {
    final box = await Hive.openBox(_queueBoxName);
    await box.add({
      'entityType': entityType,
      'operation': operation,
      'payload': payload,
      'status': 'PENDING',
      'retryCount': 0,
      'createdAt': DateTime.now().toIso8601String(),
    });
  }

  static Future<int> getPendingCount() async {
    final box = await Hive.openBox(_queueBoxName);
    return box.values.where((item) => item['status'] == 'PENDING').length;
  }

  static Future<void> performBackgroundSync() async {
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) return;

    final deviceId = await AppConstants.getDeviceId();
    final box = await Hive.openBox(_queueBoxName);
    final pendingItems = box.values.where((item) => item['status'] == 'PENDING').toList();
    if (pendingItems.isEmpty) return;

    final dio = _authenticatedDio ?? Dio(BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
    ));

    for (final entry in pendingItems) {
      try {
        final response = await dio.post('/api/sync', data: {
          'items': [entry],
          'deviceId': deviceId,
        });

        if (response.statusCode == 200) {
          final key = box.keyAt(pendingItems.indexOf(entry));
          await box.put(key, {...entry, 'status': 'SYNCED', 'syncedAt': DateTime.now().toIso8601String()});
        }
      } catch (e) {
        final key = box.keyAt(pendingItems.indexOf(entry));
        await box.put(key, {...entry, 'status': 'FAILED', 'retryCount': (entry['retryCount'] as int) + 1, 'lastError': e.toString()});
      }
    }
  }

  static Future<List<Map<String, dynamic>>> getPendingItems() async {
    final box = await Hive.openBox(_queueBoxName);
    return box.values.where((item) => item['status'] == 'PENDING').cast<Map<String, dynamic>>().toList();
  }

  static Future<void> clearSynced() async {
    final box = await Hive.openBox(_queueBoxName);
    final keysToDelete = <dynamic>[];
    for (var i = 0; i < box.length; i++) {
      final key = box.keyAt(i);
      final item = box.get(key);
      if (item != null && item['status'] == 'SYNCED') {
        keysToDelete.add(key);
      }
    }
    for (final key in keysToDelete) {
      await box.delete(key);
    }
  }
}
