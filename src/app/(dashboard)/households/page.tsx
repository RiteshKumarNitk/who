"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import api from "@lib/api";

interface Household {
  id: string;
  headName: string;
  code: string;
  village: string;
  district: string;
  state: string;
  memberCount: number;
  location?: { lat: number; lng: number };
}

interface HouseholdsResponse {
  data: Household[];
  total: number;
}

export default function HouseholdsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery<HouseholdsResponse>({
    queryKey: ["households"],
    queryFn: async () => {
      const res = await api.get("/api/households?limit=50");
      return res.data;
    },
  });

  const households = data?.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return households;
    const q = search.toLowerCase();
    return households.filter(
      (h) =>
        h.code.toLowerCase().includes(q) ||
        h.headName.toLowerCase().includes(q)
    );
  }, [households, search]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-who-blue border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-red-500">Failed to load households. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Households</h1>
        <p className="text-sm text-gray-500">Manage registered households</p>
      </div>

      <Input
        placeholder="Search by code or head name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {search ? "No households match your search" : "No households found"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => (
            <Card key={h.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{h.headName}</span>
                    <span className="text-xs text-gray-400">{h.code}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {h.village}, {h.district}, {h.state} &middot; {h.memberCount} members
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
