"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapView } from "@components/maps/MapView";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Modal } from "@components/ui/Modal";
import { useGeolocation } from "@hooks/use-geolocation";
import api from "@lib/api";

export default function GisPage() {
  const [selectedTab, setSelectedTab] = useState<"boundaries" | "heatmap" | "search">("boundaries");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<[number, number][]>([]);
  const [searchLat, setSearchLat] = useState("");
  const [searchLng, setSearchLng] = useState("");
  const { latitude, longitude, getCurrentPosition } = useGeolocation();

  const { data: boundaries } = useQuery({
    queryKey: ["boundaries"],
    queryFn: async () => {
      const res = await api.get("/api/gis/polygons?limit=100");
      return res.data.data;
    },
  });

  const { data: heatmap } = useQuery({
    queryKey: ["heatmap"],
    queryFn: async () => {
      const res = await api.get("/api/gis/heatmap");
      return res.data.data;
    },
    enabled: selectedTab === "heatmap",
  });

  const createBoundaryMutation = useMutation({
    mutationFn: async (data: { ashaId: string; points: [number, number][] }) => {
      const res = await api.post("/api/gis/polygons", data);
      return res.data;
    },
    onSuccess: () => {
      setShowCreateModal(false);
      setBoundaryPoints([]);
    },
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (showCreateModal) {
      setBoundaryPoints((prev) => [...prev, [lng, lat]]);
    }
  }, [showCreateModal]);

  const handleLocateMe = async () => {
    try {
      const pos = await getCurrentPosition();
      setSearchLat(pos.lat.toString());
      setSearchLng(pos.lng.toString());
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GIS Mapping</h1>
          <p className="text-sm text-gray-500">ASHA Area Boundaries & Spatial Analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSelectedTab("search")}>Search Location</Button>
          <Button onClick={() => setShowCreateModal(true)}>Create Boundary</Button>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {(["boundaries", "heatmap", "search"] as const).map((tab) => (
          <button key={tab} onClick={() => setSelectedTab(tab)} className={`rounded-lg px-4 py-2 text-sm font-medium ${selectedTab === tab ? "bg-who-blue text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            {tab === "boundaries" ? "Boundaries" : tab === "heatmap" ? "Heatmap" : "Search"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardContent className="h-[600px] p-0 overflow-hidden rounded-xl">
            <MapView
              height="600px"
              showBoundaries={selectedTab === "boundaries"}
              showHeatmap={selectedTab === "heatmap"}
              onMapClick={handleMapClick}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTab === "search" && (
              <>
                <Input label="Latitude" value={searchLat} onChange={(e) => setSearchLat(e.target.value)} type="number" />
                <Input label="Longitude" value={searchLng} onChange={(e) => setSearchLng(e.target.value)} type="number" />
                <Button fullWidth onClick={handleLocateMe}>Use My Location</Button>
                <Button fullWidth variant="secondary">Find ASHA</Button>
                <Button fullWidth variant="secondary">Find Nearby Sites</Button>
              </>
            )}

            {selectedTab === "boundaries" && (
              <>
                <p className="text-sm font-medium text-gray-700">Boundary Status</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-green-500" /> APPROVED</div>
                  <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-yellow-500" /> PENDING</div>
                  <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-gray-400" /> DRAFT</div>
                </div>
                <p className="text-sm text-gray-500">Total: {boundaries?.length ?? 0} boundaries</p>
              </>
            )}

            {showCreateModal && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                Click on the map to add boundary points. Points added: {boundaryPoints.length}
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => setBoundaryPoints([])}>Clear</Button>
                  <Button size="sm" disabled={boundaryPoints.length < 3}>Save</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
