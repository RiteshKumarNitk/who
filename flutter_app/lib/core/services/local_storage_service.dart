import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  static const String _userBox = 'userData';
  static const String _cacheBox = 'cache';
  static const String _settingsBox = 'settings';

  Future<void> init() async {
    await Hive.openBox(_userBox);
    await Hive.openBox(_cacheBox);
    await Hive.openBox(_settingsBox);
  }

  // User preferences
  Future<void> setLanguage(String lang) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language', lang);
  }

  Future<String?> getLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('language');
  }

  // Cache management
  Future<void> cacheData(String key, dynamic data) async {
    final box = Hive.box(_cacheBox);
    await box.put(key, data);
  }

  dynamic getCachedData(String key) {
    final box = Hive.box(_cacheBox);
    return box.get(key);
  }

  Future<void> clearCache() async {
    await Hive.box(_cacheBox).clear();
  }

  // User data
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    final box = Hive.box(_userBox);
    await box.put('user', userData);
  }

  Map<String, dynamic>? getUserData() {
    final box = Hive.box(_userBox);
    return box.get('user');
  }

  Future<void> clearUserData() async {
    await Hive.box(_userBox).clear();
  }

  // Settings
  Future<void> setLastSyncTime(DateTime time) async {
    final box = Hive.box(_settingsBox);
    await box.put('lastSync', time.toIso8601String());
  }

  DateTime? getLastSyncTime() {
    final box = Hive.box(_settingsBox);
    final value = box.get('lastSync');
    return value != null ? DateTime.parse(value) : null;
  }

  Future<void> clearAll() async {
    await Hive.box(_userBox).clear();
    await Hive.box(_cacheBox).clear();
    await Hive.box(_settingsBox).clear();
  }
}
