import 'package:flutter_bloc/flutter_bloc.dart';
import 'auth_event.dart';
import 'auth_state.dart';
import '../../repositories/auth_repository.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(const AuthInitial()) {
    on<AuthCheckRequested>(_onCheckRequested);
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthProfileLoaded>(_onProfileLoaded);
  }

  Future<void> _onCheckRequested(AuthCheckRequested event, Emitter<AuthState> emit) async {
    final authenticated = await authRepository.isAuthenticated();
    if (authenticated) {
      emit(const AuthLoading());
      try {
        final user = await authRepository.getProfile();
        emit(AuthAuthenticated(user));
      } catch (_) {
        emit(const AuthUnauthenticated());
      }
    } else {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onLoginRequested(AuthLoginRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());
    try {
      final user = await authRepository.login(email: event.email, password: event.password);
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onLogoutRequested(AuthLogoutRequested event, Emitter<AuthState> emit) async {
    await authRepository.logout();
    emit(const AuthUnauthenticated());
  }

  Future<void> _onProfileLoaded(AuthProfileLoaded event, Emitter<AuthState> emit) async {
    try {
      final user = await authRepository.getProfile();
      emit(AuthAuthenticated(user));
    } catch (_) {
      if (state is AuthAuthenticated) emit(state);
    }
  }
}
