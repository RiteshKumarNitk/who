// ============================================================
// Core Enterprise Types for WHO GIS Surveillance Platform
// ============================================================

// --- Common ---
export type UUID = string;
export type GeoJSON = Record<string, unknown>;
export type Timestamp = string;
export type Nullable<T> = T | null;

export interface BaseEntity {
  id: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: Nullable<UUID>;
  updatedBy: Nullable<UUID>;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Nullable<Timestamp>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
  timestamp: Timestamp;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  stack?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface DateRange {
  from: Timestamp;
  to: Timestamp;
}

// --- Auth ---
export type UserRole = "SUPER_ADMIN" | "STATE_ADMIN" | "DISTRICT_ADMIN" | "BLOCK_ADMIN" | "MOIC" | "ANM" | "ASHA";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Timestamp;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  latitude?: number;
  longitude?: number;
}

export interface LoginResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface UserProfile {
  id: UUID;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  language: "en" | "hi";
  avatar?: string;
  designation?: string;
  employeeCode?: string;
  hierarchyId?: UUID;
  hierarchyType?: HierarchyType;
  isActive: boolean;
  lastLoginAt?: Timestamp;
}

// --- Hierarchy ---
export type HierarchyType = "STATE" | "DISTRICT" | "BLOCK" | "PLANNING_UNIT" | "ANM" | "ASHA";

export interface State {
  id: UUID;
  code: string;
  name: string;
  nameHindi: string;
  isoCode: string;
  population: number;
  districts?: District[];
}

export interface District {
  id: UUID;
  code: string;
  name: string;
  nameHindi: string;
  population: number;
  stateId: UUID;
  state?: State;
  blocks?: Block[];
}

export interface Block {
  id: UUID;
  code: string;
  name: string;
  nameHindi: string;
  population: number;
  districtId: UUID;
  district?: District;
  planningUnits?: PlanningUnit[];
}

export type PlanningUnitType = "CHC" | "PHC" | "UPHC";

export interface PlanningUnit {
  id: UUID;
  code: string;
  name: string;
  nameHindi: string;
  type: PlanningUnitType;
  blockId: UUID;
  block?: Block;
  anms?: ANM[];
  location?: GeoPoint;
}

export interface ANM {
  id: UUID;
  code: string;
  name: string;
  nameHindi: string;
  phone: string;
  planningUnitId: UUID;
  planningUnit?: PlanningUnit;
  ashas?: ASHA[];
  userId?: UUID;
}

export interface ASHA {
  id: UUID;
  code: string;
  name: string;
  nameHindi: string;
  phone: string;
  anmId: UUID;
  anm?: ANM;
  areaBoundary?: ASHABoundary;
  userId?: UUID;
}

// --- GIS ---
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface GeoMultiPolygon {
  type: "MultiPolygon";
  coordinates: [number, number][][][];
}

export interface ASHABoundary {
  id: UUID;
  ashaId: UUID;
  asha?: ASHA;
  polygon: GeoPolygon | GeoMultiPolygon;
  areaSqKm: number;
  centroid: GeoPoint;
  surveyPoints?: SurveyPoint[];
  status: BoundaryStatus;
  version: number;
  validatedAt?: Timestamp;
  validatedBy?: UUID;
}

export type BoundaryStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

export interface SurveyPoint {
  id: UUID;
  boundaryId: UUID;
  sequence: number;
  point: GeoPoint;
  accuracy: number;
  altitude?: number;
  timestamp: Timestamp;
  capturedBy: UUID;
}

// --- Surveys ---
export interface SurveySession {
  id: UUID;
  ashaId: UUID;
  asha?: ASHA;
  date: string;
  status: SurveyStatus;
  type: SurveyType;
  householdId?: UUID;
  household?: Household;
  points: GPSCoordinate[];
  startedAt: Timestamp;
  completedAt?: Timestamp;
  isOffline: boolean;
  syncStatus: SyncStatus;
}

export type SurveyStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "SYNCED";
export type SurveyType = "ROUTINE" | "VACCINATION" | "DISEASE_SURVEILLANCE" | "HOUSEHOLD_SURVEY" | "AREA_MAPPING";

export interface GPSCoordinate {
  id: UUID;
  sessionId: UUID;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  bearing?: number;
  timestamp: Timestamp;
  isOffline: boolean;
}

// --- Households ---
export interface Household {
  id: UUID;
  code: string;
  ashaId: UUID;
  asha?: ASHA;
  headName: string;
  headNameHindi?: string;
  location: GeoPoint;
  address: string;
  addressHindi?: string;
  pincode: string;
  familyMembers: number;
  belowPovertyLine: boolean;
  hasToilet: boolean;
  hasElectricity: boolean;
  waterSource: WaterSource;
  members?: FamilyMember[];
  children?: Child[];
}

export type WaterSource = "TAP" | "HAND_PUMP" | "WELL" | "POND" | "RIVER" | "OTHER";

export interface FamilyMember {
  id: UUID;
  householdId: UUID;
  name: string;
  nameHindi?: string;
  relationship: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  phone?: string;
  aadhaar?: string;
  isPregnant: boolean;
  isLactating: boolean;
  hasChronicDisease: boolean;
  chronicDisease?: string;
}

// --- Children ---
export interface Child {
  id: UUID;
  householdId: UUID;
  name: string;
  nameHindi?: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  birthWeight?: number;
  isHighRisk: boolean;
  highRiskReason?: string;
  motherName: string;
  fatherName?: string;
  aadhaar?: string;
  vaccinations: VaccinationRecord[];
}

// --- Vaccination ---
export interface Vaccine {
  id: UUID;
  code: string;
  name: string;
  nameHindi: string;
  doses: number;
  ageStartMonths: number;
  ageEndMonths: number;
  intervalDays?: number;
  isActive: boolean;
}

export interface VaccinationRecord {
  id: UUID;
  childId: UUID;
  vaccineId: UUID;
  vaccine?: Vaccine;
  doseNumber: number;
  scheduledDate: string;
  administeredDate?: string;
  administeredBy?: UUID;
  sessionId?: UUID;
  siteId?: UUID;
  status: VaccinationStatus;
  batchNumber?: string;
  manufacturer?: string;
  adverseEvent?: string;
  notes?: string;
}

export type VaccinationStatus = "SCHEDULED" | "ADMINISTERED" | "MISSED" | "REFUSED" | "CONTRAINDICATED";

export interface VaccinationCoverage {
  total: number;
  vaccinated: number;
  missed: number;
  coveragePercent: number;
  byVaccine: Record<string, { total: number; vaccinated: number; coveragePercent: number }>;
}

// --- Disease Surveillance ---
export type DiseaseType = "AFP" | "MEASLES" | "RUBELLA" | "DIPHTHERIA" | "PERTUSSIS" | "TETANUS" | "COVID_19" | "CHOLERA" | "DENGUE" | "MALARIA" | "TUBERCULOSIS" | "OTHER";

export type CaseStatus = "SUSPECTED" | "PROBABLE" | "CONFIRMED" | "DISCARDED" | "RECOVERED" | "DECEASED";
export type CaseSeverity = "MILD" | "MODERATE" | "SEVERE" | "CRITICAL";

export interface DiseaseCase {
  id: UUID;
  caseNumber: string;
  diseaseType: DiseaseType;
  status: CaseStatus;
  severity: CaseSeverity;
  patientName: string;
  patientAge: number;
  patientGender: "MALE" | "FEMALE" | "OTHER";
  location: GeoPoint;
  address: string;
  householdId?: UUID;
  reportedBy: UUID;
  reportedAt: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: UUID;
  symptoms: string[];
  onsetDate: string;
  hospitalizationDate?: string;
  outcome?: string;
  isOutbreakRelated: boolean;
  clusterId?: UUID;
  contacts: number;
  vaccinationStatus?: string;
}

export interface DiseaseCluster {
  id: UUID;
  name: string;
  diseaseType: DiseaseType;
  center: GeoPoint;
  radius: number;
  caseCount: number;
  startDate: string;
  endDate?: string;
  status: "ACTIVE" | "CONTAINED" | "RESOLVED";
  assignedTeam?: UUID;
  createdAt: Timestamp;
}

// --- Session Sites ---
export interface SessionSite {
  id: UUID;
  code: string;
  name: string;
  nameHindi?: string;
  type: SessionSiteType;
  location: GeoPoint;
  planningUnitId: UUID;
  planningUnit?: PlanningUnit;
  ashaId?: UUID;
  isActive: boolean;
  sessions?: VaccinationSession[];
}

export type SessionSiteType = "ANGANWADI" | "SCHOOL" | "CHC" | "PHC" | "UPHC" | "COMMUNITY_HALL" | "OTHER";

export interface VaccinationSession {
  id: UUID;
  siteId: UUID;
  site?: SessionSite;
  date: string;
  startTime: string;
  endTime: string;
  type: SurveyType;
  status: SessionStatus;
  plannedChildren: number;
  vaccinatedChildren: number;
  conductedBy: UUID;
  ashaId?: UUID;
  anmId?: UUID;
  createdAt: Timestamp;
}

export type SessionStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

// --- Notifications ---
export type NotificationType = "ALERT" | "REMINDER" | "TASK" | "UPDATE" | "WARNING";
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type NotificationChannel = "IN_APP" | "SMS" | "EMAIL" | "PUSH";

export interface Notification {
  id: UUID;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  titleHindi?: string;
  body: string;
  bodyHindi?: string;
  recipientId: UUID;
  recipientRole: UserRole;
  channel: NotificationChannel;
  isRead: boolean;
  readAt?: Timestamp;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
}

// --- Offline Sync ---
export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED" | "CONFLICT";
export type SyncEntityType = "SURVEY" | "GPS_POINT" | "VACCINATION" | "DISEASE_CASE" | "HOUSEHOLD" | "BOUNDARY";

export interface SyncQueueItem {
  id: UUID;
  entityType: SyncEntityType;
  entityId: UUID;
  operation: "CREATE" | "UPDATE" | "DELETE";
  payload: Record<string, unknown>;
  status: SyncStatus;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  deviceId: string;
  userId: UUID;
  createdAt: Timestamp;
  syncedAt?: Timestamp;
}

// --- Audit ---
export interface AuditLog {
  id: UUID;
  userId: UUID;
  action: string;
  entity: string;
  entityId: UUID;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

// --- Analytics ---
export interface DashboardStats {
  totalAshAreas: number;
  mappedAshAreas: number;
  unmappedAshAreas: number;
  totalHouseholds: number;
  surveyedHouseholds: number;
  totalChildren: number;
  vaccinatedChildren: number;
  vaccinationCoverage: number;
  activeDiseaseCases: number;
  diseaseClusters: number;
  pendingSurveys: number;
  overdueVaccinations: number;
  coverageByDistrict: CoverageData[];
  diseaseTrend: TrendData[];
  vaccinationTrend: TrendData[];
}

export interface CoverageData {
  name: string;
  total: number;
  covered: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  value: number;
}

// --- Admin ---
export interface SystemConfig {
  id: UUID;
  key: string;
  value: string;
  description?: string;
  category: ConfigCategory;
  isEncrypted: boolean;
  updatedBy: UUID;
  updatedAt: Timestamp;
}

export type ConfigCategory = "GENERAL" | "VACCINATION" | "DISEASE" | "SYNC" | "NOTIFICATION" | "SECURITY" | "GIS";

export interface DeviceInfo {
  id: UUID;
  userId: UUID;
  deviceId: string;
  deviceName: string;
  platform: "ANDROID" | "IOS" | "WEB";
  osVersion: string;
  appVersion: string;
  isActive: boolean;
  lastSyncAt?: Timestamp;
  lastLoginAt: Timestamp;
  createdAt: Timestamp;
}
