import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/models/user.dart';
import '../../core/services/api_service.dart';
import '../../core/services/local_storage_service.dart';
import '../../core/errors/failures.dart';
import '../../core/network/network_info.dart';

class AuthRepository {
  final ApiService apiService;
  final LocalStorageService localStorage;
  final NetworkInfo networkInfo;
  final FlutterSecureStorage secureStorage;

  AuthRepository({
    required this.apiService,
    required this.localStorage,
    required this.networkInfo,
    required this.secureStorage,
  });

  Future<String?> _readToken() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token');
    }
    return secureStorage.read(key: 'auth_token');
  }

  Future<void> _writeToken(String token) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
    } else {
      await secureStorage.write(key: 'auth_token', value: token);
    }
  }

  Future<void> _deleteToken() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
    } else {
      await secureStorage.delete(key: 'auth_token');
    }
  }

  Future<User> login({required String email, required String password}) async {
    try {
      final response = await apiService.login(email: email, password: password);
      if (response == null) {
        throw const ServerFailure('Server returned empty response. Try again.');
      }
      final tokens = response['tokens'] as Map<String, dynamic>?;
      if (tokens == null || tokens['accessToken'] == null) {
        throw const ServerFailure('Invalid server response - no auth token.');
      }
      await _writeToken(tokens['accessToken'] as String);
      final userData = response['user'] as Map<String, dynamic>?;
      if (userData == null) {
        throw const ServerFailure('Invalid server response - no user data.');
      }
      final user = User.fromJson(userData);
      await localStorage.saveUserData(userData);
      return user;
    } on ServerFailure {
      rethrow;
    } catch (e) {
      throw ServerFailure(e.toString());
    }
  }

  Future<User> getProfile() async {
    try {
      final data = await apiService.getProfile();
      final user = User.fromJson(data);
      await localStorage.saveUserData(data);
      return user;
    } catch (e) {
      final cached = localStorage.getUserData();
      if (cached != null) return User.fromJson(cached);
      throw const ServerFailure('Could not load profile');
    }
  }

  Future<bool> isAuthenticated() async {
    final token = await _readToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> logout() async {
    await _deleteToken();
    await localStorage.clearAll();
  }

  Future<void> updateLanguage(String lang) async {
    await localStorage.setLanguage(lang);
  }
}
