"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { analysisService, CustomerFullHistoryData } from "@/services/analysisService";
import { doctorService } from "@/services/doctorService";
import { useCurrentUser } from "@/hooks";
import { useFilterStore } from "@/store";
import { normalizeRole } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Package,
  Phone,
  Pill,
  Presentation,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  Stethoscope,
  UserCheck,
  Building2,
  Check,
  X,
} from "lucide-react";

type DatePreset = "ALL_TIME" | "7D" | "THIS_MONTH" | "30D" | "90D" | "CUSTOM";
type DoctorTab = "VISITS" | "PRODUCTS" | "ORDERS";

const toLocalIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getPresetRange = (preset: DatePreset): { start?: string; end?: string } => {
  const now = new Date();
  const today = toLocalIso(now);
  if (preset === "7D") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return { start: toLocalIso(s), end: today };
  }
  if (preset === "THIS_MONTH") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toLocalIso(s), end: today };
  }
  if (preset === "30D") {
    const s = new Date(now);
    s.setDate(s.getDate() - 29);
    return { start: toLocalIso(s), end: today };
  }
  if (preset === "90D") {
    const s = new Date(now);
    s.setDate(s.getDate() - 89);
    return { start: toLocalIso(s), end: today };
  }
  return {};
};

const formatTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

export default function DoctorDetailsPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const { data: currentUser } = useCurrentUser();
  const { operatingDate, dateSelectionVersion } = useFilterStore();
  const canonicalRole = normalizeRole(currentUser?.role);
  const isCompanyAdmin = canonicalRole === "ADMIN" || canonicalRole === "SUPER_ADMIN";

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>(() =>
    dateSelectionVersion > 0 ? "CUSTOM" : "ALL_TIME"
  );
  const [startDate, setStartDate] = useState<string>(() =>
    dateSelectionVersion > 0 ? operatingDate : ""
  );
  const [endDate, setEndDate] = useState<string>(() =>
    dateSelectionVersion > 0 ? operatingDate : ""
  );

  useEffect(() => {
    if (dateSelectionVersion > 0) {
      setDatePreset("CUSTOM");
      setStartDate(operatingDate);
      setEndDate(operatingDate);
    }
  }, [operatingDate, dateSelectionVersion]);
  const [mrId, setMrId] = useState<string>("ALL");
  const [productId, setProductId] = useState<string>("ALL");
  const [visitStatus, setVisitStatus] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [activeTab, setActiveTab] = useState<DoctorTab>("VISITS");
  const [data, setData] = useState<CustomerFullHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDoctorHistory = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await analysisService.getCustomerHistory("DOCTOR", id, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        mrId,
        productId,
        visitStatus,
        search: debouncedSearch,
      });
      setData(res);
    } catch (err) {
      console.warn("Failed to load doctor details & history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id, startDate, endDate, mrId, productId, visitStatus, debouncedSearch]);

  useEffect(() => {
    fetchDoctorHistory();
  }, [fetchDoctorHistory]);

  const handleSelectPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "CUSTOM") return;
    const range = getPresetRange(preset);
    setStartDate(range.start || "");
    setEndDate(range.end || "");
  };

  const handleResetFilters = () => {
    setDatePreset("ALL_TIME");
    setStartDate("");
    setEndDate("");
    setMrId("ALL");
    setProductId("ALL");
    setVisitStatus("ALL");
    setSearch("");
    setDebouncedSearch("");
  };

  const handleApproveDoctor = async () => {
    if (!id) return;
    setIsActionLoading(true);
    try {
      await doctorService.approveDoctor(id);
      await fetchDoctorHistory();
    } catch (err: any) {
      alert(err?.message || "Failed to approve doctor.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectDoctor = async () => {
    if (!id) return;
    const reason = window.prompt("Enter rejection reason for this doctor registration:");
    if (!reason || !reason.trim()) return;
    setIsActionLoading(true);
    try {
      await doctorService.rejectDoctor(id, reason.trim());
      await fetchDoctorHistory();
    } catch (err: any) {
      alert(err?.message || "Failed to reject doctor.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const hasActiveFilters =
    datePreset !== "ALL_TIME" ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    mrId !== "ALL" ||
    productId !== "ALL" ||
    visitStatus !== "ALL" ||
    Boolean(search.trim());

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const doc = data?.customer;
  if (!doc) {
    return (
      <div className="space-y-4">
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Doctors & Clinics</span>
        </Link>
        <Card className="p-8 text-center">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Doctor Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            The requested doctor profile could not be found or is outside your tenant scope.
          </p>
        </Card>
      </div>
    );
  }

  const isPurchasing = doc.customerType === "PURCHASING_DOCTOR" || doc.doctorCategory === "PURCHASING_DOCTOR";
  const backHref = isPurchasing ? "/purchasing-doctors" : "/doctors";
  const backLabel = isPurchasing ? "Back to Purchasing Doctors" : "Back to Doctors & Clinics";
  const summary = data.lifetimeSummary;
  const visits = data.visits || [];
  const orders = data.orders || [];
  const products = data.productsBreakdown || [];
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${
    doc.latitude && doc.longitude && !(doc.latitude === 0 && doc.longitude === 0)
      ? `${doc.latitude},${doc.longitude}`
      : encodeURIComponent([doc.clinicName || doc.name, doc.address].filter(Boolean).join(", "))
  }&travelmode=driving`;

  return (
    <div className="space-y-6">
      {/* Back Nav & Header */}
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{backLabel}</span>
        </Link>

        <PageHeader
          title={doc.name}
          description={`${doc.specialty || "General Medicine"}${doc.qualification ? ` • ${doc.qualification}` : ""} • ${doc.clinicName || "Clinic"}`}
          badge={
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant={isPurchasing ? "success" : "info"} className="text-xs">
                {isPurchasing ? "PURCHASING DOCTOR" : "DOCTOR"}
              </Badge>
              {doc.tier && (
                <Badge variant="outline" className="text-xs">
                  Tier {doc.tier}
                </Badge>
              )}
              <Badge
                variant={
                  doc.approvalStatus === "APPROVED"
                    ? "success"
                    : doc.approvalStatus === "REJECTED"
                    ? "destructive"
                    : "warning"
                }
                className="text-xs"
              >
                {doc.approvalStatus || "APPROVED"}
              </Badge>
            </div>
          }
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-[#FF6B00] hover:bg-orange-100 transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Directions</span>
              </a>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => fetchDoctorHistory()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Doctor Complete Profile & Governance Card */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Identity */}
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-sm font-bold text-white shadow-md">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{doc.name}</div>
                <div className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
                  {doc.specialty || "General Medicine"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {doc.qualification || "MBBS"}
                  {doc.registrationNo ? ` • Reg: ${doc.registrationNo}` : ""}
                </div>
              </div>
            </div>

            {/* Clinic & Location */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{doc.clinicName || "Clinic"}</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{doc.address}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Territory: <strong className="text-slate-700 dark:text-slate-300">{doc.territoryName || "Assigned"}</strong>
              </div>
            </div>

            {/* Contact & Visiting Schedule */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{doc.phone || "Not recorded"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{doc.email || "No email"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  Target: {doc.visitFrequency || 2} visits/mo
                  {doc.visitingHours ? ` • ${doc.visitingHours}` : ""}
                </span>
              </div>
            </div>

            {/* Registration & Governance */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1 text-xs dark:border-slate-800 dark:bg-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Registration & GPS
              </span>
              <div className="text-slate-700 dark:text-slate-300">
                Registered By:{" "}
                <strong>
                  {doc.createdBy
                    ? `${doc.createdBy.firstName} ${doc.createdBy.lastName}`
                    : "Admin"}
                </strong>
              </div>
              {doc.createdAt && (
                <div className="text-[11px] text-slate-500">
                  Added: {formatDate(doc.createdAt)}
                </div>
              )}
              {doc.latitude && doc.longitude ? (
                <div className="text-[11px] font-mono text-slate-500">
                  GPS: {Number(doc.latitude).toFixed(5)}, {Number(doc.longitude).toFixed(5)}
                </div>
              ) : null}
            </div>
          </div>

          {doc.rejectionReason && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <strong>Rejection Reason:</strong> {doc.rejectionReason}
            </div>
          )}

          {isCompanyAdmin && doc.approvalStatus === "PENDING_APPROVAL" && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xs font-medium text-amber-900">
                This doctor registration is pending Company Admin approval.
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1"
                  onClick={handleApproveDoctor}
                  disabled={isActionLoading}
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-8 gap-1"
                  onClick={handleRejectDoctor}
                  disabled={isActionLoading}
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lifetime KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Past Visits
            </span>
            <CalendarCheck className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.completedVisits}{" "}
              <span className="text-sm font-medium text-slate-400">/ {summary.totalVisits}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Avg duration: {summary.avgDurationMinutes}m • Last:{" "}
              {summary.lastVisitDate ? formatDate(summary.lastVisitDate) : "Never"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Products Detailed
            </span>
            <Pill className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.uniqueProductsDiscussed}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              First visit: {summary.firstVisitDate ? formatDate(summary.firstVisitDate) : "—"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Samples & Visual Aids
            </span>
            <Presentation className="h-4 w-4 text-violet-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.totalSamplesGiven} <span className="text-sm font-normal text-slate-400">samples</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary.totalVisualAidsShown} visual aid presentations shown
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Orders Value
            </span>
            <ShoppingCart className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalOrdersAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary.totalOrdersCount} order(s) • Delivered: {formatCurrency(summary.deliveredOrdersAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Past Visits & Analysis Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400 mr-1" />
              {(
                [
                  { key: "ALL_TIME", label: "All Time (Till Now)" },
                  { key: "7D", label: "Last 7 Days" },
                  { key: "THIS_MONTH", label: "This Month" },
                  { key: "30D", label: "Last 30 Days" },
                  { key: "90D", label: "Last 90 Days" },
                ] as const
              ).map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPreset(p.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    datePreset === p.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}

              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="date"
                  aria-label="Filter visits from date"
                  value={startDate}
                  onChange={(e) => {
                    setDatePreset("CUSTOM");
                    setStartDate(e.target.value);
                  }}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  aria-label="Filter visits to date"
                  value={endDate}
                  onChange={(e) => {
                    setDatePreset("CUSTOM");
                    setEndDate(e.target.value);
                  }}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs text-rose-600 hover:text-rose-700 gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search MR, product, visual aid, feedback..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <select
              aria-label="Filter by Medical Representative"
              value={mrId}
              onChange={(e) => setMrId(e.target.value)}
              className="h-9 px-2.5 rounded-md border border-input bg-background text-xs font-medium"
            >
              <option value="ALL">All Representatives (MRs)</option>
              {(data.filterOptions?.mrs || []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.employeeCode ? `(${m.employeeCode})` : ""}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-9 px-2.5 rounded-md border border-input bg-background text-xs font-medium"
            >
              <option value="ALL">All Products Detailed</option>
              {(data.filterOptions?.products || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brandName}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by visit status"
              value={visitStatus}
              onChange={(e) => setVisitStatus(e.target.value)}
              className="h-9 px-2.5 rounded-md border border-input bg-background text-xs font-medium"
            >
              <option value="ALL">All Visit Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="MISSED">Missed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <Button
          variant={activeTab === "VISITS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("VISITS")}
        >
          <CalendarCheck className="h-4 w-4" />
          <span>All Past Visits ({visits.length})</span>
        </Button>

        <Button
          variant={activeTab === "PRODUCTS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("PRODUCTS")}
        >
          <Package className="h-4 w-4" />
          <span>Products & Samples ({products.length})</span>
        </Button>

        <Button
          variant={activeTab === "ORDERS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("ORDERS")}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Orders Booked ({orders.length})</span>
        </Button>
      </div>

      {/* TAB 1: ALL PAST VISITS */}
      {activeTab === "VISITS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-sky-600" />
              Complete Past Visits & Interaction Log ({visits.length})
            </CardTitle>
            <CardDescription>
              Every call recorded with {doc.name} including representative, call timings, GPS verification, products discussed, visual aids shown, samples & feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {visits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No visits recorded for this doctor matching the selected filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visit Date & Time</TableHead>
                    <TableHead>Representative (MR)</TableHead>
                    <TableHead>Status & GPS</TableHead>
                    <TableHead>Products & Visual Aids</TableHead>
                    <TableHead>Feedback & Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((v, idx) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          #{visits.length - idx} • {formatDate(v.scheduledDate)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {formatTime(v.actualStartTime)} – {formatTime(v.actualEndTime)}
                          {v.durationSeconds ? ` (${Math.max(1, Math.round(v.durationSeconds / 60))}m)` : ""}
                        </div>
                        {v.isJointVisit && (
                          <Badge variant="outline" className="text-[9px] mt-1">
                            Joint Call
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/field-force/${v.mrId}`}
                          className="font-semibold text-xs text-sky-600 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{v.mrName}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        {v.mrEmployeeCode && (
                          <div className="text-[11px] font-mono text-slate-500">{v.mrEmployeeCode}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant={
                              v.status === "COMPLETED"
                                ? "success"
                                : v.status === "MISSED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {v.status}
                          </Badge>
                          <Badge
                            variant={
                              v.verificationStatus === "VERIFIED" || v.verificationStatus === "EXCEPTION_APPROVED"
                                ? "success"
                                : v.verificationStatus === "OUTSIDE_RADIUS"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-[10px] gap-1"
                          >
                            {v.verificationStatus === "VERIFIED" ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            {v.verificationStatus}
                            {v.distanceMeters ? ` (${Math.round(v.distanceMeters)}m)` : ""}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {v.productsDiscussed.map((p) => (
                            <span
                              key={p.productId}
                              className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-[10px] font-medium text-blue-700 dark:text-blue-300"
                            >
                              {p.brandName}
                              {p.samplesQty > 0 ? ` (${p.samplesQty} smp)` : ""}
                            </span>
                          ))}
                          {v.visualAidsShown.map((va) => (
                            <span
                              key={va.sessionId}
                              className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/50 text-[10px] font-medium text-violet-700 dark:text-violet-300"
                            >
                              VA: {va.title}
                            </span>
                          ))}
                          {v.productsDiscussed.length === 0 && v.visualAidsShown.length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-sm text-xs text-slate-600 dark:text-slate-300">
                        <div>{v.feedbackNotes || <span className="text-slate-400 italic">No feedback notes</span>}</div>
                        {v.productsDiscussed.some((p) => p.feedback) && (
                          <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                            {v.productsDiscussed
                              .filter((p) => p.feedback)
                              .map((p) => (
                                <div key={p.productId}>
                                  • <strong>{p.brandName}:</strong> {p.feedback}
                                </div>
                              ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: PRODUCTS & SAMPLES */}
      {activeTab === "PRODUCTS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Products Detailed & Samples Distributed</CardTitle>
            <CardDescription>Cumulative product engagement across all visits with {doc.name}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {products.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No products recorded for this doctor in the selected period.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Brand</TableHead>
                    <TableHead>Times Detailed</TableHead>
                    <TableHead>Samples Distributed</TableHead>
                    <TableHead className="text-right">Ordered Qty & Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-semibold text-xs">{p.brandName}</TableCell>
                      <TableCell className="text-xs">{p.timesDiscussed} call(s)</TableCell>
                      <TableCell className="text-xs font-semibold text-sky-600">{p.samplesGiven} units</TableCell>
                      <TableCell className="text-right text-xs font-bold text-emerald-600">
                        {p.orderedQty} units ({formatCurrency(p.orderedValue)})
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === "ORDERS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Orders Associated with {doc.name}</CardTitle>
            <CardDescription>Orders booked during calls with this doctor</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No orders linked to this doctor in the selected period.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Representative</TableHead>
                    <TableHead>Line Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs font-semibold">{o.orderNumber}</TableCell>
                      <TableCell className="text-xs text-slate-500">{formatDate(o.createdAt)}</TableCell>
                      <TableCell className="text-xs">{o.mrName || "Representative"}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {o.items.map((it) => `${it.productName} × ${it.quantity}`).join(", ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "destructive" : "outline"}
                          className="text-[10px]"
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        {formatCurrency(o.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
