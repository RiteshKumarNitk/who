import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class DiseaseDetailScreen extends StatefulWidget {
  static const String routeName = '/disease-detail';
  final String caseId;
  const DiseaseDetailScreen({super.key, required this.caseId});

  @override
  State<DiseaseDetailScreen> createState() => _DiseaseDetailScreenState();
}

class _DiseaseDetailScreenState extends State<DiseaseDetailScreen> {
  final _api = di.sl<ApiService>();
  Map<String, dynamic>? _case;
  bool _isLoading = true;
  bool _isEditing = false;

  final _nameCtrl = TextEditingController();
  final _symptomsCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String? _status;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _symptomsCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get('/api/disease/${widget.caseId}');
      final data = res['data'] as Map<String, dynamic>?;
      setState(() {
        _case = data;
        _nameCtrl.text = data?['patientName'] as String? ?? '';
        _symptomsCtrl.text = data?['symptoms'] as String? ?? '';
        _notesCtrl.text = data?['notes'] as String? ?? '';
        _status = data?['status'] as String?;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _save() async {
    try {
      final body = <String, dynamic>{
        'patientName': _nameCtrl.text,
        'symptoms': _symptomsCtrl.text,
        'notes': _notesCtrl.text,
      };
      if (_status != null) body['status'] = _status;
      final res = await _api.post('/api/disease/${widget.caseId}', data: body);
      if (res['success'] == true) {
        setState(() => _isEditing = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Case updated'), backgroundColor: AppColors.success));
        }
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Disease Case'),
        actions: [
          IconButton(
            icon: Icon(_isEditing ? Icons.check : Icons.edit),
            onPressed: _isEditing ? _save : () => setState(() => _isEditing = true),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _case == null
              ? const Center(child: Text('Case not found'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.person, color: AppColors.primary),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _isEditing
                                      ? TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Patient Name'))
                                      : Text(_case!['patientName'] as String? ?? '', style: Theme.of(context).textTheme.titleMedium),
                                ),
                              ],
                            ),
                            const Divider(height: 20),
                            _field('Disease', _case!['diseaseType'] as String? ?? ''),
                            _field('Status', _case!['status'] as String? ?? ''),
                            _field('Severity', _case!['severity'] as String? ?? 'N/A'),
                            _field('Reported', _case!['reportedAt'] != null ? DateFormat('dd MMM yyyy HH:mm').format(DateTime.parse(_case!['reportedAt'] as String)) : ''),
                            if (_case!['latitude'] != null && _case!['longitude'] != null) ...[
                              _field('Latitude', (_case!['latitude'] as num).toStringAsFixed(6)),
                              _field('Longitude', (_case!['longitude'] as num).toStringAsFixed(6)),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Symptoms', style: TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            _isEditing
                                ? TextField(controller: _symptomsCtrl, maxLines: 3, decoration: const InputDecoration(border: OutlineInputBorder()))
                                : Text(_case!['symptoms'] as String? ?? 'No symptoms recorded'),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Notes', style: TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            _isEditing
                                ? TextField(controller: _notesCtrl, maxLines: 3, decoration: const InputDecoration(border: OutlineInputBorder()))
                                : Text(_case!['notes'] as String? ?? 'No notes'),
                          ],
                        ),
                      ),
                    ),
                    if (_isEditing) ...[
                      const SizedBox(height: 12),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: DropdownButtonFormField<String>(
                            value: _status,
                            items: ['OPEN', 'INVESTIGATING', 'CONFIRMED', 'CLOSED'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                            onChanged: (v) => setState(() => _status = v),
                            decoration: const InputDecoration(labelText: 'Status'),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
    );
  }

  Widget _field(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 90, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}
