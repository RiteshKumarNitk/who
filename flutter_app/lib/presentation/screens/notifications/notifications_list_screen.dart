import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class NotificationsListScreen extends StatefulWidget {
  static const String routeName = '/notifications-list';
  const NotificationsListScreen({super.key});

  @override
  State<NotificationsListScreen> createState() => _NotificationsListScreenState();
}

class _NotificationsListScreenState extends State<NotificationsListScreen> {
  final _api = di.sl<ApiService>();
  List<dynamic> _items = [];
  bool _isLoading = true;
  String? _typeFilter;
  bool? _readFilter;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final params = <String, dynamic>{'limit': '50'};
      if (_typeFilter != null) params['type'] = _typeFilter;
      if (_readFilter != null) params['isRead'] = _readFilter.toString();
      final res = await _api.get('/api/notifications', queryParameters: params);
      setState(() {
        _items = (res['data'] as List<dynamic>?) ?? [];
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  IconData _icon(String? type) {
    switch (type) {
      case 'ALERT': return Icons.warning_amber;
      case 'REMINDER': return Icons.notifications_active;
      default: return Icons.notifications;
    }
  }

  Color _color(String? priority) {
    switch (priority) {
      case 'URGENT': return AppColors.danger;
      case 'HIGH': return AppColors.warning;
      default: return AppColors.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) {
              if (v == 'all') { _typeFilter = null; _readFilter = null; }
              else if (v == 'unread') { _readFilter = false; _typeFilter = null; }
              else { _typeFilter = v; _readFilter = null; }
              _load();
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'all', child: Text('All')),
              const PopupMenuItem(value: 'unread', child: Text('Unread')),
              const PopupMenuItem(value: 'ALERT', child: Text('Alerts')),
              const PopupMenuItem(value: 'REMINDER', child: Text('Reminders')),
              const PopupMenuItem(value: 'INFO', child: Text('Info')),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(child: Text('No notifications', style: TextStyle(color: Colors.grey)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    itemCount: _items.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      final n = _items[i] as Map<String, dynamic>;
                      final isRead = n['isRead'] == true;
                      return ListTile(
                        leading: Icon(_icon(n['type'] as String?), color: _color(n['priority'] as String?)),
                        title: Text(n['title'] as String? ?? '', style: TextStyle(fontWeight: isRead ? FontWeight.normal : FontWeight.bold, fontSize: 14)),
                        subtitle: Text(n['body'] as String? ?? '', maxLines: 2, overflow: TextOverflow.ellipsis),
                        trailing: Text(
                          n['createdAt'] != null ? DateFormat('dd MMM').format(DateTime.parse(n['createdAt'] as String)) : '',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
