# API Documentation — WHO GIS Surveillance Platform

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All API endpoints (except login/register) require JWT authentication via:
- Header: `Authorization: Bearer <token>`
- Or HttpOnly cookie: `auth_token`

## Standard Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  },
  "timestamp": "2026-05-22T12:00:00.000Z"
}
```

## Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "email": ["Invalid email format"]
    }
  },
  "timestamp": "2026-05-22T12:00:00.000Z"
}
```

---

## Authentication

### POST /api/auth/login
Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "email": "asha@example.com",
  "password": "password123",
  "deviceId": "uuid-optional"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "asha@example.com",
      "name": "Sunita Devi",
      "role": "ASHA",
      "phone": "+919876543210",
      "language": "hi",
      "hierarchyId": "uuid",
      "hierarchyType": "ASHA"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresAt": "2026-05-29T12:00:00.000Z"
    }
  }
}
```

### POST /api/auth/register
Register a new user. Super Admin only.

**Request:**
```json
{
  "email": "newuser@example.com",
  "phone": "+919876543210",
  "password": "securePassword123",
  "name": "User Name",
  "nameHindi": "उपयोगकर्ता नाम",
  "role": "ASHA",
  "employeeCode": "EMP001",
  "hierarchyId": "uuid",
  "hierarchyType": "ASHA"
}
```

---

## GIS Module

### GET /api/gis/polygons
List ASHA area boundaries.

**Query Params:** `?status=APPROVED&page=1&limit=20`

### POST /api/gis/polygons
Create or update an ASHA boundary.

**Request:**
```json
{
  "ashaId": "uuid",
  "points": [[78.9629, 20.5937], [78.9729, 20.5937], [78.9729, 20.6037]]
}
```

### GET /api/gis/polygons/:id
Get boundary details with full hierarchy.

### PATCH /api/gis/polygons/:id
Submit/approve/reject boundary.

**Request:**
```json
{
  "action": "SUBMIT" | "APPROVE" | "REJECT"
}
```

### GET /api/gis/coordinates?lat=20.5937&lng=78.9629
Find which ASHA covers a location.

### GET /api/gis/heatmap
Disease heatmap data.

**Query Params:** `?diseaseType=MEASLES&startDate=2026-01-01&endDate=2026-05-22`

---

## Surveys

### GET /api/surveys?ashaId=uuid&status=COMPLETED&page=1&limit=20
List surveys for an ASHA worker.

### POST /api/surveys
Create a new survey session.

**Request:**
```json
{
  "ashaId": "uuid",
  "date": "2026-05-22T10:00:00.000Z",
  "type": "ROUTINE",
  "householdId": "uuid-optional",
  "points": [
    {
      "latitude": 20.5937,
      "longitude": 78.9629,
      "accuracy": 5.0,
      "timestamp": "2026-05-22T10:00:00.000Z"
    }
  ],
  "isOffline": false
}
```

---

## Vaccination

### POST /api/vaccination
Schedule, administer, or record vaccination sessions.

**Schedule:**
```json
{
  "action": "SCHEDULE",
  "childId": "uuid",
  "vaccineId": "uuid",
  "doseNumber": 1,
  "scheduledDate": "2026-06-01T10:00:00.000Z",
  "isOffline": false
}
```

**Administer:**
```json
{
  "action": "ADMINISTER",
  "id": "record-uuid",
  "sessionId": "uuid-optional",
  "siteId": "uuid-optional",
  "batchNumber": "BT2026001",
  "manufacturer": "Serum Institute"
}
```

### GET /api/vaccination?type=due&days=30
Get due vaccinations. Also `?type=overdue` for overdue.

---

## Disease Surveillance

### GET /api/disease
List disease cases.

**Query Params:** `?diseaseType=MEASLES&status=SUSPECTED&severity=CRITICAL&page=1&limit=20`

### GET /api/disease?type=clusters
Get active disease clusters.

### GET /api/disease?type=stats
Get disease dashboard stats.

### POST /api/disease
Report a disease case.

**Request:**
```json
{
  "diseaseType": "MEASLES",
  "severity": "MODERATE",
  "patientName": "Patient Name",
  "patientAge": 5,
  "patientGender": "FEMALE",
  "latitude": 20.5937,
  "longitude": 78.9629,
  "address": "Village, Block, District",
  "symptoms": ["Fever", "Rash", "Cough"],
  "onsetDate": "2026-05-20T10:00:00.000Z",
  "contacts": 10,
  "isOffline": false
}
```

---

## Sync

### POST /api/sync
Batch sync offline data.

**Request:**
```json
{
  "items": [
    {
      "entityType": "SURVEY",
      "operation": "CREATE",
      "entityId": "uuid",
      "payload": {}
    }
  ],
  "deviceId": "device-uuid"
}
```

---

## Analytics

### GET /api/analytics
Dashboard statistics.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required |
| TOKEN_EXPIRED | 401 | JWT token expired |
| FORBIDDEN | 403 | Insufficient permissions |
| VALIDATION_ERROR | 400 | Input validation failed |
| NOT_FOUND | 404 | Resource not found |
| USER_EXISTS | 409 | User already exists |
| ACCOUNT_LOCKED | 423 | Account temporarily locked |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| OFFLINE | 202 | Request queued for offline sync |

## Pagination

All list endpoints support:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sortBy` (field name)
- `sortOrder` (asc/desc)
- `search` (text search)
