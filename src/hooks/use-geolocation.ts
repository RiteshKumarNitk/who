"use client";

import { useState, useCallback, useEffect } from "react";

interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number | null;
  error: string | null;
  isTracking: boolean;
}

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    speed: null,
    heading: null,
    timestamp: null,
    error: null,
    isTracking: false,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      speed: pos.coords.speed,
      heading: pos.coords.heading,
      timestamp: pos.timestamp,
      error: null,
      isTracking: true,
    });
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    setState((s) => ({
      ...s,
      error: err.message,
      isTracking: false,
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported", isTracking: false }));
      return;
    }
    const id = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    });
    setWatchId(id);
    setState((s) => ({ ...s, isTracking: true }));
  }, [onSuccess, onError, options]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setState((s) => ({ ...s, isTracking: false }));
    }
  }, [watchId]);

  const getCurrentPosition = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return { ...state, startTracking, stopTracking, getCurrentPosition };
}
