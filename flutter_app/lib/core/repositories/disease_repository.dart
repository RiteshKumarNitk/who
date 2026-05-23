import '../../core/models/disease_case.dart';
import '../../core/services/api_service.dart';
import '../../core/services/local_storage_service.dart';
import '../../core/services/offline_sync_service.dart';
import '../../core/network/network_info.dart';

class DiseaseRepository {
  final ApiService apiService;
  final LocalStorageService localStorage;
  final NetworkInfo networkInfo;

  DiseaseRepository({
    required this.apiService,
    required this.localStorage,
    required this.networkInfo,
  });

  Future<List<DiseaseCase>> getCases({String? diseaseType, String? status, int page = 1, int limit = 20}) async {
    try {
      final connected = await networkInfo.isConnected;
      if (!connected) return _getCached();
      final data = await apiService.get('/api/disease', queryParameters: {
        'diseaseType': diseaseType, 'status': status, 'page': page, 'limit': limit,
      });
      final list = (data['data'] as List<dynamic>?) ?? [];
      final cases = list.map((j) => DiseaseCase.fromJson(j as Map<String, dynamic>)).toList();
      await localStorage.cacheData('disease_cases', list);
      return cases;
    } catch (_) {
      return _getCached();
    }
  }

  List<DiseaseCase> _getCached() {
    final cached = localStorage.getCachedData('disease_cases');
    if (cached != null && cached is List) {
      return cached.map((j) => DiseaseCase.fromJson(j as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<void> reportCase(Map<String, dynamic> data) async {
    final connected = await networkInfo.isConnected;
    if (connected) {
      try {
        await apiService.post('/api/disease', data: data);
        return;
      } catch (_) {}
    }
    await OfflineSyncService.enqueue(entityType: 'DISEASE_CASE', operation: 'CREATE', payload: data);
  }
}
