import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../core/bloc/auth/auth_bloc.dart';
import '../../../core/bloc/auth/auth_event.dart';
import '../../../core/bloc/auth/auth_state.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/models/dashboard_stats.dart';
import '../../../core/repositories/auth_repository.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  static const String routeName = '/dashboard';
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardStats _stats = DashboardStats();
  bool _isLoading = true;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final api = di.sl<ApiService>();
      final data = await api.getDashboardStats();
      setState(() { _stats = DashboardStats.fromJson(data); _isLoading = false; });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _showNotifications(BuildContext context) async {
    try {
      final api = di.sl<ApiService>();
      final res = await api.get('/api/notifications', queryParameters: {'limit': '20'});
      final items = (res['data'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];

      if (!context.mounted) return;
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        builder: (_) => DraggableScrollableSheet(
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          minChildSize: 0.3,
          expand: false,
          builder: (_, scrollController) => Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 16),
                Text('Notifications', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                if (items.isEmpty)
                  const Expanded(child: Center(child: Text('No notifications', style: TextStyle(color: Colors.grey))))
                else
                  Expanded(
                    child: ListView.separated(
                      controller: scrollController,
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (_, i) {
                        final n = items[i];
                        final isRead = n['isRead'] == true;
                        return ListTile(
                          leading: Icon(
                            n['type'] == 'ALERT' ? Icons.warning_amber : n['type'] == 'REMINDER' ? Icons.notifications_active : Icons.notifications,
                            color: n['priority'] == 'URGENT' ? AppColors.danger : n['priority'] == 'HIGH' ? AppColors.warning : AppColors.info,
                          ),
                          title: Text(n['title'] as String? ?? '', style: TextStyle(fontWeight: isRead ? FontWeight.normal : FontWeight.bold, fontSize: 14)),
                          subtitle: Text(n['body'] as String? ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                          trailing: Text(
                            n['createdAt'] != null ? DateFormat('dd MMM').format(DateTime.parse(n['createdAt'] as String)) : '',
                            style: const TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not load notifications')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('WHO GIS'),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () => _showNotifications(context)),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _HomeTab(stats: _stats, isLoading: _isLoading, onRefresh: _loadStats),
          const _MapTab(),
          const _ProfileTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.map), label: 'Map'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  final DashboardStats stats;
  final bool isLoading;
  final VoidCallback onRefresh;

  const _HomeTab({required this.stats, required this.isLoading, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Dashboard', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text('Public Health GIS Surveillance', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 20),
          if (isLoading)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
          else
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                StatCard(icon: Icons.people, label: 'ASHA Areas', value: '${stats.totalAshaAreas}', color: AppColors.primary),
                StatCard(icon: Icons.home, label: 'Households', value: '${stats.totalHouseholds}', color: AppColors.success),
                StatCard(icon: Icons.child_care, label: 'Children', value: '${stats.totalChildren}', color: AppColors.info),
                StatCard(icon: Icons.vaccines, label: 'Vaccinated', value: '${stats.vaccinatedCount}', color: AppColors.warning),
              ],
            ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Quick Actions', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  _actionButton(context, 'New Survey', Icons.assignment, '/surveys'),
                  _actionButton(context, 'Report Disease', Icons.bug_report, '/disease'),
                  _actionButton(context, 'Record Vaccination', Icons.vaccines, '/vaccination'),
                  _actionButton(context, 'View GIS Map', Icons.map, '/gis'),
                  _actionButton(context, 'GPS Logger', Icons.satellite_alt, '/gps-tracking'),
                  _actionButton(context, 'Households', Icons.home, '/households'),
                  _actionButton(context, 'Children', Icons.child_care, '/children'),
                  _actionButton(context, 'Sessions', Icons.event, '/sessions'),
                  _actionButton(context, 'Notifications', Icons.notifications, '/notifications-list'),
                  _actionButton(context, 'Offline Sync', Icons.sync, '/sync'),
                  _actionButton(context, 'Users', Icons.people, '/users'),
                  _actionButton(context, 'Settings', Icons.settings, '/settings'),
                  _actionButton(context, 'Boundaries', Icons.hexagon_outlined, '/boundary-approval'),
                  _actionButton(context, 'Hierarchy', Icons.account_tree, '/hierarchy'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionButton(BuildContext context, String label, IconData icon, String route) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => Navigator.pushNamed(context, route),
    );
  }
}

class _MapTab extends StatelessWidget {
  const _MapTab();

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Map View - Flutter Map integration'));
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthAuthenticated) {
          final user = state.user;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const SizedBox(height: 20),
              CircleAvatar(
                radius: 40,
                backgroundColor: AppColors.primary,
                child: Text(user.name.substring(0, 1).toUpperCase(), style: const TextStyle(fontSize: 32, color: Colors.white)),
              ),
              const SizedBox(height: 16),
              Text(user.name, textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              Text(user.role.replaceAll('_', ' '), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w500)),
              const SizedBox(height: 32),
              Card(
                child: Column(
                  children: [
                    _infoTile(Icons.email_outlined, 'Email', user.email),
                    const Divider(height: 1),
                    _infoTile(Icons.phone_outlined, 'Phone', user.phone),
                    const Divider(height: 1),
                    _infoTile(Icons.badge_outlined, 'Employee Code', user.employeeCode ?? 'N/A'),
                    const Divider(height: 1),
                    _infoTile(Icons.language, 'Language', user.language.toUpperCase()),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => context.read<AuthBloc>().add(const AuthLogoutRequested()),
                  icon: const Icon(Icons.logout, color: AppColors.danger),
                  label: const Text('Sign Out', style: TextStyle(color: AppColors.danger)),
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.danger), minimumSize: const Size(double.infinity, 52)),
                ),
              ),
            ],
          );
        }
        return const Center(child: Text('Not authenticated'));
      },
    );
  }

  Widget _infoTile(IconData icon, String label, String value) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      subtitle: Text(value, style: const TextStyle(fontSize: 16)),
    );
  }
}
