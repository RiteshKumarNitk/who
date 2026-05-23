import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/bloc/auth/auth_bloc.dart';
import '../../../core/bloc/auth/auth_event.dart';
import '../../../core/bloc/auth/auth_state.dart';
import '../../../core/theme/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  static const String routeName = '/profile';
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthAuthenticated) {
          final user = state.user;
          return Scaffold(
            appBar: AppBar(
              title: const Text('Profile'),
              actions: [IconButton(icon: const Icon(Icons.logout), onPressed: () => context.read<AuthBloc>().add(const AuthLogoutRequested()))],
            ),
            body: ListView(
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
                  child: Column(children: [
                    _infoTile(Icons.email_outlined, 'Email', user.email),
                    const Divider(height: 1),
                    _infoTile(Icons.phone_outlined, 'Phone', user.phone),
                    const Divider(height: 1),
                    _infoTile(Icons.badge_outlined, 'Employee Code', user.employeeCode ?? 'N/A'),
                    const Divider(height: 1),
                    _infoTile(Icons.language, 'Language', user.language.toUpperCase()),
                  ]),
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
            ),
          );
        }
        return const Scaffold(body: Center(child: Text('Not authenticated')));
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
