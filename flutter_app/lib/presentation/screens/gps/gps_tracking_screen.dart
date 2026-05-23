import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/gps_service.dart';
import '../../../core/services/api_service.dart';
import '../../../core/utils/kml_exporter.dart';
import '../../../core/theme/app_theme.dart';

class GpsTrackingScreen extends StatefulWidget {
  static const String routeName = '/gps-tracking';
  const GpsTrackingScreen({super.key});

  @override
  State<GpsTrackingScreen> createState() => _GpsTrackingScreenState();
}

class _GpsTrackingScreenState extends State<GpsTrackingScreen> {
  final _gpsService = di.sl<GpsService>();
  Position? _currentPosition;
  bool _isRecording = false;
  int _pointCount = 0;
  bool _isSaving = false;
  bool _isSharing = false;
  TrackingSummary? _summary;

  @override
  void initState() {
    super.initState();
    _initGps();
  }

  Future<void> _initGps() async {
    try {
      final pos = await _gpsService.getCurrentPosition();
      if (!mounted) return;
      setState(() => _currentPosition = pos);
      _gpsService.startTracking((pos) {
        if (!mounted) return;
        setState(() {
          _currentPosition = pos;
          if (_isRecording) {
            _pointCount = _gpsService.pointCount;
          }
        });
      }, intervalSeconds: 1);
    } catch (_) {}
  }

  void _startRecording() {
    _gpsService.startRecord();
    setState(() {
      _isRecording = true;
      _summary = null;
      _pointCount = 0;
    });
  }

  void _stopRecording() {
    final summary = _gpsService.stopRecord();
    setState(() {
      _isRecording = false;
      _summary = summary;
      _pointCount = 0;
    });
  }

  Future<void> _saveRecording() async {
    if (_summary == null) return;
    setState(() => _isSaving = true);
    try {
      final api = di.sl<ApiService>();
      await api.post('/api/surveys', data: {
        'type': 'AREA_MAPPING',
        'latitude': _currentPosition?.latitude,
        'longitude': _currentPosition?.longitude,
        'points': _gpsService.trackedPoints.map((p) => p.toJson()).toList(),
        'totalDistanceKm': _summary!.totalDistanceKm,
        'areaSqMeters': _summary!.areaSqMeters,
        'durationSeconds': _summary!.duration.inSeconds,
        'timestamp': DateTime.now().toIso8601String(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('GPS recording saved'), backgroundColor: AppColors.success),
        );
        _gpsService.reset();
        setState(() => _summary = null);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Save error: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _shareKml() async {
    if (_summary == null) return;
    setState(() => _isSharing = true);
    try {
      await KmlExporter.shareKml(
        name: 'GPS_Track_${DateTime.now().millisecondsSinceEpoch}',
        points: _gpsService.trackedPoints,
        totalDistanceKm: _summary!.totalDistanceKm,
        areaSqMeters: _summary!.areaSqMeters,
        duration: _summary!.duration,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Share error: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GPS Logger')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildGpsCard(),
                const SizedBox(height: 16),
                if (_summary != null) _buildSummaryCard(),
              ],
            ),
          ),
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildGpsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.satellite_alt, color: AppColors.primary),
                const SizedBox(width: 8),
                Text('GPS Location', style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                Container(
                  width: 12, height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _currentPosition != null ? AppColors.success : Colors.grey,
                  ),
                ),
              ],
            ),
            const Divider(height: 20),
            _dataRow('Latitude', _currentPosition?.latitude.toStringAsFixed(6) ?? '--'),
            _dataRow('Longitude', _currentPosition?.longitude.toStringAsFixed(6) ?? '--'),
            _dataRow('Accuracy', _currentPosition != null ? '${_currentPosition!.accuracy.toStringAsFixed(1)} m' : '--'),
            _dataRow('Altitude', _currentPosition?.altitude?.toStringAsFixed(1) != null ? '${_currentPosition!.altitude!.toStringAsFixed(1)} m' : '--'),
            _dataRow('Speed', _currentPosition != null ? '${(_currentPosition!.speed * 3.6).toStringAsFixed(1)} km/h' : '--'),
            _dataRow('Bearing', _currentPosition != null ? '${_currentPosition!.heading.toStringAsFixed(1)}°' : '--'),
            if (_isRecording) ...[
              const Divider(height: 20),
              Row(
                children: [
                  const Icon(Icons.timeline, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text('Tracking $_pointCount points',
                    style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w500)),
                  const SizedBox(width: 8),
                  const SizedBox(width: 14, height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2)),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _dataRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(width: 100, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }

  Widget _buildSummaryCard() {
    final s = _summary!;
    return Card(
      color: AppColors.success.withValues(alpha: 0.08),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.summarize, color: AppColors.success),
                const SizedBox(width: 8),
                Text('Recording Summary', style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const Divider(height: 20),
            _dataRow('Distance', '${s.totalDistanceKm.toStringAsFixed(3)} km'),
            _dataRow('Area', '${s.areaSqMeters.toStringAsFixed(1)} m²'),
            _dataRow('Area', '${s.areaHectares.toStringAsFixed(3)} hectares'),
            _dataRow('Duration', _formatDuration(s.duration)),
            _dataRow('Points', '${s.pointCount}'),
            _dataRow('Avg Accuracy', '${s.avgAccuracy.toStringAsFixed(1)} m'),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isSaving ? null : _saveRecording,
                    icon: _isSaving
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.save),
                    label: const Text('Save'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isSharing ? null : _shareKml,
                    icon: _isSharing
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.share),
                    label: const Text('Share KML'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 8, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity, height: 52,
          child: ElevatedButton.icon(
            onPressed: _isRecording ? _stopRecording : _startRecording,
            icon: Icon(_isRecording ? Icons.stop : Icons.fiber_manual_record),
            label: Text(_isRecording ? 'Stop Recording' : 'Start Recording'),
            style: ElevatedButton.styleFrom(
              backgroundColor: _isRecording ? AppColors.danger : AppColors.primary,
              foregroundColor: Colors.white,
              textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ),
    );
  }

  String _formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    if (h > 0) return '${h}h ${m}m ${s}s';
    if (m > 0) return '${m}m ${s}s';
    return '${s}s';
  }
}
