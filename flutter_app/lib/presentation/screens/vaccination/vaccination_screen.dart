import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class VaccinationScreen extends StatefulWidget {
  static const String routeName = '/vaccination';
  const VaccinationScreen({super.key});

  @override
  State<VaccinationScreen> createState() => _VaccinationScreenState();
}

class _VaccinationScreenState extends State<VaccinationScreen> {
  List<Map<String, dynamic>> _children = [];
  List<Map<String, dynamic>> _vaccines = [];
  bool _isLoading = true;
  String? _selectedChildId;
  String? _selectedVaccineId;
  bool _isAdministering = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final api = di.sl<ApiService>();
      final childrenRes = await api.get('/api/children', queryParameters: {'limit': '50'});
      final vaccinesRes = await api.get('/api/vaccines');
      setState(() {
        _children = (childrenRes['data'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
        _vaccines = (vaccinesRes['data'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _administer() async {
    if (_selectedChildId == null || _selectedVaccineId == null) return;
    setState(() => _isAdministering = true);
    try {
      final api = di.sl<ApiService>();
      await api.post('/api/vaccination', data: {
        'action': 'ADMINISTER',
        'id': _selectedChildId,
        'childId': _selectedChildId,
        'vaccineId': _selectedVaccineId,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vaccination recorded'), backgroundColor: AppColors.success),
        );
        setState(() { _selectedChildId = null; _selectedVaccineId = null; });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isAdministering = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vaccination'),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Record Vaccination', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            value: _selectedChildId,
                            items: _children.map((c) => DropdownMenuItem(
                              value: c['id'] as String,
                              child: Text('${c['name']} (${c['dateOfBirth'] != null ? _ageFromDob(c['dateOfBirth'] as String) : '?'})'),
                            )).toList(),
                            onChanged: (v) => setState(() => _selectedChildId = v),
                            decoration: const InputDecoration(labelText: 'Select Child'),
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            value: _selectedVaccineId,
                            items: _vaccines.map((v) => DropdownMenuItem(
                              value: v['id'] as String,
                              child: Text('${v['name']} (Dose ${v['doses']})'),
                            )).toList(),
                            onChanged: (v) => setState(() => _selectedVaccineId = v),
                            decoration: const InputDecoration(labelText: 'Select Vaccine'),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: (_selectedChildId != null && _selectedVaccineId != null && !_isAdministering) ? _administer : null,
                              child: _isAdministering
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Text('Record Administration'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Children', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 12),
                          if (_children.isEmpty)
                            const Text('No children found', style: TextStyle(color: Colors.grey))
                          else
                            ...(_children.take(10).map((c) => ListTile(
                              dense: true,
                              leading: const Icon(Icons.child_care, color: AppColors.info),
                              title: Text(c['name'] as String? ?? ''),
                              subtitle: Text('DOB: ${_formatDate(c['dateOfBirth'] as String?)}'),
                            ))),
                          if (_children.length > 10)
                            Text('+ ${_children.length - 10} more', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  String _formatDate(String? date) {
    if (date == null) return 'N/A';
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(date));
    } catch (_) {
      return date;
    }
  }

  String _ageFromDob(String dob) {
    try {
      final birth = DateTime.parse(dob);
      final now = DateTime.now();
      final months = (now.year - birth.year) * 12 + (now.month - birth.month);
      if (months < 12) return '${months}mo';
      return '${months ~/ 12}y';
    } catch (_) {
      return '?';
    }
  }
}
