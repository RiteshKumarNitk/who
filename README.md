# WHO GIS Surveillance & Immunization Mapping Platform

Public Health GIS Surveillance Platform for WHO teams, Government Health Departments, and field health workers. Mobile-first, offline-capable system for immunization tracking, disease surveillance, and ASHA area mapping.

## Architecture Overview

```
WHO GIS Platform
├── Next.js 15 (Full-stack)
│   ├── App Router / API Routes
│   ├── Modular Monolith Backend
│   └── PWA Frontend
├── Flutter Mobile App
│   ├── Offline-first field operations
│   ├── GPS tracking & mapping
│   └── Background sync
├── PostgreSQL + PostGIS
│   ├── Spatial data & indexing
│   ├── GeoJSON polygons
│   └── GIS queries
├── Docker / AWS / Vercel
└── CI/CD Ready
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Web) | Next.js 15, TypeScript, Tailwind CSS, ShadCN UI |
| Frontend (Mobile) | Flutter 3.x, Dart |
| State Management | Zustand, TanStack Query, BLoC (Flutter) |
| Backend | Next.js API Routes, Server Actions |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| ORM | Prisma |
| GIS | Mapbox GL JS, @turf/turf, PostGIS |
| Auth | JWT, NextAuth, bcryptjs |
| Offline | IndexedDB (Dexie), Service Workers, WorkManager |
| Container | Docker, Docker Compose |
| CI/CD | GitHub Actions |

## Project Structure

```
who-gis/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, Register pages
│   │   ├── (dashboard)/        # Dashboard pages
│   │   └── api/                # REST API routes
│   ├── modules/                # Domain modules
│   │   ├── auth/               # Authentication
│   │   ├── gis/                # GIS & Boundaries
│   │   ├── surveys/            # Field surveys
│   │   ├── vaccination/        # Vaccination tracking
│   │   ├── disease/            # Disease surveillance
│   │   ├── hierarchy/          # Government hierarchy
│   │   ├── sync/               # Offline sync engine
│   │   └── ...
│   ├── shared/                 # Shared kernel
│   ├── components/             # UI components
│   ├── lib/                    # Core libraries
│   ├── store/                  # Zustand stores
│   └── hooks/                  # React hooks
├── flutter_app/                # Flutter mobile app
├── prisma/                     # Prisma schema
├── pg-init/                    # PostGIS init scripts
├── docker/                     # Docker configs
├── public/                     # Static assets
└── .github/workflows/          # CI/CD
```

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16+ with PostGIS
- Flutter 3.x (for mobile app)
- Mapbox token (for maps)

### 1. Database Setup

```bash
# Create PostgreSQL database with PostGIS
psql -U postgres -c "CREATE DATABASE who_gis;"
psql -U postgres -d who_gis -c "CREATE EXTENSION postgis;"

# Or use Docker
docker compose up -d db
```

### 2. Environment Setup

```bash
cp .env.local .env
# Edit .env with your database credentials and API keys
```

### 3. Install & Run (Next.js)

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 4. Run Flutter App

```bash
cd flutter_app
flutter pub get
flutter run
```

### 5. Docker Deployment

```bash
docker compose up --build
```

## Key Modules

### GIS Mapping
- ASHA area boundary creation via GPS tracking
- Polygon-based territory mapping
- Point-in-polygon queries for ASHA assignment
- Heatmap generation for disease hotspots
- Overlap detection between boundaries

### Offline-First Architecture
- IndexedDB (Dexie) for local data storage
- Service Worker for background sync
- Conflict resolution with timestamp-based strategy
- Compression for bandwidth efficiency
- Retry queue with exponential backoff

### Disease Surveillance
- Real-time case reporting with GPS location
- DBSCAN-based hotspot detection (via PostGIS)
- Radius-based contact tracing
- Automated cluster detection
- Severity-based heatmap visualization

### Government Hierarchy
- State → District → Block → Planning Unit → ANM → ASHA
- Role-based access control at each level
- Automatic coverage gap identification
- Hierarchical data aggregation

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User authentication |
| POST | `/api/auth/register` | User registration |
| GET | `/api/gis/polygons` | List ASHA boundaries |
| POST | `/api/gis/polygons` | Create boundary |
| GET | `/api/gis/coordinates?lat=&lng=` | Find ASHA by location |
| GET | `/api/gis/heatmap` | Disease heatmap data |
| GET/POST | `/api/surveys` | Survey CRUD |
| GET/POST | `/api/vaccination` | Vaccination records |
| GET/POST | `/api/disease` | Disease case reporting |
| POST | `/api/sync` | Offline sync endpoint |
| GET | `/api/analytics` | Dashboard statistics |

## Government Hierarchy

```
State (राज्य)
  └── District (ज़िला)
       └── Block (ब्लॉक)
            └── Planning Unit - CHC/PHC/UPHC (योजना इकाई)
                 └── ANM (एएनएम)
                      └── ASHA (आशा)
                           └── ASHA Area Boundary
                                └── Household (परिवार)
                                     ├── Children (बच्चे)
                                     └── Pregnant Women (गर्भवती महिलाएं)
```

## Mobile App (Flutter)

The Flutter mobile app supports:
- Offline-first operation with local storage
- GPS-based survey tracking
- Disease case reporting with photo attachment
- Vaccination record management
- Hindi language UI
- Background sync via WorkManager
- Large touch targets for field workers

## License

WHO GIS Surveillance Platform &copy; 2026


 Created seed script at prisma/seed.ts
- Seeded admin user:
- Email: admin@who-gis.org
- Password: admin123
- Role: SUPER_ADMIN
- Run with npx prisma db seed (already done)



Seeded admin user: admin@who-gis.org / admin123 (SUPER_ADMIN role)
Run npx prisma db seed to create more users
OR use POST /api/auth/register (super admin only) to register users from the app

✓ Super Admin: admin@who-gis.org / admin123
✓ State Admin: state@who-gis.org / admin123
✓ District Admin: district@who-gis.org / admin123
✓ Block Admin: block@who-gis.org / admin123
✓ MOIC: moic@who-gis.org / admin123
✓ ANM: anm@who-gis.org / admin123
✓ ASHA: asha@who-gis.org / admin123