import 'package:flutter/material.dart';
import '../../presentation/screens/splash/splash_screen.dart';
import '../../presentation/screens/login/login_screen.dart';
import '../../presentation/screens/dashboard/dashboard_screen.dart';
import '../../presentation/screens/gis/gis_map_screen.dart';
import '../../presentation/screens/surveys/survey_list_screen.dart';
import '../../presentation/screens/surveys/survey_form_screen.dart';
import '../../presentation/screens/vaccination/vaccination_screen.dart';
import '../../presentation/screens/disease/disease_report_screen.dart';
import '../../presentation/screens/disease/disease_detail_screen.dart';
import '../../presentation/screens/hierarchy/hierarchy_screen.dart';
import '../../presentation/screens/profile/profile_screen.dart';
import '../../presentation/screens/gps/gps_tracking_screen.dart';
import '../../presentation/screens/households/households_screen.dart';
import '../../presentation/screens/children/children_screen.dart';
import '../../presentation/screens/notifications/notifications_list_screen.dart';
import '../../presentation/screens/sessions/sessions_screen.dart';
import '../../presentation/screens/sync/sync_screen.dart';
import '../../presentation/screens/users/users_screen.dart';
import '../../presentation/screens/settings/settings_screen.dart';
import '../../presentation/screens/boundaries/boundary_approval_screen.dart';

class AppRouter {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case SplashScreen.routeName:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case LoginScreen.routeName:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case DashboardScreen.routeName:
        return MaterialPageRoute(builder: (_) => const DashboardScreen());
      case GisMapScreen.routeName:
        return MaterialPageRoute(builder: (_) => const GisMapScreen());
      case SurveyListScreen.routeName:
        return MaterialPageRoute(builder: (_) => const SurveyListScreen());
      case SurveyFormScreen.routeName:
        return MaterialPageRoute(builder: (_) => const SurveyFormScreen());
      case VaccinationScreen.routeName:
        return MaterialPageRoute(builder: (_) => const VaccinationScreen());
      case DiseaseReportScreen.routeName:
        return MaterialPageRoute(builder: (_) => const DiseaseReportScreen());
      case DiseaseDetailScreen.routeName:
        final caseId = settings.arguments as String;
        return MaterialPageRoute(builder: (_) => DiseaseDetailScreen(caseId: caseId));
      case HierarchyScreen.routeName:
        return MaterialPageRoute(builder: (_) => const HierarchyScreen());
      case GpsTrackingScreen.routeName:
        return MaterialPageRoute(builder: (_) => const GpsTrackingScreen());
      case HouseholdsScreen.routeName:
        return MaterialPageRoute(builder: (_) => const HouseholdsScreen());
      case ChildrenScreen.routeName:
        return MaterialPageRoute(builder: (_) => const ChildrenScreen());
      case NotificationsListScreen.routeName:
        return MaterialPageRoute(builder: (_) => const NotificationsListScreen());
      case SessionsScreen.routeName:
        return MaterialPageRoute(builder: (_) => const SessionsScreen());
      case SyncScreen.routeName:
        return MaterialPageRoute(builder: (_) => const SyncScreen());
      case UsersScreen.routeName:
        return MaterialPageRoute(builder: (_) => const UsersScreen());
      case SettingsScreen.routeName:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      case BoundaryApprovalScreen.routeName:
        return MaterialPageRoute(builder: (_) => const BoundaryApprovalScreen());
      case ProfileScreen.routeName:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      default:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
    }
  }
}
