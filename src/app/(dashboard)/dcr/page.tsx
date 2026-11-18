"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/ui/empty-state";
import {
  FileCheck,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Search,
  Filter,
  AlertCircle,
  Clock,
  Calendar,
  Lock,
  Unlock,
  MapPin,
  ShoppingBag,
  CreditCard,
  User,
  Building2,
  Stethoscope,
  RefreshCw,
  Presentation,
  Pill,
  MessageSquare,
} from "lucide-react";
import { dcrService, DailyCallReport, DcrStatus } from "@/services/dcrService";
import { useFilterStore } from "@/store";
import { getLocalTodayDate, formatOperatingDateDisplay } from "@/lib/utils";

export default function DailyCallReportsPage() {
  const { operatingDate, setOperatingDate, selectedTerritoryId } = useFilterStore();
  const [showAllDates, setShowAllDates] = useState(false);
  const activeDate = showAllDates ? "" : operatingDate;
  const [statusFilter, setStatusFilter] = useState<DcrStatus | "ALL">("ALL");
  const [unlockRequestsOnly, setUnlockRequestsOnly] = useState(false);
  const [pendingUnlockCount, setPendingUnlockCount] = useState(0);
  const [search, setSearch] = useState("");

  const [dcrs, setDcrs] = useState<DailyCallReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Inspection Modal
  const [selectedDcr, setSelectedDcr] = useState<DailyCallReport | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Action State (Approve, Reject, Reopen, Unlock Review)
  const [actionType, setActionType] = useState<
    "APPROVE" | "REJECT" | "REOPEN" | "APPROVE_UNLOCK" | "REJECT_UNLOCK" | null
  >(null);
  const [actionComments, setActionComments] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchDcrs = useCallback(async () => {
    setIsLoading(true);
    try {
      const territoryParam = selectedTerritoryId && selectedTerritoryId !== "ALL" ? selectedTerritoryId : undefined;
      const [res, pendingUnlocksRes] = await Promise.all([
        dcrService.getDcrs({
          date: unlockRequestsOnly ? undefined : activeDate || undefined,
          status: unlockRequestsOnly ? "ALL" : statusFilter,
          unlockRequestStatus: unlockRequestsOnly ? "PENDING" : undefined,
          territoryId: territoryParam,
        }),
        dcrService.getDcrs({
          unlockRequestStatus: "PENDING",
          territoryId: territoryParam,
          limit: 100,
        }),
      ]);
      setDcrs(res.items);
      setPendingUnlockCount(pendingUnlocksRes.total ?? pendingUnlocksRes.items.length);
    } catch (err) {
      console.warn("Failed to fetch DCRs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeDate, statusFilter, unlockRequestsOnly, selectedTerritoryId]);

  useEffect(() => {
    if (isMounted) {
      fetchDcrs();
    }
  }, [fetchDcrs, isMounted]);

  const handleOpenDetails = async (dcr: DailyCallReport) => {
    setActionType(null);
    setActionComments("");
    try {
      const full = await dcrService.getDcrById(dcr.id);
      setSelectedDcr(full || dcr);
    } catch {
      setSelectedDcr(dcr);
    }
    setIsDetailsOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedDcr || !actionType) return;
    setIsSubmittingAction(true);
    try {
      if (actionType === "APPROVE") {
        await dcrService.approveDcr(selectedDcr.id, actionComments);
      } else if (actionType === "REJECT") {
        if (!actionComments.trim()) {
          alert("Review comments are required when rejecting a Daily Call Report.");
          setIsSubmittingAction(false);
          return;
        }
        await dcrService.rejectDcr(selectedDcr.id, actionComments);
      } else if (actionType === "REOPEN") {
        if (!actionComments.trim()) {
          alert("A mandatory reason is required to authorize unlocking and reopening a DCR.");
          setIsSubmittingAction(false);
          return;
        }
        await dcrService.reopenDcr(selectedDcr.id, actionComments);
      } else if (actionType === "APPROVE_UNLOCK") {
        await dcrService.reviewUnlockRequest(selectedDcr.id, "APPROVED", actionComments);
      } else if (actionType === "REJECT_UNLOCK") {
        await dcrService.reviewUnlockRequest(selectedDcr.id, "REJECTED", actionComments);
      }
      setActionType(null);
      setActionComments("");
      setIsDetailsOpen(false);
      await fetchDcrs();
    } catch (err: any) {
      alert(err?.message || "Failed to execute action");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredDcrs = dcrs.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const mrName = d.mr?.user ? `${d.mr.user.firstName} ${d.mr.user.lastName}` : "";
    const empCode = d.mr?.employeeCode || "";
    const territory = d.territory?.name || "";
    return (
      mrName.toLowerCase().includes(q) ||
      empCode.toLowerCase().includes(q) ||
      territory.toLowerCase().includes(q)
    );
  });

  // Aggregated Counters
  const totalCount = dcrs.length;
  const submittedCount = dcrs.filter((d) => d.status === "SUBMITTED").length;
  const approvedCount = dcrs.filter((d) => d.status === "APPROVED").length;
  const reopenedCount = dcrs.filter((d) => d.status === "REOPENED").length;
  const totalCallsLogged = dcrs.reduce((sum, d) => sum + (d.totalExecutedCalls || 0), 0);
  const totalOrdersAmount = dcrs.reduce((sum, d) => sum + Number(d.totalOrdersAmount || 0), 0);

  const getStatusBadge = (status: DcrStatus) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">APPROVED 🔒</Badge>;
      case "SUBMITTED":
        return <Badge variant="warning">SUBMITTED (Pending Review 🔒)</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">REJECTED</Badge>;
      case "REOPENED":
        return <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40">REOPENED (Unlocked 🔓)</Badge>;
      case "DRAFT":
      default:
        return <Badge variant="secondary">DRAFT (In Progress)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Call Reports (DCR)"
        description="Formal Daily Call Submission, End-of-Day Review, Visit Locking, and Authorized Corrections"
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/80">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reports Logged</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{totalCount}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Date: {unlockRequestsOnly ? "All Pending Unlocks" : activeDate ? formatOperatingDateDisplay(activeDate) : "All Recorded Dates"}
          </div>
        </Card>
        <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/40">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Review</div>
          <div className="text-2xl font-bold mt-1 text-amber-900 dark:text-amber-200">{submittedCount}</div>
          <div className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">Calls Locked 🔒</div>
        </Card>
        <Card
          onClick={() => setUnlockRequestsOnly((prev) => !prev)}
          className={`p-4 cursor-pointer transition-all border ${
            unlockRequestsOnly
              ? "bg-indigo-100/80 dark:bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500"
              : "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-800/40 hover:border-indigo-400"
          }`}
        >
          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Unlock Requests</div>
          <div className="text-2xl font-bold mt-1 text-indigo-900 dark:text-indigo-200">{pendingUnlockCount}</div>
          <div className="text-xs text-indigo-700/80 dark:text-indigo-400/80 mt-1">
            {unlockRequestsOnly ? "Showing pending unlocks" : "Click to review 🔓"}
          </div>
        </Card>
        <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/40">
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Approved Reports</div>
          <div className="text-2xl font-bold mt-1 text-emerald-900 dark:text-emerald-200">{approvedCount}</div>
          <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">Finalized Ledger</div>
        </Card>
        <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/40">
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Reopened (Unlocked)</div>
          <div className="text-2xl font-bold mt-1 text-blue-900 dark:text-blue-200">{reopenedCount}</div>
          <div className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1">Ready for Resend 🔓</div>
        </Card>
        <Card className="p-4 bg-card border-border/80">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calls / Order Booking</div>
          <div className="text-2xl font-bold mt-1 text-primary">{totalCallsLogged} Calls</div>
          <div className="text-xs text-muted-foreground mt-1">₹{totalOrdersAmount.toLocaleString("en-IN")} secondary sales</div>
        </Card>
      </div>

      {/* Control Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Date Input */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                aria-label="Filter DCR by date"
                value={activeDate}
                onChange={(e) => {
                  setUnlockRequestsOnly(false);
                  setShowAllDates(false);
                  if (e.target.value) {
                    setOperatingDate(e.target.value);
                  }
                }}
                className="h-9 px-3 py-1 rounded-md border border-input bg-background text-sm font-medium focus:ring-1 focus:ring-ring cursor-pointer"
              />
              {activeDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setUnlockRequestsOnly(false);
                    setShowAllDates(true);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
                >
                  Show All Dates
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUnlockRequestsOnly(false);
                    setShowAllDates(false);
                    setOperatingDate(getLocalTodayDate());
                  }}
                  className="text-xs text-primary hover:underline ml-1 cursor-pointer"
                >
                  Reset to Operating Date
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-1 border border-border rounded-md p-0.5 bg-muted/40">
              {(["ALL", "SUBMITTED", "APPROVED", "REJECTED", "REOPENED", "DRAFT"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setUnlockRequestsOnly(false);
                    setStatusFilter(st);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    !unlockRequestsOnly && statusFilter === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
              <button
                onClick={() => setUnlockRequestsOnly((prev) => !prev)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  unlockRequestsOnly
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/50"
                }`}
              >
                <Unlock className="h-3 w-3" />
                UNLOCK REQUESTS ({pendingUnlockCount})
              </button>
            </div>
          </div>

          {/* Search Box & Refresh */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search MR, employee code, territory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDcrs()}
              disabled={isLoading}
              className="h-9 gap-1.5 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* DCR Registry Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Daily Call Reports Registry</span>
            <span className="text-xs font-normal text-muted-foreground">
              Showing {filteredDcrs.length} records
            </span>
          </CardTitle>
          <CardDescription>
            Representative end-of-day call logs, verified visits, sample allocations, and order receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medical Representative</TableHead>
                <TableHead>Territory</TableHead>
                <TableHead>Report Date</TableHead>
                <TableHead>Calls (Exec / Plan)</TableHead>
                <TableHead>Doctors & Retail</TableHead>
                <TableHead>Orders & Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Loading daily call reports...
                  </TableCell>
                </TableRow>
              ) : filteredDcrs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <EmptyState
                      icon={FileCheck}
                      title="No Daily Call Reports Found"
                      description={`No DCR records found matching the selected filters.`}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredDcrs.map((dcr) => {
                  const mrName = dcr.mr?.user
                    ? `${dcr.mr.user.firstName} ${dcr.mr.user.lastName}`
                    : "Assigned MR";
                  const reportDateStr = new Date(dcr.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <TableRow key={dcr.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{mrName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {dcr.mr?.employeeCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{dcr.territory?.name || "Territory"}</div>
                        <div className="text-xs text-muted-foreground">{dcr.territory?.code}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold">{reportDateStr}</div>
                        <div className="text-xs text-muted-foreground">
                          {dcr.submittedAt
                            ? new Date(dcr.submittedAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Draft"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-bold text-foreground">
                          {dcr.totalExecutedCalls} / {dcr.totalPlannedCalls}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dcr.workStartTime || dcr.workEndTime ? (
                            <span>
                              {dcr.workStartTime
                                ? new Date(dcr.workStartTime).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "--:--"}{" "}
                              –{" "}
                              {dcr.workEndTime
                                ? new Date(dcr.workEndTime).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "--:--"}
                            </span>
                          ) : dcr.totalWorkDurationMinutes ? (
                            `${Math.floor(dcr.totalWorkDurationMinutes / 60)}h ${dcr.totalWorkDurationMinutes % 60}m`
                          ) : (
                            "—"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {dcr.totalDoctorsVisited} Docs • {dcr.totalPharmaciesVisited} Pharm
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {dcr.totalSamplesDistributed} samples given
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-foreground">
                          ₹{Number(dcr.totalOrdersAmount || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ₹{Number(dcr.totalCollectionsAmount || 0).toLocaleString("en-IN")} coll.
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(dcr.status)}
                          {dcr.unlockRequestStatus === "PENDING" && (
                            <span
                              title={dcr.unlockRequestReason || "MR requested unlock"}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-700"
                            >
                              <Unlock className="h-3 w-3" />
                              Unlock Requested
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {dcr.unlockRequestStatus === "PENDING" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={async () => {
                                await handleOpenDetails(dcr);
                                setActionType("APPROVE_UNLOCK");
                              }}
                              className="h-8 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              <Unlock className="h-3.5 w-3.5" />
                              <span>Accept Unlock</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetails(dcr)}
                            className="h-8 gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Review</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DCR Review & Approval Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Daily Call Report Review"
        maxWidth="2xl"
      >
        {selectedDcr && (
          <div className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Daily Call Report Review</span>
                  {getStatusBadge(selectedDcr.status)}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Representative: {selectedDcr.mr?.user?.firstName} {selectedDcr.mr?.user?.lastName} (
                  {selectedDcr.mr?.employeeCode}) • Territory: {selectedDcr.territory?.name} • Date:{" "}
                  {new Date(selectedDcr.date).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Pending Unlock Request Banner */}
            {selectedDcr.unlockRequestStatus === "PENDING" && (
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-700 rounded-lg space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 text-xs text-indigo-900 dark:text-indigo-200">
                    <Unlock className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                    <div>
                      <div className="font-bold">Unlock Request Pending Review</div>
                      <p className="mt-0.5 text-indigo-800 dark:text-indigo-300">
                        <strong>MR Reason:</strong> {selectedDcr.unlockRequestReason || "Requested unlock to update and resend DCR."}
                      </p>
                      {selectedDcr.unlockRequestedAt && (
                        <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">
                          Requested at {new Date(selectedDcr.unlockRequestedAt).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => {
                        setActionComments("");
                        setActionType("APPROVE_UNLOCK");
                      }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept Unlock
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40"
                      onClick={() => {
                        setActionComments("");
                        setActionType("REJECT_UNLOCK");
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Locked / Rejected / Reopened Notice Banners */}
            {(selectedDcr.status === "SUBMITTED" || selectedDcr.status === "APPROVED") && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Calls Locked:</strong> Visits logged for this date are locked against edits and new visit creation. If the representative made an error, you can authorize a reopening below.
                </span>
              </div>
            )}

            {selectedDcr.status === "REJECTED" && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2 text-xs text-red-800 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <strong>Report Rejected — Unlocked for MR Resubmission:</strong>{" "}
                  {selectedDcr.reviewComments || "Manager requested corrections."} The representative can update calls and resend this DCR from the mobile app.
                </div>
              </div>
            )}

            {selectedDcr.status === "REOPENED" && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
                <Unlock className="h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  <strong>Report Reopened:</strong> {selectedDcr.reopenReason || "Authorized for field corrections."} Visits on this date are currently unlocked.
                </span>
              </div>
            )}

            {/* Work Shift Start / End Timer Banner */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg border bg-slate-50/80 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Start Time
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {selectedDcr.workStartTime
                      ? new Date(selectedDcr.workStartTime).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-600 shrink-0" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    End Time
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {selectedDcr.workEndTime
                      ? new Date(selectedDcr.workEndTime).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Duration
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {selectedDcr.totalWorkDurationMinutes
                      ? `${Math.floor(selectedDcr.totalWorkDurationMinutes / 60)}h ${selectedDcr.totalWorkDurationMinutes % 60}m`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-muted/40 rounded-lg text-center border">
                <div className="text-2xl font-black text-foreground">{selectedDcr.totalExecutedCalls}</div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase mt-1">Calls Executed</div>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg text-center border">
                <div className="text-2xl font-black text-foreground">{selectedDcr.totalDoctorsVisited}</div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase mt-1">Doctors Visited</div>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg text-center border">
                <div className="text-2xl font-black text-foreground">{selectedDcr.totalPharmaciesVisited}</div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase mt-1">Chemists</div>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg text-center border">
                <div className="text-2xl font-black text-primary">₹{Number(selectedDcr.totalOrdersAmount || 0).toLocaleString("en-IN")}</div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase mt-1">
                  Orders Booked ({selectedDcr.ordersBooked?.length || 0})
                </div>
              </div>
            </div>

            {/* Submission Notes */}
            {selectedDcr.submissionNotes && (
              <div className="p-3 bg-card border rounded-md text-xs">
                <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  Representative Activity Summary & Feedback:
                </div>
                <p className="text-muted-foreground italic">“{selectedDcr.submissionNotes}”</p>
              </div>
            )}

            {/* Visual Aids Shown & Products Discussed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-card/60 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Presentation className="h-3.5 w-3.5 text-violet-600" />
                  Visual Aids Shown ({selectedDcr.visualAidsShown?.length || 0})
                </div>
                {selectedDcr.visualAidsShown && selectedDcr.visualAidsShown.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedDcr.visualAidsShown.map((va) => (
                      <div
                        key={va.sessionId}
                        className="text-xs p-2 rounded bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200/70 dark:border-violet-800/40 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{va.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {[va.productName, va.customerName, va.type].filter(Boolean).join(" • ")}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {va.durationSeconds > 0
                            ? `${Math.max(1, Math.round(va.durationSeconds / 60))}m`
                            : "Shown"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">No visual aids recorded for this day.</div>
                )}
              </div>

              <div className="p-3 rounded-lg border bg-card/60 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-blue-600" />
                  Products Discussed ({selectedDcr.productsDiscussed?.length || 0})
                </div>
                {selectedDcr.productsDiscussed && selectedDcr.productsDiscussed.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedDcr.productsDiscussed.map((prod) => (
                      <div
                        key={prod.productId}
                        className="text-xs p-2 rounded bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">{prod.brandName}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {prod.visitCount} call{prod.visitCount === 1 ? "" : "s"}
                            {prod.samplesQty > 0 ? ` • ${prod.samplesQty} samples` : ""}
                          </span>
                        </div>
                        {prod.feedbacks && prod.feedbacks.length > 0 && (
                          <div className="text-[11px] text-muted-foreground italic mt-1">
                            {prod.feedbacks.join(" | ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">No products detailed for this day.</div>
                )}
              </div>
            </div>

            {/* Orders Booked Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                Orders Booked ({selectedDcr.ordersBooked?.length || 0})
              </h3>
              {selectedDcr.ordersBooked && selectedDcr.ordersBooked.length > 0 ? (
                <div className="space-y-2">
                  {selectedDcr.ordersBooked.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-lg border bg-card/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-foreground">{ord.orderNumber}</span>
                          <span className="font-semibold text-foreground">• {ord.customerName}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {ord.status}
                          </Badge>
                        </div>
                        {ord.items && ord.items.length > 0 && (
                          <div className="text-[11px] text-muted-foreground">
                            {ord.items.map((it) => `${it.productName} × ${it.quantity}`).join(", ")}
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground">
                          Booked at{" "}
                          {new Date(ord.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary shrink-0">
                        ₹{Number(ord.totalAmount || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic py-1">
                  No orders booked on this date.
                </div>
              )}
            </div>

            {/* Executed Visits Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Executed Customer Calls, Timings & Feedbacks ({selectedDcr.visits?.length || 0})
              </h3>
              <div className="space-y-2">
                {selectedDcr.visits && selectedDcr.visits.length > 0 ? (
                  selectedDcr.visits.map((v: any, idx: number) => {
                    const custName = v.doctor?.name || v.pharmacy?.name || v.distributor?.name || "Customer";
                    return (
                      <div
                        key={v.id || idx}
                        className="p-3 rounded-lg border bg-card/60 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-foreground text-sm">{custName}</span>
                            <Badge variant="outline">{v.customerType}</Badge>
                            <Badge variant={v.verificationStatus === "VERIFIED" ? "success" : "secondary"}>
                              {v.verificationStatus}
                            </Badge>
                          </div>

                          {/* Call Start & End Time */}
                          <div className="text-muted-foreground text-[11px] flex items-center gap-2 flex-wrap">
                            <span>
                              Start:{" "}
                              <strong>
                                {v.actualStartTime
                                  ? new Date(v.actualStartTime).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "—"}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              End:{" "}
                              <strong>
                                {v.actualEndTime
                                  ? new Date(v.actualEndTime).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "—"}
                              </strong>
                            </span>
                            {v.durationSeconds ? (
                              <>
                                <span>•</span>
                                <span>Duration: {Math.max(1, Math.round(v.durationSeconds / 60))} mins</span>
                              </>
                            ) : null}
                          </div>

                          {/* Products & Visual Aids on this Visit */}
                          {v.visitProducts && v.visitProducts.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {v.visitProducts.map((vp: any) => (
                                <span
                                  key={vp.id || vp.productId}
                                  className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-[11px] text-blue-700 dark:text-blue-300 font-medium"
                                >
                                  {vp.product?.brandName || "Product"}
                                  {vp.samplesQty > 0 ? ` (${vp.samplesQty} samples)` : ""}
                                </span>
                              ))}
                            </div>
                          )}

                          {v.visualAidSessions && v.visualAidSessions.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {v.visualAidSessions.map((vas: any) => (
                                <span
                                  key={vas.id}
                                  className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/50 text-[11px] text-violet-700 dark:text-violet-300 font-medium"
                                >
                                  Visual Aid: {vas.visualAid?.title || "Presentation"}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Feedback */}
                          {v.feedbackNotes && (
                            <p className="text-foreground/90 bg-muted/40 rounded px-2 py-1 italic">
                              Feedback: “{v.feedbackNotes}”
                            </p>
                          )}
                        </div>
                        <Badge variant={v.status === "COMPLETED" ? "success" : "secondary"}>
                          {v.status}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground italic py-3">
                    No individual visits linked to this report.
                  </div>
                )}
              </div>
            </div>

            {/* Audit Trail */}
            {selectedDcr.audits && selectedDcr.audits.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Audit History
                </h3>
                <div className="space-y-1.5">
                  {selectedDcr.audits.map((a) => (
                    <div
                      key={a.id}
                      className="text-xs p-2 rounded bg-muted/30 border flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold">{a.action}:</span>{" "}
                        <span className="text-muted-foreground">{a.fromStatus} → {a.toStatus}</span>{" "}
                        {a.comments && <span className="italic">({a.comments})</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Dialog / Form */}
            {actionType ? (
              <div className="p-4 border rounded-lg bg-card space-y-3">
                <h4 className="text-sm font-bold text-foreground">
                  {actionType === "APPROVE" && "Approve Daily Call Report"}
                  {actionType === "REJECT" && "Reject Daily Call Report with Comments"}
                  {actionType === "REOPEN" && "Authorize Reopening of Locked Daily Call Report"}
                  {actionType === "APPROVE_UNLOCK" && "Accept Unlock Request & Reopen DCR"}
                  {actionType === "REJECT_UNLOCK" && "Decline Unlock Request"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {actionType === "APPROVE" &&
                    "Approving will officially confirm all calls, orders, and expenses for this work day."}
                  {actionType === "REJECT" &&
                    "Specify feedback so the representative can make necessary adjustments."}
                  {actionType === "REOPEN" &&
                    "Specify the authorization reason. This will unlock all visits on this date so the representative can correct or add calls."}
                  {actionType === "APPROVE_UNLOCK" &&
                    "Accepting this unlock request will reopen the DCR, unlock visits for editing, and allow the representative to resend the DCR."}
                  {actionType === "REJECT_UNLOCK" &&
                    "Declining will keep this DCR locked and notify the representative with your remarks."}
                </p>
                <textarea
                  className="w-full text-xs p-2.5 rounded-md border border-input bg-background min-h-[70px]"
                  placeholder={
                    actionType === "APPROVE"
                      ? "Optional manager approval remarks..."
                      : actionType === "REJECT"
                      ? "Explain reason for rejection..."
                      : actionType === "APPROVE_UNLOCK"
                      ? "Optional note to MR (e.g., Unlocked — please update the missed visit and resend)..."
                      : actionType === "REJECT_UNLOCK"
                      ? "Optional reason for declining unlock request..."
                      : "Mandatory reopen reason (e.g., MR missed logging evening doctor visit)..."
                  }
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActionType(null);
                      setActionComments("");
                    }}
                    disabled={isSubmittingAction}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={
                      actionType === "APPROVE" || actionType === "APPROVE_UNLOCK"
                        ? "default"
                        : actionType === "REJECT" || actionType === "REJECT_UNLOCK"
                        ? "destructive"
                        : "outline"
                    }
                    size="sm"
                    onClick={handleExecuteAction}
                    disabled={isSubmittingAction}
                  >
                    {isSubmittingAction
                      ? "Processing..."
                      : actionType === "APPROVE_UNLOCK"
                      ? "Confirm Accept Unlock"
                      : actionType === "REJECT_UNLOCK"
                      ? "Confirm Decline Unlock"
                      : `Confirm ${actionType}`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  {selectedDcr.status === "APPROVED" && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <Lock className="h-3.5 w-3.5" /> Approved & Locked
                    </span>
                  )}
                  {selectedDcr.status === "SUBMITTED" && (
                    <span className="text-amber-600 font-medium">
                      Awaiting Manager Verification
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDcr.unlockRequestStatus === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActionType("REJECT_UNLOCK")}
                        className="border-rose-300 text-rose-600 hover:bg-rose-50"
                      >
                        <XCircle className="h-4 w-4 mr-1.5" /> Decline Unlock
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setActionType("APPROVE_UNLOCK")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Unlock className="h-4 w-4 mr-1.5" /> Accept Unlock
                      </Button>
                    </>
                  )}
                  {selectedDcr.status === "SUBMITTED" && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setActionType("REJECT")}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" /> Reject Report
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setActionType("APPROVE")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" /> Approve DCR
                      </Button>
                    </>
                  )}
                  {(selectedDcr.status === "APPROVED" || selectedDcr.status === "SUBMITTED") &&
                    selectedDcr.unlockRequestStatus !== "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActionType("REOPEN")}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5" /> Authorize Reopening (Unlock Calls 🔓)
                      </Button>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
