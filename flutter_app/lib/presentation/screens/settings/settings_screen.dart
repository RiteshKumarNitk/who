import 'package:flutter/material.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  static const String routeName = '/settings';
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _api = di.sl<ApiService>();
  Map<String, List<Map<String, dynamic>>> _grouped = {};
  bool _isLoading = true;
  final _editCtrl = TextEditingController();
  String? _editKey;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _editCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get('/api/settings');
      final data = res['data'] as List<dynamic>? ?? [];
      final grouped = <String, List<Map<String, dynamic>>>{};
      for (final item in data) {
        final m = item as Map<String, dynamic>;
        final cat = m['category'] as String? ?? 'General';
        grouped.putIfAbsent(cat, () => []).add(m);
      }
      setState(() { _grouped = grouped; _isLoading = false; });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSetting(String key, String value) async {
    setState(() => _isSaving = true);
    try {
      await _api.post('/api/settings', data: {'key': key, 'value': value});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Setting updated'), backgroundColor: AppColors.success));
      }
      _editKey = null;
      _editCtrl.clear();
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _grouped.isEmpty
              ? const Center(child: Text('No settings'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: _grouped.entries.map((entry) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(entry.key, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppColors.primary)),
                            const Divider(),
                            ...entry.value.map((s) {
                              final key = s['key'] as String? ?? '';
                              final val = s['value'] as String? ?? '';
                              final isEditing = _editKey == key;
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: isEditing
                                          ? TextField(controller: _editCtrl, decoration: const InputDecoration(isDense: true, border: OutlineInputBorder()))
                                          : Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(key, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                                Text(val, style: const TextStyle(fontWeight: FontWeight.w500)),
                                              ],
                                            ),
                                    ),
                                    IconButton(
                                      icon: Icon(isEditing ? Icons.check : Icons.edit, size: 18),
                                      onPressed: isEditing
                                          ? () => _saveSetting(key, _editCtrl.text)
                                          : () {
                                              _editKey = key;
                                              _editCtrl.text = val;
                                              setState(() {});
                                            },
                                    ),
                                    if (isEditing)
                                      IconButton(
                                        icon: const Icon(Icons.close, size: 18),
                                        onPressed: () { setState(() { _editKey = null; _editCtrl.clear(); }); },
                                      ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
    );
  }
}
