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
import { expenseService } from "@/services/expenseService";
import type { ExpenseClaim, ExpensePolicy, ExpenseSummary } from "@/types";
import {
  Wallet,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  Download,
  Plus,
  Filter,
  Search,
  FileText,
  AlertCircle,
  Receipt,
  Car,
  Utensils,
  Hotel,
  Fuel,
  Settings,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function ExpensesPage() {
  const isMounted = useIsMounted();
  const { data: user } = useCurrentUser();


  // State
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [policies, setPolicies] = useState<ExpensePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Modals
  const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | "RETURN_FOR_CORRECTION" | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Claim Form
  const [newClaimTitle, setNewClaimTitle] = useState("");
  const [newClaimStartDate, setNewClaimStartDate] = useState("");
  const [newClaimEndDate, setNewClaimEndDate] = useState("");
  const [newClaimNotes, setNewClaimNotes] = useState("");
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [claimsRes, summaryRes, policiesRes] = await Promise.all([
        expenseService.getClaims({
          status: selectedStatus !== "ALL" ? selectedStatus : undefined,
          search: search || undefined,
        }),
        expenseService.getSummary(),
        expenseService.getPolicies(),
      ]);

      setClaims(claimsRes.items || []);
      setSummary(summaryRes);
      setPolicies(policiesRes || []);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      const today = new Date().toISOString().split("T")[0];
      setNewClaimStartDate((prev) => prev || today);
      setNewClaimEndDate((prev) => prev || today);
      fetchData();
    }
  }, [isMounted, selectedStatus, search]);

  const handleReview = async () => {
    if (!selectedClaim || !reviewAction) return;
    setIsSubmittingReview(true);
    try {
      await expenseService.reviewClaim(selectedClaim.id, reviewAction, reviewComments);
      setReviewAction(null);
      setReviewComments("");
      setSelectedClaim(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingClaim(true);
    try {
      const created = await expenseService.createClaim({
        title: newClaimTitle,
        startDate: newClaimStartDate,
        endDate: newClaimEndDate,
        submissionNotes: newClaimNotes,
      });
      setShowCreateModal(false);
      setNewClaimTitle("");
      setNewClaimNotes("");
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to create claim");
    } finally {
      setIsCreatingClaim(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="default" className="bg-emerald-600 text-white"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "SUBMITTED":
        return <Badge variant="secondary" className="bg-blue-600 text-white"><Clock className="w-3 h-3 mr-1" /> Submitted</Badge>;
      case "RETURNED_FOR_CORRECTION":
        return <Badge variant="outline" className="border-amber-500 text-amber-500"><RotateCcw className="w-3 h-3 mr-1" /> Needs Correction</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case "DRAFT":
      default:
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
    }
  };

  const isSelfClaim = (claim: ExpenseClaim) => {
    return claim.mr?.user?.email === user?.email;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Claims & Travel Allowances</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Company-scoped field expense management, policy governance, and separation-of-duties review workflow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPolicyModal(true)}
            className="flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" />
            Company Policies
          </Button>
          <a
            href="/api/v1/expenses/export"
            download
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            New Claim
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 shadow-sm bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Claims</p>
              <h3 className="text-2xl font-bold mt-1">{summary?.totalClaims ?? 0}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Across active field force</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approved Amount</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{Number(summary?.approvedAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Authorized for reimbursement</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Review</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                ₹{Number(summary?.pendingAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Requires manager authorization</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Travel & Mileage</p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                ₹{Number(summary?.categoryBreakdown?.TRAVEL?.totalAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Fuel & transport reimbursements</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER BAR */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search claim number, representative, or tour title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md h-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {["ALL", "SUBMITTED", "APPROVED", "RETURNED_FOR_CORRECTION", "DRAFT", "REJECTED"].map((st) => (
              <Button
                key={st}
                size="sm"
                variant={selectedStatus === st ? "default" : "outline"}
                onClick={() => setSelectedStatus(st)}
                className="h-8 text-xs px-2.5"
              >
                {st.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CLAIMS TABLE */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : claims.length === 0 ? (
            <EmptyState
              title="No expense claims found"
              description="No expense claims match your selected filters. Representatives can draft claims from the mobile app."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Details</TableHead>
                  <TableHead>Representative</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => setSelectedClaim(claim)}>
                    <TableCell>
                      <div className="font-semibold text-sm">{claim.claimNumber}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{claim.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {claim.mr?.user ? `${claim.mr.user.firstName} ${claim.mr.user.lastName}` : "Representative"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {claim.mr?.employeeCode} • {claim.mr?.territory?.name || "Territory"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {claim.startDate?.split("T")[0]} to {claim.endDate?.split("T")[0]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold">
                        ₹{Number(claim.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">{claim.currency}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {claim.items?.length || 0} line items
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClaim(claim);
                        }}
                      >
                        Review / View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* REVIEW & DETAILS MODAL */}
      {selectedClaim && (
        <Modal
          isOpen={!!selectedClaim}
          onClose={() => {
            setSelectedClaim(null);
            setReviewAction(null);
            setReviewComments("");
          }}
          title={`Expense Claim ${selectedClaim.claimNumber}`}
          description={`${selectedClaim.title} • Submitted by ${selectedClaim.mr?.user?.firstName || "MR"} (${selectedClaim.mr?.employeeCode || ""})`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Self-approval Separation of Duties Warning */}
            {isSelfClaim(selectedClaim) && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Separation of Duties Notice:</strong> You submitted this claim. Company policy prohibits self-approval. An authorized manager or administrator must review it.
                </span>
              </div>
            )}

            {/* Status and Summary Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/40 rounded-lg text-xs">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="mt-0.5">{getStatusBadge(selectedClaim.status)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Claimed:</span>
                <div className="font-semibold text-sm mt-0.5 text-blue-600 dark:text-blue-400">
                  ₹{Number(selectedClaim.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Tour Period:</span>
                <div className="font-medium mt-0.5">
                  {selectedClaim.startDate?.split("T")[0]} to {selectedClaim.endDate?.split("T")[0]}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted:</span>
                <div className="font-medium mt-0.5">
                  {selectedClaim.submittedAt ? new Date(selectedClaim.submittedAt).toLocaleDateString() : "Not submitted"}
                </div>
              </div>
            </div>

            {selectedClaim.submissionNotes && (
              <div className="p-3 bg-muted/20 border border-border/40 rounded-md text-xs">
                <span className="font-medium text-muted-foreground">MR Submission Remarks:</span>
                <p className="mt-1 text-foreground">{selectedClaim.submissionNotes}</p>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Expense Line Items ({selectedClaim.items?.length || 0})
              </h4>
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Notes / Details</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs text-center">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!selectedClaim.items || selectedClaim.items.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs py-4 text-muted-foreground">
                          No line items recorded on this claim
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedClaim.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs font-mono">{item.date?.split("T")[0]}</TableCell>
                          <TableCell className="text-xs font-medium">
                            <Badge variant="outline" className="text-[10px]">
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.notes || "—"}
                            {item.distanceKm && <span className="ml-1 text-foreground font-mono">({item.distanceKm} km)</span>}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-right">
                            ₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {item.receiptUrl ? (
                              <a
                                href={item.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-blue-600 hover:underline gap-1 text-[11px]"
                              >
                                <Receipt className="w-3 h-3" /> View
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">No receipt</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Review History / Comments */}
            {selectedClaim.reviewComments && (
              <div className="p-3 bg-muted/30 border border-border/50 rounded-md text-xs">
                <span className="font-semibold text-muted-foreground">Latest Reviewer Feedback:</span>
                <p className="mt-1">{selectedClaim.reviewComments}</p>
                {selectedClaim.approvedBy && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Approved by {selectedClaim.approvedBy.firstName} {selectedClaim.approvedBy.lastName} on{" "}
                    {selectedClaim.approvedAt ? new Date(selectedClaim.approvedAt).toLocaleDateString() : ""}
                  </p>
                )}
              </div>
            )}

            {/* Review Actions Panel (Available for SUBMITTED claims and non-self users) */}
            {selectedClaim.status === "SUBMITTED" && !isSelfClaim(selectedClaim) && (
              <div className="p-4 bg-muted/40 border border-border/60 rounded-lg space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  Manager Review & Approval Action
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Reviewer Feedback Comments (Optional for approval, recommended for corrections/rejection):</label>
                  <textarea
                    rows={2}
                    className="w-full text-xs p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Provide audit notes, policy feedback, or reason for return/rejection..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                    disabled={isSubmittingReview}
                    onClick={() => {
                      setReviewAction("RETURN_FOR_CORRECTION");
                      handleReview();
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Return for Correction
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isSubmittingReview}
                    onClick={() => {
                      setReviewAction("REJECT");
                      handleReview();
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject Claim
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isSubmittingReview}
                    onClick={() => {
                      setReviewAction("APPROVE");
                      handleReview();
                    }}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Authorize Approval
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* COMPANY POLICIES MODAL */}
      <Modal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title="Company Expense Policies & Limits"
        description="Configurable travel, mileage, and daily allowance ceilings enforced on all representative claims."
      >
        <div className="space-y-4">
          <div className="border border-border/50 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Max Daily Limit</TableHead>
                  <TableHead className="text-xs">Mileage / Km</TableHead>
                  <TableHead className="text-xs">Receipt Above</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs py-4 text-muted-foreground">
                      No policies configured yet
                    </TableCell>
                  </TableRow>
                ) : (
                  policies.map((pol) => (
                    <TableRow key={pol.id}>
                      <TableCell className="text-xs font-semibold">{pol.category}</TableCell>
                      <TableCell className="text-xs">₹{Number(pol.maxDailyLimit).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-xs">
                        {pol.mileageRatePerKm ? `₹${Number(pol.mileageRatePerKm)} / km` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {pol.requiresReceiptAbove ? `₹${Number(pol.requiresReceiptAbove)}` : "All require receipt"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Modal>

      {/* CREATE DRAFT CLAIM MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Expense Claim"
        description="Draft a field expense claim for your scheduled tour period."
      >
        <form onSubmit={handleCreateClaim} className="space-y-3">
          <div>
            <label className="text-xs font-medium">Claim Title / Tour Name</label>
            <Input
              required
              placeholder="e.g. November 2026 Field Tour - Madurai South"
              value={newClaimTitle}
              onChange={(e) => setNewClaimTitle(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium">Start Date</label>
              <Input
                type="date"
                required
                value={newClaimStartDate}
                onChange={(e) => setNewClaimStartDate(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium">End Date</label>
              <Input
                type="date"
                required
                value={newClaimEndDate}
                onChange={(e) => setNewClaimEndDate(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Tour Notes / Objective (Optional)</label>
            <textarea
              rows={2}
              className="w-full text-xs p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring mt-1"
              placeholder="Field visits, customer symposium, and secondary sales collections..."
              value={newClaimNotes}
              onChange={(e) => setNewClaimNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isCreatingClaim} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Draft Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
