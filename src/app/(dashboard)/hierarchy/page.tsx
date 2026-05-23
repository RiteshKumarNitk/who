"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import api from "@lib/api";
import { useAuthStore } from "@store/auth-store";
import type { State, District, Block, PlanningUnit, ANM, ASHA, UserRole } from "@shared/types";

const ALLOWED_ROLES: UserRole[] = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN"];

interface TreeNode {
  id: string;
  name: string;
  nameHi: string;
  code: string;
  population?: number;
  type: string;
  children?: TreeNode[];
  collapsed: boolean;
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PopulationIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LevelBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    STATE: "bg-blue-100 text-blue-800",
    DISTRICT: "bg-indigo-100 text-indigo-800",
    BLOCK: "bg-purple-100 text-purple-800",
    PLANNING_UNIT: "bg-pink-100 text-pink-800",
    ANM: "bg-amber-100 text-amber-800",
    ASHA: "bg-green-100 text-green-800",
  };
  const labels: Record<string, string> = {
    STATE: "State",
    DISTRICT: "District",
    BLOCK: "Block",
    PLANNING_UNIT: "PU",
    ANM: "ANM",
    ASHA: "ASHA",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] || "bg-gray-100 text-gray-800"}`}>
      {labels[type] || type}
    </span>
  );
}

export default function HierarchyPage() {
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const role = user?.role ?? "ASHA";
  if (!ALLOWED_ROLES.includes(role)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">आपके पास इस पृष्ठ तक पहुँच नहीं है / You do not have access to this page</p>
      </div>
    );
  }

  const { data: statesRes, isLoading, error } = useQuery({
    queryKey: ["hierarchy-states", page],
    queryFn: async () => {
      const res = await api.get(`/api/hierarchy/states?page=${page}&limit=50`);
      return res.data as { data: State[]; meta: { page: number; totalPages: number; total: number; hasNext: boolean; hasPrevious: boolean } };
    },
  });

  const states = statesRes?.data;
  const meta = statesRes?.meta;

  const childTypeMap: Record<string, string> = {
    STATE: "DISTRICT",
    DISTRICT: "BLOCK",
    BLOCK: "PLANNING_UNIT",
    PLANNING_UNIT: "ANM",
    ANM: "ASHA",
  };

  const typeMap: Record<string, string> = {
    STATE: "states",
    DISTRICT: "districts",
    BLOCK: "blocks",
    PLANNING_UNIT: "planning-units",
    ANM: "anms",
    ASHA: "ashas",
  };

  const drillQuery = (parentType: string, parentId: string) =>
    useQuery({
      queryKey: ["hierarchy", parentType, parentId],
      queryFn: async () => {
        const path = typeMap[parentType] || `${parentType.toLowerCase()}s`;
        const res = await api.get(`/api/hierarchy/${path}/${parentId}/children`);
        return res.data.data as (District | Block | PlanningUnit | ANM | ASHA)[];
      },
      enabled: !collapsed[parentId] && !!childTypeMap[parentType],
    });

  function DrillDown({ parentType, parentId }: { parentType: string; parentId: string }) {
    const { data: children, isLoading: loading } = drillQuery(parentType, parentId);

    if (loading) {
      return (
        <div className="ml-8 py-2 text-sm text-gray-400">
          Loading...
        </div>
      );
    }

    if (!children || children.length === 0) return null;

    const childType = childTypeMap[parentType];

    return (
      <div className="ml-8 border-l-2 border-gray-200 pl-4">
        {children.map((child) => {
          const c = child as any;
          const nodeId = c.id;
          const isCollapsed = collapsed[nodeId];
          const isActive = activeId === nodeId;

          return (
            <div key={nodeId}>
              <div
                className={`my-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100 ${isActive ? "bg-who-blue/10" : ""}`}
                onClick={() => {
                  setCollapsed((prev) => ({ ...prev, [nodeId]: !isCollapsed }));
                  setActiveId(nodeId);
                }}
              >
                {childType ? (
                  isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <div className="w-3.5" />
                )}
                <LevelBadge type={childType || parentType} />
                <span className="font-medium text-gray-900">{c.name}</span>
                {c.nameHindi && <span className="text-gray-400">({c.nameHindi})</span>}
                {c.code && <span className="text-xs text-gray-400">{c.code}</span>}
                {c.population != null && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                    <PopulationIcon />
                    {c.population.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {!isCollapsed && childType && <DrillDown parentType={childType} parentId={nodeId} />}
            </div>
          );
        })}
      </div>
    );
  }

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
        <p className="text-red-500">डेटा लोड करने में त्रुटि / Error loading data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">प्रशासनिक पदानुक्रम / Administrative Hierarchy</h1>
        <p className="text-sm text-gray-500">States, Districts, Blocks, Planning Units, ANMs & ASHAs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hierarchy Tree / पदानुक्रम वृक्ष</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <LevelBadge type="STATE" />
              <span>Click to expand</span>
            </div>
            {states && states.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <p>कोई राज्य उपलब्ध नहीं / No states available</p>
              </div>
            ) : (
              states?.map((state) => {
                const isCollapsed = collapsed[state.id];
                const isActive = activeId === state.id;
                return (
                  <div key={state.id}>
                    <div
                      className={`my-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100 ${isActive ? "bg-who-blue/10" : ""}`}
                      onClick={() => {
                        setCollapsed((prev) => ({ ...prev, [state.id]: !isCollapsed }));
                        setActiveId(state.id);
                      }}
                    >
                      {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      <LevelBadge type="STATE" />
                      <span className="font-medium text-gray-900">{state.name}</span>
                      <span className="text-gray-400">({state.nameHindi})</span>
                      <span className="text-xs text-gray-400">{state.code}</span>
                      <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                        <PopulationIcon />
                        {state.population.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {!isCollapsed && <DrillDown parentType="STATE" parentId={state.id} />}
                  </div>
                );
              })
            )}
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between rounded-lg border bg-white px-4 py-3">
              <div className="text-sm text-gray-600">
                Page {meta.page} of {meta.totalPages} ({meta.total} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasPrevious}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
