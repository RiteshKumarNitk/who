"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import api from "@lib/api";

interface DueVaccination {
  id: string;
  childName: string;
  childAge: number;
  vaccine: string;
  dueDate: string;
  status: string;
  highRisk: boolean;
}

interface VaccinationResponse {
  data: {
    coverage: number;
    totalChildren: number;
    vaccinatedChildren: number;
    dueVaccinations: DueVaccination[];
  };
}

export default function VaccinationPage() {
  const { data, isLoading, error } = useQuery<VaccinationResponse>({
    queryKey: ["vaccination"],
    queryFn: async () => {
      const res = await api.get("/api/vaccination?status=DUE");
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
        <p className="text-red-500">Failed to load vaccination data. Please try again.</p>
      </div>
    );
  }

  const { coverage, totalChildren, vaccinatedChildren, dueVaccinations } = data?.data ?? {
    coverage: 0,
    totalChildren: 0,
    vaccinatedChildren: 0,
    dueVaccinations: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vaccination</h1>
        <p className="text-sm text-gray-500">Vaccination coverage and due vaccinations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-gray-900">{coverage}%</span>
              <span className="text-sm text-gray-500">
                {vaccinatedChildren} / {totalChildren} children
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-who-blue transition-all"
                style={{ width: `${Math.min(coverage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Due Vaccinations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{dueVaccinations.length}</p>
            <p className="text-sm text-gray-500">vaccinations due</p>
          </CardContent>
        </Card>
      </div>

      {dueVaccinations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No due vaccinations
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {dueVaccinations.map((v) => (
            <Card key={v.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{v.childName}</span>
                    {v.highRisk && (
                      <Badge variant="danger">High Risk</Badge>
                    )}
                    <Badge variant="warning">Due</Badge>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {v.vaccine} &middot; Age: {v.childAge} months &middot; Due:{" "}
                    {new Date(v.dueDate).toLocaleDateString()}
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
