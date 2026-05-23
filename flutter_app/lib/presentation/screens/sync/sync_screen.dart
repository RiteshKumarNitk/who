import 'package:flutter/material.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/services/offline_sync_service.dart';
import '../../../core/theme/app_theme.dart';

class SyncScreen extends StatefulWidget {
  static const String routeName = '/sync';
  const SyncScreen({super.key});

  @override
  State<SyncScreen> createState() => _SyncScreenState();
}

class _SyncScreenState extends State<SyncScreen> {
  final _api = di.sl<ApiService>();
  final _syncService = di.sl<OfflineSyncService>();
  bool _isSyncing = false;
  String? _lastSyncResult;
  List<dynamic> _pendingItems = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPending();
  }

  Future<void> _loadPending() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get('/api/sync');
      setState(() {
        _pendingItems = (res['data'] as List<dynamic>?) ?? [];
        _isLoading = false;
      });
    } catch (_) {
      setState(() {
        _pendingItems = [];
        _isLoading = false;
      });
    }
  }

  Future<void> _syncNow() async {
    setState(() => _isSyncing = true);
    try {
      final items = _pendingItems.map((e) => e as Map<String, dynamic>).toList();
      if (items.isEmpty) {
        setState(() { _lastSyncResult = 'No items to sync'; _isSyncing = false; });
        return;
      }
      final res = await _api.syncBatch(items, 'mobile');
      setState(() {
        _lastSyncResult = 'Synced ${res['processedCount'] ?? 0} items (${res['failedCount'] ?? 0} failed)';
        _isSyncing = false;
      });
      _loadPending();
    } catch (e) {
      setState(() {
        _lastSyncResult = 'Sync failed: $e';
        _isSyncing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Offline Sync')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Icon(Icons.sync, size: 48, color: AppColors.primary),
                  const SizedBox(height: 12),
                  Text(_isSyncing ? 'Syncing...' : 'Offline Data Sync', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text('$_pendingItems pending items', style: const TextStyle(color: Colors.grey)),
                  if (_lastSyncResult != null) ...[
                    const SizedBox(height: 8),
                    Text(_lastSyncResult!, style: const TextStyle(color: AppColors.success, fontSize: 13)),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSyncing ? null : _syncNow,
                      icon: _isSyncing
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.sync),
                      label: Text(_isSyncing ? 'Syncing...' : 'Sync Now'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 48),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Pending Items', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else if (_pendingItems.isEmpty)
            const Card(child: Padding(padding: EdgeInsets.all(24), child: Center(child: Text('All synced', style: TextStyle(color: Colors.grey)))))
          else
            ...(_pendingItems.map((item) {
              final i = item as Map<String, dynamic>;
              return Card(
                child: ListTile(
                  leading: Icon(i['type'] == 'SURVEY' ? Icons.assignment : Icons.bug_report, color: AppColors.warning),
                  title: Text(i['type'] as String? ?? 'Unknown'),
                  subtitle: Text('Last attempt: ${i['lastAttempt'] as String? ?? 'Never'}'),
                  trailing: Icon(i['status'] == 'FAILED' ? Icons.error : Icons.pending, color: i['status'] == 'FAILED' ? AppColors.danger : Colors.grey),
                ),
              );
            })),
        ],
      ),
    );
  }
}
