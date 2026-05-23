import 'dart:async';
import 'package:geolocator/geolocator.dart';

class GpsService {
  StreamSubscription<Position>? _positionSubscription;
  Position? _currentPosition;
  Timer? _periodicTimer;
  void Function(Position)? _onPositionChanged;

  Future<Position> getCurrentPosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      await Geolocator.openLocationSettings();
      throw Exception('Location services are disabled');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied');
    }

    _currentPosition = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5,
        timeLimit: Duration(seconds: 15),
      ),
    );

    return _currentPosition!;
  }

  void startTracking(void Function(Position position) onPositionChanged, {int intervalSeconds = 1}) {
    _onPositionChanged = onPositionChanged;

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 0,
        timeLimit: const Duration(seconds: 30),
      ),
    ).listen((pos) {
      _currentPosition = pos;
      onPositionChanged(pos);
    });

    _periodicTimer = Timer.periodic(Duration(seconds: intervalSeconds), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 0,
            timeLimit: Duration(seconds: 5),
          ),
        );
        _currentPosition = pos;
        _onPositionChanged?.call(pos);
      } catch (_) {}
    });
  }

  void stopTracking() {
    _periodicTimer?.cancel();
    _periodicTimer = null;
    _positionSubscription?.cancel();
    _positionSubscription = null;
    _onPositionChanged = null;
  }

  double calculateDistance(double startLat, double startLng, double endLat, double endLng) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }

  void dispose() {
    stopTracking();
  }
}
