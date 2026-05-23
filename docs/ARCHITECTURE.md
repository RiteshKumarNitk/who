# System Architecture Document

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Next.js PWA  │  │ Flutter App  │  │ Third-Party  │  │
│  │  (Web/Admin)  │  │  (Field)     │  │  Integrations│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway Layer                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Next.js API Routes / Server Actions                ││
│  │  Rate Limiting │ JWT Auth │ Request Validation      ││
│  └──────────────────────┬──────────────────────────────┘│
└─────────────────────────┼──────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Application Layer (Modules)               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │Auth  │ │Users │ │ GIS  │ │Survey│ │Vacc  │ │Dis   ││
│  │Module│ │Module│ │Module│ │Module│ │Module│ │Module││
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐│
│  │Hier  │ │Sess  │ │Notif │ │Sync  │ │ Analytics    ││
│  │Module│ │Module│ │Module│ │Module│ │ Module       ││
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────────────┘│
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  │
│  │ PostgreSQL │  │   Redis    │  │   File Storage    │  │
│  │  + PostGIS │  │  (Cache)   │  │ (Images/GEOJSON)  │  │
│  └────────────┘  └────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 2. Why Next.js Full-Stack Architecture?

1. **Unified Codebase**: Single TypeScript codebase for frontend and backend reduces context switching
2. **Server Components**: React Server Components enable zero-bundle-size data fetching
3. **API Routes**: Built-in API route handlers eliminate need for separate Express/Fastify server
4. **PWA Support**: Native PWA capabilities for offline-first mobile web
5. **Edge Ready**: Deploy on Vercel Edge or AWS Lambda@Edge
6. **Type Safety**: End-to-end type safety from DB to UI via Prisma + TypeScript

## 3. Why Modular Monolith?

1. **Simpler Deployment**: Single deployable unit vs microservices complexity
2. **Shared Kernel**: Common utilities, types, and GIS functions shared across modules
3. **Domain Boundaries**: Clear module boundaries with internal events for communication
4. **Future Migration Path**: Modules map 1:1 to future microservices
5. **Development Speed**: Faster iteration without service orchestration

### Migration Path to Microservices:
```
Modular Monolith → Extract high-load modules (GIS, Sync) → Event-driven communication → Full microservices
```

## 4. Why PostGIS is Mandatory

1. **Spatial Queries**: Native point-in-polygon, radius search, spatial joins
2. **GIS Functions**: ST_Contains, ST_DWithin, ST_ClusterDBSCAN for disease hotspot detection
3. **GeoJSON Support**: Native GeoJSON input/output for map integration
4. **Performance**: GiST indexes for sub-millisecond spatial queries
5. **No Extra Infrastructure**: Spatial capabilities within existing PostgreSQL without additional services

## 5. Offline-First Architecture

```
┌─────────────────────────────────────────────┐
│              Online Mode                     │
│  App → Service Worker → API → DB            │
│         ↓ (cache)                           │
│       IndexedDB                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              Offline Mode                    │
│  App → IndexedDB (local) → Queue            │
│         ↓ (when online)                     │
│  Background Sync → API → DB                 │
└─────────────────────────────────────────────┘
```

### Sync Strategy:
- **Optimistic**: Local writes succeed immediately
- **Last-Write-Wins**: Timestamp-based conflict resolution
- **Batch Processing**: 50 items per sync batch
- **Exponential Backoff**: Retry with 1s, 2s, 4s, 8s, 16s intervals
- **Compression**: LZ-String compression for payload size reduction

## 6. Security Architecture

```
┌─────────────────────────────────────────────┐
│           Authentication Flow               │
│                                              │
│  Client → Login → JWT Generation            │
│       ↓                                     │
│  HttpOnly Cookie + Bearer Token             │
│       ↓                                     │
│  Middleware → JWT Verify → Route Handler    │
│       ↓                                     │
│  Audit Log → Response to Client             │
└─────────────────────────────────────────────┘
```

- JWT tokens with 7-day expiry, refresh tokens for 30 days
- Role-based access control (RBAC) at every API endpoint
- Device binding for mobile app authentication
- All mutations logged in append-only audit table
- Encryption at rest for sensitive PII data

## 7. Data Flow: Survey Submission

```
ASHA Worker → Flutter App → IndexedDB (if offline)
                           → API (if online)
                                → Validation
                                → GPS Point Storage (PostGIS)
                                → Household Update
                                → Vaccination Schedule Check
                                → Audit Log
                                → Notification (if overdue)
                                → Sync Status Update
                                → Response
```

## 8. Scalability Approach

| Component | Strategy |
|-----------|----------|
| Database | Connection pooling (pgBouncer), Read replicas, Table partitioning |
| API | Horizontal scaling, CDN caching for static assets |
| GIS | Materialized views for common queries, Spatial index optimization |
| Offline | Batch sync, Compression, Incremental sync |
| Cache | Redis for session store, API response caching |
| File Storage | S3/CDN for uploaded images/GEOJSON files |
