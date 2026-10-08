import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardOverview } from "@/features/dashboard/DashboardOverview";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Operations Command Center"
        description="Comprehensive real-time telemetry, representative call compliance, order booking, and stock analytics for Novis Pharma."
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
