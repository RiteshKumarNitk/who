"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Select } from "@components/ui/Select";
import api from "@lib/api";

interface Child {
  id: string;
  name: string;
  age: number;
  gender: string;
  vaccinationStatus: "VACCINATED" | "DUE" | "OVERDUE" | "NOT_DUE";
  highRisk: boolean;
  motherName: string;
  householdCode: string;
}

interface ChildrenResponse {
  data: Child[];
  total: number;
}

const statusBadge: Record<string, "success" | "warning" | "danger" | "outline"> = {
  VACCINATED: "success",
  DUE: "warning",
  OVERDUE: "danger",
  NOT_DUE: "outline",
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "VACCINATED", label: "Vaccinated" },
  { value: "DUE", label: "Due" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "NOT_DUE", label: "Not Due" },
];

export default function ChildrenPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useQuery<ChildrenResponse>({
    queryKey: ["children", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.append("vaccinationStatus", statusFilter);
      const res = await api.get(`/api/children?${params}`);
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
        <p className="text-red-500">Failed to load children data. Please try again.</p>
      </div>
    );
  }

  const children = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Children</h1>
        <p className="text-sm text-gray-500">Child vaccination records</p>
      </div>

      <div className="flex gap-4">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="Filter by status"
          className="w-48"
        />
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No children found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <Card key={child.id} className={child.highRisk ? "border-red-300 bg-red-50" : ""}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{child.name}</span>
                    {child.highRisk && (
                      <Badge variant="danger">High Risk</Badge>
                    )}
                    <Badge variant={statusBadge[child.vaccinationStatus]}>
                      {child.vaccinationStatus.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {child.gender} &middot; {child.age} months &middot; Mother: {child.motherName}
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
