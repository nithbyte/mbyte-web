"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useTerritories,
  useMRList,
  useProducts,
  useVisitReport,
  useMRPerformanceReport,
  useProductPresenceReport,
  useSalesReport,
  useCollectionReport,
  useTargetAchievementReport,
} from "@/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  User,
  Package,
  RotateCcw,
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  ShoppingCart,
  Receipt,
  Target,
  Users,
  ShieldCheck,
  X,
} from "lucide-react";
import { ReportTab } from "@/types";

export default function ReportsPage() {
  // Tab State
  const [activeTab, setActiveTab] = useState<ReportTab>("VISITS");

  // Global Filter State (date, territory, MR, product)
  const [selectedDate, setSelectedDate] = useState<string>("ALL");
  const [selectedTerritory, setSelectedTerritory] = useState<string>("ALL");
  const [selectedMR, setSelectedMR] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<string>("ALL");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Filter master datasets
  const { data: territories } = useTerritories();
  const { data: mrs } = useMRList();
  const { data: products } = useProducts();

  const filterParams = {
    date: selectedDate !== "ALL" ? selectedDate : undefined,
    territoryId: selectedTerritory !== "ALL" ? selectedTerritory : undefined,
    mrId: selectedMR !== "ALL" ? selectedMR : undefined,
    productId: selectedProduct !== "ALL" ? selectedProduct : undefined,
  };

  // Queries for each report tab
  const { data: visitReport, isLoading: visitLoading } = useVisitReport(filterParams);
  const { data: mrReport, isLoading: mrLoading } = useMRPerformanceReport(filterParams);
  const { data: presenceReport, isLoading: presenceLoading } = useProductPresenceReport(filterParams);
  const { data: salesReport, isLoading: salesLoading } = useSalesReport(filterParams);
  const { data: collectionReport, isLoading: colLoading } = useCollectionReport(filterParams);
  const { data: targetReport, isLoading: targetLoading } = useTargetAchievementReport(filterParams);

  const resetFilters = () => {
    setSelectedDate("ALL");
    setSelectedTerritory("ALL");
    setSelectedMR("ALL");
    setSelectedProduct("ALL");
  };

  const handleExport = (format: string, reportName: string) => {
    const message = `Exporting ${reportName} in ${format} format... (Ready for download)`;
    setExportNotice(message);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Field Intelligence & Management Reports"
        description="Comprehensive audit logs, field representative KPIs, shelf presence, commercial sales, collections, and target quota attainment."
        badge={<Badge variant="default">Audit & Compliance Reports</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("Excel (.xlsx)", activeTab)}
              className="gap-1.5 text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("CSV (.csv)", activeTab)}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5 text-sky-600" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("PDF Document", activeTab)}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              Print / PDF
            </Button>
          </div>
        }
      />

      {/* Export Toast Notification */}
      {exportNotice && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {exportNotice}
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 transition-colors p-0.5 rounded"
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Multi-Criteria Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 flex-1">
              {/* 1. DATE FILTER */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-sky-600" /> Date
                </label>
                <select
                  aria-label="Filter by report date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">All Dates (October MTD)</option>
                  <option value="2026-10-08">Today (08 Oct 2026)</option>
                  <option value="2026-10-07">07 Oct 2026</option>
                  <option value="2026-10-06">06 Oct 2026</option>
                  <option value="2026-10-05">05 Oct 2026</option>
                  <option value="2026-10-04">04 Oct 2026</option>
                  <option value="2026-10-03">03 Oct 2026</option>
                  <option value="2026-10-02">02 Oct 2026</option>
                  <option value="2026-10-01">01 Oct 2026</option>
                </select>
              </div>

              {/* 2. TERRITORY FILTER */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-indigo-600" /> Territory
                </label>
                <select
                  aria-label="Filter by territory"
                  value={selectedTerritory}
                  onChange={(e) => setSelectedTerritory(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">All Territories</option>
                  {territories?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. MR FILTER */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <User className="h-3 w-3 text-emerald-600" /> Representative (MR)
                </label>
                <select
                  aria-label="Filter by medical representative"
                  value={selectedMR}
                  onChange={(e) => setSelectedMR(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">All Representatives</option>
                  {mrs?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. PRODUCT FILTER */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Package className="h-3 w-3 text-purple-600" /> Product Formulation
                </label>
                <select
                  aria-label="Filter by product formulation"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">All Products</option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset Button */}
            {(selectedDate !== "ALL" ||
              selectedTerritory !== "ALL" ||
              selectedMR !== "ALL" ||
              selectedProduct !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="self-end lg:self-center text-xs text-rose-600 hover:text-rose-700 gap-1 h-8 mt-2 lg:mt-0"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 6 Report Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("VISITS")}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "VISITS"
              ? "border-sky-600 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Visit Report
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
            {visitReport?.totalVisits || 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MR_PERFORMANCE")}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "MR_PERFORMANCE"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          MR Performance
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
            {mrReport?.totalMRs || 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PRODUCT_PRESENCE")}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "PRODUCT_PRESENCE"
              ? "border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Package className="h-4 w-4" />
          Product Presence
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
            {presenceReport?.totalAudited || 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SALES")}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "SALES"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Sales Report
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
            {salesReport?.totalOrders || 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("COLLECTIONS")}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "COLLECTIONS"
              ? "border-teal-600 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Collection Report
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
            {collectionReport?.totalReceipts || 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TARGET_ACHIEVEMENT")}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "TARGET_ACHIEVEMENT"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Target className="h-4 w-4" />
          Target Achievement
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
            {targetReport?.items?.length || 0}
          </Badge>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: VISIT REPORT
      ========================================================================= */}
      {activeTab === "VISITS" && (
        <div className="space-y-4 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-3">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Visits</div>
              <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
                {visitLoading ? <Skeleton className="h-6 w-12" /> : visitReport?.totalVisits}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[11px] text-emerald-600 font-semibold uppercase">Completed</div>
              <div className="text-xl font-bold mt-1 text-emerald-600">
                {visitLoading ? <Skeleton className="h-6 w-12" /> : visitReport?.completedVisits}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[11px] text-sky-600 font-semibold uppercase">In Progress</div>
              <div className="text-xl font-bold mt-1 text-sky-600">
                {visitLoading ? <Skeleton className="h-6 w-12" /> : visitReport?.inProgressVisits}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[11px] text-amber-600 font-semibold uppercase">Missed</div>
              <div className="text-xl font-bold mt-1 text-amber-600">
                {visitLoading ? <Skeleton className="h-6 w-12" /> : visitReport?.missedVisits}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[11px] text-rose-600 font-semibold uppercase">Cancelled</div>
              <div className="text-xl font-bold mt-1 text-rose-600">
                {visitLoading ? <Skeleton className="h-6 w-12" /> : visitReport?.cancelledVisits}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[11px] text-indigo-600 font-semibold uppercase">GPS Accuracy</div>
              <div className="text-xl font-bold mt-1 text-indigo-600">
                {visitLoading ? <Skeleton className="h-6 w-12" /> : `${visitReport?.gpsVerifiedPercent}%`}
              </div>
            </Card>
          </div>

          {/* Chart: Status Breakdown */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Visit Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex items-center gap-3">
                {visitReport?.chartData?.map((item) => {
                  const pct =
                    visitReport.totalVisits > 0
                      ? Math.round((item.count / visitReport.totalVisits) * 100)
                      : 0;
                  return (
                    <div key={item.label} className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          {item.label}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color || "bg-sky-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Visits Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-sm font-bold">Daily Call Record (DCR) Audit Log</CardTitle>
                <CardDescription className="text-xs">
                  {visitReport?.items?.length || 0} visits matching filter criteria
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("Excel", "Visit Report")}
                className="text-xs h-7 gap-1"
              >
                <Download className="h-3 w-3" /> Export Table
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {visitLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !visitReport?.items || visitReport.items.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No Visit Records Found"
                    description="No DCR audit entries match the selected filter criteria."
                    actionLabel="Reset All Filters"
                    onAction={resetFilters}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Field Representative</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>GPS Verification</TableHead>
                      <TableHead>Outcome / Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitReport?.items?.map((v) => (
                      <TableRow key={v.id} className="text-xs">
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {formatDate(v.date)}
                          </div>
                          <div className="text-[11px] text-slate-500">{v.time}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {v.mrName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {v.mrEmployeeCode}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {v.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">{v.customerType}</div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {v.territoryName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              v.status === "COMPLETED"
                                ? "success"
                                : v.status === "CANCELLED"
                                ? "destructive"
                                : v.status === "MISSED"
                                ? "warning"
                                : "default"
                            }
                            className="text-[10px]"
                          >
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            <ShieldCheck className="h-3 w-3" />
                            {v.distanceMeters ? `±${v.distanceMeters}m` : "Verified"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                          {v.outcomeNotes}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MR PERFORMANCE REPORT
      ========================================================================= */}
      {activeTab === "MR_PERFORMANCE" && (
        <div className="space-y-4 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-indigo-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Total Field Force</div>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {mrLoading ? <Skeleton className="h-8 w-16" /> : `${mrReport?.totalMRs} Representatives`}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Avg Call Compliance</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">
                {mrLoading ? <Skeleton className="h-8 w-16" /> : `${mrReport?.avgCompliancePercent}%`}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-sky-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Total Orders Booked</div>
              <div className="text-2xl font-bold mt-1 text-sky-600">
                {mrLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(mrReport?.totalOrdersValue || 0)}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-teal-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Total Collections Realized</div>
              <div className="text-2xl font-bold mt-1 text-teal-600">
                {mrLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(mrReport?.totalCollectionsValue || 0)}
              </div>
            </Card>
          </div>

          {/* Chart: MR Target Achievement Ranking */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Representative Quota Attainment Ranking (%)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-2">
                {mrReport?.chartData?.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.label}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.value}% Attained
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color || "bg-indigo-600"}`}
                        style={{ width: `${Math.min(100, item.value)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-sm font-bold">Representative Performance Matrix</CardTitle>
                <CardDescription className="text-xs">
                  Evaluation across planned calls, booked orders, collections, and target realization
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("Excel", "MR Performance Report")}
                className="text-xs h-7 gap-1"
              >
                <Download className="h-3 w-3" /> Export Table
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {mrLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !mrReport?.items || mrReport.items.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No Performance Metrics Found"
                    description="No representative metrics match the selected filter criteria."
                    actionLabel="Reset All Filters"
                    onAction={resetFilters}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Representative</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead className="text-center">Calls Planned / Done</TableHead>
                      <TableHead className="text-center">Compliance</TableHead>
                      <TableHead className="text-right">Orders Booked</TableHead>
                      <TableHead className="text-right">Collections Done</TableHead>
                      <TableHead className="text-right">Monthly Target</TableHead>
                      <TableHead className="text-right">Achievement %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mrReport?.items?.map((m) => (
                      <TableRow key={m.mrId} className="text-xs">
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">{m.mrName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{m.employeeCode}</div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {m.territoryName}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {m.completedCalls}
                          </span>
                          <span className="text-slate-400"> / {m.plannedCalls}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              m.callCompliancePercent >= 80
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {m.callCompliancePercent}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(m.ordersBookedValue)}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {m.ordersBookedCount} orders
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(m.collectionsRealizedValue)}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          {formatCurrency(m.monthlyTargetAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                              m.targetAchievementPercent >= 80
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            }`}
                          >
                            {m.targetAchievementPercent}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PRODUCT PRESENCE REPORT
      ========================================================================= */}
      {activeTab === "PRODUCT_PRESENCE" && (
        <div className="space-y-4 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="p-3">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Outlets Audited</div>
              <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
                {presenceLoading ? <Skeleton className="h-6 w-12" /> : presenceReport?.totalAudited}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[11px] text-emerald-600 font-semibold uppercase">Available In-Stock</div>
              <div className="text-xl font-bold mt-1 text-emerald-600">
                {presenceLoading ? <Skeleton className="h-6 w-12" /> : presenceReport?.availableCount}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[11px] text-amber-600 font-semibold uppercase">Low Stock Alerts</div>
              <div className="text-xl font-bold mt-1 text-amber-600">
                {presenceLoading ? <Skeleton className="h-6 w-12" /> : presenceReport?.lowStockCount}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[11px] text-rose-600 font-semibold uppercase">Out of Stock</div>
              <div className="text-xl font-bold mt-1 text-rose-600">
                {presenceLoading ? <Skeleton className="h-6 w-12" /> : presenceReport?.outOfStockCount}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[11px] text-indigo-600 font-semibold uppercase">Availability Rate</div>
              <div className="text-xl font-bold mt-1 text-indigo-600">
                {presenceLoading ? <Skeleton className="h-6 w-12" /> : `${presenceReport?.stockAvailabilityRate}%`}
              </div>
            </Card>
          </div>

          {/* Chart: Presence Distribution */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Retail Shelf Presence Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="flex items-center gap-4">
                {presenceReport?.chartData?.map((item) => (
                  <div key={item.label} className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        {item.label}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.count} ({item.percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-sm font-bold">Chemist Shelf Audit Log</CardTitle>
                <CardDescription className="text-xs">
                  {presenceReport?.items?.length || 0} formulation audits across retail chemists
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("Excel", "Product Presence Report")}
                className="text-xs h-7 gap-1"
              >
                <Download className="h-3 w-3" /> Export Table
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {presenceLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !presenceReport?.items || presenceReport.items.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No Shelf Audits Found"
                    description="No retail shelf presence audits match the selected filter criteria."
                    actionLabel="Reset All Filters"
                    onAction={resetFilters}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Formulation</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Chemist / Pharmacy</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>Audited By</TableHead>
                      <TableHead>Shelf Status</TableHead>
                      <TableHead className="text-right">Quantity Found</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presenceReport?.items?.map((item) => (
                      <TableRow key={item.id} className="text-xs">
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">{item.productName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.productSku}</div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {item.categoryName}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                          {item.pharmacyName}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {item.territoryName}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {item.auditedByMrName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === "AVAILABLE"
                                ? "success"
                                : item.status === "LOW_STOCK"
                                ? "warning"
                                : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                          {item.quantity} units
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SALES REPORT
      ========================================================================= */}
      {activeTab === "SALES" && (
        <div className="space-y-4 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-l-4 border-l-sky-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Total Sales Orders</div>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {salesLoading ? <Skeleton className="h-8 w-16" /> : `${salesReport?.totalOrders} Orders`}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Total Commercial Value</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">
                {salesLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(salesReport?.totalSalesValue || 0)}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-indigo-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Average Ticket Size</div>
              <div className="text-2xl font-bold mt-1 text-indigo-600">
                {salesLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(salesReport?.avgOrderValue || 0)}
              </div>
            </Card>
          </div>

          {/* Chart: Top Selling Products */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Top Generating Formulations by Revenue (INR)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-2">
                {salesReport?.chartData?.map((item) => {
                  const maxVal = Math.max(...(salesReport.chartData.map((d) => d.value) || [1]), 1);
                  const pct = Math.round((item.value / maxVal) * 100);
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.label}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-sm font-bold">Booked Sales Registers</CardTitle>
                <CardDescription className="text-xs">
                  {salesReport?.items?.length || 0} orders recorded in field sales
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("Excel", "Sales Report")}
                className="text-xs h-7 gap-1"
              >
                <Download className="h-3 w-3" /> Export Table
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {salesLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !salesReport?.items || salesReport.items.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No Sales Orders Found"
                    description="No commercial bookings match the selected filter criteria."
                    actionLabel="Reset All Filters"
                    onAction={resetFilters}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order # & Date</TableHead>
                      <TableHead>Customer Chemist</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>Representative</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReport?.items?.map((o) => (
                      <TableRow key={o.id} className="text-xs">
                        <TableCell>
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {o.orderNumber}
                          </div>
                          <div className="text-[11px] text-slate-500">{formatDate(o.orderDate)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {o.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {o.customerAddress}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {o.territoryName}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">{o.mrName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{o.mrEmployeeCode}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              o.status === "DELIVERED"
                                ? "success"
                                : o.status === "CANCELLED"
                                ? "destructive"
                                : "default"
                            }
                            className="text-[10px]"
                          >
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{o.itemsCount}</span> SKUs
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {o.topProductNames.join(", ")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(o.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 5: COLLECTION REPORT
      ========================================================================= */}
      {activeTab === "COLLECTIONS" && (
        <div className="space-y-4 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Total Receipts</div>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {colLoading ? <Skeleton className="h-8 w-16" /> : `${collectionReport?.totalReceipts} Vouchers`}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-teal-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Total Cash Collected</div>
              <div className="text-2xl font-bold mt-1 text-teal-600">
                {colLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(collectionReport?.totalCollectedValue || 0)}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-sky-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">UPI & Digital Inflow</div>
              <div className="text-2xl font-bold mt-1 text-sky-600">
                {colLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(
                    (collectionReport?.modeBreakdown?.upi || 0) +
                      (collectionReport?.modeBreakdown?.bankTransfer || 0)
                  )
                )}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-amber-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Cheque & Cash Clearance</div>
              <div className="text-2xl font-bold mt-1 text-amber-600">
                {colLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(
                    (collectionReport?.modeBreakdown?.cheque || 0) +
                      (collectionReport?.modeBreakdown?.cash || 0)
                  )
                )}
              </div>
            </Card>
          </div>

          {/* Chart: Mode Distribution */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Payment Collection Modes Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {collectionReport?.chartData?.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.percent}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatCurrency(item.value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-sm font-bold">Reconciled Payment Vouchers</CardTitle>
                <CardDescription className="text-xs">
                  {collectionReport?.items?.length || 0} vouchers deposited against invoices
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("Excel", "Collection Report")}
                className="text-xs h-7 gap-1"
              >
                <Download className="h-3 w-3" /> Export Table
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {colLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !collectionReport?.items || collectionReport.items.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No Payment Vouchers Found"
                    description="No collection receipts match the selected filter criteria."
                    actionLabel="Reset All Filters"
                    onAction={resetFilters}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt # & Date</TableHead>
                      <TableHead>Customer Chemist</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>Representative</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Reference Number</TableHead>
                      <TableHead className="text-right">Amount Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectionReport?.items?.map((c) => (
                      <TableRow key={c.id} className="text-xs">
                        <TableCell>
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {c.receiptNumber}
                          </div>
                          <div className="text-[11px] text-slate-500">{formatDate(c.paymentDate)}</div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                          {c.customerName}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {c.territoryName}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">{c.mrName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.mrEmployeeCode}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.paymentMode === "UPI"
                                ? "info"
                                : c.paymentMode === "CHEQUE"
                                ? "warning"
                                : "success"
                            }
                            className="text-[10px]"
                          >
                            {c.paymentMode}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-slate-600 dark:text-slate-400">
                          {c.referenceNumber}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(c.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 6: TARGET ACHIEVEMENT REPORT
      ========================================================================= */}
      {activeTab === "TARGET_ACHIEVEMENT" && (
        <div className="space-y-4 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-purple-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Total Target Quota</div>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {targetLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(targetReport?.totalTargetAmount || 0)}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Realized Revenue</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">
                {targetLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(targetReport?.totalAchievedAmount || 0)}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-indigo-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Overall Revenue Quota %</div>
              <div className="text-2xl font-bold mt-1 text-indigo-600">
                {targetLoading ? <Skeleton className="h-8 w-16" /> : `${targetReport?.overallAchievementPercent}%`}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-sky-500">
              <div className="text-xs text-slate-500 font-semibold uppercase">Visit Quota Completion</div>
              <div className="text-2xl font-bold mt-1 text-sky-600">
                {targetLoading ? <Skeleton className="h-8 w-16" /> : `${targetReport?.overallVisitPercent}%`}
              </div>
            </Card>
          </div>

          {/* Chart: Target vs Achieved Comparison */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Representative Quota Attainment Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-2.5">
                {targetReport?.chartData?.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.label}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.achieved)} / {formatCurrency(item.target)} ({item.percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.percent >= 80
                            ? "bg-emerald-500"
                            : item.percent >= 60
                            ? "bg-sky-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, item.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-sm font-bold">Target vs Achievement Register</CardTitle>
                <CardDescription className="text-xs">
                  Representative monthly quota allocations for October 2026
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("Excel", "Target Achievement Report")}
                className="text-xs h-7 gap-1"
              >
                <Download className="h-3 w-3" /> Export Table
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {targetLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !targetReport?.items || targetReport.items.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No Quota Records Found"
                    description="No representative quota achievements match the selected filter criteria."
                    actionLabel="Reset All Filters"
                    onAction={resetFilters}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Representative</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Target Quota</TableHead>
                      <TableHead className="text-right">Achieved Sales</TableHead>
                      <TableHead className="text-right">Revenue %</TableHead>
                      <TableHead className="text-center">Visit Calls Quota</TableHead>
                      <TableHead className="text-center">Attainment Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targetReport?.items?.map((t) => (
                      <TableRow key={t.id} className="text-xs">
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">{t.mrName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{t.employeeCode}</div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {t.territoryName}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {t.monthYear}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                          {formatCurrency(t.targetAmount)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(t.achievedAmount)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {t.valueAchievementPercent}%
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {t.visitAchieved}
                          </span>
                          <span className="text-slate-400"> / {t.visitTarget} ({t.visitAchievementPercent}%)</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              t.status === "EXCEEDED"
                                ? "success"
                                : t.status === "ON_TRACK"
                                ? "info"
                                : t.status === "AT_RISK"
                                ? "warning"
                                : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
