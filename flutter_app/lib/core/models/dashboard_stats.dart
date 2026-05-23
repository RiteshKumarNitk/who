class DashboardStats {
  final int totalAshaAreas;
  final int totalHouseholds;
  final int totalChildren;
  final int vaccinatedCount;
  final int activeSurveys;
  final int pendingCases;
  final int totalUsers;
  final int offlinePendingCount;

  DashboardStats({
    this.totalAshaAreas = 0,
    this.totalHouseholds = 0,
    this.totalChildren = 0,
    this.vaccinatedCount = 0,
    this.activeSurveys = 0,
    this.pendingCases = 0,
    this.totalUsers = 0,
    this.offlinePendingCount = 0,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalAshaAreas: _intVal(json['totalAshaAreas']),
      totalHouseholds: _intVal(json['totalHouseholds']),
      totalChildren: _intVal(json['totalChildren']),
      vaccinatedCount: _intVal(json['vaccinatedCount']),
      activeSurveys: _intVal(json['activeSurveys']),
      pendingCases: _intVal(json['pendingCases']),
      totalUsers: _intVal(json['totalUsers']),
      offlinePendingCount: _intVal(json['offlinePendingCount']),
    );
  }

  static int _intVal(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is double) return v.toInt();
    return int.tryParse(v.toString()) ?? 0;
  }
}
