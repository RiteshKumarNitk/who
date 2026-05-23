"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import api from "@lib/api";
import { LocationPicker } from "@components/maps/LocationPicker";

interface DiseaseCase {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  diseaseType: string;
  status: string;
  severity: string;
  reportedAt: string;
  onsetDate: string;
  address: string;
  symptoms: string[];
  vaccinationStatus: string | null;
  hospitalizationDate: string | null;
  contacts: number;
  outcome: string | null;
}

interface DiseaseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface DiseaseResponse {
  data: DiseaseCase[];
  meta: DiseaseMeta;
}

const severityColors: Record<string, "warning" | "danger" | "info"> = {
  MILD: "warning", MODERATE: "info", SEVERE: "danger", CRITICAL: "danger",
};

const statusColors: Record<string, "warning" | "success" | "info" | "danger"> = {
  SUSPECTED: "warning", PROBABLE: "info", CONFIRMED: "danger",
  RECOVERED: "success", DECEASED: "danger", DISCARDED: "info",
};

const diseaseOptions = [
  { value: "", label: "All Diseases" },
  { value: "DENGUE", label: "Dengue" },
  { value: "MALARIA", label: "Malaria" },
  { value: "CHIKUNGUNYA", label: "Chikungunya" },
  { value: "TYPHOID", label: "Typhoid" },
  { value: "TUBERCULOSIS", label: "Tuberculosis" },
  { value: "AFP", label: "AFP" },
  { value: "MEASLES", label: "Measles" },
  { value: "COVID_19", label: "COVID-19" },
  { value: "CHOLERA", label: "Cholera" },
  { value: "OTHER", label: "Other" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "SUSPECTED", label: "Suspected" },
  { value: "PROBABLE", label: "Probable" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "RECOVERED", label: "Recovered" },
  { value: "DECEASED", label: "Deceased" },
];

interface CaseForm {
  id?: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  diseaseType: string;
  severity: string;
  status: string;
  symptoms: string;
  onsetDate: string;
  address: string;
  vaccinationStatus: string;
  hospitalizationDate: string;
  contacts: string;
  latitude: string;
  longitude: string;
}

const emptyForm: CaseForm = {
  patientName: "", patientAge: "", patientGender: "", diseaseType: "",
  severity: "MILD", status: "SUSPECTED", symptoms: "", onsetDate: "",
  address: "", vaccinationStatus: "", hospitalizationDate: "", contacts: "0",
  latitude: "", longitude: "",
};

export default function DiseasePage() {
  const queryClient = useQueryClient();
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CaseForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const queryParams = new URLSearchParams({ limit: "20", page: String(page) });
  if (diseaseFilter) queryParams.append("diseaseType", diseaseFilter);
  if (statusFilter) queryParams.append("status", statusFilter);
  if (dateFrom) queryParams.append("dateFrom", dateFrom);
  if (dateTo) queryParams.append("dateTo", dateTo);

  const { data, isLoading, error } = useQuery<DiseaseResponse>({
    placeholderData: (prev) => prev,
    queryKey: ["disease", diseaseFilter, statusFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      const res = await api.get(`/api/disease?${queryParams}`);
      return res.data;
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (formData: CaseForm) => {
      const payload: any = { ...formData };
      payload.patientAge = parseInt(formData.patientAge, 10) || 0;
      payload.contacts = parseInt(formData.contacts, 10) || 0;
      payload.symptoms = formData.symptoms.split(",").map((s) => s.trim()).filter(Boolean);
      if (!payload.symptoms.length) delete payload.symptoms;
      if (!payload.onsetDate) delete payload.onsetDate;
      if (!payload.hospitalizationDate) delete payload.hospitalizationDate;
      if (!payload.latitude || !payload.longitude) {
        delete payload.latitude;
        delete payload.longitude;
      }
      if (!payload.vaccinationStatus) delete payload.vaccinationStatus;

      if (formData.id) {
        const res = await api.patch(`/api/disease/${formData.id}`, payload);
        return res.data;
      }
      const res = await api.post("/api/disease", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disease"] });
      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const openEdit = (c: DiseaseCase) => {
    setForm({
      id: c.id,
      patientName: c.patientName,
      patientAge: String(c.patientAge),
      patientGender: c.patientGender,
      diseaseType: c.diseaseType,
      severity: c.severity,
      status: c.status,
      symptoms: (c.symptoms || []).join(", "),
      onsetDate: c.onsetDate ? c.onsetDate.slice(0, 10) : "",
      address: c.address || "",
      vaccinationStatus: c.vaccinationStatus || "",
      hospitalizationDate: c.hospitalizationDate ? c.hospitalizationDate.slice(0, 10) : "",
      contacts: String(c.contacts || 0),
      latitude: "", longitude: "",
    });
    setEditingId(c.id);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

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
        <p className="text-red-500">Failed to load disease data. Please try again.</p>
      </div>
    );
  }

  const cases = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disease Cases</h1>
          <p className="text-sm text-gray-500">Track, report, and manage disease cases</p>
        </div>
        <Button onClick={openCreate}>Report New Case</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={diseaseFilter}
          onChange={(e) => { setDiseaseFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-who-blue focus:outline-none"
        >
          {diseaseOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-who-blue focus:outline-none"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-who-blue focus:outline-none"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-who-blue focus:outline-none"
          title="To date"
        />
        {(diseaseFilter || statusFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setDiseaseFilter(""); setStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            Clear filters
          </button>
        )}
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No disease cases found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{c.patientName}</span>
                    <Badge variant={severityColors[c.severity] || "warning"}>{c.severity}</Badge>
                    <Badge variant={statusColors[c.status] || "info"}>{c.status}</Badge>
                    <Badge variant="info">{c.diseaseType}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {c.patientGender && c.patientGender !== "OTHER" ? (c.patientGender === "MALE" ? "Male" : "Female") : ""}{c.patientGender ? ", " : ""}{c.patientAge} yrs
                    &middot; Reported: {new Date(c.reportedAt).toLocaleDateString()}
                    {c.onsetDate && <> &middot; Onset: {new Date(c.onsetDate).toLocaleDateString()}</>}
                    {c.address && <> &middot; {c.address}</>}
                  </div>
                  {(c.symptoms?.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.symptoms.map((s, i) => (
                        <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="secondary" size="sm" onClick={() => openEdit(c)} className="ml-4">Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
          <div className="text-sm text-gray-600">
            Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!data.meta.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!data.meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingId(null); setForm(emptyForm); }}
        title={editingId ? "Edit Case" : "Report New Case"}
        size="lg"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); reportMutation.mutate(form); }}
          className="space-y-4"
        >
          <Input
            label="Patient Name"
            value={form.patientName}
            onChange={(e) => setForm({ ...form, patientName: e.target.value })}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Age (years)"
              type="number"
              min="0"
              max="120"
              value={form.patientAge}
              onChange={(e) => setForm({ ...form, patientAge: e.target.value })}
              required
            />
            <select
              value={form.patientGender}
              onChange={(e) => setForm({ ...form, patientGender: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-who-blue focus:outline-none"
              required
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={form.diseaseType}
              onChange={(e) => setForm({ ...form, diseaseType: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-who-blue focus:outline-none"
              required
            >
              <option value="">Select disease</option>
              {diseaseOptions.slice(1).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-who-blue focus:outline-none"
            >
              <option value="MILD">Mild</option>
              <option value="MODERATE">Moderate</option>
              <option value="SEVERE">Severe</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-who-blue focus:outline-none"
            >
              <option value="SUSPECTED">Suspected</option>
              <option value="PROBABLE">Probable</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="RECOVERED">Recovered</option>
              <option value="DECEASED">Deceased</option>
              <option value="DISCARDED">Discarded</option>
            </select>
          </div>
          <Input
            label="Symptoms (comma-separated, e.g. fever, cough, headache)"
            value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Onset Date"
              type="date"
              value={form.onsetDate}
              onChange={(e) => setForm({ ...form, onsetDate: e.target.value })}
            />
            <Input
              label="Hospitalization Date"
              type="date"
              value={form.hospitalizationDate}
              onChange={(e) => setForm({ ...form, hospitalizationDate: e.target.value })}
            />
          </div>
          <Input
            label="Address / Location"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Number of contacts"
              type="number"
              min="0"
              value={form.contacts}
              onChange={(e) => setForm({ ...form, contacts: e.target.value })}
            />
            <select
              value={form.vaccinationStatus}
              onChange={(e) => setForm({ ...form, vaccinationStatus: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-who-blue focus:outline-none"
            >
              <option value="">Vaccination status</option>
              <option value="VACCINATED">Vaccinated</option>
              <option value="PARTIALLY">Partially vaccinated</option>
              <option value="UNVACCINATED">Unvaccinated</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setForm(emptyForm); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={reportMutation.isPending}>
              {editingId ? "Update Case" : "Submit Report"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
