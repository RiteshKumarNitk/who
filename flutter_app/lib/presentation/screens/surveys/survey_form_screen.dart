import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/repositories/survey_repository.dart';
import '../../../core/services/gps_service.dart';
import '../../../core/theme/app_theme.dart';

class SurveyFormScreen extends StatefulWidget {
  static const String routeName = '/survey-form';
  const SurveyFormScreen({super.key});

  @override
  State<SurveyFormScreen> createState() => _SurveyFormScreenState();
}

class _SurveyFormScreenState extends State<SurveyFormScreen> {
  final _gpsService = di.sl<GpsService>();
  String _surveyType = 'ROUTINE';
  bool _isLoading = false;
  Position? _currentPosition;
  List<Map<String, dynamic>> _trackedPoints = [];
  int _pointCount = 0;

  @override
  void initState() {
    super.initState();
    _startTracking();
  }

  void _startTracking() {
    _gpsService.getCurrentPosition().then((pos) {
      if (!mounted) return;
      setState(() => _currentPosition = pos);
      _gpsService.startTracking((pos) {
        if (!mounted) return;
        setState(() {
          _currentPosition = pos;
          _trackedPoints.add({
            'latitude': pos.latitude,
            'longitude': pos.longitude,
            'accuracy': pos.accuracy,
            'altitude': pos.altitude,
            'speed': pos.speed,
            'bearing': pos.heading,
            'timestamp': DateTime.now().toIso8601String(),
          });
          _pointCount = _trackedPoints.length;
        });
      }, intervalSeconds: 1);
    }).catchError((_) {});
  }

  @override
  void dispose() {
    _gpsService.stopTracking();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      final repo = di.sl<SurveyRepository>();
      await repo.createSurvey({
        'type': _surveyType,
        'latitude': _currentPosition?.latitude,
        'longitude': _currentPosition?.longitude,
        'timestamp': DateTime.now().toIso8601String(),
        'points': _trackedPoints,
        'isOffline': true,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Survey saved'), backgroundColor: AppColors.success),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Survey')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DropdownButtonFormField(
              value: _surveyType,
              items: ['ROUTINE', 'VACCINATION', 'DISEASE_SURVEILLANCE', 'HOUSEHOLD_SURVEY', 'AREA_MAPPING']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                  .toList(),
              onChanged: (v) => setState(() => _surveyType = v!),
              decoration: const InputDecoration(labelText: 'Survey Type'),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.my_location, color: AppColors.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('GPS Location', style: TextStyle(fontWeight: FontWeight.w500)),
                              Text(_currentPosition != null
                                  ? '${_currentPosition!.latitude.toStringAsFixed(6)}, ${_currentPosition!.longitude.toStringAsFixed(6)}'
                                  : 'Fetching...'),
                            ],
                          ),
                        ),
                        IconButton(icon: const Icon(Icons.refresh), onPressed: () async {
                          try {
                            final pos = await _gpsService.getCurrentPosition();
                            setState(() => _currentPosition = pos);
                          } catch (_) {}
                        }),
                      ],
                    ),
                    if (_pointCount > 0) ...[
                      const Divider(height: 16),
                      Row(
                        children: [
                          const Icon(Icons.timeline, size: 16, color: Colors.grey),
                          const SizedBox(width: 8),
                          Text('$_pointCount points tracked', style: const TextStyle(fontSize: 13, color: Colors.grey)),
                          const SizedBox(width: 8),
                          const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity, height: 52,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading ? const CircularProgressIndicator(strokeWidth: 2, color: Colors.white) : const Text('Start Survey'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
