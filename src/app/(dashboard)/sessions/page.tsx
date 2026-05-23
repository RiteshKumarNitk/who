"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import api from "@lib/api";

interface VaccinationSession {
  id: string;
  site: string;
  sessionDate: string;
  status: "PLANNED" | "COMPLETED" | "CANCELLED" | "IN_PROGRESS";
  childrenCount: number;
  vaccinatedCount: number;
  ashaName: string;
}

interface SessionsResponse {
  data: VaccinationSession[];
  total: number;
}

const statusBadge: Record<string, "warning" | "success" | "danger" | "info"> = {
  PLANNED: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  IN_PROGRESS: "info",
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function SessionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, error } = useQuery<SessionsResponse>({
    queryKey: ["sessions", statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const res = await api.get(`/api/sessions?${params}`);
      return res.data;
    },
  });

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
        <p className="text-red-500">Failed to load sessions. Please try again.</p>
      </div>
    );
  }

  const sessions = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vaccination Sessions</h1>
        <p className="text-sm text-gray-500">Manage vaccination sessions</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="Filter by status"
          className="w-48"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          label="From"
          className="w-44"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          label="To"
          className="w-44"
        />
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No sessions found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{s.site}</span>
                    <Badge variant={statusBadge[s.status]}>
                      {s.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {new Date(s.sessionDate).toLocaleDateString()} &middot;{" "}
                    {s.vaccinatedCount}/{s.childrenCount} vaccinated &middot; ASHA: {s.ashaName}
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
