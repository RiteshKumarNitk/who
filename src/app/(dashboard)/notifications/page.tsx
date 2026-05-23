"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import api from "@lib/api";

interface Notification {
  id: string;
  type: "ALERT" | "REMINDER" | "TASK" | "UPDATE" | "WARNING";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
}

const typeBadge: Record<string, "danger" | "warning" | "info" | "success" | "outline"> = {
  ALERT: "danger",
  REMINDER: "warning",
  TASK: "info",
  UPDATE: "success",
  WARNING: "outline",
};

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "ALERT", label: "Alert" },
  { value: "REMINDER", label: "Reminder" },
  { value: "TASK", label: "Task" },
  { value: "UPDATE", label: "Update" },
  { value: "WARNING", label: "Warning" },
];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading, error } = useQuery<NotificationsResponse>({
    queryKey: ["notifications", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (typeFilter) params.append("type", typeFilter);
      const res = await api.get(`/api/notifications?${params}`);
      return res.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/notifications/${id}`, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
        <p className="text-red-500">Failed to load notifications. Please try again.</p>
      </div>
    );
  }

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            isLoading={markAllReadMutation.isPending}
          >
            Mark All Read
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="Filter by type"
          className="w-48"
        />
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No notifications found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={!n.read ? "border-who-blue/30 bg-blue-50/50" : ""}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant={typeBadge[n.type]}>{n.type}</Badge>
                    <span className="font-medium text-gray-900">{n.title}</span>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-who-blue" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{n.body}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.timestamp).toLocaleString()}
                  </p>
                </div>
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markReadMutation.mutate(n.id)}
                    isLoading={markReadMutation.isPending}
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
