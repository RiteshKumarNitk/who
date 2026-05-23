import 'package:flutter/material.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class HouseholdsScreen extends StatefulWidget {
  static const String routeName = '/households';
  const HouseholdsScreen({super.key});

  @override
  State<HouseholdsScreen> createState() => _HouseholdsScreenState();
}

class _HouseholdsScreenState extends State<HouseholdsScreen> {
  final _api = di.sl<ApiService>();
  final _search = TextEditingController();
  List<dynamic> _items = [];
  bool _isLoading = true;
  int _page = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final params = <String, dynamic>{'page': _page, 'limit': '20'};
      if (_search.text.isNotEmpty) params['search'] = _search.text;
      final res = await _api.get('/api/households', queryParameters: params);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Households')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: 'Search by code or head name...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear), onPressed: () { _search.clear(); _load(); })
                    : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              onSubmitted: (_) => _load(),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _items.isEmpty
                    ? const Center(child: Text('No households found', style: TextStyle(color: Colors.grey)))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          itemCount: _items.length + 1,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (_, i) {
                            if (i == _items.length) return _buildPagination();
                            final h = _items[i] as Map<String, dynamic>;
                            return ListTile(
                              leading: const CircleAvatar(child: Icon(Icons.home)),
                              title: Text(h['headName'] as String? ?? ''),
                              subtitle: Text('Code: ${h['code'] as String? ?? ''}'),
                              trailing: const Icon(Icons.chevron_right),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildPagination() {
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
}
