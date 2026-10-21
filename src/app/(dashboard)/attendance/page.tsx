"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useCurrentUser, useIsMounted } from "@/hooks";
import { attendanceService } from "@/services/growthServices";
import type { AttendanceRecord, AttendanceCorrection, AttendanceSummary } from "@/types";
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
  UserCheck,
  FileText,
  ShieldAlert,
} from "lucide-react";

export default function AttendancePage() {
  const isMounted = useIsMounted();
  const { data: user } = useCurrentUser();

  const [activeTab, setActiveTab] = useState<"records" | "corrections">("records");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCorrectionStatus, setSelectedCorrectionStatus] = useState<string>("ALL");

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<AttendanceCorrection | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recs, corrs, summ] = await Promise.all([
        attendanceService.getRecords(),
        attendanceService.getCorrections(),
        attendanceService.getSummary(),
      ]);
      setRecords(recs);
      setCorrections(corrs);
      setSummary(summ);
    } catch (err) {
      console.error("Failed to load attendance records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted]);

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.user?.firstName.toLowerCase().includes(q) ||
        r.user?.lastName.toLowerCase().includes(q) ||
        r.user?.email.toLowerCase().includes(q) ||
        r.mr?.employeeCode.toLowerCase().includes(q) ||
        r.mr?.territory?.toLowerCase().includes(q),
    );
  }, [records, search]);

  const filteredCorrections = useMemo(() => {
    return corrections.filter((c) => {
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
  }, [corrections, selectedCorrectionStatus, search]);

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
        title="Shift Attendance & Regularization"
        description="Monitor daily field shift check-ins, server-authoritative timestamps, and review regularization requests."
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Shifts Logged</p>
              <h3 className="text-2xl font-bold mt-1">{summary?.totalRecords ?? 0}</h3>
            </div>
            <Clock className="w-8 h-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Present Shifts</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{summary?.presentCount ?? 0}</h3>
            </div>
            <UserCheck className="w-8 h-8 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Daily Hours</p>
              <h3 className="text-2xl font-bold mt-1">{summary?.averageDailyHours ?? 0} hrs</h3>
            </div>
            <Calendar className="w-8 h-8 text-indigo-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Regularizations</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">
                {corrections.filter((c) => c.status === "PENDING").length}
              </h3>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-4">
        <button
          onClick={() => setActiveTab("records")}
          className={`pb-3 px-2 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === "records"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Shift Records ({records.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("corrections")}
          className={`pb-3 px-2 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === "corrections"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>
            Regularization Requests (
            {corrections.filter((c) => c.status === "PENDING").length} pending)
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by MR name, email, territory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
                  {filteredRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">
                          {r.user ? `${r.user.firstName} ${r.user.lastName}` : "MR"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.mr?.employeeCode} • {r.mr?.territory || "Headquarters"}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {new Date(r.attendanceDate).toISOString().slice(0, 10)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {new Date(r.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {r.punchOutTime
                          ? new Date(r.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : "— In Progress —"}
                      </TableCell>
                      <TableCell>
                        {r.totalWorkHours !== undefined && r.totalWorkHours !== null ? (
                          <span className="font-semibold">{r.totalWorkHours} hrs</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Active Shift</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {r.punchInVerificationType === "DEVICE_PHOTO" ? "Photo Auth" : r.punchInVerificationType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "PRESENT"
                              ? "default"
                              : r.status === "HALF_DAY"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(r)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                          {c.mr?.employeeCode} • {c.mr?.territory}
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

      {/* Record Details Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title="Shift Check-in Verification Details"
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
              <div>
                <span className="text-muted-foreground text-xs block">Verification Method</span>
                <span className="font-medium text-emerald-600">
                  {selectedRecord.punchInVerificationType} (Device Photo Verification)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Total Work Hours</span>
                <span className="font-semibold">{selectedRecord.totalWorkHours ?? "—"} hrs</span>
              </div>
            </div>

            {selectedRecord.punchInPhotoUrl && (
              <div className="border rounded-md p-3 bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground block mb-2">Check-in Photo Capture</span>
                <img
                  src={selectedRecord.punchInPhotoUrl}
                  alt="Punch In Verification"
                  className="rounded max-h-48 object-cover mx-auto"
                />
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
