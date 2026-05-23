import 'package:flutter/material.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/models/survey.dart';
import '../../../core/repositories/survey_repository.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/offline_sync_service.dart';

class SurveyListScreen extends StatefulWidget {
  static const String routeName = '/surveys';
  const SurveyListScreen({super.key});

  @override
  State<SurveyListScreen> createState() => _SurveyListScreenState();
}

class _SurveyListScreenState extends State<SurveyListScreen> {
  List<Survey> _surveys = [];
  bool _isLoading = true;
  int _pendingCount = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final repo = di.sl<SurveyRepository>();
      final surveys = await repo.getSurveys();
      final pending = await OfflineSyncService.getPendingCount();
      setState(() { _surveys = surveys; _pendingCount = pending; _isLoading = false; });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Surveys'),
        actions: [
          if (_pendingCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Chip(
                label: Text('$_pendingCount pending', style: const TextStyle(fontSize: 11, color: Colors.white)),
                backgroundColor: AppColors.warning,
                padding: EdgeInsets.zero,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          IconButton(icon: const Icon(Icons.add), onPressed: () => Navigator.pushNamed(context, '/survey-form')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _surveys.isEmpty
                ? ListView(
                    children: [
                      SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                      const Center(child: Column(
                        children: [
                          Icon(Icons.assignment, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('No surveys found', style: TextStyle(color: Colors.grey)),
                        ],
                      )),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _surveys.length,
                    itemBuilder: (context, index) {
                      final survey = _surveys[index];
                      final isOffline = survey.syncStatus != 'SYNCED';
                      return Card(
                        child: ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _statusColor(survey.status).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(Icons.assignment, color: _statusColor(survey.status)),
                          ),
                          title: Text(survey.displayName),
                          subtitle: Row(
                            children: [
                              Text(survey.status.replaceAll('_', ' '), style: TextStyle(color: _statusColor(survey.status), fontSize: 12)),
                              if (isOffline) ...[
                                const SizedBox(width: 8),
                                const Icon(Icons.cloud_off, size: 14, color: Colors.grey),
                              ],
                            ],
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {},
                        ),
                      );
                    },
                  ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/survey-form'),
        icon: const Icon(Icons.add),
        label: const Text('New Survey'),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'COMPLETED': return AppColors.success;
      case 'IN_PROGRESS': return AppColors.info;
      case 'CANCELLED': return AppColors.danger;
      default: return AppColors.warning;
    }
  }
}
