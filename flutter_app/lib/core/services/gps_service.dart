import 'dart:async';
import 'dart:math';
import 'package:geolocator/geolocator.dart';

class TrackedPoint {
  final double latitude;
  final double longitude;
  final double accuracy;
  final double? altitude;
  final double speed;
  final double bearing;
  final DateTime timestamp;

  TrackedPoint({
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    this.altitude,
    required this.speed,
    required this.bearing,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
    'accuracy': accuracy,
    'altitude': altitude,
    'speed': speed,
    'bearing': bearing,
    'timestamp': timestamp.toIso8601String(),
  };
}

class TrackingSummary {
  final double totalDistanceMeters;
  final double areaSqMeters;
  final Duration duration;
  final int pointCount;
  final double minAccuracy;
  final double maxAccuracy;

  TrackingSummary({
    required this.totalDistanceMeters,
    required this.areaSqMeters,
    required this.duration,
    required this.pointCount,
    required this.minAccuracy,
    required this.maxAccuracy,
  });

  double get totalDistanceKm => totalDistanceMeters / 1000;
  double get areaHectares => areaSqMeters / 10000;
  double get areaAcres => areaSqMeters / 4046.86;
  double get avgAccuracy => pointCount > 0 ? (minAccuracy + maxAccuracy) / 2 : 0;
}

class GpsService {
  StreamSubscription<Position>? _positionSubscription;
  Position? _currentPosition;
  Timer? _periodicTimer;
  void Function(Position)? _onPositionChanged;

  bool _isTracking = false;
  final List<TrackedPoint> _points = [];
  DateTime? _trackingStartTime;

  bool get isTracking => _isTracking;
  List<TrackedPoint> get trackedPoints => List.unmodifiable(_points);
  int get pointCount => _points.length;
  Duration? get trackingDuration {
    if (_trackingStartTime == null) return null;
    return DateTime.now().difference(_trackingStartTime!);
  }

  Future<Position> getCurrentPosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
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
        accuracy: LocationAccuracy.best,
        distanceFilter: 0,
        timeLimit: Duration(seconds: 15),
      ),
    );

    return _currentPosition!;
  }

  void startTracking(void Function(Position position) onPositionChanged, {int intervalSeconds = 1}) {
    _onPositionChanged = onPositionChanged;

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 0,
      ),
    ).listen((pos) {
      _currentPosition = pos;
      onPositionChanged(pos);
    });

    _periodicTimer = Timer.periodic(Duration(seconds: intervalSeconds), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.best,
            distanceFilter: 0,
            timeLimit: Duration(seconds: 5),
          ),
        );
        _currentPosition = pos;
        _onPositionChanged?.call(pos);
      } catch (_) {}
    });
  }

  void startRecord() {
    _points.clear();
    _trackingStartTime = DateTime.now();
    _isTracking = true;

    if (_onPositionChanged == null) {
      startTracking((pos) {
        _recordPoint(pos);
      }, intervalSeconds: 1);
    }
  }

  void _recordPoint(Position pos) {
    if (!_isTracking) return;
    _points.add(TrackedPoint(
      latitude: pos.latitude,
      longitude: pos.longitude,
      accuracy: pos.accuracy,
      altitude: pos.altitude,
      speed: pos.speed,
      bearing: pos.heading,
      timestamp: DateTime.now(),
    ));
  }

  TrackingSummary stopRecord() {
    _isTracking = false;
    stopTracking();

    if (_points.length < 2) {
      return TrackingSummary(
        totalDistanceMeters: 0,
        areaSqMeters: 0,
        duration: _trackingStartTime != null ? DateTime.now().difference(_trackingStartTime!) : Duration.zero,
        pointCount: _points.length,
        minAccuracy: 0,
        maxAccuracy: 0,
      );
    }

    double totalDist = 0;
    double minAcc = double.infinity;
    double maxAcc = 0;

    for (int i = 1; i < _points.length; i++) {
      totalDist += Geolocator.distanceBetween(
        _points[i - 1].latitude, _points[i - 1].longitude,
        _points[i].latitude, _points[i].longitude,
      );
      final acc = _points[i].accuracy;
      if (acc < minAcc) minAcc = acc;
      if (acc > maxAcc) maxAcc = acc;
    }

    final area = _calculateArea(_points);

    return TrackingSummary(
      totalDistanceMeters: totalDist,
      areaSqMeters: area,
      duration: _trackingStartTime != null ? DateTime.now().difference(_trackingStartTime!) : Duration.zero,
      pointCount: _points.length,
      minAccuracy: minAcc.isFinite ? minAcc : 0,
      maxAccuracy: maxAcc.isFinite ? maxAcc : 0,
    );
  }

  double _calculateArea(List<TrackedPoint> points) {
    if (points.length < 3) return 0;

    final n = points.length;
    double area = 0;

    for (int i = 0; i < n; i++) {
      final j = (i + 1) % n;
      final x1 = points[i].longitude * 111320 * cos(points[i].latitude * pi / 180);
      final y1 = points[i].latitude * 110540;
      final x2 = points[j].longitude * 111320 * cos(points[j].latitude * pi / 180);
      final y2 = points[j].latitude * 110540;
      area += x1 * y2 - x2 * y1;
    }

    return area.abs() / 2;
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

  void reset() {
    _points.clear();
    _trackingStartTime = null;
    _isTracking = false;
  }

  void dispose() {
    stopTracking();
    reset();
  }
}
