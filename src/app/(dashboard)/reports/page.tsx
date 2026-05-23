"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import api from "@lib/api";
import { useAuthStore } from "@store/auth-store";
import type { UserRole } from "@shared/types";

const ALLOWED_ROLES: UserRole[] = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN"];

const REPORT_TYPES = [
  { value: "vaccination", label: "Vaccination Coverage / टीकाकरण कवरेज" },
  { value: "disease", label: "Disease Trends / रोग के रुझान" },
  { value: "asha", label: "ASHA Performance / आशा प्रदर्शन" },
  { value: "household", label: "Household Survey / घरेलू सर्वेक्षण" },
  { value: "comprehensive", label: "Comprehensive / व्यापक" },
];

const FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
];

interface ReportCard {
  title: string;
  titleHi: string;
  value: string | number;
  sub: string;
  subHi: string;
  color: "blue" | "green" | "purple" | "amber" | "red" | "orange";
}

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const [reportType, setReportType] = useState("vaccination");
  const [format, setFormat] = useState("pdf");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const role = user?.role ?? "ASHA";
  if (!ALLOWED_ROLES.includes(role)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">आपके पास इस पृष्ठ तक पहुँच नहीं है / You do not have access to this page</p>
      </div>
    );
  }

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["report-analytics", reportType],
    queryFn: async () => {
      const res = await api.get("/api/analytics", {
        params: { type: reportType, dateFrom, dateTo },
      });
      return res.data.data;
    },
  });

  const handleGenerate = () => {
    const params = new URLSearchParams({
      type: reportType,
      format,
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });
    window.open(`/api/reports/generate?${params.toString()}`, "_blank");
  };

  const reportCards: Record<string, ReportCard[]> = {
    vaccination: [
      { title: "Vaccination Coverage", titleHi: "टीकाकरण कवरेज", value: `${analytics?.vaccinationCoverage ?? 0}%`, sub: "overall coverage", subHi: "समग्र कवरेज", color: "blue" },
      { title: "Children Vaccinated", titleHi: "टीकाकृत बच्चे", value: analytics?.vaccinatedChildren ?? 0, sub: "total vaccinated", subHi: "कुल टीकाकृत", color: "green" },
      { title: "Missed Doses", titleHi: "छूटी खुराकें", value: analytics?.missedDoses ?? 0, sub: "overdue vaccinations", subHi: "अतिदेय टीकाकरण", color: "red" },
      { title: "Session Completed", titleHi: "पूर्ण सत्र", value: analytics?.completedSessions ?? 0, sub: "vaccination sessions", subHi: "टीकाकरण सत्र", color: "purple" },
    ],
    disease: [
      { title: "Active Cases", titleHi: "सक्रिय मामले", value: analytics?.activeDiseaseCases ?? 0, sub: "currently active", subHi: "वर्तमान में सक्रिय", color: "red" },
      { title: "Disease Clusters", titleHi: "रोग समूह", value: analytics?.diseaseClusters ?? 0, sub: "active clusters", subHi: "सक्रिय समूह", color: "orange" },
      { title: "Cases Resolved", titleHi: "हल किए गए मामले", value: analytics?.resolvedCases ?? 0, sub: "recovered/resolved", subHi: "ठीक/हल", color: "green" },
      { title: "Under Investigation", titleHi: "जांचाधीन", value: analytics?.underInvestigation ?? 0, sub: "suspected cases", subHi: "संदिग्ध मामले", color: "amber" },
    ],
    asha: [
      { title: "ASHA Workers", titleHi: "आशा कार्यकर्ता", value: analytics?.totalAsha ?? 0, sub: "total workers", subHi: "कुल कार्यकर्ता", color: "blue" },
      { title: "Areas Mapped", titleHi: "मैप किए गए क्षेत्र", value: analytics?.mappedAreas ?? 0, sub: "boundaries completed", subHi: "सीमाएँ पूर्ण", color: "green" },
      { title: "Surveys Done", titleHi: "किए गए सर्वेक्षण", value: analytics?.surveysCompleted ?? 0, sub: "this period", subHi: "इस अवधि में", color: "purple" },
      { title: "Pending Tasks", titleHi: "लंबित कार्य", value: analytics?.pendingTasks ?? 0, sub: "pending assignments", subHi: "लंबित कार्यभार", color: "orange" },
    ],
    household: [
      { title: "Households", titleHi: "परिवार", value: analytics?.totalHouseholds ?? 0, sub: "total surveyed", subHi: "कुल सर्वेक्षित", color: "blue" },
      { title: "Survey Coverage", titleHi: "सर्वेक्षण कवरेज", value: `${analytics?.surveyCoverage ?? 0}%`, sub: "completion rate", subHi: "पूर्णता दर", color: "green" },
      { title: "Below Poverty Line", titleHi: "गरीबी रेखा से नीचे", value: analytics?.bplHouseholds ?? 0, sub: "BPL families", subHi: "बीपीएल परिवार", color: "amber" },
      { title: "Children per HH", titleHi: "प्रति परिवार बच्चे", value: analytics?.avgChildrenPerHh ?? 0, sub: "average", subHi: "औसत", color: "purple" },
    ],
    comprehensive: [
      { title: "Total Coverage", titleHi: "कुल कवरेज", value: `${analytics?.vaccinationCoverage ?? 0}%`, sub: "vaccination", subHi: "टीकाकरण", color: "blue" },
      { title: "Disease Burden", titleHi: "रोग बोझ", value: analytics?.activeDiseaseCases ?? 0, sub: "active cases", subHi: "सक्रिय मामले", color: "red" },
      { title: "ASHA Performance", titleHi: "आशा प्रदर्शन", value: analytics?.ashaPerformance ?? "N/A", sub: "efficiency score", subHi: "दक्षता स्कोर", color: "green" },
      { title: "Survey Progress", titleHi: "सर्वेक्षण प्रगति", value: `${analytics?.surveyProgress ?? 0}%`, sub: "completion", subHi: "पूर्णता", color: "purple" },
    ],
  };

  const cards = reportCards[reportType] || reportCards.vaccination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">रिपोर्ट्स / Reports</h1>
        <p className="text-sm text-gray-500">Generate and view reports / रिपोर्ट तैयार करें और देखें</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters / रिपोर्ट फ़िल्टर</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <Select
              label="Report Type / रिपोर्ट प्रकार"
              options={REPORT_TYPES}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-64"
            />
            <Select
              label="Format / प्रारूप"
              options={FORMAT_OPTIONS}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-40"
            />
            <Input
              label="From / से"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-44"
            />
            <Input
              label="To / तक"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-44"
            />
            <Button onClick={handleGenerate} size="lg">
              Generate Report / रिपोर्ट बनाएँ
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-who-blue border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.title} className="text-center">
                <p className="text-xs text-gray-500">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
                <p className="text-xs text-gray-300">{card.subHi}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sample Report Preview / नमूना रिपोर्ट पूर्वावलोकन</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                      <th className="px-4 py-3">Indicator / संकेतक</th>
                      <th className="px-4 py-3">Value / मान</th>
                      <th className="px-4 py-3">Target / लक्ष्य</th>
                      <th className="px-4 py-3">Achievement / उपलब्धि</th>
                      <th className="px-4 py-3">Status / स्थिति</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { indicator: "Vaccination Coverage / टीकाकरण कवरेज", value: `${analytics?.vaccinationCoverage ?? 0}%`, target: "90%", pct: analytics?.vaccinationCoverage ?? 0 },
                      { indicator: "Survey Completion / सर्वेक्षण पूर्णता", value: `${analytics?.surveyProgress ?? 0}%`, target: "100%", pct: analytics?.surveyProgress ?? 0 },
                      { indicator: "Disease Reporting / रोग रिपोर्टिंग", value: `${analytics?.diseaseReportingRate ?? 0}%`, target: "95%", pct: analytics?.diseaseReportingRate ?? 0 },
                      { indicator: "ASHA Activity / आशा गतिविधि", value: `${analytics?.ashaActivityRate ?? 0}%`, target: "85%", pct: analytics?.ashaActivityRate ?? 0 },
                    ].map((row) => (
                      <tr key={row.indicator} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.indicator}</td>
                        <td className="px-4 py-3 text-gray-600">{row.value}</td>
                        <td className="px-4 py-3 text-gray-600">{row.target}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                              <div className={`h-full rounded-full ${row.pct >= 90 ? "bg-green-500" : row.pct >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{row.pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={row.pct >= 90 ? "success" : row.pct >= 70 ? "warning" : "danger"}>
                            {row.pct >= 90 ? "On Track" : row.pct >= 70 ? "Attention" : "Behind"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
