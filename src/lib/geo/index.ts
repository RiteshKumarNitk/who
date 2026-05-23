import * as turf from "@turf/turf";
import type { Feature, Polygon, MultiPolygon, Point } from "geojson";

export class GeoService {
  static createPoint(lat: number, lng: number): Point {
    return {
      type: "Point",
      coordinates: [lng, lat],
    };
  }

  static createPolygonFromPoints(
    points: [number, number][]
  ): Polygon {
    if (points.length < 3) throw new Error("Need at least 3 points for a polygon");
    const coords = [...points, points[0]];
    return {
      type: "Polygon",
      coordinates: [coords],
    };
  }

  static calculateArea(polygon: Polygon | MultiPolygon): number {
    const area = turf.area(polygon);
    return Math.round(area / 1_000_000 * 100) / 100; // sq km, 2 decimal
  }

  static calculateCentroid(polygon: Polygon | MultiPolygon): Point {
    return turf.centroid(polygon).geometry;
  }

  static pointInPolygon(
    lat: number,
    lng: number,
    polygon: Polygon | MultiPolygon
  ): boolean {
    const point = turf.point([lng, lat]);
    return turf.booleanPointInPolygon(point, polygon);
  }

  static detectOverlap(
    poly1: Polygon | MultiPolygon,
    poly2: Polygon | MultiPolygon
  ): { overlaps: boolean; area: number } {
    if (!turf.booleanIntersects(poly1, poly2)) {
      return { overlaps: false, area: 0 };
    }
    const intersection = turf.intersect(
      turf.featureCollection([
        turf.feature(poly1 as any),
        turf.feature(poly2 as any),
      ])
    );
    if (!intersection) return { overlaps: false, area: 0 };
    return {
      overlaps: true,
      area: Math.round(turf.area(intersection) / 1_000_000 * 100) / 100,
    };
  }

  static bufferPoint(
    lat: number,
    lng: number,
    radiusMeters: number
  ): Polygon {
    const point = turf.point([lng, lat]);
    const buffered = turf.buffer(point, radiusMeters, { units: "meters" });
    return buffered!.geometry as unknown as Polygon;
  }

  static findPointsInRadius(
    centerLat: number,
    centerLng: number,
    points: Array<{ lat: number; lng: number }>,
    radiusMeters: number
  ): Array<{ lat: number; lng: number; distance: number }> {
    const center = turf.point([centerLng, centerLat]);
    return points
      .map((p) => {
        const pt = turf.point([p.lng, p.lat]);
        const distance = turf.distance(center, pt, { units: "meters" });
        return { ...p, distance };
      })
      .filter((p) => p.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
  }

  static generateHeatmapData(
    points: Array<{ lat: number; lng: number; weight?: number }>,
    options?: { radius?: number; gridSize?: number }
  ): Array<{ lat: number; lng: number; intensity: number }> {
    const gridSize = options?.gridSize || 0.01;
    const radius = options?.radius || 0.05;
    const grid = new Map<string, { lat: number; lng: number; sum: number; count: number }>();

    for (const point of points) {
      const gridLat = Math.round(point.lat / gridSize) * gridSize;
      const gridLng = Math.round(point.lng / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;

      if (!grid.has(key)) {
        grid.set(key, { lat: gridLat, lng: gridLng, sum: 0, count: 0 });
      }
      const cell = grid.get(key)!;
      cell.sum += point.weight || 1;
      cell.count++;
    }

    return Array.from(grid.values()).map((cell) => ({
      lat: cell.lat,
      lng: cell.lng,
      intensity: cell.sum / cell.count,
    }));
  }

  static simplifyPolygon(
    polygon: Polygon | MultiPolygon,
    tolerance = 0.001
  ): Polygon | MultiPolygon {
    const simplified = turf.simplify(polygon as unknown as Feature, {
      tolerance,
      highQuality: true,
    });
    return simplified.geometry as unknown as Polygon | MultiPolygon;
  }

  static toGeoJSON<T>(data: T): string {
    return JSON.stringify(data);
  }

  static fromGeoJSON<T>(json: string): T {
    return JSON.parse(json) as T;
  }
}

// Re-export turf for advanced usage
export { turf };
