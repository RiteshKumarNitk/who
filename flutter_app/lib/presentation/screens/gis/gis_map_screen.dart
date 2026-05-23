import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class GisMapScreen extends StatefulWidget {
  static const String routeName = '/gis';
  const GisMapScreen({super.key});

  @override
  State<GisMapScreen> createState() => _GisMapScreenState();
}

class _GisMapScreenState extends State<GisMapScreen> {
  final _mapController = MapController();
  final _center = const LatLng(20.5937, 78.9629);
  bool _showBoundaries = false;
  bool _showHeatmap = false;
  List<Map<String, dynamic>> _boundaries = [];
  List<Map<String, dynamic>> _heatmapPoints = [];
  bool _isLoadingBoundaries = false;
  bool _isLoadingHeatmap = false;
  LatLng? _myLocation;

  Future<void> _toggleBoundaries() async {
    if (_showBoundaries) {
      setState(() { _showBoundaries = false; _boundaries = []; });
      return;
    }
    setState(() { _isLoadingBoundaries = true; });
    try {
      final api = di.sl<ApiService>();
      final data = await api.get('/api/gis/polygons', queryParameters: {'limit': '100'});
      setState(() {
        _boundaries = (data['data'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
        _showBoundaries = true;
        _isLoadingBoundaries = false;
      });
    } catch (e) {
      setState(() { _showBoundaries = true; _isLoadingBoundaries = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading boundaries: $e')));
      }
    }
  }

  Future<void> _toggleHeatmap() async {
    if (_showHeatmap) {
      setState(() { _showHeatmap = false; _heatmapPoints = []; });
      return;
    }
    setState(() { _isLoadingHeatmap = true; });
    try {
      final api = di.sl<ApiService>();
      final data = await api.get('/api/gis/heatmap');
      setState(() {
        _heatmapPoints = (data['data'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
        _showHeatmap = true;
        _isLoadingHeatmap = false;
      });
    } catch (e) {
      setState(() { _showHeatmap = true; _isLoadingHeatmap = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading heatmap: $e')));
      }
    }
  }

  Future<void> _goToMyLocation() async {
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      setState(() => _myLocation = LatLng(pos.latitude, pos.longitude));
      _mapController.move(LatLng(pos.latitude, pos.longitude), 15);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not get location. Check GPS.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GIS Map')),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _center,
              initialZoom: 5.0,
              minZoom: 3.0,
              maxZoom: 18.0,
              interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.who.gis_surveillance',
              ),
              if (_myLocation != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _myLocation!,
                      width: 40,
                      height: 40,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.blue,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white, width: 3),
                        ),
                        child: const Icon(Icons.my_location, color: Colors.white, size: 24),
                      ),
                    ),
                  ],
                ),
            ],
          ),
          Positioned(
            top: 16,
            right: 16,
            child: Column(
              children: [
                _mapButton(Icons.add, () => _mapController.move(_mapController.camera.center, _mapController.camera.zoom + 1)),
                const SizedBox(height: 8),
                _mapButton(Icons.remove, () => _mapController.move(_mapController.camera.center, _mapController.camera.zoom - 1)),
                const SizedBox(height: 8),
                _mapButton(Icons.my_location, _goToMyLocation),
              ],
            ),
          ),
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
                  const SizedBox(height: 16),
                  Row(children: [
                    Expanded(child: _toolButton(context, 'Boundaries', Icons.layers, _toggleBoundaries, isLoading: _isLoadingBoundaries, isActive: _showBoundaries)),
                    const SizedBox(width: 8),
                    Expanded(child: _toolButton(context, 'Heatmap', Icons.whatshot, _toggleHeatmap, isLoading: _isLoadingHeatmap, isActive: _showHeatmap)),
                    const SizedBox(width: 8),
                    Expanded(child: _toolButton(context, 'Search', Icons.search, () {})),
                  ]),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _goToMyLocation,
                      icon: const Icon(Icons.my_location),
                      label: const Text('My Location'),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.secondary),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _mapButton(IconData icon, VoidCallback onTap) {
    return Material(
      color: Colors.white,
      elevation: 2,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Container(
          width: 44, height: 44,
          alignment: Alignment.center,
          child: Icon(icon, color: AppColors.textPrimary, size: 24),
        ),
      ),
    );
  }

  Widget _toolButton(BuildContext context, String label, IconData icon, VoidCallback onTap, {bool isLoading = false, bool isActive = false}) {
    return Material(
      color: isActive ? AppColors.primary.withOpacity(0.1) : Colors.grey[100],
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: isLoading ? null : onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(children: [
            if (isLoading)
              const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
            else
              Icon(icon, color: isActive ? AppColors.primary : AppColors.primary),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 12, color: isActive ? AppColors.primary : null)),
          ]),
        ),
      ),
    );
  }
}
