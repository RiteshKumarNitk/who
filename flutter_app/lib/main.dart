import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:workmanager/workmanager.dart';
import 'app/app.dart';
import 'core/constants/app_constants.dart';
import 'core/di/injection_container.dart';
import 'core/services/offline_sync_service.dart';
import 'core/services/local_storage_service.dart';

const String backgroundSyncTask = 'backgroundSync';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    await OfflineSyncService.performBackgroundSync();
    return Future.value(true);
  });
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load();
  await Hive.initFlutter();
  await AppConstants.getDeviceId();
  await configureDependencies();

  await sl<LocalStorageService>().init();

  if (!kIsWeb) {
    Workmanager().initialize(callbackDispatcher);
    Workmanager().registerPeriodicTask(
      backgroundSyncTask,
      backgroundSyncTask,
      frequency: const Duration(minutes: 15),
      constraints: Constraints(networkType: NetworkType.connected),
    );
  }

  runApp(const WHOGISApp());
}
