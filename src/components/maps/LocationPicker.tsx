"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCoords = Boolean(latitude && longitude);

  const initMap = useCallback(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) {
      mapInstance.current.invalidateSize();
      return;
    }

    setIsLoading(true);
    setError(null);

    const defaultLat = parseFloat(latitude) || 20.5937;
    const defaultLng = parseFloat(longitude) || 78.9629;

    try {
      const map = L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 5,
        zoomControl: true,
      });

      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href='https://openstreetmap.org/copyright'>OpenStreetMap</a>",
      });

      tileLayer.on("load", () => {
        setIsLoading(false);
      });

      tileLayer.on("tileerror", () => {
        setError("Failed to load map tiles. Check your internet connection.");
        setIsLoading(false);
      });

      tileLayer.addTo(map);

      const icon = L.divIcon({
        html: `<div style="width:20px;height:20px;background:#dc2626;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: "",
      });

      const marker = L.marker([defaultLat, defaultLng], { icon, draggable: true }).addTo(map);
      markerRef.current = marker;

      const updateCoords = (latlng: L.LatLng) => {
        onChange(latlng.lat.toFixed(6), latlng.lng.toFixed(6));
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        updateCoords(pos);
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        updateCoords(e.latlng);
      });

      mapInstance.current = map;
      setIsLoading(false);
    } catch {
      setError("Failed to initialize map.");
      setIsLoading(false);
    }
  }, [latitude, longitude, onChange]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(initMap, 100);
    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isOpen, initMap]);

  const openMap = () => {
    setIsOpen(true);
  };

  const closeMap = () => {
    setIsOpen(false);
    setError(null);
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
  };

  return (
    <>
      <div className="col-span-2">
        <button
          type="button"
          onClick={openMap}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {hasCoords ? `Location: ${latitude}, ${longitude}` : "Click to select location on map"}
        </button>
        {hasCoords && (
          <div className="mt-2 flex gap-2 text-xs text-gray-500">
            <span>Lat: {latitude}</span>
            <span>Lng: {longitude}</span>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeMap}>
          <div
            className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
              <button
                type="button"
                onClick={closeMap}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error ? (
              <div className="flex h-[400px] flex-col items-center justify-center gap-4 px-6">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={() => { setError(null); initMap(); }}
                  className="rounded-lg bg-who-blue px-4 py-2 text-sm font-medium text-white hover:bg-who-blue/90"
                >
                  Retry
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex h-[400px] flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-who-blue border-t-transparent" />
                <p className="text-sm text-gray-500">Loading map...</p>
              </div>
            ) : (
              <div ref={mapRef} className="h-[400px] w-full" />
            )}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-gray-600">
                {latitude && longitude ? (
                  <>Lat: {latitude}, Lng: {longitude}</>
                ) : (
                  "Click on the map or drag the marker"
                )}
              </div>
              <button
                type="button"
                onClick={closeMap}
                className="rounded-lg bg-who-blue px-6 py-2 text-sm font-medium text-white hover:bg-who-blue/90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
