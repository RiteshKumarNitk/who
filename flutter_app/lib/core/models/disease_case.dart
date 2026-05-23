class DiseaseCase {
  final String id;
  final String diseaseType;
  final String status;
  final String severity;
  final String patientName;
  final int patientAge;
  final String patientGender;
  final String location;
  final String address;
  final List<String> symptoms;
  final DateTime onsetDate;
  final int contacts;
  final bool isOffline;

  DiseaseCase({
    required this.id,
    required this.diseaseType,
    required this.status,
    required this.severity,
    required this.patientName,
    required this.patientAge,
    required this.patientGender,
    required this.location,
    required this.address,
    required this.symptoms,
    required this.onsetDate,
    this.contacts = 0,
    this.isOffline = false,
  });

  factory DiseaseCase.fromJson(Map<String, dynamic> json) {
    final lat = json['latitude']?.toString() ?? '';
    final lng = json['longitude']?.toString() ?? '';
    return DiseaseCase(
      id: json['id'] as String,
      diseaseType: json['diseaseType'] as String,
      status: json['status'] as String,
      severity: json['severity'] as String,
      patientName: json['patientName'] as String,
      patientAge: json['patientAge'] as int,
      patientGender: json['patientGender'] as String,
      location: lat.isNotEmpty && lng.isNotEmpty ? '$lat, $lng' : json['location'] as String? ?? '',
      address: json['address'] as String? ?? '',
      symptoms: (json['symptoms'] as List<dynamic>?)?.cast<String>() ?? [],
      onsetDate: DateTime.parse(json['onsetDate'] as String),
      contacts: (json['contacts'] as int?) ?? 0,
      isOffline: (json['isOffline'] as bool?) ?? false,
    );
  }
}
