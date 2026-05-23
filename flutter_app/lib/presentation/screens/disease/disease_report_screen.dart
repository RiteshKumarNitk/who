import 'package:flutter/material.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/models/disease_case.dart';
import '../../../core/repositories/disease_repository.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/offline_sync_service.dart';

class DiseaseReportScreen extends StatefulWidget {
  static const String routeName = '/disease';
  const DiseaseReportScreen({super.key});

  @override
  State<DiseaseReportScreen> createState() => _DiseaseReportScreenState();
}

class _DiseaseReportScreenState extends State<DiseaseReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _ageController = TextEditingController();
  final _addressController = TextEditingController();
  final _contactsController = TextEditingController();
  final _symptomController = TextEditingController();

  String _diseaseType = 'MEASLES';
  String _severity = 'MILD';
  String _gender = 'MALE';
  bool _isSubmitting = false;
  final List<String> _symptoms = [];

  final _diseaseTypes = ['AFP', 'MEASLES', 'RUBELLA', 'DIPHTHERIA', 'PERTUSSIS', 'TETANUS', 'COVID_19', 'CHOLERA', 'DENGUE', 'MALARIA', 'OTHER'];
  final _severityLevels = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_symptoms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add at least one symptom')));
      return;
    }

    setState(() => _isSubmitting = true);

    final data = {
      'diseaseType': _diseaseType,
      'severity': _severity,
      'patientName': _nameController.text.trim(),
      'patientAge': int.parse(_ageController.text.trim()),
      'patientGender': _gender,
      'latitude': 0,
      'longitude': 0,
      'address': _addressController.text.trim(),
      'symptoms': _symptoms,
      'onsetDate': DateTime.now().toIso8601String(),
      'contacts': int.tryParse(_contactsController.text) ?? 0,
      'isOffline': true,
    };

    try {
      final repo = di.sl<DiseaseRepository>();
      await repo.reportCase(data);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Case reported successfully'), backgroundColor: AppColors.success),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _addressController.dispose();
    _contactsController.dispose();
    _symptomController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report Disease Case')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Patient Information', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              TextFormField(controller: _nameController, decoration: const InputDecoration(labelText: 'Patient Name'), validator: (v) => v?.isEmpty ?? true ? 'Required' : null),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: TextFormField(controller: _ageController, decoration: const InputDecoration(labelText: 'Age'), keyboardType: TextInputType.number, validator: (v) => v?.isEmpty ?? true ? 'Required' : null)),
                const SizedBox(width: 12),
                Expanded(child: DropdownButtonFormField(value: _gender, items: ['MALE', 'FEMALE', 'OTHER'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(), onChanged: (v) => setState(() => _gender = v!), decoration: const InputDecoration(labelText: 'Gender'))),
              ]),
              const SizedBox(height: 20),
              Text('Disease Details', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              DropdownButtonFormField(value: _diseaseType, items: _diseaseTypes.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(), onChanged: (v) => setState(() => _diseaseType = v!), decoration: const InputDecoration(labelText: 'Disease Type')),
              const SizedBox(height: 12),
              DropdownButtonFormField(value: _severity, items: _severityLevels.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(), onChanged: (v) => setState(() => _severity = v!), decoration: const InputDecoration(labelText: 'Severity')),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: TextFormField(controller: _symptomController, decoration: const InputDecoration(labelText: 'Add Symptom', hintText: 'e.g. Fever'))),
                const SizedBox(width: 8),
                IconButton(icon: const Icon(Icons.add_circle, color: AppColors.primary), onPressed: () {
                  if (_symptomController.text.trim().isNotEmpty) {
                    setState(() => _symptoms.add(_symptomController.text.trim()));
                    _symptomController.clear();
                  }
                }),
              ]),
              if (_symptoms.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(spacing: 8, children: _symptoms.map((s) => Chip(label: Text(s), onDeleted: () => setState(() => _symptoms.remove(s)))).toList()),
              ],
              const SizedBox(height: 20),
              Text('Location', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              TextFormField(controller: _addressController, maxLines: 2, decoration: const InputDecoration(labelText: 'Address'), validator: (v) => v?.isEmpty ?? true ? 'Required' : null),
              const SizedBox(height: 12),
              TextFormField(controller: _contactsController, decoration: const InputDecoration(labelText: 'Number of Contacts'), keyboardType: TextInputType.number),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  child: _isSubmitting ? const CircularProgressIndicator(strokeWidth: 2, color: Colors.white) : const Text('Submit Report'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
