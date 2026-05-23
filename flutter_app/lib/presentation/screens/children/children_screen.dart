import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class ChildrenScreen extends StatefulWidget {
  static const String routeName = '/children';
  const ChildrenScreen({super.key});

  @override
  State<ChildrenScreen> createState() => _ChildrenScreenState();
}

class _ChildrenScreenState extends State<ChildrenScreen> {
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
      final res = await _api.get('/api/children', queryParameters: {'page': _page, 'limit': '20'});
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

  String _age(String? dob) {
    if (dob == null) return '?';
    try {
      final birth = DateTime.parse(dob);
      final months = DateTime.now().difference(birth).inDays ~/ 30;
      if (months < 12) return '${months}mo';
      return '${months ~/ 12}y ${months % 12}mo';
    } catch (_) {
      return '?';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Children')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(child: Text('No children found', style: TextStyle(color: Colors.grey)))
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
                      final c = _items[i] as Map<String, dynamic>;
                      final name = c['name'] as String? ?? '';
                      final dob = c['dateOfBirth'] as String?;
                      final hh = c['household'] as Map<String, dynamic>?;
                      return ListTile(
                        leading: CircleAvatar(backgroundColor: AppColors.info, child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(color: Colors.white))),
                        title: Text(name),
                        subtitle: Text('${_age(dob)} | ${hh?['code'] as String? ?? ''}'),
                        trailing: Text(dob != null ? DateFormat('dd MMM yy').format(DateTime.parse(dob)) : '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      );
                    },
                  ),
                ),
    );
  }
}
