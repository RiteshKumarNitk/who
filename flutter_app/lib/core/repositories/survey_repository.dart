import '../../core/models/survey.dart';
import '../../core/services/api_service.dart';
import '../../core/services/local_storage_service.dart';
import '../../core/services/offline_sync_service.dart';
import '../../core/network/network_info.dart';
import '../../core/errors/failures.dart';

class SurveyRepository {
  final ApiService apiService;
  final LocalStorageService localStorage;
  final NetworkInfo networkInfo;

  SurveyRepository({
    required this.apiService,
    required this.localStorage,
    required this.networkInfo,
  });

  Future<List<Survey>> getSurveys({int page = 1, int limit = 20}) async {
    try {
      final connected = await networkInfo.isConnected;
      if (!connected) {
        return _getCached();
      }
      final data = await apiService.get('/api/surveys', queryParameters: {'page': page, 'limit': limit});
      final list = (data['data'] as List<dynamic>?) ?? [];
      final surveys = list.map((j) => Survey.fromJson(j as Map<String, dynamic>)).toList();
      await localStorage.cacheData('surveys', list);
      return surveys;
    } catch (e) {
      return _getCached();
    }
  }

  List<Survey> _getCached() {
    final cached = localStorage.getCachedData('surveys');
    if (cached != null && cached is List) {
      return cached.map((j) => Survey.fromJson(j as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<void> createSurvey(Map<String, dynamic> data) async {
    final connected = await networkInfo.isConnected;
    if (connected) {
      try {
        await apiService.post('/api/surveys', data: data);
        return;
      } catch (_) {}
    }
    await OfflineSyncService.enqueue(
      entityType: 'SURVEY',
      operation: 'CREATE',
      payload: data,
    );
  }
}
