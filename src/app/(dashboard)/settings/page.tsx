"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";
import { useCurrentUser, useUserList, useSwitchUser } from "@/hooks";
import { Shield, MapPin, UserCheck, Key } from "lucide-react";

export default function SettingsPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: userList } = useUserList();
  const switchUserMutation = useSwitchUser();

  const userName = currentUser?.name || "Field Operations Manager";
  const userRole = currentUser?.designation || currentUser?.role || "Area Sales Manager";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings & Governance"
        description="Tenant configuration, GPS geofencing radius parameters, centralized authentication session, and data governance controls."
        badge={<Badge variant="default">Tenant: {APP_CONFIG.organization}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Active Session & Auth Governance Card */}
        <Card className="border-sky-200/70 shadow-sm dark:border-sky-900/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-sky-600" aria-hidden="true" />
                Active Authenticated Session
              </span>
              <Badge variant="success" className="text-[10px]">
                {currentUser?.status || "ACTIVE"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Current session security context, user role privileges, and assigned operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Authenticated User</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{userName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Designation / Role</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{userRole}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Email Address</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Employee Code</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{currentUser?.employeeCode || "NP-HQ-01"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Security Clearance</span>
              <span className="font-semibold text-sky-600 dark:text-sky-400">
                {currentUser?.role === "SUPER_ADMIN"
                  ? "Level 5 - Global Full Access"
                  : currentUser?.role === "COMPANY_ADMIN"
                  ? "Level 4 - Commercial & Finance"
                  : "Level 3 - Territory & Field Operations"}
              </span>
            </div>

            {/* Quick Switch Persona for Audit Testing */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 mb-2">Switch Active Persona:</div>
              <div className="flex flex-wrap gap-2">
                {userList?.slice(0, 4).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => switchUserMutation.mutate(u.id)}
                    disabled={u.id === currentUser?.id || switchUserMutation.isPending}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      u.id === currentUser?.id
                        ? "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                    }`}
                  >
                    {u.name?.split(" ")[0]} ({u.role.substring(0, 3)})
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geofence & GPS Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Geofence & GPS Policy
            </CardTitle>
            <CardDescription>
              Geospatial validation thresholds for medical representative calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Maximum Allowed Geofence Radius</span>
              <span className="font-semibold text-emerald-600">50 meters</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">GPS Minimum Accuracy</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Within 50 meters</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Anti-Mock Location Guard</span>
              <Badge variant="success" className="text-[10px]">Strictly Enforced</Badge>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Manual Manager Override</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">Requires Reason Code</span>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Organization Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-600" aria-hidden="true" />
              Tenant Organization Profile
            </CardTitle>
            <CardDescription>
              Primary enterprise identity and regional operations hub
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Organization Name</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{APP_CONFIG.organization}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Tenant Identifier</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{APP_CONFIG.tenantId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Operating Region</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{APP_CONFIG.region}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Hub & Headquarters</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{APP_CONFIG.headquarters}</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Architecture & API Migration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Key className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              Backend API Architecture
            </CardTitle>
            <CardDescription>
              Service encapsulation status & REST endpoint migration readiness
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Service Layer Decoupling</span>
              <Badge variant="success" className="text-[10px]">100% Encapsulated</Badge>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Service Interface Contracts</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Async Typed Promises</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Screen Rewrites Needed for REST</span>
              <span className="font-semibold text-emerald-600">Zero (0) screens</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Data Fetching Library</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">TanStack Query v5</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
