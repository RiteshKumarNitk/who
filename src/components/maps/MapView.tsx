"use client";

import { useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useGisStore } from "@store/gis-store";
import type { ASHABoundary } from "@shared/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const HAS_MAPBOX = Boolean(
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN &&
  !process.env.NEXT_PUBLIC_MAPBOX_TOKEN.startsWith("your-")
);

interface MapViewProps {
  className?: string;
  interactive?: boolean;
  showBoundaries?: boolean;
  showHeatmap?: boolean;
  showDiseaseCases?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
}

function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(n * ((lng + 180) / 360));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    n * ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2)
  );
  return { x, y };
}

function OsmFallback({
  viewport,
  boundaries,
  showBoundaries,
  height,
  className,
}: {
  viewport: { latitude: number; longitude: number; zoom: number };
  boundaries: ASHABoundary[];
  showBoundaries: boolean;
  height: string;
  className?: string;
}) {
  const z = Math.round(viewport.zoom);
  const tile = useMemo(
    () => latLngToTile(viewport.latitude, viewport.longitude, z),
    [viewport.latitude, viewport.longitude, z]
  );

  const tileUrl = `https://tile.openstreetmap.org/${z}/${tile.x}/${tile.y}.png`;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border bg-gray-100 ${className ?? ""}`}
      style={{ height }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <img
          src={tileUrl}
          alt={`Map at ${viewport.latitude.toFixed(4)}, ${viewport.longitude.toFixed(4)}`}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-5 w-5 rounded-full border-2 border-red-600 bg-red-500/30" />
      </div>

      <div className="absolute left-2 top-2 rounded-md border bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          <span className="font-semibold text-gray-500">Lat</span>
          <span className="font-mono text-gray-900">{viewport.latitude.toFixed(6)}</span>
          <span className="font-semibold text-gray-500">Lng</span>
          <span className="font-mono text-gray-900">{viewport.longitude.toFixed(6)}</span>
          <span className="font-semibold text-gray-500">Zoom</span>
          <span className="font-mono text-gray-900">{viewport.zoom.toFixed(1)}</span>
        </div>
      </div>

      {showBoundaries && boundaries.length > 0 && (
        <div className="absolute right-2 top-2 max-h-[calc(100%-4rem)] w-52 overflow-y-auto rounded-md border bg-white/95 p-3 shadow-sm backdrop-blur">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Boundaries ({boundaries.length})
          </h4>
          <ul className="space-y-1">
            {boundaries.map((b) => (
              <li key={b.id} className="truncate text-sm text-gray-700">
                {b.asha?.name || `ID: ${b.id.slice(0, 8)}...`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="absolute bottom-1 right-1 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-500">
        &copy;{" "}
        <a
          href="https://openstreetmap.org/copyright"
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenStreetMap
        </a>{" "}
        contributors
      </div>
    </div>
  );
}

export function MapView({
  className = "",
  interactive = true,
  showBoundaries = true,
  showHeatmap = false,
  showDiseaseCases = false,
  onMapClick,
  height = "100%",
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { viewport, setViewport, boundaries, heatmapData } = useGisStore();

  useEffect(() => {
    if (!HAS_MAPBOX || !mapContainer.current || map.current) return;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      attributionControl: false,
    });

    m.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    m.addControl(new mapboxgl.ScaleControl({ unit: "metric" }));

    m.on("move", () => {
      const center = m.getCenter();
      setViewport({
        longitude: center.lng,
        latitude: center.lat,
        zoom: m.getZoom(),
      });
    });

    m.on("click", (e) => {
      onMapClick?.(e.lngLat.lat, e.lngLat.lng);
    });

    m.on("load", () => {
      map.current = m;
    });

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    map.current.flyTo({
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      duration: 1000,
    });
  }, [viewport.latitude, viewport.longitude, viewport.zoom]);

  useEffect(() => {
    if (!map.current || !showBoundaries || !boundaries.length) return;
    const m = map.current;

    if (m.getSource("boundaries")) {
      (m.getSource("boundaries") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: boundaries.map((b: ASHABoundary) => ({
          type: "Feature",
          properties: { id: b.id, name: b.asha?.name, area: b.areaSqKm, status: b.status },
          geometry: b.polygon,
        })),
      });
    } else {
      m.addSource("boundaries", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: boundaries.map((b: ASHABoundary) => ({
            type: "Feature",
            properties: { id: b.id, name: b.asha?.name, area: b.areaSqKm, status: b.status },
            geometry: b.polygon,
          })),
        },
      });

      m.addLayer({
        id: "boundaries-fill",
        type: "fill",
        source: "boundaries",
        paint: {
          "fill-color": ["match", ["get", "status"], "APPROVED", "#22c55e", "PENDING", "#eab308", "DRAFT", "#6b7280", "#3b82f6"],
          "fill-opacity": 0.3,
        },
      });

      m.addLayer({
        id: "boundaries-outline",
        type: "line",
        source: "boundaries",
        paint: {
          "line-color": ["match", ["get", "status"], "APPROVED", "#16a34a", "PENDING", "#ca8a04", "DRAFT", "#4b5563", "#2563eb"],
          "line-width": 2,
        },
      });

      m.on("click", "boundaries-fill", (e) => {
        if (e.features?.[0]?.properties) {
          const props = e.features[0].properties;
          new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(`<b>${props.name}</b><br/>Area: ${props.area?.toFixed(2)} km²<br/>Status: ${props.status}`).addTo(m);
        }
      });
    }
  }, [boundaries, showBoundaries]);

  useEffect(() => {
    if (!map.current || !showHeatmap || !heatmapData.length) return;
    const m = map.current;

    const heatmapPoints: GeoJSON.Feature[] = heatmapData.map((d) => ({
      type: "Feature",
      properties: { intensity: d.intensity },
      geometry: { type: "Point", coordinates: [d.lng, d.lat] },
    }));

    if (m.getSource("heatmap")) {
      (m.getSource("heatmap") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: heatmapPoints,
      });
    } else {
      m.addSource("heatmap", {
        type: "geojson",
        data: { type: "FeatureCollection", features: heatmapPoints },
      });

      m.addLayer(
        {
          id: "heatmap-layer",
          type: "heatmap",
          source: "heatmap",
          paint: {
            "heatmap-weight": ["get", "intensity"],
            "heatmap-intensity": 1,
            "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(33,102,172,0)", 0.2, "rgb(103,169,207)", 0.4, "rgb(209,229,240)", 0.6, "rgb(253,219,199)", 0.8, "rgb(239,138,98)", 1, "rgb(178,24,43)"],
            "heatmap-radius": 30,
            "heatmap-opacity": 0.8,
          },
        },
        "boundaries-fill"
      );
    }
  }, [heatmapData, showHeatmap]);

  if (!HAS_MAPBOX) {
    return (
      <OsmFallback
        viewport={viewport}
        boundaries={showBoundaries ? boundaries : []}
        showBoundaries={showBoundaries}
        height={height}
        className={className}
      />
    );
  }

  return <div ref={mapContainer} className={`w-full ${className}`} style={{ height }} />;
}
