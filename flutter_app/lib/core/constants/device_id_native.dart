import 'dart:io' show Platform;
import 'package:device_info_plus/device_info_plus.dart';

Future<String> getDeviceIdImpl() async {
  final deviceInfo = DeviceInfoPlugin();
  if (Platform.isAndroid) {
    final info = await deviceInfo.androidInfo;
    return info.id;
  }
  if (Platform.isIOS) {
    final info = await deviceInfo.iosInfo;
    return info.identifierForVendor ?? 'unknown-device';
  }
  if (Platform.isWindows) {
    final info = await deviceInfo.windowsInfo;
    return info.computerName;
  }
  if (Platform.isLinux) {
    final info = await deviceInfo.linuxInfo;
    return info.machineId;
  }
  if (Platform.isMacOS) {
    final info = await deviceInfo.macOsInfo;
    return info.computerName;
  }
  return 'unknown-device';
}
