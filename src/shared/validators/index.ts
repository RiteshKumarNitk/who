import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

export const dateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  deviceId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const boundaryCreateSchema = z.object({
  ashaId: z.string().uuid(),
  points: z.array(z.tuple([z.number(), z.number()])).min(3),
});

export const gpsPointSchema = z.object({
  sessionId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  altitude: z.number().optional(),
  speed: z.number().min(0).optional(),
  bearing: z.number().min(0).max(360).optional(),
  timestamp: z.string().datetime(),
  isOffline: z.boolean().default(false),
});

export const surveyCreateSchema = z.object({
  ashaId: z.string().uuid(),
  date: z.string().datetime(),
  type: z.enum(["ROUTINE", "VACCINATION", "DISEASE_SURVEILLANCE", "HOUSEHOLD_SURVEY", "AREA_MAPPING"]),
  householdId: z.string().uuid().optional(),
  points: z.array(gpsPointSchema).optional(),
  isOffline: z.boolean().default(false),
});

export const vaccinationRecordSchema = z.object({
  childId: z.string().uuid(),
  vaccineId: z.string().uuid(),
  doseNumber: z.number().int().positive(),
  scheduledDate: z.string().datetime(),
  administeredDate: z.string().datetime().optional(),
  status: z.enum(["SCHEDULED", "ADMINISTERED", "MISSED", "REFUSED", "CONTRAINDICATED"]).default("SCHEDULED"),
  batchNumber: z.string().optional(),
  isOffline: z.boolean().default(false),
});

export const diseaseCaseSchema = z.object({
  diseaseType: z.enum(["AFP", "MEASLES", "RUBELLA", "DIPHTHERIA", "PERTUSSIS", "TETANUS", "COVID_19", "CHOLERA", "DENGUE", "MALARIA", "TUBERCULOSIS", "OTHER"]),
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "CRITICAL"]).default("MILD"),
  patientName: z.string().min(1).max(255),
  patientAge: z.number().int().min(0).max(150),
  patientGender: z.enum(["MALE", "FEMALE", "OTHER"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1),
  symptoms: z.array(z.string()).min(1),
  onsetDate: z.string().datetime(),
  isOffline: z.boolean().default(false),
});

export const registerSchema = z.object({
  email: z.string().email().max(255),
  phone: z.string().min(10).max(15),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(255),
  nameHindi: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "MOIC", "ANM", "ASHA"]),
  designation: z.string().optional(),
  employeeCode: z.string().optional(),
  hierarchyId: z.string().uuid().optional(),
  hierarchyType: z.enum(["STATE", "DISTRICT", "BLOCK", "PLANNING_UNIT", "ANM", "ASHA"]).optional(),
});

export const syncBatchSchema = z.object({
  items: z.array(z.object({
    entityType: z.enum(["SURVEY", "GPS_POINT", "VACCINATION", "DISEASE_CASE", "HOUSEHOLD", "BOUNDARY"]),
    operation: z.enum(["CREATE", "UPDATE", "DELETE"]),
    entityId: z.string().uuid(),
    payload: z.record(z.unknown()),
  })).min(1).max(500),
  deviceId: z.string(),
});
