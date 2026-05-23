import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class SessionsScreen extends StatefulWidget {
  static const String routeName = '/sessions';
  const SessionsScreen({super.key});

  @override
  State<SessionsScreen> createState() => _SessionsScreenState();
}

class _SessionsScreenState extends State<SessionsScreen> {
  final _api = di.sl<ApiService>();
  List<dynamic> _items = [];
  bool _isLoading = true;
  String? _statusFilter;
  int _page = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final params = <String, dynamic>{'page': _page, 'limit': '20'};
      if (_statusFilter != null) params['status'] = _statusFilter;
      final res = await _api.get('/api/sessions', queryParameters: params);
      setState(() {
        _items = (res['data'] as List<dynamic>?) ?? [];
        final meta = res['meta'] as Map<String, dynamic>?;
        _totalPages = (meta?['totalPages'] as int?) ?? 1;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'COMPLETED': return AppColors.success;
      case 'IN_PROGRESS': return AppColors.warning;
      case 'SCHEDULED': return AppColors.info;
      case 'CANCELLED': return AppColors.danger;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sessions'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) { _statusFilter = v == 'all' ? null : v; _page = 1; _load(); },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'all', child: Text('All')),
              const PopupMenuItem(value: 'SCHEDULED', child: Text('Scheduled')),
              const PopupMenuItem(value: 'IN_PROGRESS', child: Text('In Progress')),
              const PopupMenuItem(value: 'COMPLETED', child: Text('Completed')),
              const PopupMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(child: Text('No sessions found', style: TextStyle(color: Colors.grey)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    itemCount: _items.length + 1,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      if (i == _items.length) {
                        return Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              IconButton(icon: const Icon(Icons.chevron_left), onPressed: _page > 1 ? () { _page--; _load(); } : null),
                              Text('Page $_page of $_totalPages'),
                              IconButton(icon: const Icon(Icons.chevron_right), onPressed: _page < _totalPages ? () { _page++; _load(); } : null),
                            ],
                          ),
                        );
                      }
                      final s = _items[i] as Map<String, dynamic>;
                      final site = s['site'] as Map<String, dynamic>?;
                      final status = s['status'] as String?;
                      return ListTile(
                        leading: Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(color: _statusColor(status).withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                          child: Icon(Icons.event, color: _statusColor(status)),
                        ),
                        title: Text(site?['name'] as String? ?? 'Session'),
                        subtitle: Text('${status ?? 'N/A'} | ${s['date'] != null ? DateFormat('dd MMM yyyy').format(DateTime.parse(s['date'] as String)) : ''}'),
                        trailing: Chip(label: Text(status ?? '', style: const TextStyle(fontSize: 11)), backgroundColor: _statusColor(status).withValues(alpha: 0.15)),
                      );
                    },
                  ),
                ),
    );
  }
}
