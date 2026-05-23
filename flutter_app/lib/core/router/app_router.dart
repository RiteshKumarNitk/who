import 'package:flutter/material.dart';
import '../../presentation/screens/splash/splash_screen.dart';
import '../../presentation/screens/login/login_screen.dart';
import '../../presentation/screens/dashboard/dashboard_screen.dart';
import '../../presentation/screens/gis/gis_map_screen.dart';
import '../../presentation/screens/surveys/survey_list_screen.dart';
import '../../presentation/screens/surveys/survey_form_screen.dart';
import '../../presentation/screens/vaccination/vaccination_screen.dart';
import '../../presentation/screens/disease/disease_report_screen.dart';
import '../../presentation/screens/hierarchy/hierarchy_screen.dart';
import '../../presentation/screens/profile/profile_screen.dart';

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
      case HierarchyScreen.routeName:
        return MaterialPageRoute(builder: (_) => const HierarchyScreen());
      case ProfileScreen.routeName:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      default:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
    }
  }
}
