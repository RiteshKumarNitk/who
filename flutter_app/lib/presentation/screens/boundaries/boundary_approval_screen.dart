import 'package:flutter/material.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class BoundaryApprovalScreen extends StatefulWidget {
  static const String routeName = '/boundary-approval';
  const BoundaryApprovalScreen({super.key});

  @override
  State<BoundaryApprovalScreen> createState() => _BoundaryApprovalScreenState();
}

class _BoundaryApprovalScreenState extends State<BoundaryApprovalScreen> {
  final _api = di.sl<ApiService>();
  List<dynamic> _items = [];
  bool _isLoading = true;
  int _page = 1;
  int _totalPages = 1;
  String? _statusFilter = 'PENDING';

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
      final res = await _api.get('/api/gis/polygons', queryParameters: params);
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

  Future<void> _updateStatus(String id, String action) async {
    try {
      await _api.post('/api/gis/polygons/$id', data: {'action': action});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Boundary ${action.toLowerCase()}d'),
          backgroundColor: action == 'APPROVE' ? AppColors.success : AppColors.warning,
        ));
      }
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Boundary Approvals'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) { _statusFilter = v == 'all' ? null : v; _page = 1; _load(); },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'all', child: Text('All')),
              const PopupMenuItem(value: 'PENDING', child: Text('Pending')),
              const PopupMenuItem(value: 'SUBMITTED', child: Text('Submitted')),
              const PopupMenuItem(value: 'APPROVED', child: Text('Approved')),
              const PopupMenuItem(value: 'REJECTED', child: Text('Rejected')),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(child: Text('No boundaries'))
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
                      final b = _items[i] as Map<String, dynamic>;
                      final status = b['status'] as String? ?? 'DRAFT';
                      final asha = b['asha'] as Map<String, dynamic>?;
                      final points = b['points'] as List<dynamic>? ?? [];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(child: Text('ASHA: ${asha?['name'] as String? ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.w600))),
                                  Chip(label: Text(status, style: const TextStyle(fontSize: 11)), backgroundColor: status == 'APPROVED' ? AppColors.success.withValues(alpha: 0.15) : status == 'PENDING' ? AppColors.warning.withValues(alpha: 0.15) : Colors.grey.withValues(alpha: 0.15)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text('${points.length} boundary points', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                              const SizedBox(height: 8),
                              if (status == 'PENDING' || status == 'SUBMITTED')
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    if (status == 'PENDING')
                                      TextButton.icon(
                                        onPressed: () => _updateStatus(b['id'] as String, 'SUBMIT'),
                                        icon: const Icon(Icons.upload, size: 16),
                                        label: const Text('Submit'),
                                      ),
                                    if (status == 'SUBMITTED') ...[
                                      TextButton.icon(
                                        onPressed: () => _updateStatus(b['id'] as String, 'APPROVE'),
                                        icon: const Icon(Icons.check_circle, size: 16),
                                        label: const Text('Approve'),
                                        style: TextButton.styleFrom(foregroundColor: AppColors.success),
                                      ),
                                      TextButton.icon(
                                        onPressed: () => _updateStatus(b['id'] as String, 'REJECT'),
                                        icon: const Icon(Icons.cancel, size: 16),
                                        label: const Text('Reject'),
                                        style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                                      ),
                                    ],
                                  ],
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
