class User {
  final String id;
  final String email;
  final String phone;
  final String name;
  final String? nameHindi;
  final String role;
  final String? designation;
  final String? employeeCode;
  final String language;
  final bool isActive;
  final String? hierarchyId;
  final String? hierarchyType;
  final String? avatar;
  final String? lastLoginAt;

  User({
    required this.id,
    required this.email,
    required this.phone,
    required this.name,
    this.nameHindi,
    required this.role,
    this.designation,
    this.employeeCode,
    this.language = 'hi',
    this.isActive = true,
    this.hierarchyId,
    this.hierarchyType,
    this.avatar,
    this.lastLoginAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String,
      name: json['name'] as String,
      nameHindi: json['nameHindi'] as String?,
      role: json['role'] as String,
      designation: json['designation'] as String?,
      employeeCode: json['employeeCode'] as String?,
      language: (json['language'] as String?) ?? 'hi',
      isActive: (json['isActive'] as bool?) ?? true,
      hierarchyId: json['hierarchyId'] as String?,
      hierarchyType: json['hierarchyType'] as String?,
      avatar: json['avatar'] as String?,
      lastLoginAt: json['lastLoginAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id, 'email': email, 'phone': phone, 'name': name,
    'nameHindi': nameHindi, 'role': role, 'designation': designation,
    'employeeCode': employeeCode, 'language': language,
    'isActive': isActive, 'hierarchyId': hierarchyId,
    'hierarchyType': hierarchyType, 'avatar': avatar,
    'lastLoginAt': lastLoginAt,
  };
}
