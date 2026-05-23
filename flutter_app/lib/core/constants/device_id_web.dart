Future<String> getDeviceIdImpl() async {
  return 'web-${DateTime.now().millisecondsSinceEpoch}';
}
