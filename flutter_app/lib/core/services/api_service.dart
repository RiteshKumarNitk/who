import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class ApiService {
  late final Dio _dio;

  Dio get dio => _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _readToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await _deleteToken();
        }
        handler.next(error);
      },
    ));
  }

  Future<String?> _readToken() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token');
    }
    const storage = FlutterSecureStorage();
    return storage.read(key: 'auth_token');
  }

  Future<void> _deleteToken() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
    } else {
      const storage = FlutterSecureStorage();
      await storage.delete(key: 'auth_token');
    }
  }

  Future<Map<String, dynamic>> login({required String email, required String password}) async {
    final response = await _dio.post('/api/auth/login', data: {'email': email, 'password': password});
    return response.data['data'];
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _dio.get('/api/auth/profile');
    return response.data['data'];
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? queryParameters}) async {
    final response = await _dio.get(path, queryParameters: queryParameters);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? data}) async {
    final response = await _dio.post(path, data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getBoundaries({String? status, int page = 1, int limit = 20}) async {
    final response = await _dio.get('/api/gis/polygons', queryParameters: {'status': status, 'page': page, 'limit': limit});
    return response.data['data'] ?? [];
  }

  Future<List<dynamic>> getDiseaseCases({String? diseaseType, String? status, int page = 1, int limit = 20}) async {
    final response = await _dio.get('/api/disease', queryParameters: {'diseaseType': diseaseType, 'status': status, 'page': page, 'limit': limit});
    return response.data['data'] ?? [];
  }

  Future<Map<String, dynamic>> reportDiseaseCase(Map<String, dynamic> data) async {
    final response = await _dio.post('/api/disease', data: data);
    return response.data['data'];
  }

  Future<Map<String, dynamic>> submitSurvey(Map<String, dynamic> data) async {
    final response = await _dio.post('/api/surveys', data: data);
    return response.data['data'];
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    final response = await _dio.get('/api/analytics');
    return response.data['data'];
  }

  Future<Map<String, dynamic>> syncBatch(List<Map<String, dynamic>> items, String deviceId) async {
    final response = await _dio.post('/api/sync', data: {'items': items, 'deviceId': deviceId});
    return response.data['data'];
  }

  Future<List<dynamic>> getHierarchy({required String type, String? parentId}) async {
    final endpoint = type == 'states' ? '/api/hierarchy/states'
        : type == 'districts' ? '/api/hierarchy/districts'
        : type == 'blocks' ? '/api/hierarchy/blocks'
        : type == 'planning-units' ? '/api/hierarchy/planning-units'
        : type == 'anms' ? '/api/hierarchy/anms'
        : '/api/hierarchy/ashas';

    final params = <String, dynamic>{};
    if (parentId != null) params['parentId'] = parentId;

    final response = await _dio.get(endpoint, queryParameters: params);
    return response.data['data'] ?? [];
  }
}
