class Survey {
  final String id;
  final String ashaId;
  final DateTime date;
  final String status;
  final String type;
  final String? householdId;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final bool isOffline;
  final String syncStatus;

  Survey({
    required this.id,
    required this.ashaId,
    required this.date,
    required this.status,
    required this.type,
    this.householdId,
    this.startedAt,
    this.completedAt,
    this.isOffline = false,
    this.syncStatus = 'PENDING',
  });

  factory Survey.fromJson(Map<String, dynamic> json) {
    return Survey(
      id: json['id'] as String,
      ashaId: json['ashaId'] as String,
      date: DateTime.parse(json['date'] as String),
      status: json['status'] as String,
      type: json['type'] as String,
      householdId: json['householdId'] as String?,
      startedAt: json['startedAt'] != null ? DateTime.parse(json['startedAt'] as String) : null,
      completedAt: json['completedAt'] != null ? DateTime.parse(json['completedAt'] as String) : null,
      isOffline: (json['isOffline'] as bool?) ?? false,
      syncStatus: (json['syncStatus'] as String?) ?? 'PENDING',
    );
  }

  String get displayName => '${type.replaceAll('_', ' ')} - ${date.toLocal().toString().split(' ')[0]}';
}
