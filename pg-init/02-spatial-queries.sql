-- ============================================================
-- WHO GIS — Spatial Query Examples & Prepared Functions
-- ============================================================

-- 1. POINT-IN-POLYGON: Find which ASHA covers a given location
CREATE OR REPLACE FUNCTION find_asha_by_location(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
RETURNS TABLE(
  asha_id UUID,
  asha_name VARCHAR,
  anm_id UUID,
  anm_name VARCHAR,
  planning_unit_id UUID,
  planning_unit_name VARCHAR,
  distance_meters DOUBLE PRECISION
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    a.id,
    a.name,
    anm.id,
    anm.name,
    pu.id,
    pu.name,
    ST_Distance(
      ab.centroid,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    ) * 111320 AS distance_meters
  FROM asha_boundaries ab
  JOIN ashas a ON a.id = ab.asha_id
  JOIN anms anm ON anm.id = a.anm_id
  JOIN planning_units pu ON pu.id = anm.planning_unit_id
  WHERE ab.status = 'APPROVED'
    AND ST_Contains(
      ab.polygon,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    );
$$;

-- 2. RADIUS SEARCH: Find disease cases within radius (meters)
CREATE OR REPLACE FUNCTION find_cases_in_radius(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  disease_type VARCHAR DEFAULT NULL,
  days_back INT DEFAULT 30
)
RETURNS TABLE(
  case_id UUID,
  case_number VARCHAR,
  disease_type VARCHAR,
  status VARCHAR,
  patient_name VARCHAR,
  distance_meters DOUBLE PRECISION,
  reported_at TIMESTAMP
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    dc.id,
    dc.case_number,
    dc.disease_type::text,
    dc.status::text,
    dc.patient_name,
    ST_Distance(
      dc.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    ) * 111320 AS distance_meters,
    dc.reported_at
  FROM disease_cases dc
  WHERE ST_DWithin(
    dc.location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    radius_meters / 111320.0  -- approximate degree-to-meter conversion
  )
  AND (disease_type IS NULL OR dc.disease_type = disease_type::disease_type)
  AND dc.reported_at >= NOW() - (days_back || ' days')::INTERVAL
  AND dc.status NOT IN ('DISCARDED', 'RECOVERED')
  ORDER BY distance_meters;
$$;

-- 3. DISEASE HOTSPOT ANALYSIS: DBSCAN-style clustering
CREATE OR REPLACE FUNCTION detect_disease_hotspots(
  disease_type VARCHAR,
  min_points INT DEFAULT 3,
  radius_meters DOUBLE PRECISION DEFAULT 500,
  days_back INT DEFAULT 30
)
RETURNS TABLE(
  cluster_id INT,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  case_count BIGINT,
  cluster_radius DOUBLE PRECISION,
  avg_severity DOUBLE PRECISION
)
LANGUAGE SQL STABLE
AS $$
  WITH active_cases AS (
    SELECT id, location, severity::text
    FROM disease_cases
    WHERE (disease_type IS NULL OR disease_type = disease_type::disease_type)
      AND reported_at >= NOW() - (days_back || ' days')::INTERVAL
      AND status NOT IN ('DISCARDED', 'RECOVERED')
  ),
  clustered AS (
    SELECT
      ST_ClusterDBSCAN(location, radius_meters / 111320.0, min_points)
        OVER () AS cid,
      location,
      severity
    FROM active_cases
  )
  SELECT
    cid,
    ST_Y(ST_Centroid(ST_Collect(location))) AS center_lat,
    ST_X(ST_Centroid(ST_Collect(location))) AS center_lng,
    COUNT(*) AS case_count,
    MAX(ST_Distance(location, ST_Centroid(ST_Collect(location)))) * 111320 AS cluster_radius,
    AVG(CASE
      WHEN severity = 'CRITICAL' THEN 4
      WHEN severity = 'SEVERE' THEN 3
      WHEN severity = 'MODERATE' THEN 2
      WHEN severity = 'MILD' THEN 1
      ELSE 0
    END) AS avg_severity
  FROM clustered
  WHERE cid IS NOT NULL
  GROUP BY cid
  HAVING COUNT(*) >= min_points
  ORDER BY case_count DESC;
$$;

-- 4. FIND UNCOVERED AREAS: Areas not covered by any ASHA boundary
CREATE OR REPLACE FUNCTION find_uncovered_areas(
  boundary_geom geometry DEFAULT NULL
)
RETURNS TABLE(
  area geometry,
  area_sq_km DOUBLE PRECISION
)
LANGUAGE SQL STABLE
AS $$
  WITH all_boundaries AS (
    SELECT ST_Union(polygon) AS combined
    FROM asha_boundaries
    WHERE status = 'APPROVED'
  ),
  area_of_interest AS (
    SELECT CASE
      WHEN boundary_geom IS NOT NULL THEN boundary_geom
      ELSE ST_SetSRID(ST_MakeEnvelope(68, 6, 98, 38, 4326), 4326)
    END AS geom
  )
  SELECT
    ST_Difference(aoi.geom, COALESCE(ab.combined, ST_GeomFromText('POLYGON EMPTY', 4326))),
    ST_Area(ST_Difference(aoi.geom, COALESCE(ab.combined, ST_GeomFromText('POLYGON EMPTY', 4326))), true) / 1000000
  FROM area_of_interest aoi
  CROSS JOIN all_boundaries ab;
$$;

-- 5. VACCINATION COVERAGE BY ASHA AREA
CREATE OR REPLACE FUNCTION vaccination_coverage_by_asha(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  asha_id UUID,
  asha_name VARCHAR,
  district_name VARCHAR,
  block_name VARCHAR,
  total_children BIGINT,
  vaccinated_children BIGINT,
  missed_children BIGINT,
  coverage_percentage NUMERIC
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    a.id,
    a.name,
    d.name,
    b.name,
    COUNT(DISTINCT c.id) AS total_children,
    COUNT(DISTINCT vr.id) FILTER (WHERE vr.status = 'ADMINISTERED') AS vaccinated,
    COUNT(DISTINCT c.id) - COUNT(DISTINCT vr.id) FILTER (WHERE vr.status = 'ADMINISTERED') AS missed,
    ROUND(
      COUNT(DISTINCT vr.id) FILTER (WHERE vr.status = 'ADMINISTERED')::NUMERIC
      / NULLIF(COUNT(DISTINCT c.id), 0) * 100, 2
    )
  FROM ashas a
  JOIN anms anm ON anm.id = a.anm_id
  JOIN planning_units pu ON pu.id = anm.planning_unit_id
  JOIN blocks b ON b.id = pu.block_id
  JOIN districts d ON d.id = b.district_id
  LEFT JOIN households h ON h.asha_id = a.id
  LEFT JOIN children c ON c.household_id = h.id
  LEFT JOIN vaccination_records vr ON vr.child_id = c.id
    AND (start_date IS NULL OR vr.scheduled_date >= start_date)
    AND (end_date IS NULL OR vr.scheduled_date <= end_date)
  GROUP BY a.id, a.name, d.name, b.name
  ORDER BY coverage_percentage;
$$;

-- 6. OVERLAP DETECTION: Find overlapping ASHA boundaries
CREATE OR REPLACE FUNCTION detect_boundary_overlaps()
RETURNS TABLE(
  asha_id_1 UUID,
  asha_name_1 VARCHAR,
  asha_id_2 UUID,
  asha_name_2 VARCHAR,
  overlap_area_sq_m DOUBLE PRECISION,
  overlap_geometry geometry
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    a1.id,
    a1.name,
    a2.id,
    a2.name,
    ST_Area(ST_Intersection(ab1.polygon, ab2.polygon), true),
    ST_Intersection(ab1.polygon, ab2.polygon)
  FROM asha_boundaries ab1
  JOIN ashas a1 ON a1.id = ab1.asha_id
  JOIN asha_boundaries ab2 ON ab2.asha_id > ab1.asha_id
  JOIN ashas a2 ON a2.id = ab2.asha_id
  WHERE ab1.status = 'APPROVED' AND ab2.status = 'APPROVED'
    AND ST_Intersects(ab1.polygon, ab2.polygon)
    AND ST_Area(ST_Intersection(ab1.polygon, ab2.polygon)) > 0;
$$;

-- 7. UNVACCINATED CHILDREN BY PLANNING UNIT
CREATE OR REPLACE FUNCTION find_unvaccinated_children(
  vaccine_code VARCHAR DEFAULT NULL
)
RETURNS TABLE(
  child_id UUID,
  child_name VARCHAR,
  age_months INT,
  planning_unit_name VARCHAR,
  asha_name VARCHAR,
  vaccine_name VARCHAR,
  dose_number INT,
  due_date DATE
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    c.id,
    c.name,
    EXTRACT(MONTH FROM AGE(c.date_of_birth))::INT,
    pu.name,
    a.name,
    v.name,
    vr.dose_number,
    vr.scheduled_date::DATE
  FROM children c
  JOIN households h ON h.id = c.household_id
  JOIN ashas a ON a.id = h.asha_id
  JOIN anms anm ON anm.id = a.anm_id
  JOIN planning_units pu ON pu.id = anm.planning_unit_id
  JOIN vaccination_records vr ON vr.child_id = c.id
  JOIN vaccines v ON v.id = vr.vaccine_id
  WHERE vr.status = 'SCHEDULED'
    AND vr.scheduled_date <= CURRENT_DATE
    AND (vaccine_code IS NULL OR v.code = vaccine_code)
  ORDER BY vr.scheduled_date;
$$;

-- 8. NEARBY SESSION SITES
CREATE OR REPLACE FUNCTION find_nearby_sites(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 5000
)
RETURNS TABLE(
  site_id UUID,
  site_name VARCHAR,
  site_type VARCHAR,
  distance_meters DOUBLE PRECISION,
  next_session_date DATE,
  asha_name VARCHAR
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    ss.id,
    ss.name,
    ss.type::text,
    ST_Distance(
      ss.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    ) * 111320,
    vs.date::DATE,
    a.name
  FROM session_sites ss
  LEFT JOIN ashas a ON a.id = ss.asha_id
  LEFT JOIN vaccination_sessions vs ON vs.site_id = ss.id
    AND vs.date >= CURRENT_DATE
  WHERE ST_DWithin(
    ss.location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    radius_meters / 111320.0
  )
  ORDER BY distance_meters;
$$;
