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
  CalendarDays,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  BarChart3,
  Search,
  Filter,
  AlertCircle,
  FileText,
  Clock,
  User,
  MapPin,
  Send,
  Lock,
  Unlock,
} from "lucide-react";
import { tourPlanService, TourPlan, PlannedVsActualReport, TourPlanStatus } from "@/services/tourPlanService";
import { useFilterStore } from "@/store";

export default function TourPlansPage() {
  const { operatingDate, setOperatingDate } = useFilterStore();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<TourPlanStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const [plans, setPlans] = useState<TourPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Synchronize year & month whenever operatingDate changes
  useEffect(() => {
    if (operatingDate && /^\d{4}-\d{2}-\d{2}$/.test(operatingDate)) {
      const [yStr, mStr] = operatingDate.split("-");
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(y) && !isNaN(m)) {
        setSelectedYear(y);
        setSelectedMonth(m);
      }
    }
  }, [operatingDate]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateOperatingPeriod = (year: number, month: number) => {
    const dayPart = operatingDate ? parseInt(operatingDate.split("-")[2] || "1", 10) : 1;
    const maxDays = new Date(year, month, 0).getDate();
    const safeDay = Math.min(Math.max(1, dayPart), maxDays);
    const newDate = `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
    setOperatingDate(newDate);
  };

  // Inspection Modal
  const [selectedPlan, setSelectedPlan] = useState<TourPlan | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Approval / Rejection / Reopening Action States
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "REOPEN" | null>(null);
  const [actionComments, setActionComments] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Planned vs Actual Modal
  const [pvaReport, setPvaReport] = useState<PlannedVsActualReport | null>(null);
  const [isPvaOpen, setIsPvaOpen] = useState(false);
  const [isLoadingPva, setIsLoadingPva] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await tourPlanService.getTourPlans({
        year: selectedYear,
        month: selectedMonth,
        status: statusFilter,
      });
      setPlans(res.items);
    } catch (err) {
      console.warn("Failed to fetch tour plans:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, statusFilter]);

  useEffect(() => {
    if (isMounted) {
      fetchPlans();
    }
  }, [fetchPlans, isMounted]);

  const handleOpenDetails = async (plan: TourPlan) => {
    try {
      const full = await tourPlanService.getTourPlanById(plan.id);
      setSelectedPlan(full || plan);
    } catch {
      setSelectedPlan(plan);
    }
    setIsDetailsOpen(true);
  };

  const handleOpenPva = async (plan: TourPlan) => {
    setIsLoadingPva(true);
    setIsPvaOpen(true);
    try {
      const report = await tourPlanService.getPlannedVsActual(plan.year, plan.month, plan.mrId);
      setPvaReport(report);
    } catch (err) {
      console.warn("Failed to load PVA report:", err);
    } finally {
      setIsLoadingPva(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedPlan || !actionType) return;
    setIsSubmittingAction(true);
    try {
      if (actionType === "APPROVE") {
        await tourPlanService.approveTourPlan(selectedPlan.id, actionComments);
      } else if (actionType === "REJECT") {
        if (!actionComments.trim()) {
          alert("Review comments are required when rejecting a tour plan.");
          setIsSubmittingAction(false);
          return;
        }
        await tourPlanService.rejectTourPlan(selectedPlan.id, actionComments);
      } else if (actionType === "REOPEN") {
        if (!actionComments.trim()) {
          alert("A mandatory reason is required to authorize reopening an approved plan.");
          setIsSubmittingAction(false);
          return;
        }
        await tourPlanService.reopenTourPlan(selectedPlan.id, actionComments);
      }
      setActionType(null);
      setActionComments("");
      setIsDetailsOpen(false);
      await fetchPlans();
    } catch (err: any) {
      alert(err?.message || "Failed to execute action");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const mrName = p.mr?.user ? `${p.mr.user.firstName} ${p.mr.user.lastName}` : "";
    const empCode = p.mr?.employeeCode || "";
    const territory = p.territory?.name || "";
    return (
      mrName.toLowerCase().includes(q) ||
      empCode.toLowerCase().includes(q) ||
      territory.toLowerCase().includes(q)
    );
  });

  // Aggregated Counters
  const totalCount = plans.length;
  const submittedCount = plans.filter((p) => p.status === "SUBMITTED").length;
  const approvedCount = plans.filter((p) => p.status === "APPROVED").length;
  const rejectedCount = plans.filter((p) => p.status === "REJECTED").length;
  const reopenedCount = plans.filter((p) => p.status === "REOPENED").length;

  const getStatusBadge = (status: TourPlanStatus) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">APPROVED</Badge>;
      case "SUBMITTED":
        return <Badge variant="warning">SUBMITTED (Awaiting Review)</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">REJECTED</Badge>;
      case "REOPENED":
        return <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40">REOPENED (v{selectedPlan?.version || 2})</Badge>;
      case "DRAFT":
      default:
        return <Badge variant="secondary">DRAFT</Badge>;
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Tour Planning (MTP)"
        description="Territory Tour Planning, Materialized Planned Calls, Manager Approvals, and Controlled Reopening"
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-card/60 backdrop-blur border-border/80">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Plans</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{totalCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Period: {monthNames[selectedMonth - 1]} {selectedYear}</div>
        </Card>
        <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/40">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Review</div>
          <div className="text-2xl font-bold mt-1 text-amber-900 dark:text-amber-200">{submittedCount}</div>
          <div className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">Requires Manager Action</div>
        </Card>
        <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/40">
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Approved Plans</div>
          <div className="text-2xl font-bold mt-1 text-emerald-900 dark:text-emerald-200">{approvedCount}</div>
          <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">Visits Materialized 🔒</div>
        </Card>
        <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/40">
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Reopened</div>
          <div className="text-2xl font-bold mt-1 text-blue-900 dark:text-blue-200">{reopenedCount}</div>
          <div className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1">Authorized for Edits 🔓</div>
        </Card>
        <Card className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/40">
          <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Rejected</div>
          <div className="text-2xl font-bold mt-1 text-rose-900 dark:text-rose-200">{rejectedCount}</div>
          <div className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1">Requires MR Revision</div>
        </Card>
      </div>

      {/* Control Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Year Selector */}
            <select
              aria-label="Filter Tour Plans by Year"
              value={selectedYear}
              onChange={(e) => {
                const yr = Number(e.target.value);
                setSelectedYear(yr);
                updateOperatingPeriod(yr, selectedMonth);
              }}
              className="h-9 px-3 py-1 rounded-md border border-input bg-background text-sm font-medium focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {[2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Month Selector */}
            <select
              aria-label="Filter Tour Plans by Month"
              value={selectedMonth}
              onChange={(e) => {
                const m = Number(e.target.value);
                setSelectedMonth(m);
                updateOperatingPeriod(selectedYear, m);
              }}
              className="h-9 px-3 py-1 rounded-md border border-input bg-background text-sm font-medium focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {monthNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-muted/40">
              {(["ALL", "SUBMITTED", "APPROVED", "REOPENED", "REJECTED", "DRAFT"] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      statusFilter === st
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search MR, employee code, territory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </Card>

      {/* Main Tour Plans Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Tour Plans Registry</span>
            <span className="text-xs font-normal text-muted-foreground">
              Showing {filteredPlans.length} records
            </span>
          </CardTitle>
          <CardDescription>
            Field Representative monthly schedules, scheduled itineraries, and manager approvals.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medical Representative</TableHead>
                <TableHead>Territory</TableHead>
                <TableHead>Period & Version</TableHead>
                <TableHead>Planned Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Loading monthly tour plans...
                  </TableCell>
                </TableRow>
              ) : filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <EmptyState
                      icon={CalendarDays}
                      title="No Tour Plans Found"
                      description={`No monthly plans found matching the selected filters for ${monthNames[selectedMonth - 1]} ${selectedYear}.`}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => {
                  const mrName = plan.mr?.user
                    ? `${plan.mr.user.firstName} ${plan.mr.user.lastName}`
                    : "Assigned MR";
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{mrName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {plan.mr?.employeeCode} • {plan.mr?.designation || "MR"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{plan.territory?.name || "Territory"}</div>
                        <div className="text-xs text-muted-foreground">{plan.territory?.code}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {monthNames[plan.month - 1]} {plan.year}
                        </div>
                        <div className="text-xs font-mono text-primary font-semibold">
                          Version {plan.version}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold">{plan.days?.length || plan._count?.days || 0} Days</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(plan.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {plan.submittedAt
                          ? new Date(plan.submittedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Not submitted"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetails(plan)}
                            className="h-8 gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Review</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPva(plan)}
                            className="h-8 gap-1.5 text-primary hover:text-primary"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Adherence</span>
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

      {/* Plan Details & Approval Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Tour Plan Inspection"
        maxWidth="2xl"
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground">Plan Status:</span>
                  {getStatusBadge(selectedPlan.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Representative: {selectedPlan.mr?.user?.firstName} {selectedPlan.mr?.user?.lastName} (
                  {selectedPlan.mr?.employeeCode}) • Territory: {selectedPlan.territory?.name} • Period:{" "}
                  {monthNames[selectedPlan.month - 1]} {selectedPlan.year} (Version {selectedPlan.version})
                </p>
              </div>
            </div>

            {/* Notes & Audit Alert Banners */}
            {selectedPlan.reviewComments && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Manager Review Notes:</strong> {selectedPlan.reviewComments}
                </span>
              </div>
            )}

            {selectedPlan.reopenReason && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
                <Unlock className="h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  <strong>Authorized Reopen Reason:</strong> {selectedPlan.reopenReason}
                </span>
              </div>
            )}

            {/* Daily Itinerary Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Scheduled Daily Activities ({selectedPlan.days?.length || 0} Days)
              </h3>
              <div className="space-y-3">
                {selectedPlan.days?.map((day, idx) => (
                  <div
                    key={day.id || idx}
                    className="p-3.5 rounded-lg border bg-card/70 hover:bg-muted/30 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{day.date}</span>
                        <Badge variant={day.activityType === "FIELD_WORK" ? "outline" : "secondary"}>
                          {day.activityType}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Target Calls: {day.targetCallCount} • Planned: {day.plannedCalls?.length || 0}
                      </span>
                    </div>

                    {day.routeDescription && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>Route: {day.routeDescription}</span>
                      </div>
                    )}

                    {day.notes && (
                      <p className="text-xs italic text-muted-foreground">“{day.notes}”</p>
                    )}

                    {/* Planned Calls */}
                    {day.plannedCalls && day.plannedCalls.length > 0 && (
                      <div className="pt-2 border-t border-dashed space-y-1.5">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                          Customer Calls:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {day.plannedCalls.map((call, cIdx) => (
                            <div
                              key={call.id || cIdx}
                              className="text-xs p-2 rounded bg-muted/40 border border-border/50 flex items-start justify-between"
                            >
                              <div>
                                <span className="font-semibold text-foreground">
                                  #{call.priority} {call.customerType}
                                </span>
                                {call.doctor && (
                                  <div className="text-muted-foreground">
                                    {call.doctor.name} ({call.doctor.specialty})
                                  </div>
                                )}
                                {call.pharmacy && (
                                  <div className="text-muted-foreground">{call.pharmacy.name}</div>
                                )}
                                {call.distributor && (
                                  <div className="text-muted-foreground">{call.distributor.name}</div>
                                )}
                                {call.objective && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    Obj: {call.objective}
                                  </div>
                                )}
                              </div>
                              {call.visitId && (
                                <Badge variant="success" className="text-[10px] py-0">
                                  VISIT LINKED
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Trail Section */}
            {selectedPlan.audits && selectedPlan.audits.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Audit History
                </h3>
                <div className="space-y-1.5">
                  {selectedPlan.audits.map((a) => (
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

            {/* Action Dialog / Form when approving, rejecting, or reopening */}
            {actionType ? (
              <div className="p-4 border rounded-lg bg-card space-y-3">
                <h4 className="text-sm font-bold text-foreground">
                  {actionType === "APPROVE" && "Approve Tour Plan & Materialize Visits"}
                  {actionType === "REJECT" && "Reject Tour Plan with Manager Feedback"}
                  {actionType === "REOPEN" && "Authorize Controlled Tour Plan Reopening"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {actionType === "APPROVE" &&
                    "Approving will officially instantiate planned visits for this representative into the active Visit ledger."}
                  {actionType === "REJECT" &&
                    "Specify feedback so the representative can adjust schedules and resubmit."}
                  {actionType === "REOPEN" &&
                    "Specify the business authorization reason. This will unlock the plan, increment version, and record an audit log."}
                </p>
                <textarea
                  className="w-full text-xs p-2.5 rounded-md border border-input bg-background min-h-[70px]"
                  placeholder={
                    actionType === "APPROVE"
                      ? "Optional manager approval comments..."
                      : actionType === "REJECT"
                      ? "Explain what needs modification before approval..."
                      : "Mandatory reopen reason (e.g., Doctor CME rescheduling)..."
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
                      actionType === "APPROVE"
                        ? "default"
                        : actionType === "REJECT"
                        ? "destructive"
                        : "outline"
                    }
                    size="sm"
                    onClick={handleExecuteAction}
                    disabled={isSubmittingAction}
                  >
                    {isSubmittingAction ? "Processing..." : `Confirm ${actionType}`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  {selectedPlan.status === "APPROVED" && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <Lock className="h-3.5 w-3.5" /> Plan is Approved & Locked against edits
                    </span>
                  )}
                  {selectedPlan.status === "SUBMITTED" && (
                    <span className="text-amber-600 font-medium">
                      Awaiting Territory Manager Approval
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedPlan.status === "SUBMITTED" && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setActionType("REJECT")}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" /> Reject Plan
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setActionType("APPROVE")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" /> Approve Plan
                      </Button>
                    </>
                  )}
                  {selectedPlan.status === "APPROVED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActionType("REOPEN")}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5" /> Authorize Reopen (v{selectedPlan.version + 1})
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Planned vs Actual Analytics Modal */}
      <Modal
        isOpen={isPvaOpen}
        onClose={() => setIsPvaOpen(false)}
        title="Planned vs. Actual Execution Adherence"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground -mt-2">
            Comparison between approved tour plan commitments and verified GPS field activity.
          </p>

          {isLoadingPva ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Computing execution adherence metrics...
            </div>
          ) : pvaReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-muted/40 rounded-lg text-center border">
                  <div className="text-2xl font-black text-foreground">{pvaReport.totalPlannedCalls}</div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase mt-1">Planned Calls</div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center border border-emerald-200">
                  <div className="text-2xl font-black text-emerald-600">{pvaReport.completedPlannedCalls}</div>
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase mt-1">Calls Executed</div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center border border-blue-200">
                  <div className="text-2xl font-black text-blue-600">{pvaReport.unplannedExecutedVisits}</div>
                  <div className="text-[11px] font-semibold text-blue-700 uppercase mt-1">Unplanned Calls</div>
                </div>
                <div className="p-3 bg-card rounded-lg text-center border">
                  <div className="text-2xl font-black text-primary">{pvaReport.completionRate}%</div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase mt-1">Plan Adherence</div>
                </div>
              </div>

              <div className="p-3 bg-card border rounded-lg space-y-1.5 text-xs text-muted-foreground">
                <div>• Approved Schedule Version: <strong>v{pvaReport.tourPlanVersion}</strong></div>
                <div>• Total Executed Field Visits in Period: <strong>{pvaReport.totalExecutedVisits}</strong></div>
                <div>• Adherence Formula: <em>(Completed Planned Calls / Total Planned Calls) × 100</em></div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No performance data available for this plan period.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
