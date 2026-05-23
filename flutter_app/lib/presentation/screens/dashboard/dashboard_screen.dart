import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../core/bloc/auth/auth_bloc.dart';
import '../../../core/bloc/auth/auth_event.dart';
import '../../../core/bloc/auth/auth_state.dart';
import '../../../core/di/injection_container.dart' as di;
import '../../../core/models/dashboard_stats.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

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
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    try {
      final api = di.sl<ApiService>();
      final data = await api.getDashboardStats();
      final authState = context.read<AuthBloc>().state;
      String name = '';
      if (authState is AuthAuthenticated) name = authState.user.name;
      setState(() {
        _stats = DashboardStats.fromJson(data);
        _userName = name;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('WHO GIS', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.pushNamed(context, '/notifications-list'),
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _HomeTab(stats: _stats, isLoading: _isLoading, onRefresh: _loadStats, userName: _userName),
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
  final String userName;

  const _HomeTab({required this.stats, required this.isLoading, required this.onRefresh, required this.userName});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Welcome${userName.isNotEmpty ? ', $userName' : ''}', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text('Public Health GIS Surveillance', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 20),
          if (isLoading)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
          else
            _buildStatsGrid(),
          const SizedBox(height: 20),
          _buildSection(context, 'Field Work', [
            _ActionItem('New Survey', Icons.assignment, '/survey-form', AppColors.primary),
            _ActionItem('Report Disease', Icons.bug_report, '/disease', AppColors.danger),
            _ActionItem('Vaccination', Icons.vaccines, '/vaccination', AppColors.success),
            _ActionItem('GPS Logger', Icons.satellite_alt, '/gps-tracking', AppColors.warning),
          ]),
          const SizedBox(height: 12),
          _buildSection(context, 'Data & Records', [
            _ActionItem('Households', Icons.home, '/households', AppColors.info),
            _ActionItem('Children', Icons.child_care, '/children', AppColors.primary),
            _ActionItem('Sessions', Icons.event, '/sessions', AppColors.warning),
            _ActionItem('Hierarchy', Icons.account_tree, '/hierarchy', AppColors.secondary),
          ]),
          const SizedBox(height: 12),
          _buildSection(context, 'GIS & Administration', [
            _ActionItem('GIS Map', Icons.map, '/gis', AppColors.info),
            _ActionItem('Boundaries', Icons.hexagon_outlined, '/boundary-approval', AppColors.primary),
            _ActionItem('Notifications', Icons.notifications, '/notifications-list', AppColors.warning),
            _ActionItem('Offline Sync', Icons.sync, '/sync', AppColors.secondary),
          ]),
          const SizedBox(height: 12),
          _buildSection(context, 'System', [
            _ActionItem('Users', Icons.people, '/users', AppColors.primary),
            _ActionItem('Settings', Icons.settings, '/settings', AppColors.textSecondary),
          ]),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _statCard('ASHA Areas', '${stats.totalAshaAreas}', Icons.people, AppColors.primary)),
            const SizedBox(width: 8),
            Expanded(child: _statCard('Households', '${stats.totalHouseholds}', Icons.home, AppColors.success)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _statCard('Children', '${stats.totalChildren}', Icons.child_care, AppColors.info)),
            const SizedBox(width: 8),
            Expanded(child: _statCard('Vaccinated', '${stats.vaccinatedCount}', Icons.vaccines, AppColors.warning)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _statCard('Active Surveys', '${stats.activeSurveys}', Icons.assignment, AppColors.secondary)),
            const SizedBox(width: 8),
            Expanded(child: _statCard('Pending Cases', '${stats.pendingCases}', Icons.error_outline, AppColors.danger)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _statCard('Total Users', '${stats.totalUsers}', Icons.group, AppColors.primary)),
            const SizedBox(width: 8),
            Expanded(child: _statCard('Offline Pending', '${stats.offlinePendingCount}', Icons.cloud_off, AppColors.textSecondary)),
          ],
        ),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
              Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, List<_ActionItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.textSecondary)),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: items.map((item) => _actionItemTile(context, item)).toList(),
          ),
        ),
      ],
    );
  }

  Widget _actionItemTile(BuildContext context, _ActionItem item) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, item.route),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: item.color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
              child: Icon(item.icon, color: item.color, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(child: Text(item.label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500))),
            const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}

class _ActionItem {
  final String label;
  final IconData icon;
  final String route;
  final Color color;
  const _ActionItem(this.label, this.icon, this.route, this.color);
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
              Center(
                child: CircleAvatar(
                  radius: 44,
                  backgroundColor: AppColors.primary,
                  child: Text(user.name.substring(0, 1).toUpperCase(), style: const TextStyle(fontSize: 36, color: Colors.white)),
                ),
              ),
              const SizedBox(height: 16),
              Center(child: Text(user.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold))),
              Center(child: Text(user.role.replaceAll('_', ' '), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w500))),
              const SizedBox(height: 32),
              Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                child: Column(
                  children: [
                    _infoTile(Icons.email_outlined, 'Email', user.email),
                    const Divider(height: 1, indent: 56),
                    _infoTile(Icons.phone_outlined, 'Phone', user.phone),
                    const Divider(height: 1, indent: 56),
                    _infoTile(Icons.badge_outlined, 'Employee Code', user.employeeCode ?? 'N/A'),
                    const Divider(height: 1, indent: 56),
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
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.danger),
                    minimumSize: const Size(double.infinity, 52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 22),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
              Text(value, style: const TextStyle(fontSize: 16)),
            ],
          ),
        ],
      ),
    );
  }
}
