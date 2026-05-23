import 'package:get_it/get_it.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../services/api_service.dart';
import '../services/offline_sync_service.dart';
import '../services/local_storage_service.dart';
import '../services/gps_service.dart';
import '../network/network_info.dart';
import '../repositories/auth_repository.dart';
import '../repositories/survey_repository.dart';
import '../repositories/disease_repository.dart';
import '../repositories/hierarchy_repository.dart';
import '../bloc/auth/auth_bloc.dart';

final sl = GetIt.instance;

Future<void> configureDependencies() async {
  final apiService = ApiService();
  sl.registerLazySingleton<ApiService>(() => apiService);
  OfflineSyncService.setDio(apiService.dio);
  sl.registerLazySingleton<OfflineSyncService>(() => OfflineSyncService());
  sl.registerLazySingleton<LocalStorageService>(() => LocalStorageService());
  sl.registerLazySingleton<GpsService>(() => GpsService());
  sl.registerLazySingleton<Connectivity>(() => Connectivity());
  sl.registerLazySingleton<FlutterSecureStorage>(() => const FlutterSecureStorage());
  sl.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl(sl<Connectivity>()));

  sl.registerLazySingleton<AuthRepository>(() => AuthRepository(
    apiService: sl<ApiService>(),
    localStorage: sl<LocalStorageService>(),
    networkInfo: sl<NetworkInfo>(),
    secureStorage: sl<FlutterSecureStorage>(),
  ));
  sl.registerLazySingleton<SurveyRepository>(() => SurveyRepository(
    apiService: sl<ApiService>(),
    localStorage: sl<LocalStorageService>(),
    networkInfo: sl<NetworkInfo>(),
  ));
  sl.registerLazySingleton<DiseaseRepository>(() => DiseaseRepository(
    apiService: sl<ApiService>(),
    localStorage: sl<LocalStorageService>(),
    networkInfo: sl<NetworkInfo>(),
  ));
  sl.registerLazySingleton<HierarchyRepository>(() => HierarchyRepository(
    apiService: sl<ApiService>(),
    localStorage: sl<LocalStorageService>(),
    networkInfo: sl<NetworkInfo>(),
  ));
  sl.registerLazySingleton<AuthBloc>(() => AuthBloc(authRepository: sl<AuthRepository>()));
}
