"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardOverview } from "@/features/dashboard/DashboardOverview";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks";
import { normalizeRole } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const canonicalRole = normalizeRole(currentUser?.role);

  useEffect(() => {
    if (!isLoading && canonicalRole === "SUPER_ADMIN") {
      router.replace("/companies");
    } else if (!isLoading && canonicalRole === "MR") {
      router.replace("/visits");
    }
  }, [canonicalRole, isLoading, router]);

  if (isLoading || canonicalRole === "SUPER_ADMIN" || canonicalRole === "MR") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Operations Command Center"
        description="Comprehensive real-time telemetry, representative call compliance, order booking, and stock analytics across authorized territories."
        badge={
          <Badge variant="success" className="gap-1 px-2.5 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </Badge>
        }
      />

      <DashboardOverview />
    </div>
  );
}
