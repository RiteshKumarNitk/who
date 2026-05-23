"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Badge } from "@components/ui/Badge";
import { Select } from "@components/ui/Select";
import api from "@lib/api";
import { useAuthStore } from "@store/auth-store";
import type { SystemConfig } from "@shared/types";

const CATEGORY_OPTIONS = [
  { value: "GENERAL", label: "General / सामान्य" },
  { value: "VACCINATION", label: "Vaccination / टीकाकरण" },
  { value: "DISEASE", label: "Disease / रोग" },
  { value: "SYNC", label: "Sync / सिंक" },
  { value: "NOTIFICATION", label: "Notification / सूचना" },
  { value: "SECURITY", label: "Security / सुरक्षा" },
  { value: "GIS", label: "GIS / जीआईएस" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">आपके पास इस पृष्ठ तक पहुँच नहीं है / You do not have access to this page</p>
      </div>
    );
  }

  const { data: configs, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get("/api/settings");
      return res.data.data as SystemConfig[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await api.put("/api/settings", { key, value });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setEditingKey(null);
      setEditValue("");
    },
  });

  const filtered = configs?.filter((c) => {
    if (categoryFilter && c.category !== categoryFilter) return false;
    return true;
  });

  const startEdit = (config: SystemConfig) => {
    setEditingKey(config.key);
    setEditValue(config.value);
  };

  const saveEdit = () => {
    if (editingKey) {
      updateMutation.mutate({ key: editingKey, value: editValue });
    }
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
        <p className="text-red-500">सेटिंग्स लोड करने में त्रुटि / Error loading settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">सेटिंग्स / Settings</h1>
        <p className="text-sm text-gray-500">System Configuration / सिस्टम कॉन्फ़िगरेशन</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration / कॉन्फ़िगरेशन</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select
                options={[{ value: "", label: "All Categories / सभी श्रेणियाँ" }, ...CATEGORY_OPTIONS]}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-64"
              />
            </div>

            {filtered && filtered.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <p>कोई कॉन्फ़िगरेशन नहीं मिला / No configurations found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered?.map((config) => (
                  <div key={config.key} className="rounded-lg border bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-gray-900">{config.key}</span>
                          <Badge variant="outline">{config.category}</Badge>
                          {config.isEncrypted && (
                            <Badge variant="warning">Encrypted</Badge>
                          )}
                        </div>
                        {config.description && (
                          <p className="mt-1 text-xs text-gray-500">{config.description}</p>
                        )}
                        {editingKey === config.key ? (
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1"
                              autoFocus
                            />
                            <Button size="sm" onClick={saveEdit} isLoading={updateMutation.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-1 font-mono text-sm text-gray-700 break-all">
                            {config.isEncrypted ? "••••••••" : config.value}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(config)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Language / भाषा</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-gray-600">Default interface language / डिफ़ॉल्ट इंटरफ़ेस भाषा</p>
              <Select
                options={LANGUAGE_OPTIONS}
                value={user?.language || "en"}
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync Settings / सिंक सेटिंग्स</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Auto Sync</span>
                <Badge variant="success">Enabled / सक्षम</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Sync Interval</span>
                <span className="font-mono text-gray-600">30 min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Offline Mode</span>
                <Badge variant="info">Available / उपलब्ध</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Map Defaults / मानचित्र डिफ़ॉल्ट</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Default Zoom</span>
                <span className="font-mono text-gray-600">10</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Center Lat</span>
                <span className="font-mono text-gray-600">20.5937</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Center Lng</span>
                <span className="font-mono text-gray-600">78.9629</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Tile Provider</span>
                <span className="font-mono text-gray-600">OpenStreetMap</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
