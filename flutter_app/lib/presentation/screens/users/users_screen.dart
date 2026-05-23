import 'package:flutter/material.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class UsersScreen extends StatefulWidget {
  static const String routeName = '/users';
  const UsersScreen({super.key});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  final _api = di.sl<ApiService>();
  List<dynamic> _items = [];
  bool _isLoading = true;
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
      final res = await _api.get('/api/users', queryParameters: {'page': _page, 'limit': '20'});
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

  Color _roleColor(String? role) {
    switch (role) {
      case 'SUPER_ADMIN': return AppColors.danger;
      case 'STATE_ADMIN': return AppColors.warning;
      case 'DISTRICT_ADMIN': return AppColors.info;
      case 'BLOCK_ADMIN': return AppColors.primary;
      case 'MOIC': return AppColors.success;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Users')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(child: Text('No users found'))
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
                      final u = _items[i] as Map<String, dynamic>;
                      final role = u['role'] as String?;
                      final name = u['name'] as String? ?? '';
                      return ListTile(
                        leading: CircleAvatar(backgroundColor: _roleColor(role), child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(color: Colors.white))),
                        title: Text(name),
                        subtitle: Text('${u['email'] as String? ?? ''} | ${u['designation'] as String? ?? ''}'),
                        trailing: Chip(
                          label: Text(role?.replaceAll('_', ' ') ?? '', style: const TextStyle(fontSize: 10, color: Colors.white)),
                          backgroundColor: _roleColor(role),
                          padding: EdgeInsets.zero,
                          visualDensity: VisualDensity.compact,
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
