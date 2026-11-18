"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { ErrorState } from "@/components/ui/error-state";
import {
  usePharmacies,
  usePendingPharmacies,
  useRejectedPharmacies,
  useApprovePharmacy,
  useRejectPharmacy,
  usePharmacyHistory,
  useCreatePharmacy,
  useUpdatePharmacy,
  useTerritories,
} from "@/hooks";
import { useAuthStore } from "@/store";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Pharmacy, PharmacyInput, DoctorApprovalStatus } from "@/types";
import {
  Building2,
  Search,
  MapPin,
  ShieldCheck,
  Plus,
  Edit2,
  Phone,
  Mail,
  History as HistoryIcon,
  Filter,
  RotateCcw,
  CheckCircle,
  Check,
  X,
  Clock,
  XCircle,
  Receipt,
  ShoppingCart,
  Boxes,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

export default function PharmaciesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isCompanyAdmin =
    user?.role === "COMPANY_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  // Tab State: All Chemists vs Pending Approvals vs Rejected
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "REJECTED">("ALL");

  // Filters
  const [search, setSearch] = useState("");
  const [territoryId, setTerritoryId] = useState("ALL");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>("ALL");

  // Queries
  const { data: territories } = useTerritories();
  const { data: pharmacies, isLoading, isError, refetch } = usePharmacies({
    search,
    territoryId,
    approvalStatus:
      approvalStatusFilter !== "ALL"
        ? (approvalStatusFilter as DoctorApprovalStatus)
        : undefined,
  });

  const {
    data: pendingPharmacies,
    isLoading: isPendingLoading,
  } = usePendingPharmacies();

  const {
    data: rejectedPharmacies,
    isLoading: isRejectedLoading,
  } = useRejectedPharmacies();

  // Mutations
  const createMutation = useCreatePharmacy();
  const updateMutation = useUpdatePharmacy();
  const approveMutation = useApprovePharmacy();
  const rejectMutation = useRejectPharmacy();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [historyPharmacy, setHistoryPharmacy] = useState<Pharmacy | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Pharmacy | null>(null);

  // Approval / Rejection state
  const [approvingPharmacy, setApprovingPharmacy] = useState<Pharmacy | null>(null);
  const [rejectingPharmacy, setRejectingPharmacy] = useState<Pharmacy | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formState, setFormState] = useState<PharmacyInput>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    drugLicenseNumber: "",
    gstNumber: "",
    territoryId: "",
    latitude: 13.0569,
    longitude: 80.252,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validatePharmacyForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formState.name.trim() || formState.name.trim().length < 2) {
      errors.name = "Pharmacy name must be at least 2 characters long.";
    }
    if (!formState.contactPerson.trim() || formState.contactPerson.trim().length < 2) {
      errors.contactPerson = "Owner / Contact person name is required.";
    }
    const cleanPhone = formState.phone.replace(/[^0-9+]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Valid contact number with at least 10 digits is required.";
    }
    if (!formState.address.trim() || formState.address.trim().length < 5) {
      errors.address = "Detailed pharmacy address of at least 5 characters is required.";
    }
    if (!formState.drugLicenseNumber.trim() || formState.drugLicenseNumber.trim().length < 3) {
      errors.drugLicenseNumber = "Valid Drug License (DL) number is required.";
    }
    if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (isNaN(formState.latitude) || formState.latitude === 0) {
      errors.latitude = "Valid GPS latitude coordinate is required.";
    }
    if (isNaN(formState.longitude) || formState.longitude === 0) {
      errors.longitude = "Valid GPS longitude coordinate is required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setFormState({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      drugLicenseNumber: "",
      gstNumber: "",
      territoryId: territories?.[0]?.id || "",
      latitude: 13.0569,
      longitude: 80.252,
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (phm: Pharmacy) => {
    setEditingPharmacy(phm);
    setFormErrors({});
    setFormState({
      name: phm.name,
      contactPerson: phm.contactPerson,
      phone: phm.phone,
      email: phm.email || "",
      address: phm.address,
      drugLicenseNumber: phm.drugLicenseNumber,
      gstNumber: phm.gstNumber || "",
      territoryId: phm.territoryId,
      latitude: phm.latitude,
      longitude: phm.longitude,
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePharmacyForm()) return;
    try {
      await createMutation.mutateAsync(formState);
      setIsCreateOpen(false);
      setFormErrors({});
      setActionSuccessMessage(`Chemist ${formState.name} enrolled successfully.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormErrors({ submit: err?.message || "Failed to enroll chemist." });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPharmacy) return;
    if (!validatePharmacyForm()) return;
    try {
      await updateMutation.mutateAsync({
        id: editingPharmacy.id,
        input: formState,
      });
      setEditingPharmacy(null);
      setFormErrors({});
      setActionSuccessMessage(`Chemist ${formState.name} updated successfully.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormErrors({ submit: err?.message || "Failed to update chemist." });
    }
  };

  const handleConfirmApprove = async () => {
    if (!approvingPharmacy) return;
    try {
      await approveMutation.mutateAsync(approvingPharmacy.id);
      setActionSuccessMessage(
        `Chemist ${approvingPharmacy.name} has been approved and activated for field operations.`
      );
      if (selectedDetails?.id === approvingPharmacy.id) {
        setSelectedDetails((prev) => (prev ? { ...prev, approvalStatus: "APPROVED" } : null));
      }
      setApprovingPharmacy(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      const msg = err?.message || "Failed to approve chemist registration.";
      if (msg.toLowerCase().includes("already approved")) {
        queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
        setActionSuccessMessage(`Chemist ${approvingPharmacy.name} is approved and active.`);
        setApprovingPharmacy(null);
        setTimeout(() => setActionSuccessMessage(null), 4000);
      } else {
        alert(msg);
      }
    }
  };

  const handleOpenRejectDialog = (phm: Pharmacy) => {
    setRejectingPharmacy(phm);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPharmacy) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setRejectionError("A mandatory rejection reason (at least 5 characters) is required.");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        id: rejectingPharmacy.id,
        reason: rejectionReason.trim(),
      });
      setActionSuccessMessage(`Registration for ${rejectingPharmacy.name} has been rejected.`);
      if (selectedDetails?.id === rejectingPharmacy.id) {
        setSelectedDetails((prev) =>
          prev
            ? { ...prev, approvalStatus: "REJECTED", rejectionReason: rejectionReason.trim() }
            : null
        );
      }
      setRejectingPharmacy(null);
      setRejectionReason("");
      setRejectionError("");
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      const msg = err?.message || "Failed to reject registration.";
      setRejectionError(msg);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setTerritoryId("ALL");
    setApprovalStatusFilter("ALL");
  };

  // History query for selected pharmacy
  const { data: historyItems, isLoading: isHistoryLoading } = usePharmacyHistory(
    historyPharmacy?.id || ""
  );

  const pendingCount = pendingPharmacies?.length || 0;
  const rejectedCount = rejectedPharmacies?.length || 0;

  const renderApprovalBadge = (status?: DoctorApprovalStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
            <X className="h-3 w-3 text-rose-600" />
            Rejected
          </span>
        );
      case "PENDING_APPROVAL":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
            <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacies & Chemist Master Registry"
        description="Retail chemists, dispensary owners, valid drug licenses, MR chemist registration approvals, and commercial trade history."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="default">{pharmacies?.length || 0} Total Active</Badge>
            {pendingCount > 0 && (
              <Badge variant="warning" className="bg-amber-500 text-white font-bold animate-pulse">
                {pendingCount} Pending Approval
              </Badge>
            )}
          </div>
        }
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            <span>Enroll New Chemist</span>
          </Button>
        }
      />

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Tab Controls: 1. All Chemists | 2. Pending Approvals | 3. Rejected */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ALL"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>All Chemists</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-700/60 text-white">
            {pharmacies?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "PENDING"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pending Approvals</span>
          {pendingCount > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
              {pendingCount}
            </span>
          ) : (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
              0
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("REJECTED")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "REJECTED"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <XCircle className="h-4 w-4" />
          <span>Rejected</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-700/60 text-white">
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* TAB 1: ALL CHEMISTS */}
      {activeTab === "ALL" && (
        <>
          {/* Filter Bar */}
          <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Search Chemists
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Name, owner, phone, DL #, address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Territory */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Territory Zone
                </label>
                <select
                  value={territoryId}
                  onChange={(e) => setTerritoryId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">All Territories</option>
                  {territories?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Approval Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Approval Status
                </label>
                <select
                  value={approvalStatusFilter}
                  onChange={(e) => setApprovalStatusFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">Approved (Default)</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="PENDING_APPROVAL">Pending Review</option>
                  <option value="REJECTED">Rejected Registrations</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 gap-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Filters
                </Button>
                <div className="text-xs text-slate-500 ml-auto flex items-center gap-1 font-medium">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  {pharmacies?.length || 0} results
                </div>
              </div>
            </div>
          </Card>

          {/* Main Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-600" />
                Verified Retail Chemists & Hospital Pharmacies
              </CardTitle>
              <CardDescription>
                Valid drug license numbers, owners, registration source, approval status, and commercial history
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : isError ? (
                <div className="p-8">
                  <ErrorState
                    title="Failed to Load Pharmacies"
                    description="An error occurred while fetching retail chemist records."
                    onRetry={() => refetch()}
                  />
                </div>
              ) : !pharmacies || pharmacies.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No Pharmacies Found"
                    description="No retail chemist outlets match the specified territory or search criteria."
                    actionLabel="Reset All Filters"
                    onAction={handleResetFilters}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pharmacy Name & Address</TableHead>
                      <TableHead>Owner / Contact</TableHead>
                      <TableHead>Approval Status</TableHead>
                      <TableHead>Registered By</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>Drug License #</TableHead>
                      <TableHead>Contact Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pharmacies.map((phm) => (
                      <TableRow key={phm.id}>
                        <TableCell>
                          <button
                            onClick={() => setSelectedDetails(phm)}
                            className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                          >
                            {phm.name}
                          </button>
                          <div className="text-xs text-slate-500 truncate max-w-xs">{phm.address}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {phm.contactPerson}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">Proprietor / Chemist</div>
                        </TableCell>
                        <TableCell>{renderApprovalBadge(phm.approvalStatus)}</TableCell>
                        <TableCell>
                          {phm.createdBy ? (
                            <div className="text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {phm.createdBy.firstName} {phm.createdBy.lastName}
                              </span>
                              <div className="text-[10px] text-slate-400">MR / Field Rep</div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">System / Head Office</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{phm.territoryName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            {phm.drugLicenseNumber || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {phm.phone}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isCompanyAdmin && phm.approvalStatus === "PENDING_APPROVAL" && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  onClick={() => setApprovingPharmacy(phm)}
                                  title="Approve Registration"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Approve</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
                                  onClick={() => handleOpenRejectDialog(phm)}
                                  title="Reject Registration"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Reject</span>
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-slate-600 hover:text-sky-600"
                              onClick={() => setSelectedDetails(phm)}
                              title="View Chemist Details"
                            >
                              Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-slate-600 hover:text-sky-600"
                              onClick={() => handleOpenEdit(phm)}
                              title="Edit Chemist Master"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 border-slate-200 dark:border-slate-700"
                              onClick={() => setHistoryPharmacy(phm)}
                              title="Audit Log & Transaction History"
                            >
                              <HistoryIcon className="h-3.5 w-3.5 mr-1 text-sky-600" />
                              History
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* TAB 2: PENDING APPROVALS QUEUE */}
      {activeTab === "PENDING" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-900 dark:text-amber-300">
                <Clock className="h-5 w-5 text-amber-600" />
                Chemist Registrations Awaiting Company Admin Approval
              </CardTitle>
              <CardDescription>
                Review pharmacy credentials, drug license number, store address, and GPS geofence parameters submitted by Medical Representatives.
              </CardDescription>
            </div>
            <Badge variant="warning" className="bg-amber-600 text-white font-bold">
              {pendingCount} Pending Verification
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {isPendingLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !pendingPharmacies || pendingPharmacies.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 mb-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  No Pending Chemist Registrations
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All field chemist registrations have been audited and resolved. New submissions by Medical Representatives will appear here immediately.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pharmacy & Proprietor</TableHead>
                    <TableHead>Address & Territory</TableHead>
                    <TableHead>Mobile & DL #</TableHead>
                    <TableHead>Submitted By MR</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Governance Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPharmacies.map((phm: Pharmacy) => (
                    <TableRow key={phm.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
                      <TableCell>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {phm.name}
                        </div>
                        <div className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold">
                          Owner: {phm.contactPerson}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-800 dark:text-slate-200 truncate max-w-xs">
                          {phm.address}
                        </div>
                        <div className="text-[11px] text-slate-500">{phm.territoryName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {phm.phone}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          DL: {phm.drugLicenseNumber || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {phm.createdBy ? (
                          <div className="text-xs">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {phm.createdBy.firstName} {phm.createdBy.lastName}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {phm.createdBy.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Field Representative</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {phm.createdAt ? formatDate(phm.createdAt) : "Recent"}
                      </TableCell>
                      <TableCell>{renderApprovalBadge(phm.approvalStatus)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2.5"
                            onClick={() => setSelectedDetails(phm)}
                          >
                            View Details
                          </Button>
                          {isCompanyAdmin && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
                                onClick={() => setApprovingPharmacy(phm)}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs px-3 text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 font-semibold"
                                onClick={() => handleOpenRejectDialog(phm)}
                              >
                                <X className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: REJECTED REGISTRATIONS */}
      {activeTab === "REJECTED" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-900 dark:text-rose-300">
                <XCircle className="h-5 w-5 text-rose-600" />
                Rejected Chemist Registrations Archive
              </CardTitle>
              <CardDescription>
                Auditable repository of declined chemist submissions along with mandatory justification reasons.
              </CardDescription>
            </div>
            <Badge variant="destructive" className="text-xs">
              {rejectedCount} Rejected Records
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {isRejectedLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !rejectedPharmacies || rejectedPharmacies.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                  <CheckCircle className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  No Rejected Registrations
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are no rejected chemist registrations in this organization.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pharmacy & Owner</TableHead>
                    <TableHead>Address & Territory</TableHead>
                    <TableHead>Contact & DL #</TableHead>
                    <TableHead>Submitted By MR</TableHead>
                    <TableHead>Reviewed By & Date</TableHead>
                    <TableHead>Rejection Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedPharmacies.map((phm: Pharmacy) => (
                    <TableRow key={phm.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20">
                      <TableCell>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {phm.name}
                        </div>
                        <div className="text-[11px] text-slate-500">Owner: {phm.contactPerson}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-800 dark:text-slate-200 truncate max-w-xs">
                          {phm.address}
                        </div>
                        <div className="text-[11px] text-slate-500">{phm.territoryName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
                          {phm.phone}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          DL: {phm.drugLicenseNumber || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {phm.createdBy ? (
                          <div className="text-xs">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {phm.createdBy.firstName} {phm.createdBy.lastName}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {phm.createdBy.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">MR / Field Rep</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {phm.reviewedBy ? (
                          <div className="text-xs">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {phm.reviewedBy.firstName} {phm.reviewedBy.lastName}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {phm.reviewedAt ? formatDate(phm.reviewedAt) : "Date unknown"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Company Admin</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium max-w-xs">
                          {phm.rejectionReason || "Requirements not met"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-2.5"
                          onClick={() => setSelectedDetails(phm)}
                        >
                          View Details
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

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Enroll New Pharmacy / Chemist"
        description="Add a registered retail or institutional chemist to the master database."
      >
        <form onSubmit={handleSaveCreate} className="space-y-4">
          {formErrors.submit && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {formErrors.submit}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pharmacy / Chemist Name *
              </label>
              <Input
                required
                placeholder="e.g. Apollo Pharmacy - Anna Nagar"
                value={formState.name}
                onChange={(e) => {
                  setFormState({ ...formState, name: e.target.value });
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={formErrors.name ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.name && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Owner / Proprietor Name *
              </label>
              <Input
                required
                placeholder="e.g. S. Murugesan"
                value={formState.contactPerson}
                onChange={(e) => {
                  setFormState({ ...formState, contactPerson: e.target.value });
                  if (formErrors.contactPerson) setFormErrors((prev) => ({ ...prev, contactPerson: "" }));
                }}
                className={formErrors.contactPerson ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.contactPerson && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.contactPerson}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <Input
                required
                placeholder="+919842100001"
                value={formState.phone}
                onChange={(e) => {
                  setFormState({ ...formState, phone: e.target.value });
                  if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: "" }));
                }}
                className={formErrors.phone ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.phone && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Drug License Number (DL #) *
              </label>
              <Input
                required
                placeholder="TN-CHN-20B-1004"
                value={formState.drugLicenseNumber}
                onChange={(e) => {
                  setFormState({ ...formState, drugLicenseNumber: e.target.value });
                  if (formErrors.drugLicenseNumber) setFormErrors((prev) => ({ ...prev, drugLicenseNumber: "" }));
                }}
                className={formErrors.drugLicenseNumber ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.drugLicenseNumber && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.drugLicenseNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Territory *
              </label>
              <select
                value={formState.territoryId}
                onChange={(e) => setFormState({ ...formState, territoryId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {territories?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store / Clinic Address *
              </label>
              <Input
                required
                placeholder="Shop 12, Main Bazaar Road, Chennai"
                value={formState.address}
                onChange={(e) => {
                  setFormState({ ...formState, address: e.target.value });
                  if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: "" }));
                }}
                className={formErrors.address ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.address && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <Input
                type="email"
                placeholder="contact@chemist.com"
                value={formState.email || ""}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN (Optional)
              </label>
              <Input
                placeholder="33AABCA1234F1Z5"
                value={formState.gstNumber || ""}
                onChange={(e) => setFormState({ ...formState, gstNumber: e.target.value })}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Latitude (Geo-Pin) *
              </label>
              <Input
                type="number"
                step="any"
                required
                value={formState.latitude}
                onChange={(e) => setFormState({ ...formState, latitude: parseFloat(e.target.value) || 0 })}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Longitude (Geo-Pin) *
              </label>
              <Input
                type="number"
                step="any"
                required
                value={formState.longitude}
                onChange={(e) => setFormState({ ...formState, longitude: parseFloat(e.target.value) || 0 })}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Enrolling..." : "Save Chemist"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={Boolean(editingPharmacy)}
        onClose={() => setEditingPharmacy(null)}
        title="Edit Pharmacy Master Details"
        description={`Update record, address, and license for ${editingPharmacy?.name}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {formErrors.submit && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {formErrors.submit}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pharmacy / Chemist Name *
              </label>
              <Input
                required
                value={formState.name}
                onChange={(e) => {
                  setFormState({ ...formState, name: e.target.value });
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={formErrors.name ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.name && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Owner / Proprietor Name *
              </label>
              <Input
                required
                value={formState.contactPerson}
                onChange={(e) => {
                  setFormState({ ...formState, contactPerson: e.target.value });
                  if (formErrors.contactPerson) setFormErrors((prev) => ({ ...prev, contactPerson: "" }));
                }}
                className={formErrors.contactPerson ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.contactPerson && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.contactPerson}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <Input
                required
                value={formState.phone}
                onChange={(e) => {
                  setFormState({ ...formState, phone: e.target.value });
                  if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: "" }));
                }}
                className={formErrors.phone ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.phone && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Drug License Number (DL #) *
              </label>
              <Input
                required
                value={formState.drugLicenseNumber}
                onChange={(e) => {
                  setFormState({ ...formState, drugLicenseNumber: e.target.value });
                  if (formErrors.drugLicenseNumber) setFormErrors((prev) => ({ ...prev, drugLicenseNumber: "" }));
                }}
                className={formErrors.drugLicenseNumber ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.drugLicenseNumber && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.drugLicenseNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Territory *
              </label>
              <select
                value={formState.territoryId}
                onChange={(e) => setFormState({ ...formState, territoryId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {territories?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store / Clinic Address *
              </label>
              <Input
                required
                value={formState.address}
                onChange={(e) => {
                  setFormState({ ...formState, address: e.target.value });
                  if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: "" }));
                }}
                className={formErrors.address ? "h-9 text-xs border-rose-400 focus:border-rose-500" : "h-9 text-xs"}
              />
              {formErrors.address && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={formState.email || ""}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN
              </label>
              <Input
                value={formState.gstNumber || ""}
                onChange={(e) => setFormState({ ...formState, gstNumber: e.target.value })}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Latitude (Geo-Pin) *
              </label>
              <Input
                type="number"
                step="any"
                required
                value={formState.latitude}
                onChange={(e) => setFormState({ ...formState, latitude: parseFloat(e.target.value) || 0 })}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Longitude (Geo-Pin) *
              </label>
              <Input
                type="number"
                step="any"
                required
                value={formState.longitude}
                onChange={(e) => setFormState({ ...formState, longitude: parseFloat(e.target.value) || 0 })}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingPharmacy(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Update Chemist"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedDetails)}
        onClose={() => setSelectedDetails(null)}
        title={selectedDetails?.name || "Chemist Details"}
        description="Master registration, drug licensing, governance status, and profile overview"
      >
        {selectedDetails && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              {renderApprovalBadge(selectedDetails.approvalStatus)}
              {selectedDetails.createdBy && (
                <span className="text-[11px] text-slate-500">
                  Submitted by{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedDetails.createdBy.firstName} {selectedDetails.createdBy.lastName}
                  </span>
                </span>
              )}
            </div>

            {selectedDetails.approvalStatus === "REJECTED" && selectedDetails.rejectionReason && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <div className="font-bold">Rejection Reason</div>
                  <p className="mt-0.5">{selectedDetails.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Top Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 mb-1 flex items-center gap-1.5 font-medium">
                  <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                  Owner / Proprietor
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedDetails.contactPerson}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Authorized Licensee</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 mb-1 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Drug License Number
                </div>
                <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedDetails.drugLicenseNumber || "N/A"}
                </div>
                {selectedDetails.gstNumber && (
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    GSTIN: {selectedDetails.gstNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Address: </span>
                  <span className="text-slate-600 dark:text-slate-400">{selectedDetails.address}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Territory: {selectedDetails.territoryName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Phone: </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {selectedDetails.phone || "N/A"}
                </span>
              </div>

              {selectedDetails.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Email: </span>
                  <span className="text-slate-600 dark:text-slate-400">{selectedDetails.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">GPS Coordinates: </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {selectedDetails.latitude.toFixed(6)}, {selectedDetails.longitude.toFixed(6)}
                </span>
              </div>
            </div>

            {/* Commercial Parameters */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2.5 rounded bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
                <div className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">
                  Approved Credit Limit
                </div>
                <div className="text-sm font-bold text-sky-900 dark:text-sky-100 mt-0.5">
                  {formatCurrency(selectedDetails.creditLimit || 0)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  Outstanding Receivables
                </div>
                <div className="text-sm font-bold text-amber-900 dark:text-amber-100 mt-0.5">
                  {formatCurrency(selectedDetails.outstandingBalance || 0)}
                </div>
              </div>
            </div>

            {/* Pending Governance Action Bar */}
            {isCompanyAdmin && selectedDetails.approvalStatus === "PENDING_APPROVAL" && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    Awaiting Registration Approval
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400">
                    Approve to unlock this chemist for field visits and order booking.
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={() => setApprovingPharmacy(selectedDetails)}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Approve Chemist
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-200 hover:bg-rose-100 font-semibold"
                    onClick={() => handleOpenRejectDialog(selectedDetails)}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const curr = selectedDetails;
                  setSelectedDetails(null);
                  handleOpenEdit(curr);
                }}
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                Edit Chemist
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const curr = selectedDetails;
                  setSelectedDetails(null);
                  setHistoryPharmacy(curr);
                }}
              >
                <HistoryIcon className="h-3.5 w-3.5 mr-1" />
                View History
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM APPROVAL MODAL */}
      <Modal
        isOpen={Boolean(approvingPharmacy)}
        onClose={() => setApprovingPharmacy(null)}
        title="Confirm Chemist Registration Approval"
        description="Verify pharmacy license and details before authorizing active field status."
      >
        {approvingPharmacy && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
              <p className="font-semibold">
                Are you sure you want to approve{" "}
                <span className="font-bold underline">{approvingPharmacy.name}</span>?
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                Once approved, this chemist will enter the active Chemist Directory and become immediately eligible for field visits, stock audits, order booking, and collections.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400">Chemist: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {approvingPharmacy.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Owner: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {approvingPharmacy.contactPerson}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Drug License: </span>
                <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                  {approvingPharmacy.drugLicenseNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Submitted By: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {approvingPharmacy.createdBy
                    ? `${approvingPharmacy.createdBy.firstName} ${approvingPharmacy.createdBy.lastName}`
                    : "MR"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setApprovingPharmacy(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={handleConfirmApprove}
                isLoading={approveMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Yes, Approve Chemist
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* REJECT REGISTRATION MODAL */}
      <Modal
        isOpen={Boolean(rejectingPharmacy)}
        onClose={() => setRejectingPharmacy(null)}
        title={`Reject Chemist Registration: ${rejectingPharmacy?.name}`}
        description="Provide a clear, mandatory justification explaining why this chemist submission was declined."
      >
        <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200">
              Reason for Rejection * (Mandatory)
            </label>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (rejectionError) setRejectionError("");
              }}
              placeholder="e.g. Drug license number could not be verified; store address is incomplete; duplicate pharmacy entry."
              className="w-full mt-1.5 p-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              required
            />
            {rejectionError && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {rejectionError}
              </p>
            )}
            <p className="mt-1 text-[10px] text-slate-500">
              This reason will be visible to the submitting Medical Representative on their mobile device.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setRejectingPharmacy(null);
                setRejectionReason("");
                setRejectionError("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              isLoading={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal
        isOpen={Boolean(historyPharmacy)}
        onClose={() => setHistoryPharmacy(null)}
        title={`Audit & Activity History: ${historyPharmacy?.name}`}
        description="Commercial orders, payment receipts, stock audits, and registration log"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {isHistoryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : historyItems && historyItems.length > 0 ? (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {historyItems.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-sky-500 shadow-sm" />

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {item.type === "ORDER" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 dark:bg-sky-950 dark:text-sky-300 px-1.5 py-0.5 rounded">
                            <ShoppingCart className="h-3 w-3" />
                            Order
                          </span>
                        )}
                        {item.type === "COLLECTION" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                            <Receipt className="h-3 w-3" />
                            Payment
                          </span>
                        )}
                        {item.type === "AUDIT" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                            <Boxes className="h-3 w-3" />
                            Stock Audit
                          </span>
                        )}
                        {item.type === "CREATION" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                            <CheckCircle className="h-3 w-3" />
                            Enrolled
                          </span>
                        )}
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDate(item.date)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      {item.subtitle}
                    </div>

                    {item.amount !== undefined && (
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                        Amount: {formatCurrency(item.amount)}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No historical transactions or visits recorded yet for this pharmacy.
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryPharmacy(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
