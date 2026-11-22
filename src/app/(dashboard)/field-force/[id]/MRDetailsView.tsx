"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AtWorkBadge } from "@/components/ui/at-work-badge";
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
import { useMRDetails, useCurrentUser, useChangeRole, useResetPassword } from "@/hooks";
import { useFilterStore } from "@/store";
import { analysisService, MrAnalysisData } from "@/services/analysisService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { normalizeRole } from "@/types";
import { Modal } from "@/components/ui/dialog";
import {
  ArrowLeft,
  CalendarCheck,
  ShoppingCart,
  Receipt,
  Package,
  Target,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  UserMinus,
  Search,
  RefreshCw,
  RotateCcw,
  Stethoscope,
  Building2,
  FileCheck,
  Clock,
  ExternalLink,
  Calendar,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";

type DatePreset = "ALL_TIME" | "TODAY" | "7D" | "THIS_MONTH" | "30D" | "CUSTOM";
type ActiveTab =
  | "VISITS"
  | "DOCTORS"
  | "CHEMISTS"
  | "ORDERS"
  | "COLLECTIONS"
  | "PRODUCTS_DCR"
  | "TARGET";

const toLocalIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getPresetRange = (preset: DatePreset): { start?: string; end?: string } => {
  const now = new Date();
  const today = toLocalIso(now);
  if (preset === "TODAY") return { start: today, end: today };
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
  return {};
};

const formatTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

export function MRDetailsView({ id }: { id: string }) {
  const { data: currentUser } = useCurrentUser();
  const { operatingDate, dateSelectionVersion } = useFilterStore();
  const canonicalRole = normalizeRole(currentUser?.role);
  const { data, isLoading, refetch: refetchMRDetails } = useMRDetails(id);
  const changeRoleMutation = useChangeRole();
  const resetPasswordMutation = useResetPassword();

  // Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<"MANAGER" | "MR">("MANAGER");
  const [roleModalDesignation, setRoleModalDesignation] = useState("");
  const [roleModalError, setRoleModalError] = useState<string | null>(null);
  const [roleModalSuccess, setRoleModalSuccess] = useState<string | null>(null);

  // Password Reset Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [passwordModalSuccess, setPasswordModalSuccess] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleOpenPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordModalError(null);
    setPasswordModalSuccess(null);
    setIsCopied(false);
    setIsPasswordModalOpen(true);
  };

  const handleGenerateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd = pwd + "9!";
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setPasswordModalError(null);
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmPasswordReset = async () => {
    if (!data?.mr) return;
    setPasswordModalError(null);
    setPasswordModalSuccess(null);

    if (!newPassword) {
      setPasswordModalError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordModalError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordModalError("Passwords do not match. Please verify and try again.");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        mrId: data.mr.id,
        userId: data.mr.userId,
        password: newPassword,
      });
      setPasswordModalSuccess(
        `Password for ${data.mr.name} has been updated successfully. The user must sign in with this new password.`
      );
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordModalSuccess(null);
        setNewPassword("");
        setConfirmPassword("");
      }, 1600);
    } catch (err: any) {
      setPasswordModalError(err?.message || "Failed to reset password. Please try again.");
    }
  };

  const isCurrentManager = Boolean(
    data?.mr?.role === "MANAGER" ||
    data?.mr?.designation?.toLowerCase().includes("manager") ||
    data?.mr?.employeeId?.includes("MGR")
  );

  const handleOpenRoleModal = (role: "MANAGER" | "MR") => {
    setTargetRole(role);
    setRoleModalDesignation(role === "MANAGER" ? "Area Sales Manager" : "Medical Representative");
    setRoleModalError(null);
    setRoleModalSuccess(null);
    setIsRoleModalOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!data?.mr) return;
    setRoleModalError(null);
    try {
      await changeRoleMutation.mutateAsync({
        mrId: data.mr.id,
        userId: data.mr.userId,
        role: targetRole,
        designation: roleModalDesignation.trim() || undefined,
      });
      setRoleModalSuccess(
        `Successfully ${targetRole === "MANAGER" ? "promoted" : "demoted"} ${data.mr.name} to ${targetRole === "MANAGER" ? "Area Sales Manager" : "Medical Representative"}.`
      );
      refetchMRDetails();
      fetchAnalysis();
      setTimeout(() => {
        setIsRoleModalOpen(false);
        setRoleModalSuccess(null);
      }, 1200);
    } catch (err: any) {
      setRoleModalError(err?.message || "Failed to update role. Please verify credentials or network.");
    }
  };

  // Analysis & Multi-Facet Filter State
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
  const [customerType, setCustomerType] = useState<string>("ALL");
  const [customerId, setCustomerId] = useState<string>("ALL");
  const [productId, setProductId] = useState<string>("ALL");
  const [visitStatus, setVisitStatus] = useState<string>("ALL");
  const [orderStatus, setOrderStatus] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [analysis, setAnalysis] = useState<MrAnalysisData | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("VISITS");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAnalysis = useCallback(async () => {
    if (canonicalRole === "SUPER_ADMIN") return;
    setIsLoadingAnalysis(true);
    try {
      const res = await analysisService.getMrAnalysis({
        mrId: id,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        customerType,
        customerId,
        productId,
        visitStatus,
        orderStatus,
        search: debouncedSearch,
      });
      setAnalysis(res);
    } catch (err) {
      console.warn("Failed to load MR analysis:", err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [
    id,
    canonicalRole,
    startDate,
    endDate,
    customerType,
    customerId,
    productId,
    visitStatus,
    orderStatus,
    debouncedSearch,
  ]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

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
    setCustomerType("ALL");
    setCustomerId("ALL");
    setProductId("ALL");
    setVisitStatus("ALL");
    setOrderStatus("ALL");
    setSearch("");
    setDebouncedSearch("");
  };

  const hasActiveFilters =
    datePreset !== "ALL_TIME" ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    customerType !== "ALL" ||
    customerId !== "ALL" ||
    productId !== "ALL" ||
    visitStatus !== "ALL" ||
    orderStatus !== "ALL" ||
    Boolean(search.trim());

  if (canonicalRole === "SUPER_ADMIN") {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/field-force"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Personnel Directory</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-8 text-center dark:border-amber-900/40 dark:bg-amber-950/20 max-w-2xl mx-auto my-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
            Personnel Operational Details Protected
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto mb-6">
            Under tenant privacy governance, Super Administrators can view who all are in the company roster, but cannot view detailed operational call logs, doctor visit notes, sales orders, quota attainment, or field GPS tracking. This operational data is strictly governed by the Company Administrator.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/field-force"
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors"
            >
              Return to Personnel Directory
            </Link>
            <Link
              href="/companies"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-colors"
            >
              Manage Companies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { mr, target, productActivity } = data;
  const summary = analysis?.summary;
  const filteredVisits = analysis?.visits || [];
  const filteredOrders = analysis?.orders || [];
  const filteredCollections = analysis?.collections || [];
  const doctorsReport = analysis?.doctorsReport || [];
  const chemistsReport = analysis?.chemistsReport || [];
  const productsReport = analysis?.productsReport || [];
  const dcrs = analysis?.dcrs || [];
  const expenses = analysis?.expenses || [];

  const liveAchievedAmount =
    target.achievedAmount > 0 ? target.achievedAmount : summary?.totalOrdersAmount || 0;
  const liveAchievementRate =
    target.targetAmount > 0
      ? Math.round((liveAchievedAmount / target.targetAmount) * 100)
      : target.achievementRate;
  const liveShortfall = Math.max(0, target.targetAmount - liveAchievedAmount);
  const currentMonthLabel = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const isAhead = liveAchievementRate >= 25 || mr.performanceStatus === "AHEAD" || mr.performanceStatus === "ON_TRACK";

  return (
    <div className="space-y-6">
      {/* Back button & Page Header */}
      <div>
        <Link
          href="/field-force"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Representative Directory</span>
        </Link>

        <PageHeader
          title={`${mr.name} (${mr.employeeId})`}
          description={`${mr.designation} • ${mr.territoryName} Territory • Reporting to ${mr.managerName}`}
          badge={
            <div className="flex items-center gap-1.5">
              {mr.isAtWork && <AtWorkBadge punchInTime={mr.punchInTime} className="text-xs px-2.5 py-1" />}
              <Badge
                variant={
                  mr.status === "IN_FIELD"
                    ? "success"
                    : mr.status === "COMPLETED"
                    ? "secondary"
                    : "default"
                }
                className="text-xs"
              >
                {mr.status.replace("_", " ")}
              </Badge>
            </div>
          }
          actions={
            <div className="flex gap-2">
              {canonicalRole === "ADMIN" && (
                <>
                  {isCurrentManager ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => handleOpenRoleModal("MR")}
                    >
                      <UserMinus className="h-3.5 w-3.5 text-amber-600" />
                      <span>Demote to MR</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 border-amber-300 bg-amber-50/60 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      onClick={() => handleOpenRoleModal("MANAGER")}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                      <span>Promote to Manager</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={handleOpenPasswordModal}
                  >
                    <KeyRound className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    <span>Change Password</span>
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => fetchAnalysis()}
                disabled={isLoadingAnalysis}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAnalysis ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => alert(`Calling ${mr.name}: ${mr.phone}`)}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call Representative</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-sm font-bold text-white shadow-md">
                {mr.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {mr.name}
                </div>
                <div className="font-mono text-xs text-sky-600 dark:text-sky-400">
                  {mr.employeeId}
                </div>
                <div className="text-[11px] text-slate-500">{mr.designation}</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{mr.territoryName} ({mr.headquarters})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Manager: {mr.managerName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Joined: {formatDate(mr.joiningDate)}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{mr.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{mr.email}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1 text-xs dark:border-slate-800 dark:bg-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Field Status
              </span>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {mr.currentActivity}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                {mr.todayVisits.completed} of {mr.todayVisits.planned} calls completed today
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Rep Analysis & Filter Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400 mr-1" />
              {(
                [
                  { key: "ALL_TIME", label: "All Time" },
                  { key: "TODAY", label: "Today" },
                  { key: "7D", label: "Last 7 Days" },
                  { key: "THIS_MONTH", label: "This Month" },
                  { key: "30D", label: "Last 30 Days" },
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
                  aria-label="Start date"
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
                  aria-label="End date"
                  value={endDate}
                  onChange={(e) => {
                    setDatePreset("CUSTOM");
                    setEndDate(e.target.value);
                  }}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAnalysis()}
                disabled={isLoadingAnalysis}
                className="h-8 text-xs gap-1"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAnalysis ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search doctor, chemist, order #, product, feedback..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            {/* Customer Type */}
            <select
              aria-label="Filter by customer type"
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              className="h-9 px-2.5 rounded-md border border-input bg-background text-xs font-medium"
            >
              <option value="ALL">All Customer Types</option>
              <option value="DOCTOR">Doctors Only</option>
              <option value="PURCHASING_DOCTOR">Purchasing Doctors</option>
              <option value="PHARMACY">Chemists / Pharmacies</option>
              <option value="DISTRIBUTOR">Distributors</option>
            </select>

            {/* Specific Doctor / Chemist Selector */}
            <select
              aria-label="Filter by specific doctor or chemist"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-9 px-2.5 rounded-md border border-input bg-background text-xs font-medium"
            >
              <option value="ALL">All Doctors & Chemists</option>
              {(analysis?.filterOptions?.doctors || []).length > 0 && (
                <optgroup label="Doctors & Purchasing Doctors">
                  {(analysis?.filterOptions?.doctors || []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty})
                    </option>
                  ))}
                </optgroup>
              )}
              {(analysis?.filterOptions?.chemists || []).length > 0 && (
                <optgroup label="Chemists & Pharmacies">
                  {(analysis?.filterOptions?.chemists || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Product Filter */}
            <select
              aria-label="Filter by product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-9 px-2.5 rounded-md border border-input bg-background text-xs font-medium"
            >
              <option value="ALL">All Products</option>
              {(analysis?.filterOptions?.products || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brandName}
                </option>
              ))}
            </select>

            {/* Status Filter (Visit / Order) */}
            <div className="flex gap-1.5">
              <select
                aria-label="Filter by visit status"
                value={visitStatus}
                onChange={(e) => setVisitStatus(e.target.value)}
                className="h-9 flex-1 px-2 rounded-md border border-input bg-background text-xs font-medium"
              >
                <option value="ALL">Visit: All</option>
                <option value="COMPLETED">Completed</option>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="MISSED">Missed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                aria-label="Filter by order status"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="h-9 flex-1 px-2 rounded-md border border-input bg-background text-xs font-medium"
              >
                <option value="ALL">Order: All</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PROCESSING">Processing</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtered KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Calls Executed
            </span>
            <CalendarCheck className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary?.completedVisits ?? 0}{" "}
              <span className="text-sm font-medium text-slate-400">/ {summary?.totalVisits ?? 0}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary?.completionRate ?? 0}% completion • {summary?.verifiedVisits ?? 0} GPS verified
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Doctors & Chemists
            </span>
            <Stethoscope className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary?.uniqueDoctorsVisited ?? 0} Docs • {summary?.uniqueChemistsVisited ?? 0} Chem
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary?.totalSamplesDistributed ?? 0} samples • {summary?.totalVisualAidsShown ?? 0} visual aids
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Orders Value
            </span>
            {isAhead ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-600" />
            )}
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary?.totalOrdersAmount ?? 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary?.totalOrders ?? 0} orders ({summary?.deliveredOrdersCount ?? 0} delivered)
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Collections Recorded
            </span>
            <Receipt className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(summary?.totalCollectionsAmount ?? 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary?.totalCollections ?? 0} Payment Receipts
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Monthly Sales Target
            </span>
            <Target className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(target.targetAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {currentMonthLabel} • {liveAchievementRate}% achieved
            </p>
          </div>
        </div>
      </div>

      {/* Target Progress Bar */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Sales Quota Achievement Progress ({currentMonthLabel})
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {liveAchievementRate}% ({formatCurrency(liveAchievedAmount)} / {formatCurrency(target.targetAmount)})
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAhead ? "bg-gradient-to-r from-sky-500 to-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, liveAchievementRate)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>DCRs: {summary?.dcrApprovedCount ?? 0} Approved / {summary?.dcrSubmittedCount ?? 0} Pending / {summary?.dcrRejectedCount ?? 0} Rejected</span>
            <span>Shortfall: {formatCurrency(liveShortfall)}</span>
            <span>Monthly Target: 100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Activity Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <Button
          variant={activeTab === "VISITS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("VISITS")}
        >
          <CalendarCheck className="h-4 w-4" />
          <span>Visits & Detailing ({filteredVisits.length})</span>
        </Button>

        <Button
          variant={activeTab === "DOCTORS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("DOCTORS")}
        >
          <Stethoscope className="h-4 w-4" />
          <span>Doctors ({doctorsReport.length})</span>
        </Button>

        <Button
          variant={activeTab === "CHEMISTS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("CHEMISTS")}
        >
          <Building2 className="h-4 w-4" />
          <span>Chemists ({chemistsReport.length})</span>
        </Button>

        <Button
          variant={activeTab === "ORDERS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("ORDERS")}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Orders ({filteredOrders.length})</span>
        </Button>

        <Button
          variant={activeTab === "COLLECTIONS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("COLLECTIONS")}
        >
          <Receipt className="h-4 w-4" />
          <span>Collections ({filteredCollections.length})</span>
        </Button>

        <Button
          variant={activeTab === "PRODUCTS_DCR" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("PRODUCTS_DCR")}
        >
          <Package className="h-4 w-4" />
          <span>Products, DCRs & Expenses ({dcrs.length})</span>
        </Button>

        <Button
          variant={activeTab === "TARGET" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("TARGET")}
        >
          <Target className="h-4 w-4" />
          <span>Target & Quota</span>
        </Button>
      </div>

      {/* TAB 1: VISITS */}
      {activeTab === "VISITS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-sky-600" />
              All Visits & Field Detailing History ({filteredVisits.length})
            </CardTitle>
            <CardDescription>
              Filtered doctor & chemist meetings with start–end times, products discussed, visual aids, samples & feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingAnalysis ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading visits...</div>
            ) : filteredVisits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No visits match the selected filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status & GPS</TableHead>
                    <TableHead>Products & Visual Aids</TableHead>
                    <TableHead>Detailing Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((v) => {
                    const isDoctor = v.customerType === "DOCTOR" || v.customerType === "PURCHASING_DOCTOR";
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatDate(v.scheduledDate)}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTime(v.actualStartTime)} – {formatTime(v.actualEndTime)}
                            {v.durationSeconds ? ` (${Math.max(1, Math.round(v.durationSeconds / 60))}m)` : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isDoctor && v.customerId ? (
                            <Link
                              href={`/doctors/${v.customerId}`}
                              className="font-semibold text-xs text-sky-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>{v.customerName}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {v.customerName}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500">
                            {v.customerSubtitle} • {v.customerType.replace("_", " ")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <Badge
                              variant={
                                v.status === "COMPLETED"
                                  ? "success"
                                  : v.status === "IN_PROGRESS"
                                  ? "info"
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
                        <TableCell className="max-w-xs text-xs text-slate-600 dark:text-slate-300">
                          {v.feedbackNotes || <span className="text-slate-400 italic">No feedback notes</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: DOCTORS COVERED */}
      {activeTab === "DOCTORS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-indigo-600" />
              Doctors Covered by {mr.name} ({doctorsReport.length})
            </CardTitle>
            <CardDescription>
              Click any doctor to open their full lifetime profile, past visits, products discussed & feedback history
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {doctorsReport.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No doctor visits match the selected filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor & Specialty</TableHead>
                    <TableHead>Visits (Done / Total)</TableHead>
                    <TableHead>Products & Samples</TableHead>
                    <TableHead>Latest Feedback</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorsReport.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Link
                          href={`/doctors/${doc.id}`}
                          className="font-semibold text-xs text-sky-600 hover:underline"
                        >
                          {doc.name}
                        </Link>
                        <div className="text-[11px] text-slate-500">
                          {doc.specialty} {doc.tier ? `• Tier ${doc.tier}` : ""} •{" "}
                          {doc.customerType === "PURCHASING_DOCTOR" ? "Purchasing Dr" : "Doctor"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {doc.completedVisits} / {doc.totalVisits}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs">
                        <div>{doc.productsDiscussed.length > 0 ? doc.productsDiscussed.join(", ") : "—"}</div>
                        <div className="text-[11px] text-slate-500">
                          {doc.totalSamplesGiven} samples • {doc.visualAidsCount} visual aids
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs italic">
                        {doc.latestFeedback ? `“${doc.latestFeedback}”` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {doc.lastVisitDate ? formatDate(doc.lastVisitDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/doctors/${doc.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <span>Full History</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: CHEMISTS */}
      {activeTab === "CHEMISTS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              Chemists & Pharmacies Covered ({chemistsReport.length})
            </CardTitle>
            <CardDescription>
              Visits, orders booked, delivered values, and payment collections by pharmacy
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {chemistsReport.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No chemist records match the selected filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chemist / Pharmacy</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Orders Booked</TableHead>
                    <TableHead>Delivered Value</TableHead>
                    <TableHead>Collections</TableHead>
                    <TableHead className="text-right">Last Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chemistsReport.map((ch) => (
                    <TableRow key={ch.id}>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {ch.name}
                        </div>
                        {ch.address && <div className="text-[11px] text-slate-500">{ch.address}</div>}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {ch.completedVisits} / {ch.totalVisits}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-sky-600">
                        {formatCurrency(ch.totalOrdersAmount)} ({ch.totalOrdersCount})
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-600">
                        {formatCurrency(ch.deliveredOrdersAmount)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {formatCurrency(ch.totalCollectionsAmount)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500">
                        {ch.lastVisitDate ? formatDate(ch.lastVisitDate) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === "ORDERS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-sky-600" />
              Commercial Orders Booked by {mr.name} ({filteredOrders.length})
            </CardTitle>
            <CardDescription>
              Direct orders booked at chemists, stockists, and purchasing clinics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No orders match the selected filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Line Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {o.orderNumber}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-slate-800 dark:text-slate-200">
                        {o.customerName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(o.createdAt)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs">
                        {o.items.map((it) => `${it.productName} × ${it.quantity}`).join(", ") || `${o.itemsCount} item(s)`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            o.status === "DELIVERED"
                              ? "success"
                              : o.status === "CANCELLED"
                              ? "destructive"
                              : o.status === "ACCEPTED"
                              ? "info"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-slate-900 dark:text-slate-100">
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

      {/* TAB 5: COLLECTIONS */}
      {activeTab === "COLLECTIONS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Payment Collections Reconciled ({filteredCollections.length})
            </CardTitle>
            <CardDescription>
              Receipt vouchers cleared against outstanding chemist invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCollections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No payment receipts match the selected filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Chemist / Pharmacy</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Ref / Cheque #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollections.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {c.receiptNumber}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-slate-800 dark:text-slate-200">
                        {c.customerName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.paymentMode === "UPI"
                              ? "info"
                              : c.paymentMode === "CHEQUE"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {c.paymentMode}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {c.referenceNumber || "Cash Handover"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(c.paymentDate)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(c.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 6: PRODUCTS, DCRS & EXPENSES */}
      {activeTab === "PRODUCTS_DCR" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Package className="h-4 w-4 text-sky-600" />
                  Product Performance ({productsReport.length})
                </CardTitle>
                <CardDescription>Detailing calls, samples distributed, and order volume</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Calls Detailed</TableHead>
                      <TableHead>Samples</TableHead>
                      <TableHead className="text-right">Orders Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-slate-500 py-6">
                          No product activity in this filter range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      productsReport.map((p) => (
                        <TableRow key={p.productId}>
                          <TableCell className="font-semibold text-xs">{p.brandName}</TableCell>
                          <TableCell className="text-xs">{p.visitsDetailed}</TableCell>
                          <TableCell className="text-xs">{p.samplesDistributed}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-emerald-600">
                            {formatCurrency(p.ordersValue)} ({p.ordersQuantity} qty)
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-indigo-600" />
                  Daily Call Reports ({dcrs.length})
                </CardTitle>
                <CardDescription>End-of-day submissions, shift timers, and approval status</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Shift Time</TableHead>
                      <TableHead>Calls</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dcrs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-slate-500 py-6">
                          No DCRs recorded in this date range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dcrs.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="text-xs font-semibold">{formatDate(d.date)}</TableCell>
                          <TableCell className="text-xs font-mono text-slate-500">
                            {formatTime(d.workStartTime)} – {formatTime(d.workEndTime)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {d.totalExecutedCalls}/{d.totalPlannedCalls}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                d.status === "APPROVED"
                                  ? "success"
                                  : d.status === "REJECTED"
                                  ? "destructive"
                                  : "warning"
                              }
                              className="text-[10px]"
                            >
                              {d.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600" />
                  Recent Pharmacy Stock Presence Audits ({productActivity.auditsCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pharmacy</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Stock Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productActivity.recentAudits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-xs text-slate-500 py-6">
                          No shelf presence audits recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      productActivity.recentAudits.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs font-medium">{a.pharmacyName}</TableCell>
                          <TableCell className="text-xs text-slate-600">{a.productName}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                a.status === "AVAILABLE"
                                  ? "success"
                                  : a.status === "LOW_STOCK"
                                  ? "warning"
                                  : "destructive"
                              }
                              className="text-[10px]"
                            >
                              {a.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  Expense Claims ({expenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-slate-500 py-6">
                          No expense claims in this range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs font-semibold">{e.title}</TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(e.startDate)}</TableCell>
                          <TableCell>
                            <Badge variant={e.status === "APPROVED" ? "success" : "warning"} className="text-[10px]">
                              {e.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold">
                            {formatCurrency(e.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 7: TARGET TRACKING */}
      {activeTab === "TARGET" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Monthly Sales Quota Breakdown</CardTitle>
              <CardDescription>{currentMonthLabel} target performance and run-rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Monthly Sales Quota</span>
                <span className="font-bold">{formatCurrency(target.targetAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Achieved Commercial Value</span>
                <span className="font-bold text-emerald-600">{formatCurrency(liveAchievedAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Achievement Rate</span>
                <span className="font-semibold">{liveAchievementRate}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Shortfall to Quota</span>
                <span className="font-semibold text-rose-600">{formatCurrency(liveShortfall)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Pacing Status</span>
                <Badge variant={isAhead ? "success" : "destructive"}>
                  {mr.performanceStatus.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Call Quota & Frequency Goals</CardTitle>
              <CardDescription>Physician reach target vs completed calls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Monthly Visit Target</span>
                <span className="font-bold">{target.visitTarget} Calls</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Visits Achieved</span>
                <span className="font-bold text-sky-600">{target.visitAchieved} Calls</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Visit Completion Rate</span>
                <span className="font-semibold">{target.visitAchievementRate}%</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Daily Target Expectation</span>
                <span className="font-semibold">{target.dailyCallGoal} doctor visits / day</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role Transition Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={
          targetRole === "MANAGER"
            ? "Promote Representative to Area Sales Manager"
            : "Demote Manager to Medical Representative"
        }
        description={
          targetRole === "MANAGER"
            ? `Promoting ${mr.name} grants supervisory authority to oversee regional MRs, review doctor detailing metrics, and guide territory performance.`
            : `Demoting ${mr.name} reassigns them to direct field doctor and chemist visit duties.`
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          {roleModalError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{roleModalError}</span>
            </div>
          )}

          {roleModalSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{roleModalSuccess}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Employee:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {mr.name} ({mr.employeeId})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Current Role:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isCurrentManager ? "Area Sales Manager" : "Medical Representative"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">New Role Assignment:</span>
              <Badge
                className={
                  targetRole === "MANAGER"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-sky-100 text-sky-800 border-sky-300"
                }
              >
                {targetRole === "MANAGER" ? "Area Sales Manager" : "Medical Representative"}
              </Badge>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Designation
            </label>
            <input
              type="text"
              value={roleModalDesignation}
              onChange={(e) => setRoleModalDesignation(e.target.value)}
              placeholder={targetRole === "MANAGER" ? "Area Sales Manager" : "Medical Representative"}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Appears on official attendance logs, performance records, and company directories.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            {targetRole === "MANAGER" ? (
              <p>
                <strong>Supervisory Notice:</strong> This promotion enables this individual to be selected as a Reporting Manager for field representatives in your company. Daily visit targets will adjust to manager standard (5 calls/day).
              </p>
            ) : (
              <p>
                <strong>Field Reassignment Notice:</strong> Any representatives currently reporting to this manager will be safely detached from their hierarchy to maintain reporting integrity. Daily call goals return to 10 calls/day.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              disabled={changeRoleMutation.isPending}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRoleChange}
              disabled={changeRoleMutation.isPending}
              className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer ${
                targetRole === "MANAGER"
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-sky-600 hover:bg-sky-500"
              } disabled:opacity-50`}
            >
              {changeRoleMutation.isPending
                ? "Updating Role..."
                : targetRole === "MANAGER"
                ? "Confirm Promotion to Manager"
                : "Confirm Demotion to MR"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Change Password for ${mr.name}`}
        description={`Set a new account password for this representative (${mr.email}).`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {passwordModalError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordModalError}</span>
            </div>
          )}

          {passwordModalSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{passwordModalSuccess}</span>
            </div>
          )}

          {/* User info card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Representative:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {mr.name} ({mr.employeeId})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Work Email:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                {mr.email}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Designation:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {mr.designation}
              </span>
            </div>
          </div>

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <button
                type="button"
                onClick={handleGenerateRandomPassword}
                className="text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                Generate Strong Password
              </button>
            </div>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 pr-20 text-xs text-slate-900 focus:border-[#FF6B00] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-mono"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    title="Copy password"
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 pr-10 text-xs text-slate-900 focus:border-[#FF6B00] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-rose-500 mt-1">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 space-y-1">
            <p className="font-semibold">Security Notice:</p>
            <p className="text-[11px] leading-relaxed">
              Updating this user&apos;s password will immediately invalidate any active mobile app or web sessions for this account. The representative must use this new password on their next login.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={resetPasswordMutation.isPending}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmPasswordReset}
              disabled={resetPasswordMutation.isPending}
              className="rounded-xl bg-[#FF6B00] hover:bg-[#E85E00] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
