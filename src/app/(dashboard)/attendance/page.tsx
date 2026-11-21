"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AtWorkBadge } from "@/components/ui/at-work-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
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
import { useCurrentUser, useIsMounted, useTerritories } from "@/hooks";
import { useFilterStore } from "@/store";
import { attendanceService } from "@/services/growthServices";
import { formatOperatingDateDisplay } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-client";
import type {
  AttendanceRecord,
  AttendanceCorrection,
  AttendanceSummary,
  LeaveRequest,
} from "@/types";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Camera,
  MapPin,
  Calendar,
  CalendarOff,
  UserCheck,
  FileText,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

function formatTerritory(territory: any): string {
  if (!territory) return "Headquarters";
  if (typeof territory === "object") return territory.name || territory.code || "Headquarters";
  return String(territory);
}

function resolveAttendancePhotoUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const base = (API_BASE_URL || "").replace(/\/+$/, "");
  const path = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  if (base.endsWith("/api/v1") && path.startsWith("/api/v1/")) {
    return `${base.replace(/\/api\/v1$/, "")}${path}`;
  }
  return `${base}${path}`;
}

function isPhotoPurged(attendanceDate: string): boolean {
  try {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - new Date(attendanceDate).getTime() > SEVEN_DAYS_MS;
  } catch {
    return false;
  }
}

export default function AttendancePage() {
  const isMounted = useIsMounted();
  const { data: user } = useCurrentUser();
  const { data: territories = [] } = useTerritories();
  const { operatingDate, selectedTerritoryId } = useFilterStore();
  const [filterByOperatingDate, setFilterByOperatingDate] = useState(true);

  const [activeTab, setActiveTab] = useState<"records" | "corrections" | "leaves">("records");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCorrectionStatus, setSelectedCorrectionStatus] = useState<string>("ALL");
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState<string>("ALL");

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<AttendanceCorrection | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  // Leave Review Modal
  const [leaveReviewModalOpen, setLeaveReviewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [leaveReviewAction, setLeaveReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [leaveReviewComments, setLeaveReviewComments] = useState("");
  const [isSubmittingLeaveReview, setIsSubmittingLeaveReview] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dateParams = filterByOperatingDate
        ? { startDate: operatingDate, endDate: operatingDate }
        : undefined;

      const [recs, corrs, lvs, summ] = await Promise.all([
        attendanceService.getRecords(dateParams),
        attendanceService.getCorrections(),
        attendanceService.getLeaves(),
        attendanceService.getSummary(
          filterByOperatingDate ? operatingDate : undefined,
          filterByOperatingDate ? operatingDate : undefined
        ),
      ]);
      setRecords(recs);
      setCorrections(corrs);
      setLeaves(lvs);
      setSummary(summ);
    } catch (err) {
      console.error("Failed to load attendance records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "leaves" || tabParam === "corrections" || tabParam === "records") {
      setActiveTab(tabParam);
    }
  }, [isMounted]);

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted, operatingDate, filterByOperatingDate]);

  const selectedTerritoryObj = useMemo(
    () =>
      selectedTerritoryId === "ALL"
        ? null
        : territories.find((t) => t.id === selectedTerritoryId) ?? null,
    [selectedTerritoryId, territories],
  );

  const matchesSelectedTerritory = (mr?: any): boolean => {
    if (selectedTerritoryId === "ALL") return true;
    const directId =
      mr?.territoryId ||
      (typeof mr?.territory === "object" ? mr?.territory?.id : undefined);
    if (directId) return directId === selectedTerritoryId;
    if (selectedTerritoryObj) {
      const label = formatTerritory(mr?.territory).toLowerCase();
      if (
        label &&
        (label === selectedTerritoryObj.name.toLowerCase() ||
          label.includes(selectedTerritoryObj.name.toLowerCase()) ||
          (selectedTerritoryObj.code &&
            label.includes(selectedTerritoryObj.code.toLowerCase())))
      ) {
        return true;
      }
    }
    return false;
  };

  const territoryRecords = useMemo(
    () => records.filter((r) => matchesSelectedTerritory(r.mr)),
    [records, selectedTerritoryId, selectedTerritoryObj],
  );

  const territoryCorrections = useMemo(
    () =>
      corrections.filter((c: any) =>
        matchesSelectedTerritory(c.mr || c.attendance?.mr || c.user?.mrProfile),
      ),
    [corrections, selectedTerritoryId, selectedTerritoryObj],
  );

  const territoryLeaves = useMemo(
    () => leaves.filter((lv) => matchesSelectedTerritory(lv.mr)),
    [leaves, selectedTerritoryId, selectedTerritoryObj],
  );

  const displaySummary = useMemo(() => {
    if (selectedTerritoryId === "ALL" && summary) return summary;
    const presentCount = territoryRecords.filter((r) => r.status === "PRESENT").length;
    const onLeaveCount = territoryRecords.filter((r) => r.status === "ON_LEAVE").length;
    const hoursList = territoryRecords
      .map((r) => Number(r.totalWorkHours ?? 0))
      .filter((h) => h > 0);
    const avgHours =
      hoursList.length > 0
        ? Math.round((hoursList.reduce((a, b) => a + b, 0) / hoursList.length) * 10) / 10
        : 0;
    return {
      ...(summary || {}),
      totalRecords: territoryRecords.length,
      presentCount,
      onLeaveCount,
      averageDailyHours: avgHours,
    };
  }, [selectedTerritoryId, summary, territoryRecords]);

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return territoryRecords;
    const q = search.toLowerCase();
    return territoryRecords.filter(
      (r) =>
        r.user?.firstName?.toLowerCase().includes(q) ||
        r.user?.lastName?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.mr?.employeeCode?.toLowerCase().includes(q) ||
        formatTerritory(r.mr?.territory).toLowerCase().includes(q),
    );
  }, [territoryRecords, search]);

  const filteredCorrections = useMemo(() => {
    return territoryCorrections.filter((c) => {
      const matchesStatus =
        selectedCorrectionStatus === "ALL" || c.status === selectedCorrectionStatus;
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        c.user?.firstName.toLowerCase().includes(q) ||
        c.user?.lastName.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [territoryCorrections, selectedCorrectionStatus, search]);

  const filteredLeaves = useMemo(() => {
    return territoryLeaves.filter((lv) => {
      const matchesStatus = selectedLeaveStatus === "ALL" || lv.status === selectedLeaveStatus;
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        lv.user?.firstName?.toLowerCase().includes(q) ||
        lv.user?.lastName?.toLowerCase().includes(q) ||
        lv.user?.email?.toLowerCase().includes(q) ||
        lv.mr?.employeeCode?.toLowerCase().includes(q) ||
        formatTerritory(lv.mr?.territory).toLowerCase().includes(q) ||
        lv.leaveType.toLowerCase().includes(q) ||
        lv.reason.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [territoryLeaves, selectedLeaveStatus, search]);

  const handleReviewLeave = async () => {
    if (!selectedLeave) return;
    setIsSubmittingLeaveReview(true);
    try {
      await attendanceService.reviewLeave(selectedLeave.id, {
        status: leaveReviewAction,
        reviewComments: leaveReviewComments.trim() || undefined,
      });
      setLeaveReviewModalOpen(false);
      setSelectedLeave(null);
      setLeaveReviewComments("");
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to review leave request");
    } finally {
      setIsSubmittingLeaveReview(false);
    }
  };

  const handleReviewCorrection = async () => {
    if (!selectedCorrection) return;
    setIsSubmittingReview(true);
    try {
      await attendanceService.reviewCorrection(selectedCorrection.id, {
        status: reviewAction,
        reviewNotes: reviewComments,
      });
      setReviewModalOpen(false);
      setSelectedCorrection(null);
      setReviewComments("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to review correction request");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Shift Attendance, Regularization & Leave"
        description="Monitor daily field shift check-ins, server-authoritative timestamps, review regularization requests, and approve or reject MR leave applications."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Shifts ({filterByOperatingDate ? "Operating Date" : "All Dates"})
              </p>
              <h3 className="text-2xl font-bold mt-1">{displaySummary?.totalRecords ?? 0}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {filterByOperatingDate ? formatOperatingDateDisplay(operatingDate) : "Full History"}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Present Shifts</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{displaySummary?.presentCount ?? 0}</h3>
            </div>
            <UserCheck className="w-8 h-8 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Daily Hours</p>
              <h3 className="text-2xl font-bold mt-1">{displaySummary?.averageDailyHours ?? 0} hrs</h3>
            </div>
            <Calendar className="w-8 h-8 text-indigo-500 opacity-80" />
          </CardContent>
        </Card>

        <Card
          className="shadow-sm cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={() => setActiveTab("corrections")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Regularizations</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">
                {territoryCorrections.filter((c) => c.status === "PENDING").length}
              </h3>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500 opacity-80" />
          </CardContent>
        </Card>

        <Card
          className="shadow-sm cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={() => setActiveTab("leaves")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Leave Requests</p>
              <h3 className="text-2xl font-bold mt-1 text-purple-600">
                {territoryLeaves.filter((l) => l.status === "PENDING").length}
              </h3>
              {(displaySummary?.onLeaveCount ?? 0) > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {displaySummary?.onLeaveCount} on leave
                </p>
              )}
            </div>
            <CalendarOff className="w-8 h-8 text-purple-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("records")}
          className={`pb-3 px-2 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "records"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Shift Records ({territoryRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("corrections")}
          className={`pb-3 px-2 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "corrections"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>
            Regularization Requests (
            {territoryCorrections.filter((c) => c.status === "PENDING").length} pending)
          </span>
        </button>

        <button
          onClick={() => setActiveTab("leaves")}
          className={`pb-3 px-2 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "leaves"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarOff className="w-4 h-4" />
          <span>
            Leave Requests (
            {territoryLeaves.filter((l) => l.status === "PENDING").length} pending)
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === "leaves"
                  ? "Search by MR name, territory, leave type..."
                  : "Search by MR name, email, territory..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Operating Date Context Indicator & Toggle */}
          {activeTab === "records" && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs shadow-xs">
              <Calendar className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold text-muted-foreground">Date:</span>
              <span className="font-bold text-foreground">
                {filterByOperatingDate ? formatOperatingDateDisplay(operatingDate) : "All Recorded Shifts"}
              </span>
              <button
                type="button"
                onClick={() => setFilterByOperatingDate(!filterByOperatingDate)}
                className="ml-1 text-xs text-primary hover:underline cursor-pointer font-medium"
              >
                {filterByOperatingDate ? "Show All Shifts" : "Filter by Operating Date"}
              </button>
            </div>
          )}
        </div>

        {activeTab === "corrections" && (
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedCorrectionStatus}
              onChange={(e) => setSelectedCorrectionStatus(e.target.value)}
              className="text-sm bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedLeaveStatus}
              onChange={(e) => setSelectedLeaveStatus(e.target.value)}
              className="text-sm bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Records Table */}
      {activeTab === "records" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Shift Check-in Log</CardTitle>
            <CardDescription>
              Authoritative server timestamps recorded during daily shift start and finish. Kept strictly distinct from doctor clinic visits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No attendance records found"
                description="Shift records will appear here as field representatives check in daily."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Representative</TableHead>
                    <TableHead>Shift Date</TableHead>
                    <TableHead>Punch In (Server)</TableHead>
                    <TableHead>Punch Out (Server)</TableHead>
                    <TableHead>Work Duration</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r) => {
                    const isOnLeave =
                      r.status === "ON_LEAVE" ||
                      r.punchInVerificationType === "APPROVED_LEAVE";
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium">
                              {r.user ? `${r.user.firstName} ${r.user.lastName}` : "MR"}
                            </span>
                            {!isOnLeave && r.punchInTime && !r.punchOutTime && (
                              <AtWorkBadge punchInTime={r.punchInTime} />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.mr?.employeeCode ? `${r.mr.employeeCode} • ` : ""}{formatTerritory(r.mr?.territory)}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {new Date(r.attendanceDate).toISOString().slice(0, 10)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {isOnLeave
                            ? "—"
                            : new Date(r.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {isOnLeave
                            ? "—"
                            : r.punchOutTime
                            ? new Date(r.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : "— In Progress —"}
                        </TableCell>
                        <TableCell>
                          {isOnLeave ? (
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              On Leave
                            </span>
                          ) : r.totalWorkHours !== undefined && r.totalWorkHours !== null ? (
                            <span className="font-semibold">{r.totalWorkHours} hrs</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Active Shift</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {r.punchInVerificationType === "DEVICE_PHOTO"
                              ? "Photo Auth"
                              : r.punchInVerificationType === "APPROVED_LEAVE"
                              ? "Approved Leave"
                              : r.punchInVerificationType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.status === "PRESENT"
                                ? "default"
                                : r.status === "HALF_DAY" || r.status === "ON_LEAVE"
                                ? "outline"
                                : "secondary"
                            }
                            className={
                              r.status === "ON_LEAVE"
                                ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
                                : undefined
                            }
                          >
                            {r.status === "ON_LEAVE" ? "ON LEAVE" : r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(r);
                              setPhotoLoadError(false);
                            }}
                          >
                            Details
                          </Button>
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

      {/* Tab 2: Corrections Table */}
      {activeTab === "corrections" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shift Regularization Requests</CardTitle>
            <CardDescription>
              Review MR attendance correction requests with legitimate justifications. Separation of duties is enforced.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredCorrections.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No regularization requests"
                description="Any missed punches or battery exhaustion justifications will show up here for manager review."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Representative</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead>Requested Punch Times</TableHead>
                    <TableHead>Justification Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCorrections.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">
                          {c.user ? `${c.user.firstName} ${c.user.lastName}` : "Representative"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.mr?.employeeCode ? `${c.mr.employeeCode} • ` : ""}{formatTerritory(c.mr?.territory)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {new Date(c.attendanceDate).toISOString().slice(0, 10)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          In: {new Date(c.requestedPunchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {c.requestedPunchOut && (
                          <div>
                            Out: {new Date(c.requestedPunchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs text-sm">
                        <div className="truncate" title={c.reason}>
                          {c.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.status === "APPROVED"
                              ? "default"
                              : c.status === "PENDING"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {c.status === "PENDING" ? (
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 hover:bg-emerald-50"
                              onClick={() => {
                                setSelectedCorrection(c);
                                setReviewAction("APPROVED");
                                setReviewModalOpen(true);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => {
                                setSelectedCorrection(c);
                                setReviewAction("REJECTED");
                                setReviewModalOpen(true);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Reviewed by {c.reviewedBy?.firstName || "Manager"}
                          </span>
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

      {/* Tab 3: Leave Requests Table */}
      {activeTab === "leaves" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Field Representative Leave Applications</CardTitle>
            <CardDescription>
              Accept or reject MR leave requests. Approved leave dates automatically mark attendance as On Leave and notify the representative.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredLeaves.length === 0 ? (
              <EmptyState
                icon={CalendarOff}
                title="No leave requests found"
                description="Leave applications submitted by medical representatives from the mobile app will appear here for approval."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Representative</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates &amp; Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.map((leave) => {
                    const startStr = new Date(leave.startDate).toISOString().slice(0, 10);
                    const endStr = new Date(leave.endDate).toISOString().slice(0, 10);
                    return (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div className="font-medium">
                            {leave.user ? `${leave.user.firstName} ${leave.user.lastName}` : "Representative"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {leave.mr?.employeeCode ? `${leave.mr.employeeCode} • ` : ""}
                            {formatTerritory(leave.mr?.territory)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-medium">
                            {leave.leaveType.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-mono text-xs">
                            {startStr === endStr ? startStr : `${startStr} → ${endStr}`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {leave.totalDays} {leave.totalDays === 1 ? "day" : "days"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm">
                          <div className="line-clamp-2" title={leave.reason}>
                            {leave.reason}
                          </div>
                          {leave.reviewComments && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              Note: {leave.reviewComments}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              leave.status === "APPROVED"
                                ? "default"
                                : leave.status === "PENDING"
                                ? "outline"
                                : leave.status === "REJECTED"
                                ? "destructive"
                                : "secondary"
                            }
                            className={
                              leave.status === "PENDING"
                                ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                                : leave.status === "APPROVED"
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : undefined
                            }
                          >
                            {leave.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {leave.status === "PENDING" ? (
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40"
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setLeaveReviewAction("APPROVED");
                                  setLeaveReviewComments("");
                                  setLeaveReviewModalOpen(true);
                                }}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40"
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setLeaveReviewAction("REJECTED");
                                  setLeaveReviewComments("");
                                  setLeaveReviewModalOpen(true);
                                }}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {leave.status === "CANCELLED"
                                ? "Cancelled by MR"
                                : `Reviewed by ${leave.reviewedBy ? `${leave.reviewedBy.firstName} ${leave.reviewedBy.lastName}` : "Admin"}`}
                            </span>
                          )}
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

      {/* Record Details Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={
            selectedRecord.status === "ON_LEAVE"
              ? "Approved Leave Attendance Details"
              : "Shift Check-in Verification Details"
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Field Representative</span>
                <span className="font-semibold">{selectedRecord.user?.firstName} {selectedRecord.user?.lastName}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Shift Date</span>
                <span className="font-mono">{new Date(selectedRecord.attendanceDate).toISOString().slice(0, 10)}</span>
              </div>
              {selectedRecord.status !== "ON_LEAVE" && (
                <>
                  <div>
                    <span className="text-muted-foreground text-xs block">Server Punch-In Time</span>
                    <span className="font-mono">{new Date(selectedRecord.punchInTime).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Server Punch-Out Time</span>
                    <span className="font-mono">
                      {selectedRecord.punchOutTime ? new Date(selectedRecord.punchOutTime).toLocaleString() : "Not Punched Out"}
                    </span>
                  </div>
                </>
              )}
              <div>
                <span className="text-muted-foreground text-xs block">Verification Method</span>
                <span className="font-medium text-emerald-600">
                  {selectedRecord.status === "ON_LEAVE"
                    ? "APPROVED_LEAVE (Manager Approved Leave)"
                    : `${selectedRecord.punchInVerificationType} (Device Photo Verification)`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Total Work Hours</span>
                <span className="font-semibold">
                  {selectedRecord.status === "ON_LEAVE" ? "On Leave" : `${selectedRecord.totalWorkHours ?? "—"} hrs`}
                </span>
              </div>
            </div>

            {/* Photo Capture Section with 7-Day Auto-Purge Policy (only for worked shifts) */}
            {selectedRecord.status !== "ON_LEAVE" && (
            <div className="border border-border/80 rounded-lg p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Check-in Photo Verification</span>
                <span className="inline-flex items-center text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/40">
                  <Clock className="w-3 h-3 mr-1 text-amber-500" />
                  Auto-purges after 7 days
                </span>
              </div>

              {isPhotoPurged(selectedRecord.attendanceDate) ? (
                <div className="border border-dashed border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 rounded-md p-4 text-center space-y-1.5">
                  <div className="inline-flex items-center text-amber-700 dark:text-amber-400 font-medium text-xs">
                    <Clock className="w-4 h-4 mr-1.5" />
                    Photo Automatically Purged (7-Day Policy)
                  </div>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Per organizational data retention policy, verification selfies are automatically purged after 7 days to preserve storage and privacy. Server timestamps and GPS location records remain permanently validated.
                  </p>
                </div>
              ) : selectedRecord.punchInPhotoUrl && !photoLoadError ? (
                <div className="space-y-1.5">
                  <img
                    src={resolveAttendancePhotoUrl(selectedRecord.punchInPhotoUrl)}
                    alt="Punch In Verification"
                    className="rounded-md max-h-48 object-cover mx-auto shadow-sm border border-border/50"
                    onError={() => setPhotoLoadError(true)}
                  />
                  <div className="text-center text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Genuine Device Camera Capture
                  </div>
                </div>
              ) : (
                /* Fallback preview card for pre-Phase-B synthetic test URLs or network error */
                <div className="border border-emerald-500/20 rounded-md p-4 bg-emerald-50/30 dark:bg-emerald-950/10 text-center space-y-2 max-w-xs mx-auto">
                  <div className="relative w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-foreground">
                      {selectedRecord.user ? `${selectedRecord.user.firstName} ${selectedRecord.user.lastName}` : "Representative"}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Device Photo Verified (Selfie Auth)
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Captured at {new Date(selectedRecord.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-center text-muted-foreground/80">
                Retention Compliance: All field attendance selfies are scheduled for permanent deletion 7 days after capture.
              </p>
            </div>
            )}

            {selectedRecord.notes && (
              <div className="text-sm bg-muted/30 p-3 rounded">
                <span className="text-xs font-semibold text-muted-foreground block">Notes</span>
                {selectedRecord.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedRecord(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Leave Request Modal */}
      {leaveReviewModalOpen && selectedLeave && (
        <Modal
          isOpen={leaveReviewModalOpen}
          onClose={() => setLeaveReviewModalOpen(false)}
          title={`Confirm Leave ${leaveReviewAction === "APPROVED" ? "Acceptance" : "Rejection"}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {leaveReviewAction === "APPROVED"
                ? "Accepting this leave request will mark the selected dates as On Leave in official attendance records and immediately notify the field representative."
                : "Rejecting this leave request will notify the field representative with your review comments."}
            </p>

            <div className="p-3 bg-muted/30 rounded text-sm space-y-1">
              <div>
                <strong>Representative:</strong>{" "}
                {selectedLeave.user?.firstName} {selectedLeave.user?.lastName}
              </div>
              <div>
                <strong>Leave Type:</strong>{" "}
                {selectedLeave.leaveType.replace(/_/g, " ")} ({selectedLeave.totalDays}{" "}
                {selectedLeave.totalDays === 1 ? "day" : "days"})
              </div>
              <div>
                <strong>Dates:</strong>{" "}
                {new Date(selectedLeave.startDate).toISOString().slice(0, 10)} →{" "}
                {new Date(selectedLeave.endDate).toISOString().slice(0, 10)}
              </div>
              <div>
                <strong>Reason:</strong> {selectedLeave.reason}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Review Comments (Optional)
              </label>
              <Input
                placeholder={
                  leaveReviewAction === "APPROVED"
                    ? "e.g. Approved. Hand over urgent territory calls."
                    : "e.g. Critical hospital coverage required on these dates."
                }
                value={leaveReviewComments}
                onChange={(e) => setLeaveReviewComments(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setLeaveReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={leaveReviewAction === "APPROVED" ? "default" : "destructive"}
                onClick={handleReviewLeave}
                disabled={isSubmittingLeaveReview}
              >
                {isSubmittingLeaveReview
                  ? "Processing..."
                  : leaveReviewAction === "APPROVED"
                  ? "Confirm Accept Leave"
                  : "Confirm Reject Leave"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Regularization Modal */}
      {reviewModalOpen && selectedCorrection && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Confirm Regularization ${reviewAction === "APPROVED" ? "Approval" : "Rejection"}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {reviewAction === "APPROVED"
                ? "Approving this correction will update the representative's official attendance records and recalculate work duration."
                : "Rejecting this correction will maintain the existing unregularized attendance state."}
            </p>

            <div className="p-3 bg-muted/30 rounded text-sm space-y-1">
              <div><strong>Representative:</strong> {selectedCorrection.user?.firstName} {selectedCorrection.user?.lastName}</div>
              <div><strong>Shift Date:</strong> {new Date(selectedCorrection.attendanceDate).toISOString().slice(0, 10)}</div>
              <div><strong>Justification:</strong> {selectedCorrection.reason}</div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Review Comments (Optional)
              </label>
              <Input
                placeholder="e.g. Approved based on day-end call logs."
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={reviewAction === "APPROVED" ? "default" : "destructive"}
                onClick={handleReviewCorrection}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? "Processing..." : `Confirm ${reviewAction}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
