import 'package:flutter/material.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/repositories/hierarchy_repository.dart';
import '../../../core/theme/app_theme.dart';

class HierarchyScreen extends StatefulWidget {
  static const String routeName = '/hierarchy';
  const HierarchyScreen({super.key});

  @override
  State<HierarchyScreen> createState() => _HierarchyScreenState();
}

class _HierarchyScreenState extends State<HierarchyScreen> {
  List<dynamic> _items = [];
  bool _isLoading = true;
  String _currentType = 'states';
  String? _parentId;
  final List<_Breadcrumb> _breadcrumbs = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final repo = di.sl<HierarchyRepository>();
      final data = await repo.getHierarchy(type: _currentType, parentId: _parentId);
      setState(() { _items = data; _isLoading = false; });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _navigateTo(String type, String name, String id) {
    setState(() {
      _breadcrumbs.add(_Breadcrumb(name, _currentType, _parentId));
      _currentType = type;
      _parentId = id;
    });
    _loadData();
  }

  void _goBack() {
    if (_breadcrumbs.isEmpty) return;
    final crumb = _breadcrumbs.removeLast();
    setState(() { _currentType = crumb.type; _parentId = crumb.parentId; });
    _loadData();
  }

  String _nextType(String current) {
    switch (current) {
      case 'states': return 'districts';
      case 'districts': return 'blocks';
      case 'blocks': return 'planning-units';
      case 'planning-units': return 'anms';
      case 'anms': return 'ashas';
      default: return 'ashas';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hierarchy'),
        leading: _breadcrumbs.isNotEmpty ? IconButton(icon: const Icon(Icons.arrow_back), onPressed: _goBack) : null,
      ),
      body: Column(
        children: [
          if (_breadcrumbs.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.grey[100],
              child: Row(
                children: _breadcrumbs.map((c) => Row(children: [
                  GestureDetector(onTap: _goBack, child: Text(c.name, style: const TextStyle(fontSize: 12, color: AppColors.primary))),
                  const Text(' / ', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ])).toList(),
              ),
            ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _items.isEmpty
                    ? const Center(child: Text('No data found'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          final name = item['name'] ?? 'Unknown';
                          final code = item['code'] ?? '';
                          final id = item['id'] ?? '';
                          return Card(
                            child: ListTile(
                              leading: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                child: const Icon(Icons.business, color: AppColors.primary),
                              ),
                              title: Text(name),
                              subtitle: Text(code.toString()),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {
                                final next = _nextType(_currentType);
                                if (next != _currentType) _navigateTo(next, name, id.toString());
                              },
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _Breadcrumb {
  final String name;
  final String type;
  final String? parentId;
  _Breadcrumb(this.name, this.type, this.parentId);
}
