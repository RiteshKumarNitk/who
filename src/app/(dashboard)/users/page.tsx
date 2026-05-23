"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Badge } from "@components/ui/Badge";
import { Select } from "@components/ui/Select";
import { Modal } from "@components/ui/Modal";
import api from "@lib/api";
import { useAuthStore } from "@store/auth-store";
import type { UserProfile, UserRole } from "@shared/types";

const ALLOWED_ROLES: UserRole[] = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN"];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles / सभी भूमिकाएँ" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "STATE_ADMIN", label: "State Admin" },
  { value: "DISTRICT_ADMIN", label: "District Admin" },
  { value: "BLOCK_ADMIN", label: "Block Admin" },
  { value: "MOIC", label: "MOIC" },
  { value: "ANM", label: "ANM" },
  { value: "ASHA", label: "ASHA" },
];

const ROLE_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
  SUPER_ADMIN: "danger",
  STATE_ADMIN: "warning",
  DISTRICT_ADMIN: "info",
  BLOCK_ADMIN: "info",
  MOIC: "outline",
  ANM: "success",
  ASHA: "default",
};

interface CreateUserPayload {
  email: string;
  phone: string;
  password: string;
  name: string;
  role: string;
  designation: string;
  employeeCode: string;
}

export default function UsersPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateUserPayload>({
    email: "",
    phone: "",
    password: "",
    name: "",
    role: "ASHA",
    designation: "",
    employeeCode: "",
  });
  const [formError, setFormError] = useState("");

  const role = user?.role ?? "ASHA";
  if (!ALLOWED_ROLES.includes(role)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">आपके पास इस पृष्ठ तक पहुँच नहीं है / You do not have access to this page</p>
      </div>
    );
  }

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/api/users");
      return res.data.data as UserProfile[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const res = await api.post("/api/auth/register", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowCreateModal(false);
      setForm({ email: "", phone: "", password: "", name: "", role: "ASHA", designation: "", employeeCode: "" });
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error?.message || "Failed to create user");
    },
  });

  const filtered = users?.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) {
      setFormError("Email, password, and name are required");
      return;
    }
    createMutation.mutate(form);
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
        <p className="text-red-500">उपयोगकर्ता लोड करने में त्रुटि / Error loading users</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">उपयोगकर्ता / Users</h1>
          <p className="text-sm text-gray-500">Manage system users / सिस्टम उपयोगकर्ताओं का प्रबंधन करें</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>नया उपयोगकर्ता / New User</Button>
      </div>

      <div className="flex gap-2">
        <Select
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-56"
          placeholder="Filter by role / भूमिका द्वारा फ़िल्टर"
        />
        <p className="text-sm text-gray-400 self-center">
          {filtered?.length ?? 0} users / उपयोगकर्ता
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered && filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p>कोई उपयोगकर्ता नहीं मिला / No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-6 py-3">Name / नाम</th>
                    <th className="px-6 py-3">Email / ईमेल</th>
                    <th className="px-6 py-3">Phone / फ़ोन</th>
                    <th className="px-6 py-3">Role / भूमिका</th>
                    <th className="px-6 py-3">Designation</th>
                    <th className="px-6 py-3">Status / स्थिति</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered?.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-gray-600">{u.phone}</td>
                      <td className="px-6 py-4">
                        <Badge variant={ROLE_BADGE[u.role] || "default"}>{u.role}</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.designation || "-"}</td>
                      <td className="px-6 py-4">
                        <Badge variant={u.isActive ? "success" : "danger"}>
                          {u.isActive ? "Active / सक्रिय" : "Inactive / निष्क्रिय"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="नया उपयोगकर्ता बनाएँ / Create New User" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name / पूरा नाम" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email / ईमेल" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Phone / फ़ोन" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Password / पासवर्ड" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Select
              label="Role / भूमिका"
              options={ROLE_OPTIONS.slice(1)}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <Input label="Designation / पद" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            <Input label="Employee Code / कर्मचारी कोड" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} />
          </div>

          {formError && (
            <p className="text-sm text-red-500">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>Cancel / रद्द करें</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Create / बनाएँ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
