"use client";

import React, { useState } from "react";
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
  useDoctors,
  usePendingDoctors,
  useRejectedDoctors,
  useApproveDoctor,
  useRejectDoctor,
  useDoctorHistory,
  useCreateDoctor,
  useUpdateDoctor,
  useSpecialties,
  useTerritories,
} from "@/hooks";
import { useAuthStore } from "@/store";
import { formatDate } from "@/lib/utils";
import type { Doctor, DoctorInput, DoctorTier, DoctorApprovalStatus } from "@/types";
import {
  Stethoscope,
  Search,
  MapPin,
  Phone,
  Plus,
  Edit2,
  Clock,
  History as HistoryIcon,
  Filter,
  RotateCcw,
  CheckCircle,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  Building,
  ShieldCheck,
  XCircle,
  FileText,
} from "lucide-react";

export default function DoctorsPage() {
  const { user } = useAuthStore();
  const isCompanyAdmin =
    user?.role === "COMPANY_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  // Tab State: All Doctors vs Pending Approvals vs Rejected
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "REJECTED">("ALL");

  // Filters State
  const [search, setSearch] = useState("");
  const [territoryId, setTerritoryId] = useState("ALL");
  const [specialty, setSpecialty] = useState("ALL");
  const [tier, setTier] = useState("ALL");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>("ALL");

  // Queries
  const { data: territories } = useTerritories();
  const { data: specialties } = useSpecialties();

  // 1. All / Approved Doctors
  const { data: doctors, isLoading, isError, refetch } = useDoctors({
    search,
    territoryId,
    specialty,
    tier,
    approvalStatus:
      approvalStatusFilter !== "ALL"
        ? (approvalStatusFilter as DoctorApprovalStatus)
        : undefined,
  });

  // 2. Pending Approvals
  const {
    data: pendingDoctors,
    isLoading: isPendingLoading,
    refetch: refetchPending,
  } = usePendingDoctors();

  // 3. Rejected Doctors
  const {
    data: rejectedDoctors,
    isLoading: isRejectedLoading,
    refetch: refetchRejected,
  } = useRejectedDoctors();

  // Mutations
  const createMutation = useCreateDoctor();
  const updateMutation = useUpdateDoctor();
  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [historyDoctor, setHistoryDoctor] = useState<Doctor | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Doctor | null>(null);

  // Approval / Rejection state
  const [approvingDoctor, setApprovingDoctor] = useState<Doctor | null>(null);
  const [rejectingDoctor, setRejectingDoctor] = useState<Doctor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Form State for Create / Edit
  const [formState, setFormState] = useState<DoctorInput>({
    name: "",
    specialty: "General Medicine",
    qualification: "MBBS",
    clinicName: "",
    address: "",
    phone: "",
    email: "",
    territoryId: "",
    tier: "B",
    visitFrequency: 2,
    latitude: 13.0569,
    longitude: 80.252,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleResetFilters = () => {
    setSearch("");
    setTerritoryId("ALL");
    setSpecialty("ALL");
    setTier("ALL");
    setApprovalStatusFilter("ALL");
  };

  const handleOpenCreate = () => {
    setFormState({
      name: "",
      specialty: specialties?.[0] || "General Medicine",
      qualification: "MBBS",
      clinicName: "",
      address: "",
      phone: "",
      email: "",
      territoryId: territories?.[0]?.id || "",
      tier: "B",
      visitFrequency: 2,
      latitude: 13.0569,
      longitude: 80.252,
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormState({
      name: doc.name,
      specialty: doc.specialty,
      qualification: doc.qualification || "MBBS, MD",
      clinicName: doc.clinicName,
      address: doc.address,
      phone: doc.phone,
      email: doc.email || "",
      territoryId: doc.territoryId,
      tier: doc.tier,
      visitFrequency: doc.visitFrequency || 2,
      latitude: doc.latitude,
      longitude: doc.longitude,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formState.name.trim()) errors.name = "Doctor name is required.";
    if (!formState.clinicName?.trim()) errors.clinicName = "Clinic name is required.";
    if (!formState.address.trim()) errors.address = "Clinic address is required.";
    if (!formState.phone.trim()) errors.phone = "Contact phone is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await createMutation.mutateAsync(formState);
      setIsCreateOpen(false);
      setActionSuccessMessage(`Doctor ${formState.name} enrolled successfully.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormErrors({ submit: err?.message || "Failed to create doctor." });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    if (!validateForm()) return;
    try {
      await updateMutation.mutateAsync({ id: editingDoctor.id, input: formState });
      setEditingDoctor(null);
      setActionSuccessMessage(`Doctor ${formState.name} updated successfully.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormErrors({ submit: err?.message || "Failed to update doctor." });
    }
  };

  // Confirm Approval Flow
  const handleConfirmApprove = async () => {
    if (!approvingDoctor) return;
    try {
      await approveMutation.mutateAsync(approvingDoctor.id);
      setActionSuccessMessage(`Doctor ${approvingDoctor.name} has been approved and activated for field operations.`);
      if (selectedDetails?.id === approvingDoctor.id) {
        setSelectedDetails((prev) => (prev ? { ...prev, approvalStatus: "APPROVED" } : null));
      }
      setApprovingDoctor(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      const msg = err?.message || "Failed to approve registration.";
      if (msg.toLowerCase().includes("already approved")) {
        queryClient.invalidateQueries({ queryKey: ["doctors"] });
        setActionSuccessMessage(`Doctor ${approvingDoctor.name} is approved and active.`);
        if (selectedDetails?.id === approvingDoctor.id) {
          setSelectedDetails((prev) => (prev ? { ...prev, approvalStatus: "APPROVED" } : null));
        }
        setApprovingDoctor(null);
        setTimeout(() => setActionSuccessMessage(null), 4000);
      } else {
        alert(msg);
      }
    }
  };

  // Reject Dialog
  const handleOpenRejectDialog = (doc: Doctor) => {
    setRejectingDoctor(doc);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDoctor) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setRejectionError("A mandatory rejection reason (at least 5 characters) is required.");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        id: rejectingDoctor.id,
        reason: rejectionReason.trim(),
      });
      setActionSuccessMessage(`Registration for ${rejectingDoctor.name} has been rejected.`);
      if (selectedDetails?.id === rejectingDoctor.id) {
        setSelectedDetails((prev) =>
          prev ? { ...prev, approvalStatus: "REJECTED", rejectionReason: rejectionReason.trim() } : null
        );
      }
      setRejectingDoctor(null);
      setRejectionReason("");
      setRejectionError("");
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      const msg = err?.message || "Failed to reject registration.";
      if (msg.toLowerCase().includes("already rejected")) {
        queryClient.invalidateQueries({ queryKey: ["doctors"] });
        setActionSuccessMessage(`Registration for ${rejectingDoctor.name} has been recorded as rejected.`);
        if (selectedDetails?.id === rejectingDoctor.id) {
          setSelectedDetails((prev) =>
            prev ? { ...prev, approvalStatus: "REJECTED", rejectionReason: rejectionReason.trim() } : null
          );
        }
        setRejectingDoctor(null);
        setRejectionReason("");
        setRejectionError("");
        setTimeout(() => setActionSuccessMessage(null), 4000);
      } else {
        setRejectionError(msg);
      }
    }
  };

  // History query for selected doctor
  const { data: historyItems, isLoading: isHistoryLoading } = useDoctorHistory(
    historyDoctor?.id || ""
  );

  const pendingCount = pendingDoctors?.length || 0;
  const rejectedCount = rejectedDoctors?.length || 0;

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
        title="Doctors & Clinics Master Registry"
        description="Comprehensive healthcare professional profiling, multi-tier classification, and MR registration approval governance."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="default">{doctors?.length || 0} Total Active</Badge>
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
            <span>Enroll New Doctor</span>
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

      {/* Tab Controls: 1. All Doctors | 2. Pending Approvals | 3. Rejected */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ALL"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          <span>All Doctors</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-700/60 text-white">
            {doctors?.length || 0}
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

      {/* TAB 1: ALL DOCTORS (Approved Directory) */}
      {activeTab === "ALL" && (
        <>
          {/* Filter Bar */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-sky-600" />
                  Search & Master Filters
                </span>
                {(search ||
                  territoryId !== "ALL" ||
                  specialty !== "ALL" ||
                  tier !== "ALL" ||
                  approvalStatusFilter !== "ALL") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 text-slate-500 hover:text-slate-900"
                    onClick={handleResetFilters}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset Filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search doctor, clinic, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>

                {/* Territory */}
                <div>
                  <select
                    value={territoryId}
                    onChange={(e) => setTerritoryId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ALL">All Territories</option>
                    {territories?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specialty */}
                <div>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ALL">All Specialties</option>
                    {specialties?.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Tier */}
                <div>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="A_PLUS">Tier A+ (Key Opinion Leader)</option>
                    <option value="A">Tier A (High Volume)</option>
                    <option value="B">Tier B (Standard)</option>
                    <option value="C">Tier C (Occasional)</option>
                  </select>
                </div>

                {/* Approval Status Filter */}
                <div>
                  <select
                    value={approvalStatusFilter}
                    onChange={(e) => setApprovalStatusFilter(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ALL">All Approval States</option>
                    <option value="APPROVED">Approved Only</option>
                    <option value="PENDING_APPROVAL">Pending Review</option>
                    <option value="REJECTED">Rejected Registrations</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctors Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-sky-600" />
                  Registered Doctors & Clinics Master Table
                </CardTitle>
                <CardDescription>
                  Physician credentials, specialty, priority tier, registration source, and governance status
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {doctors?.length || 0} Doctors Displayed
              </Badge>
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
                    title="Failed to Load Physicians"
                    description="An error occurred while fetching the doctor and clinic directory."
                    onRetry={() => refetch()}
                  />
                </div>
              ) : !doctors || doctors.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No Physicians Found"
                    description="No doctors match the selected territory, specialty, priority tier, approval status, or search criteria."
                    actionLabel="Reset All Filters"
                    onAction={handleResetFilters}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Physician & Clinic</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Priority Tier</TableHead>
                      <TableHead>Approval Status</TableHead>
                      <TableHead>Registered By</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>Contact Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors?.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {doc.clinicName} • {doc.address}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                            {doc.specialty}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              doc.tier === "A_PLUS"
                                ? "default"
                                : doc.tier === "A"
                                ? "info"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            Tier {doc.tier.replace("_", "+")}
                          </Badge>
                        </TableCell>

                        <TableCell>{renderApprovalBadge(doc.approvalStatus)}</TableCell>

                        <TableCell>
                          {doc.createdBy ? (
                            <div className="text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {doc.createdBy.firstName} {doc.createdBy.lastName}
                              </span>
                              <div className="text-[10px] text-slate-400">MR / Field Rep</div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">System / Head Office</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{doc.territoryName}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {doc.phone}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Company Admin Approval Quick Actions for Pending */}
                            {isCompanyAdmin && doc.approvalStatus === "PENDING_APPROVAL" && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  onClick={() => setApprovingDoctor(doc)}
                                  title="Approve Registration"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Approve</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
                                  onClick={() => handleOpenRejectDialog(doc)}
                                  title="Reject Registration"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Reject</span>
                                </Button>
                              </>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => setSelectedDetails(doc)}
                              title="View Profile Details"
                            >
                              Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => handleOpenEdit(doc)}
                              title="Edit Doctor"
                            >
                              <Edit2 className="h-3 w-3 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => setHistoryDoctor(doc)}
                              title="View Interaction History"
                            >
                              <HistoryIcon className="h-3 w-3 text-sky-600" />
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
                Doctor Registrations Awaiting Company Admin Approval
              </CardTitle>
              <CardDescription>
                Review physician credentials, medical license, clinic address, and GPS geofence parameters submitted by Medical Representatives.
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
            ) : !pendingDoctors || pendingDoctors.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 mb-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  No Pending Doctor Registrations
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All field doctor registrations have been audited and resolved. New submissions by Medical Representatives will appear here immediately.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor Name & Specialty</TableHead>
                    <TableHead>Clinic Name & Location</TableHead>
                    <TableHead>Mobile & Reg No</TableHead>
                    <TableHead>Created by MR</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Approval Status</TableHead>
                    <TableHead className="text-right">Governance Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDoctors.map((doc: Doctor) => (
                    <TableRow key={doc.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
                      <TableCell>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold">
                          {doc.specialty} • {doc.qualification || "MBBS"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {doc.clinicName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {doc.address} ({doc.territoryName})
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {doc.phone}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {doc.registrationNo ? `Reg: ${doc.registrationNo}` : "Reg: N/A"}
                        </div>
                      </TableCell>

                      <TableCell>
                        {doc.createdBy ? (
                          <div className="text-xs">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {doc.createdBy.firstName} {doc.createdBy.lastName}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {doc.createdBy.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Field Representative</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs font-mono text-slate-500">
                        {doc.createdAt ? formatDate(doc.createdAt) : "Recent"}
                      </TableCell>

                      <TableCell>{renderApprovalBadge(doc.approvalStatus)}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2.5"
                            onClick={() => setSelectedDetails(doc)}
                          >
                            View Details
                          </Button>

                          {isCompanyAdmin && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
                                onClick={() => setApprovingDoctor(doc)}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs px-3 text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 font-semibold"
                                onClick={() => handleOpenRejectDialog(doc)}
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
                Rejected Doctor Registrations Archive
              </CardTitle>
              <CardDescription>
                Auditable repository of declined physician submissions along with mandatory justification reasons.
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
            ) : !rejectedDoctors || rejectedDoctors.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                  <CheckCircle className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  No Rejected Registrations
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are no rejected doctor registrations in this organization.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor Name & Specialty</TableHead>
                    <TableHead>Clinic Name & Address</TableHead>
                    <TableHead>Contact & Reg No</TableHead>
                    <TableHead>Created by MR</TableHead>
                    <TableHead>Reviewed By & Date</TableHead>
                    <TableHead>Rejection Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedDoctors.map((doc: Doctor) => (
                    <TableRow key={doc.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20">
                      <TableCell>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {doc.specialty} • {doc.qualification || "MBBS"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {doc.clinicName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {doc.address} ({doc.territoryName})
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
                          {doc.phone}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {doc.registrationNo ? `Reg: ${doc.registrationNo}` : "Reg: N/A"}
                        </div>
                      </TableCell>

                      <TableCell>
                        {doc.createdBy ? (
                          <div className="text-xs">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {doc.createdBy.firstName} {doc.createdBy.lastName}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {doc.createdBy.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">MR / Field Rep</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {doc.reviewedBy ? (
                          <div className="text-xs">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {doc.reviewedBy.firstName} {doc.reviewedBy.lastName}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {doc.reviewedAt ? formatDate(doc.reviewedAt) : "Date unknown"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Company Admin</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-medium max-w-xs">
                          {doc.rejectionReason || "Requirements not met"}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-2.5"
                          onClick={() => setSelectedDetails(doc)}
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

      {/* MODAL 1: CREATE DOCTOR */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Enroll New Doctor in Master Registry"
        description="Register physician credentials, specialty, clinic address, and registered GPS coordinates."
      >
        <form onSubmit={handleSaveCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Doctor Full Name *</label>
              <Input
                placeholder="e.g. Dr. K. Saravanan"
                value={formState.name}
                onChange={(e) => {
                  setFormState({ ...formState, name: e.target.value });
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                }}
                required
                className={formErrors.name ? "mt-1 border-rose-400 focus:border-rose-500" : "mt-1"}
              />
              {formErrors.name && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Specialty *</label>
              <select
                value={formState.specialty}
                onChange={(e) => setFormState({ ...formState, specialty: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 mt-1 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {specialties?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Priority Tier *</label>
              <select
                value={formState.tier}
                onChange={(e) => setFormState({ ...formState, tier: e.target.value as DoctorTier })}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 mt-1 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="A_PLUS">Tier A+ (Key Opinion Leader)</option>
                <option value="A">Tier A (High Priority)</option>
                <option value="B">Tier B (Standard)</option>
                <option value="C">Tier C (Occasional)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Territory *</label>
              <select
                value={formState.territoryId}
                onChange={(e) => setFormState({ ...formState, territoryId: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 mt-1 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {territories?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Qualification</label>
              <Input
                placeholder="e.g. MBBS, MD (General Medicine)"
                value={formState.qualification}
                onChange={(e) => setFormState({ ...formState, qualification: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Clinic / Hospital Name *</label>
              <Input
                placeholder="e.g. Saravana Health Care Clinic"
                value={formState.clinicName}
                onChange={(e) => {
                  setFormState({ ...formState, clinicName: e.target.value });
                  if (formErrors.clinicName) setFormErrors((prev) => ({ ...prev, clinicName: "" }));
                }}
                required
                className={formErrors.clinicName ? "mt-1 border-rose-400 focus:border-rose-500" : "mt-1"}
              />
              {formErrors.clinicName && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.clinicName}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Clinic Street Address *</label>
              <Input
                placeholder="e.g. 14 Gandhi Road, Anna Nagar"
                value={formState.address}
                onChange={(e) => {
                  setFormState({ ...formState, address: e.target.value });
                  if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: "" }));
                }}
                required
                className={formErrors.address ? "mt-1 border-rose-400 focus:border-rose-500" : "mt-1"}
              />
              {formErrors.address && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.address}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Contact Phone *</label>
              <Input
                placeholder="e.g. +91 94431 28901"
                value={formState.phone}
                onChange={(e) => {
                  setFormState({ ...formState, phone: e.target.value });
                  if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: "" }));
                }}
                required
                className={formErrors.phone ? "mt-1 border-rose-400 focus:border-rose-500" : "mt-1"}
              />
              {formErrors.phone && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <Input
                type="email"
                placeholder="e.g. dr.saravanan@gmail.com"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Latitude *</label>
              <Input
                type="number"
                step="any"
                value={formState.latitude}
                onChange={(e) => setFormState({ ...formState, latitude: parseFloat(e.target.value) || 0 })}
                required
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Longitude *</label>
              <Input
                type="number"
                step="any"
                value={formState.longitude}
                onChange={(e) => setFormState({ ...formState, longitude: parseFloat(e.target.value) || 0 })}
                required
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createMutation.isPending}>
              Enroll Doctor
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT DOCTOR */}
      <Modal
        isOpen={Boolean(editingDoctor)}
        onClose={() => setEditingDoctor(null)}
        title={`Edit Doctor Profile: ${editingDoctor?.name}`}
        description="Update contact credentials, clinic location, and geofencing parameters."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Doctor Full Name *</label>
              <Input
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Specialty *</label>
              <select
                value={formState.specialty}
                onChange={(e) => setFormState({ ...formState, specialty: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 mt-1 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {specialties?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Priority Tier *</label>
              <select
                value={formState.tier}
                onChange={(e) => setFormState({ ...formState, tier: e.target.value as DoctorTier })}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 mt-1 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="A_PLUS">Tier A+ (Key Opinion Leader)</option>
                <option value="A">Tier A (High Priority)</option>
                <option value="B">Tier B (Standard)</option>
                <option value="C">Tier C (Occasional)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Territory *</label>
              <select
                value={formState.territoryId}
                onChange={(e) => setFormState({ ...formState, territoryId: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 mt-1 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {territories?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Clinic / Hospital Name *</label>
              <Input
                value={formState.clinicName}
                onChange={(e) => setFormState({ ...formState, clinicName: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Clinic Street Address *</label>
              <Input
                value={formState.address}
                onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Contact Phone *</label>
              <Input
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <Input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Latitude *</label>
              <Input
                type="number"
                step="any"
                value={formState.latitude}
                onChange={(e) => setFormState({ ...formState, latitude: parseFloat(e.target.value) || 0 })}
                required
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Longitude *</label>
              <Input
                type="number"
                step="any"
                value={formState.longitude}
                onChange={(e) => setFormState({ ...formState, longitude: parseFloat(e.target.value) || 0 })}
                required
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setEditingDoctor(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={updateMutation.isPending}>
              Update Doctor
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: DOCTOR PROFILE & GOVERNANCE DETAILS */}
      <Modal
        isOpen={Boolean(selectedDetails)}
        onClose={() => setSelectedDetails(null)}
        title={selectedDetails ? `${selectedDetails.name} — Physician Profile & Master Data` : "Doctor Details"}
        description="Healthcare professional master data record, geofencing parameters, and registration review audit."
      >
        {selectedDetails && (
          <div className="space-y-4 text-xs">
            {/* Pending Notice Banner */}
            {selectedDetails.approvalStatus === "PENDING_APPROVAL" && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs">
                  <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                  <span>REGISTRATION PENDING COMPANY ADMIN APPROVAL</span>
                </div>
                <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                  This doctor registration was submitted by a field Medical Representative. Normal MTP scheduling and visit execution remain locked until approved by Company Admin.
                </p>
                {selectedDetails.createdBy && (
                  <div className="text-[11px] font-medium text-amber-900 dark:text-amber-200 pt-1 border-t border-amber-200/80">
                    Submitted by MR: <span className="font-bold">{selectedDetails.createdBy.firstName} {selectedDetails.createdBy.lastName}</span> ({selectedDetails.createdBy.email})
                    {selectedDetails.createdAt ? ` on ${formatDate(selectedDetails.createdAt)}` : ""}
                  </div>
                )}
              </div>
            )}

            {/* Rejection Notice Banner if rejected */}
            {selectedDetails.approvalStatus === "REJECTED" && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>REGISTRATION REJECTED BY ADMIN</span>
                </div>
                <p className="text-rose-800 dark:text-rose-300 font-semibold">
                  Mandatory Reason: {selectedDetails.rejectionReason || "Requirements not met"}
                </p>
                {selectedDetails.reviewedBy && (
                  <div className="text-[11px] text-rose-700 dark:text-rose-400 font-mono">
                    Reviewed by {selectedDetails.reviewedBy.firstName} {selectedDetails.reviewedBy.lastName} on{" "}
                    {selectedDetails.reviewedAt ? formatDate(selectedDetails.reviewedAt) : "Date unknown"}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-bold dark:bg-sky-950 dark:text-sky-300">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedDetails.name}</div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium">
                    {selectedDetails.specialty} • {selectedDetails.qualification || "MBBS"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedDetails.tier === "A_PLUS" ? "default" : "info"}>
                  Tier {selectedDetails.tier.replace("_", "+")}
                </Badge>
                {renderApprovalBadge(selectedDetails.approvalStatus)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Clinic & Address</span>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{selectedDetails.clinicName}</div>
                <div className="text-slate-500">{selectedDetails.address}</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Territory & Calls</span>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{selectedDetails.territoryName}</div>
                <div className="text-slate-500">{selectedDetails.visitFrequency} calls / month quota</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Contact</span>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedDetails.phone}</span>
                </div>
                <div className="text-slate-500">{selectedDetails.email || "No email on record"}</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Medical License / Geofence</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedDetails.registrationNo ? `Reg: ${selectedDetails.registrationNo}` : "TNMC Registered"}
                </div>
                <div className="font-mono text-emerald-600 text-[11px]">
                  ({selectedDetails.latitude}, {selectedDetails.longitude}) • 50m radius
                </div>
              </div>
            </div>

            {/* Registration Audit & Creator Card */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800 space-y-2">
              <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                Audit Trail & Submission History
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Enrolled By: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedDetails.createdBy
                      ? `${selectedDetails.createdBy.firstName} ${selectedDetails.createdBy.lastName} (${selectedDetails.createdBy.email})`
                      : "Head Office Administrator"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Enrollment Date: </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedDetails.createdAt ? formatDate(selectedDetails.createdAt) : "Archived"}
                  </span>
                </div>
                {selectedDetails.reviewedBy && (
                  <>
                    <div>
                      <span className="text-slate-400">Reviewed By: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedDetails.reviewedBy.firstName} {selectedDetails.reviewedBy.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Review Timestamp: </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {selectedDetails.reviewedAt ? formatDate(selectedDetails.reviewedAt) : "N/A"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Company Admin Actions for Pending Status directly in Modal */}
            {isCompanyAdmin && selectedDetails.approvalStatus === "PENDING_APPROVAL" && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                <div className="text-xs text-amber-900 dark:text-amber-300 font-medium">
                  Take governance action on this pending registration:
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={() => setApprovingDoctor(selectedDetails)}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Approve Doctor
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

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: CONFIRM APPROVAL DIALOG */}
      <Modal
        isOpen={Boolean(approvingDoctor)}
        onClose={() => setApprovingDoctor(null)}
        title="Confirm Doctor Registration Approval"
        description="Verify physician credentials before authorizing active field status."
      >
        {approvingDoctor && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
              <p className="font-semibold">
                Are you sure you want to approve <span className="font-bold underline">{approvingDoctor.name}</span>?
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                Once approved, this doctor will enter the active Physician Directory and become immediately eligible for MTP scheduling, DCR recording, detailing visits, and order booking.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400">Doctor: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{approvingDoctor.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Specialty: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{approvingDoctor.specialty}</span>
              </div>
              <div>
                <span className="text-slate-400">Clinic: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{approvingDoctor.clinicName}</span>
              </div>
              <div>
                <span className="text-slate-400">Submitted By: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {approvingDoctor.createdBy ? `${approvingDoctor.createdBy.firstName} ${approvingDoctor.createdBy.lastName}` : "MR"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setApprovingDoctor(null)}>
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
                Yes, Approve Doctor
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 5: REJECT REGISTRATION WITH MANDATORY REASON */}
      <Modal
        isOpen={Boolean(rejectingDoctor)}
        onClose={() => setRejectingDoctor(null)}
        title={`Reject Doctor Registration: ${rejectingDoctor?.name}`}
        description="Provide a clear, mandatory justification explaining why this registration was declined so the representative can correct it."
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
              placeholder="e.g. Clinic address could not be verified; medical registration number does not match council records; duplicate clinic chamber already registered."
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
                setRejectingDoctor(null);
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

      {/* MODAL 6: INTERACTION HISTORY TIMELINE */}
      <Modal
        isOpen={Boolean(historyDoctor)}
        onClose={() => setHistoryDoctor(null)}
        title={historyDoctor ? `Interaction Timeline — ${historyDoctor.name}` : "Doctor History"}
        description="Comprehensive chronological record of MR field visits, GPS verifications, sample disbursements, and detailings."
      >
        <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
          {isHistoryLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !historyItems || historyItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No historical interactions or detailing calls logged for this physician yet.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-4 space-y-4">
              {historyItems.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-600 dark:border-slate-900" />
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
                      <span className="font-mono text-slate-400">{formatDate(item.date)}</span>
                    </div>
                    {item.subtitle && (
                      <div className="text-[11px] text-sky-700 dark:text-sky-300 font-medium mb-1">
                        {item.subtitle}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
