"use client";

import React, { useState } from "react";
import {
  Users,
  CalendarCheck,
  ShoppingCart,
  Receipt,
  MapPin,
  AlertTriangle,
  RotateCw,
  Building,
  Radio,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  TrendingDown,
  PhoneCall,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardData } from "@/hooks";
import { useFilterStore } from "@/store";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { DonutChart } from "@/components/ui/charts/DonutChart";
import { HorizontalBarChart } from "@/components/ui/charts/BarChart";
import { TargetGauge } from "@/components/ui/charts/TargetGauge";
import { formatCurrency, formatDate } from "@/lib/utils";

export function DashboardOverview() {
  const queryClient = useQueryClient();
  const { selectedTerritoryId } = useFilterStore();
  const { data, isLoading, isFetching } = useDashboardData(selectedTerritoryId);

  // Active view tabs for deep dives
  const [activeAttentionTab, setActiveAttentionTab] = useState<
    "ALL" | "BELOW_TARGET" | "MISSED_VISITS" | "STOCKOUTS" | "PENDING_COMMERCIAL"
  >("ALL");

  const [activeDimensionTab, setActiveDimensionTab] = useState<
    "TEAM" | "ACTIVITY" | "COMMERCIAL" | "PRODUCTS"
  >("TEAM");

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const {
    kpis,
    territorySummary,
    fieldForceSummary,
    recentVisits,
    recentOrders,
    attentionCenter,
  } = data;

  // Chart data for call status breakdown
  const callStatusSegments = [
    {
      label: "Completed Calls",
      value: kpis.calls.completedToday,
      percentage: Math.round((kpis.calls.completedToday / (kpis.calls.plannedToday || 1)) * 100),
      color: "emerald",
      hexColor: "#10b981",
    },
    {
      label: "In-Progress Detailing",
      value: kpis.calls.inProgressToday,
      percentage: Math.round((kpis.calls.inProgressToday / (kpis.calls.plannedToday || 1)) * 100),
      color: "sky",
      hexColor: "#0284c7",
    },
    {
      label: "Planned Remaining",
      value: Math.max(
        0,
        kpis.calls.plannedToday - kpis.calls.completedToday - kpis.calls.inProgressToday - kpis.calls.missedToday
      ),
      percentage: Math.round(
        (Math.max(
          0,
          kpis.calls.plannedToday - kpis.calls.completedToday - kpis.calls.inProgressToday - kpis.calls.missedToday
        ) /
          (kpis.calls.plannedToday || 1)) *
          100
      ),
      color: "slate",
      hexColor: "#94a3b8",
    },
    {
      label: "Missed Calls",
      value: kpis.calls.missedToday,
      percentage: Math.round((kpis.calls.missedToday / (kpis.calls.plannedToday || 1)) * 100),
      color: "rose",
      hexColor: "#ef4444",
    },
  ];

  // Chart data for product availability
  const productAvailabilitySegments = [
    {
      label: "Fully Available",
      value: kpis.inventory.availableCount,
      percentage: kpis.inventory.availabilityRate,
      color: "emerald",
      hexColor: "#10b981",
    },
    {
      label: "Low Stock Alert",
      value: kpis.inventory.lowStockCount,
      percentage: Math.round((kpis.inventory.lowStockCount / (kpis.inventory.auditsToday || 1)) * 100),
      color: "amber",
      hexColor: "#f59e0b",
    },
    {
      label: "Critical Out of Stock",
      value: kpis.inventory.outOfStockCount,
      percentage: Math.round((kpis.inventory.outOfStockCount / (kpis.inventory.auditsToday || 1)) * 100),
      color: "rose",
      hexColor: "#ef4444",
    },
  ];

  // Chart data for Collections by Mode
  const collectionsModeSegments = kpis.commercial.collectionsByMode.map((m) => ({
    label: m.mode,
    value: m.count,
    percentage: m.percentage,
    color: m.mode === "UPI" ? "sky" : m.mode === "CHEQUE" ? "amber" : "emerald",
    hexColor:
      m.mode === "UPI"
        ? "#0284c7"
        : m.mode === "CHEQUE"
        ? "#f59e0b"
        : m.mode === "BANK_TRANSFER"
        ? "#8b5cf6"
        : "#10b981",
  }));

  // Top stockout products horizontal bar chart items
  const stockoutBarItems = kpis.inventory.topStockoutProducts.map((p) => ({
    label: p.productName,
    value: p.stockoutCount,
    formattedValue: `${p.stockoutCount} Pharmacies`,
    color: "bg-rose-500",
  }));

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 0. Live Telemetry Status Banner & Action Toolbar            */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-sky-50 via-white to-indigo-50/50 p-4 rounded-xl border border-sky-100 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Novis Pharma Operations Hub</span>
              <span className="text-slate-300">•</span>
              <span className="text-sky-700 dark:text-sky-400 font-semibold">
                Tamil Nadu Territory Active Telemetry
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {kpis.fieldForce.inFieldNow} In-Clinic Detailing • {kpis.fieldForce.travelingNow} En Route • {kpis.calls.completedToday} Calls Finalized Today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="text-xs gap-1.5 bg-white dark:bg-slate-950"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Sync Live Telemetry</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => window.print()}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export DCR & Alerts</span>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. Core 5-Question KPI Row (Answers questions 1 to 5 at a glance) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Q1: Where is my team? */}
        <MetricCard
          title="1. Where Is My Team?"
          value={`${kpis.fieldForce.inFieldNow + kpis.fieldForce.travelingNow} / ${kpis.fieldForce.total}`}
          description={`${kpis.fieldForce.inFieldNow} In-Call • ${kpis.fieldForce.travelingNow} Traveling`}
          icon={Users}
          iconColor="sky"
          trend={{ value: "100% On-Duty", isPositive: true }}
        />

        {/* Q2: What did they do? */}
        <MetricCard
          title="2. What Did They Do?"
          value={`${kpis.calls.complianceRate}%`}
          description={`${kpis.calls.completedToday} of ${kpis.calls.plannedToday} completed (${kpis.calls.gpsComplianceRate}% GPS OK)`}
          icon={CalendarCheck}
          iconColor="emerald"
          progress={{ value: kpis.calls.complianceRate, label: "Call Plan Completed" }}
        />

        {/* Q3: What happened commercially? */}
        <MetricCard
          title="3. Commercial Revenue"
          value={formatCurrency(kpis.commercial.totalOrderValue)}
          description={`${kpis.commercial.ordersBookedCount} Orders • ${formatCurrency(kpis.commercial.totalCollectionsValue)} Collected`}
          icon={ShoppingCart}
          iconColor="indigo"
          trend={{ value: `+${formatCurrency(kpis.commercial.pendingOrdersValue)} Pending`, isPositive: true }}
        />

        {/* Q4: Where are products? */}
        <MetricCard
          title="4. Product Availability"
          value={`${kpis.inventory.availabilityRate}%`}
          description={`${kpis.inventory.availableCount} OK • ${kpis.inventory.outOfStockCount} Out-of-Stock`}
          icon={Building}
          iconColor="amber"
          trend={{
            value: `${kpis.inventory.outOfStockCount} Stockouts`,
            isPositive: kpis.inventory.outOfStockCount === 0,
          }}
        />

        {/* Q5: What needs attention? */}
        <MetricCard
          title="5. Needs Attention"
          value={`${attentionCenter.totalAlertsCount} Alerts`}
          description={`${attentionCenter.belowTargetMRs.length} Lagging MRs • ${attentionCenter.missedVisits.length} Missed Calls`}
          icon={AlertTriangle}
          iconColor="rose"
          trend={{
            value: attentionCenter.totalAlertsCount > 0 ? "Action Required" : "All Clear",
            isPositive: attentionCenter.totalAlertsCount === 0,
          }}
        />
      </div>

      {/* ============================================================ */}
      {/* 2. "WHAT NEEDS ATTENTION?" (Critical Alerts Matrix)          */}
      {/* ============================================================ */}
      <Card className="border-rose-200/80 bg-rose-50/20 dark:border-rose-950 dark:bg-rose-950/10">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <CardTitle className="text-base font-bold text-rose-900 dark:text-rose-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                Manager Attention & Triage Board
              </CardTitle>
              <Badge variant="destructive" className="ml-1 text-xs">
                {attentionCenter.totalAlertsCount} Active Items
              </Badge>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Immediate operational exceptions requiring manager intervention: below-target pacing, missed visits, retail stockouts, and pending approvals.
            </CardDescription>
          </div>

          {/* Alert Filter Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3 sm:mt-0">
            <Button
              variant={activeAttentionTab === "ALL" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 px-2.5"
              onClick={() => setActiveAttentionTab("ALL")}
            >
              All ({attentionCenter.totalAlertsCount})
            </Button>
            <Button
              variant={activeAttentionTab === "BELOW_TARGET" ? "destructive" : "outline"}
              size="sm"
              className="text-xs h-7 px-2.5"
              onClick={() => setActiveAttentionTab("BELOW_TARGET")}
            >
              Below-Target MRs ({attentionCenter.belowTargetMRs.length})
            </Button>
            <Button
              variant={activeAttentionTab === "MISSED_VISITS" ? "destructive" : "outline"}
              size="sm"
              className="text-xs h-7 px-2.5"
              onClick={() => setActiveAttentionTab("MISSED_VISITS")}
            >
              Missed Visits ({attentionCenter.missedVisits.length})
            </Button>
            <Button
              variant={activeAttentionTab === "STOCKOUTS" ? "destructive" : "outline"}
              size="sm"
              className="text-xs h-7 px-2.5"
              onClick={() => setActiveAttentionTab("STOCKOUTS")}
            >
              Stockouts ({attentionCenter.criticalStockouts.length})
            </Button>
            <Button
              variant={activeAttentionTab === "PENDING_COMMERCIAL" ? "destructive" : "outline"}
              size="sm"
              className="text-xs h-7 px-2.5"
              onClick={() => setActiveAttentionTab("PENDING_COMMERCIAL")}
            >
              Pending Commercial ({attentionCenter.pendingCommercial.length})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* A. Below Target MRs */}
          {(activeAttentionTab === "ALL" || activeAttentionTab === "BELOW_TARGET") &&
            attentionCenter.belowTargetMRs.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-white p-4 dark:border-rose-900 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      Below-Target Medical Representatives (Monthly Sales & Daily Call Shortfalls)
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    {attentionCenter.belowTargetMRs.length} Behind Quota Pacing
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {attentionCenter.belowTargetMRs.map((mr) => (
                    <div
                      key={mr.mrId}
                      className="rounded-lg border border-slate-200/90 bg-white p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-50">
                            {mr.mrName}
                          </div>
                          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{mr.territoryName}</div>
                        </div>
                        <Badge
                          variant={mr.severity === "HIGH" ? "destructive" : "warning"}
                          className="text-[10px]"
                        >
                          {mr.achievementPercent}% Quota
                        </Badge>
                      </div>

                      <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Today Calls:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {mr.callsCompletedToday} / {mr.callsPlannedToday} calls
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Shortfall:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(mr.shortfallAmount)}
                        </span>
                      </div>

                      <div className="pt-1 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-[11px] h-7 bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                          onClick={() => alert(`Reviewing itinerary for ${mr.mrName}`)}
                        >
                          <PhoneCall className="h-3 w-3 mr-1" />
                          Nudge Rep
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* B. Missed Visits Alert */}
          {(activeAttentionTab === "ALL" || activeAttentionTab === "MISSED_VISITS") &&
            attentionCenter.missedVisits.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-900 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Missed Physician Visits (Doctor Call Non-Compliance)
                    </span>
                  </div>
                  <Badge variant="warning" className="text-[10px]">
                    {attentionCenter.missedVisits.length} Missed Calls Today
                  </Badge>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attentionCenter.missedVisits.map((v) => (
                    <div key={v.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {v.doctorName} ({v.specialty})
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          Assigned MR: {v.mrName} • {v.territoryName} • Slot: {v.scheduledTime}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px]">
                          MISSED CALL
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => alert(`Rescheduling missed call for ${v.doctorName}`)}
                        >
                          Reschedule Call
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* C. Critical Pharmacy Stockouts */}
          {(activeAttentionTab === "ALL" || activeAttentionTab === "STOCKOUTS") &&
            attentionCenter.criticalStockouts.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-white p-4 dark:border-rose-900 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      Out-of-Stock Products at Key Retail Pharmacies
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    Immediate Stockist Refill Required
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {attentionCenter.criticalStockouts.map((stock) => (
                    <div
                      key={stock.id}
                      className="rounded-lg border border-rose-100 bg-rose-50/40 p-3 space-y-1 dark:border-rose-950 dark:bg-rose-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-rose-900 dark:text-rose-200">
                          {stock.productName}
                        </span>
                        <Badge variant="destructive" className="text-[9px]">
                          OUT OF STOCK
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {stock.pharmacyName}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex justify-between pt-1">
                        <span>{stock.territoryName}</span>
                        <span>Audited by {stock.auditedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* D. Pending Commercial Pipeline */}
          {(activeAttentionTab === "ALL" || activeAttentionTab === "PENDING_COMMERCIAL") &&
            attentionCenter.pendingCommercial.length > 0 && (
              <div className="rounded-lg border border-sky-200 bg-white p-4 dark:border-sky-900 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-sky-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                      Pending Commercial Approvals & Unreconciled Cheques
                    </span>
                  </div>
                  <Badge variant="info" className="text-[10px]">
                    {attentionCenter.pendingCommercial.length} Pending Actions
                  </Badge>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attentionCenter.pendingCommercial.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {item.identifier}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {item.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                          {item.customerName} • Rep: {item.mrName} • {formatDate(item.date)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.amount)}
                          </div>
                          <div className="text-[10px] text-sky-600 font-medium">{item.actionRequired}</div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => alert(`Approving ${item.identifier}`)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 3. CORE DIMENSION DEEP DIVES (Tabbed Navigation)             */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              variant={activeDimensionTab === "TEAM" ? "primary" : "ghost"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setActiveDimensionTab("TEAM")}
            >
              <Users className="h-4 w-4" />
              <span>1. Where Is My Team?</span>
            </Button>

            <Button
              variant={activeDimensionTab === "ACTIVITY" ? "primary" : "ghost"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setActiveDimensionTab("ACTIVITY")}
            >
              <CalendarCheck className="h-4 w-4" />
              <span>2. What Did They Do?</span>
            </Button>

            <Button
              variant={activeDimensionTab === "COMMERCIAL" ? "primary" : "ghost"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setActiveDimensionTab("COMMERCIAL")}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>3. What Happened Commercially?</span>
            </Button>

            <Button
              variant={activeDimensionTab === "PRODUCTS" ? "primary" : "ghost"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setActiveDimensionTab("PRODUCTS")}
            >
              <Building className="h-4 w-4" />
              <span>4. Where Are Products?</span>
            </Button>
          </div>

          <span className="text-xs text-slate-400 hidden md:inline">
            Interactive Dimension Explorer
          </span>
        </div>

        {/* ========================================================== */}
        {/* DIMENSION 1: Where is my team?                             */}
        {/* ========================================================== */}
        {activeDimensionTab === "TEAM" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Team Roster */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                      Live Medical Representative Roster & Territory Location
                    </CardTitle>
                    <CardDescription>
                      Real-time activity status, in-clinic detailing location, and compliance
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {fieldForceSummary.length} MRs Active
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {fieldForceSummary.map((mr) => (
                      <div
                        key={mr.mrId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {mr.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {mr.name}
                              </span>
                              <Badge
                                variant={
                                  mr.status === "IN_FIELD"
                                    ? "success"
                                    : mr.status === "COMPLETED"
                                    ? "secondary"
                                    : "default"
                                }
                                className="text-[10px] px-2 py-0"
                              >
                                {mr.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-400 dark:text-slate-400" />
                              {mr.territoryName} • <span className="text-sky-700 dark:text-sky-400 font-medium">{mr.currentActivity}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 sm:self-center">
                          <div className="text-right">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Call Progress</span>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {mr.callsCompletedToday} / {mr.callsPlannedToday} ({mr.complianceRate}%)
                            </p>
                          </div>

                          <div className="text-right hidden sm:block">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Orders Booked</span>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(mr.ordersBookedValue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Right 1 Col: Duty Breakdown & Territory Distribution */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Duty Status Distribution</CardTitle>
                    <CardDescription>Current representative engagement mode</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          In-Call (Inside Clinic)
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {kpis.fieldForce.inFieldNow} MRs
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-sky-500" />
                          Traveling (En Route)
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {kpis.fieldForce.travelingNow} MRs
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          Day Calls Concluded
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {kpis.fieldForce.concludedToday} MRs
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          Idle / Pending Next Call
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {kpis.fieldForce.idleNow} MRs
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Territory Deployment</CardTitle>
                    <CardDescription>Active MRs by Tamil Nadu territory</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {territorySummary.map((t) => (
                        <div key={t.territoryId} className="p-3 flex justify-between items-center">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {t.territoryName}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[11px]">
                              {t.totalMRs} MRs
                            </Badge>
                            <span className="font-semibold text-emerald-600">
                              {t.complianceRate}% Calls OK
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* DIMENSION 2: What did they do?                             */}
        {/* ========================================================== */}
        {activeDimensionTab === "ACTIVITY" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Call Status Donut Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-sky-600" />
                    Daily Call Execution & Plan Compliance
                  </CardTitle>
                  <CardDescription>
                    Breakdown of today&apos;s {kpis.calls.plannedToday} scheduled physician calls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    segments={callStatusSegments}
                    centerTitle={`${kpis.calls.complianceRate}%`}
                    centerSubtitle="Compliance"
                  />
                </CardContent>
              </Card>

              {/* GPS Geofence Verification Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    GPS Geofence Verification & Distance Compliance
                  </CardTitle>
                  <CardDescription>
                    Strict 50-meter geofence verification across clinic visits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
                    <div>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        GPS Verified Ratio (Within 50m)
                      </span>
                      <div className="text-2xl font-bold text-emerald-950 dark:text-emerald-100">
                        {kpis.calls.gpsComplianceRate}%
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {kpis.calls.verifiedGpsCount} verified calls • {kpis.calls.outsideRadiusCount} flagged outside radius
                      </p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Total Visits Screened</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{kpis.calls.completedToday}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Verified Location Matches</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{kpis.calls.verifiedGpsCount}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Outside Radius (Requires Reason)</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{kpis.calls.outsideRadiusCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Live Visits Stream */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Recent Physician Calls Detail Stream</CardTitle>
                <CardDescription>Doctor engagement, detailing feedback, and GPS audit</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor & Clinic</TableHead>
                      <TableHead>Field Representative</TableHead>
                      <TableHead>Call Status</TableHead>
                      <TableHead>GPS Geofence</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentVisits.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {v.customerName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{v.specialty || "Clinic"}</div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                          {v.mrName || "Assigned MR"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              v.status === "COMPLETED"
                                ? "default"
                                : v.status === "IN_PROGRESS"
                                ? "info"
                                : "secondary"
                            }
                          >
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              v.verificationStatus === "VERIFIED"
                                ? "success"
                                : v.verificationStatus === "OUTSIDE_RADIUS"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-[10px]"
                          >
                            {v.verificationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {v.actualStartTime || v.plannedStartTime || "10:00 AM"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================== */}
        {/* DIMENSION 3: What happened commercially?                   */}
        {/* ========================================================== */}
        {activeDimensionTab === "COMMERCIAL" && (
          <div className="space-y-6">
            {/* Target vs Achievement Run-Rate Gauge */}
            <TargetGauge
              monthlyTarget={kpis.targets.monthlyTargetTotal}
              monthlyAchieved={kpis.targets.monthlyAchievedTotal}
              achievementRate={kpis.targets.overallAchievementRate}
              benchmarkRate={kpis.targets.benchmarkRate}
              pacingStatus={kpis.targets.pacingStatus}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Collections by Payment Mode Donut */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    Collections Reconciled by Payment Mode
                  </CardTitle>
                  <CardDescription>
                    Breakdown of {formatCurrency(kpis.commercial.totalCollectionsValue)} collected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    segments={collectionsModeSegments}
                    centerTitle={formatCurrency(kpis.commercial.totalCollectionsValue)}
                    centerSubtitle="Total Receipts"
                  />
                </CardContent>
              </Card>

              {/* Recent Orders Registry */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-indigo-600" />
                    Recent Commercial Orders
                  </CardTitle>
                  <CardDescription>
                    Direct retail orders placed with stockists
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentOrders.map((o) => (
                      <div key={o.id} className="p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {o.orderNumber}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {o.status}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {o.pharmacyName} • Booked by {o.mrName || "MR"}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(o.totalAmount)}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-400">{formatDate(o.orderDate)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* DIMENSION 4: Where are products?                           */}
        {/* ========================================================== */}
        {activeDimensionTab === "PRODUCTS" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Availability Donut Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building className="h-4 w-4 text-sky-600" />
                    Retail Pharmacy Stock Availability
                  </CardTitle>
                  <CardDescription>
                    Audit results across {kpis.inventory.auditsToday} checked pharmacy retail points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    segments={productAvailabilitySegments}
                    centerTitle={`${kpis.inventory.availabilityRate}%`}
                    centerSubtitle="Stock Health"
                  />
                </CardContent>
              </Card>

              {/* Top Stockout Products Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    Top Critical Stockout Molecules
                  </CardTitle>
                  <CardDescription>
                    Formulations facing the highest stockout frequency across chemist counters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HorizontalBarChart data={stockoutBarItems} />
                </CardContent>
              </Card>
            </div>

            {/* Territory-wise Stock Health Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">
                  Territory Stock Health & Commercial Performance
                </CardTitle>
                <CardDescription>
                  Comparative analysis of stock availability, call compliance, and commercial collections
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Territory</TableHead>
                      <TableHead>Active Representatives</TableHead>
                      <TableHead>Stock Health %</TableHead>
                      <TableHead>Call Compliance</TableHead>
                      <TableHead className="text-right">Orders Booked</TableHead>
                      <TableHead className="text-right">Collections</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {territorySummary.map((t) => (
                      <TableRow key={t.territoryId}>
                        <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                          {t.territoryName}
                        </TableCell>
                        <TableCell>{t.totalMRs} MRs</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {t.stockHealthRate}%
                            </span>
                            <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${t.stockHealthRate}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                            {t.complianceRate}% ({t.callsCompleted}/{t.callsPlanned})
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(t.orderValue)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(t.collectionsValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
