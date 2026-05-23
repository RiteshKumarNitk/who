import 'device_id_web.dart' if (dart.library.io) 'device_id_native.dart';

class DeviceIdResolver {
  const DeviceIdResolver();

  Future<String> resolve() => getDeviceIdImpl();
}
