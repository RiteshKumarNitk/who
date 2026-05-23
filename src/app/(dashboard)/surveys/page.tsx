"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Select } from "@components/ui/Select";
import api from "@lib/api";

interface SurveySession {
  id: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  type: string;
  surveyDate: string;
  ashaName: string;
  householdCode: string;
  location?: { lat: number; lng: number };
}

interface SurveysResponse {
  data: SurveySession[];
  total: number;
}

const statusBadge: Record<string, "warning" | "info" | "success" | "danger"> = {
  PLANNED: "warning",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "HOUSEHOLD", label: "Household" },
  { value: "HEALTH", label: "Health" },
  { value: "FOLLOW_UP", label: "Follow Up" },
];

export default function SurveysPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading, error } = useQuery<SurveysResponse>({
    queryKey: ["surveys", statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);
      const res = await api.get(`/api/surveys?${params}`);
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
        <p className="text-red-500">Failed to load surveys. Please try again.</p>
      </div>
    );
  }

  const surveys = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
        <p className="text-sm text-gray-500">Manage survey sessions</p>
      </div>

      <div className="flex gap-4">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="Filter by status"
          className="w-48"
        />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="Filter by type"
          className="w-48"
        />
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No surveys found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {surveys.map((survey) => (
            <Card key={survey.id} hoverable>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant={statusBadge[survey.status]}>
                      {survey.status.replace("_", " ")}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900">
                      {survey.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(survey.surveyDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    ASHA: {survey.ashaName} &middot; Household: {survey.householdCode}
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
