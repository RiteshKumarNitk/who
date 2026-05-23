import '../../core/services/api_service.dart';
import '../../core/services/local_storage_service.dart';
import '../../core/network/network_info.dart';

class HierarchyRepository {
  final ApiService apiService;
  final LocalStorageService localStorage;
  final NetworkInfo networkInfo;

  HierarchyRepository({
    required this.apiService,
    required this.localStorage,
    required this.networkInfo,
  });

  Future<List<dynamic>> getHierarchy({required String type, String? parentId}) async {
    try {
      final data = await apiService.getHierarchy(type: type, parentId: parentId);
      return data;
    } catch (_) {
      return [];
    }
  }
}
