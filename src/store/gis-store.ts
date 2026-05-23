import { create } from "zustand";
import type { ASHABoundary, DiseaseCase } from "@shared/types";

interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface GisState {
  viewport: MapViewport;
  selectedBoundary: ASHABoundary | null;
  selectedCase: DiseaseCase | null;
  boundaries: ASHABoundary[];
  heatmapData: Array<{ lat: number; lng: number; intensity: number }>;
  isLoading: boolean;
  setViewport: (viewport: MapViewport) => void;
  setSelectedBoundary: (boundary: ASHABoundary | null) => void;
  setSelectedCase: (case_: DiseaseCase | null) => void;
  setBoundaries: (boundaries: ASHABoundary[]) => void;
  setHeatmapData: (data: Array<{ lat: number; lng: number; intensity: number }>) => void;
  setLoading: (loading: boolean) => void;
}

export const useGisStore = create<GisState>()((set) => ({
  viewport: {
    latitude: 20.5937,
    longitude: 78.9629,
    zoom: 5,
  },
  selectedBoundary: null,
  selectedCase: null,
  boundaries: [],
  heatmapData: [],
  isLoading: false,

  setViewport: (viewport: MapViewport) => set({ viewport }),
  setSelectedBoundary: (selectedBoundary: ASHABoundary | null) => set({ selectedBoundary }),
  setSelectedCase: (selectedCase: DiseaseCase | null) => set({ selectedCase }),
  setBoundaries: (boundaries: ASHABoundary[]) => set({ boundaries }),
  setHeatmapData: (heatmapData: Array<{ lat: number; lng: number; intensity: number }>) => set({ heatmapData }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
