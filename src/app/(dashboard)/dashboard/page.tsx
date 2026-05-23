"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { MapView } from "@components/maps/MapView";
import api from "@lib/api";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/api/analytics");
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-who-blue border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { label: "ASHA Areas", labelHi: "आशा क्षेत्र", value: stats?.totalAshAreas ?? 0, sub: `${stats?.mappedAshAreas ?? 0} mapped`, color: "blue" },
    { label: "Households", labelHi: "परिवार", value: stats?.totalHouseholds ?? 0, sub: `${stats?.surveyedHouseholds ?? 0} surveyed`, color: "green" },
    { label: "Children", labelHi: "बच्चे", value: stats?.totalChildren ?? 0, sub: `${stats?.vaccinatedChildren ?? 0} vaccinated`, color: "purple" },
    { label: "Vaccination", labelHi: "टीकाकरण", value: `${stats?.vaccinationCoverage ?? 0}%`, sub: "coverage", color: "amber" },
    { label: "Disease Cases", labelHi: "रोग के मामले", value: stats?.activeDiseaseCases ?? 0, sub: `${stats?.diseaseClusters ?? 0} active clusters`, color: "red" },
    { label: "Pending", labelHi: "लंबित", value: stats?.pendingSurveys ?? 0, sub: `${stats?.overdueVaccinations ?? 0} overdue vaccines`, color: "orange" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Public Health GIS Surveillance Overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.label} className="text-center">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>GIS Overview Map</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <MapView interactive showBoundaries />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { href: "/gis", label: "View GIS Map", labelHi: "जीआईएस मानचित्र देखें" },
              { href: "/surveys", label: "New Survey", labelHi: "नया सर्वेक्षण" },
              { href: "/disease", label: "Report Disease", labelHi: "रोग की रिपोर्ट करें" },
              { href: "/vaccination", label: "Record Vaccination", labelHi: "टीकाकरण रिकॉर्ड करें" },
              { href: "/households", label: "Add Household", labelHi: "परिवार जोड़ें" },
            ].map((action) => (
              <a key={action.href} href={action.href} className="block rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-who-blue transition-colors hover:bg-who-blue hover:text-white">
                {action.label}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
