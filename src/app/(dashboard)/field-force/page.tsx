"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useMRList,
  useManagers,
  useTerritories,
  useCurrentUser,
  useCreateUser,
  useOrganizations,
  useUserList,
  useUpdateMRTerritory,
  useCreateTerritory,
} from "@/hooks";
import { formatCurrency } from "@/lib/utils";
import { normalizeRole, getRoleLabel } from "@/types";
import { Modal } from "@/components/ui/dialog";
import {
  Users,
  Search,
  MapPin,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  Filter,
  RotateCcw,
  Plus,
  Building,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Edit3,
} from "lucide-react";

export default function FieldForcePage() {
  const { data: currentUser } = useCurrentUser();
  const canonicalRole = normalizeRole(currentUser?.role);
  const createUserMutation = useCreateUser();
  const updateTerritoryMutation = useUpdateMRTerritory();
  const { data: organizations } = useOrganizations();
  const { data: userList, isLoading: isUsersLoading, refetch: refetchUsers } = useUserList();

  const [search, setSearch] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("ALL");
  const [territoryId, setTerritoryId] = useState("ALL");
  const [managerId, setManagerId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [performance, setPerformance] = useState<"ALL" | "ON_TRACK" | "BELOW_TARGET" | "AHEAD">("ALL");

  // Provision User Modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Password123!",
    phone: "",
    role: "MR",
    organizationId: "",
    territoryId: "",
    managerId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Assign Territory Modal state (Company Admin only)
  const [isAssignTerritoryOpen, setIsAssignTerritoryOpen] = useState(false);
  const [selectedRepForTerritory, setSelectedRepForTerritory] = useState<{
    id: string;
    name: string;
    currentTerritoryId?: string;
    currentManagerId?: string;
    designation?: string;
  } | null>(null);
  const [targetTerritoryId, setTargetTerritoryId] = useState("");
  const [targetManagerId, setTargetManagerId] = useState("");
  const [territoryAssignSuccess, setTerritoryAssignSuccess] = useState<string | null>(null);
  const [territoryAssignError, setTerritoryAssignError] = useState<string | null>(null);

  // Add Territory Modal state (Company Admin)
  const createTerritoryMutation = useCreateTerritory();
  const [isAddTerritoryOpen, setIsAddTerritoryOpen] = useState(false);
  const [territoryForm, setTerritoryForm] = useState({
    name: "",
    code: "",
    zone: "South",
    region: "",
    headquarters: "",
    area: "",
    description: "",
  });
  const [territoryFormError, setTerritoryFormError] = useState<string | null>(null);
  const [territoryFormSuccess, setTerritoryFormSuccess] = useState<string | null>(null);

  const companyOrgId = canonicalRole === "SUPER_ADMIN" ? undefined : currentUser?.organizationId || undefined;
  const { data: territories, refetch: refetchTerritories } = useTerritories(companyOrgId);
  const { data: managers } = useManagers(companyOrgId);
  const { data: mrList, isLoading: isMRLoading, refetch: refetchMRs } = useMRList({
    search,
    organizationId: companyOrgId,
    territoryId: territoryId !== "ALL" ? territoryId : undefined,
    managerId,
    status,
    performance,
  });

  const handleOpenAddUser = () => {
    setUserForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "Password123!",
      phone: "",
      role: canonicalRole === "SUPER_ADMIN" ? "ADMIN" : "MR",
      organizationId: canonicalRole === "SUPER_ADMIN" ? (organizations?.[0]?.id || "") : (currentUser?.organizationId || ""),
      territoryId: territories?.[0]?.id || "",
      managerId: managers?.[0]?.id || "",
    });
    setFormError(null);
    setFormSuccess(null);
    setIsAddUserOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!userForm.firstName || !userForm.lastName || !userForm.email) {
      setFormError("First Name, Last Name, and Email are required.");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        ...userForm,
        organizationId: canonicalRole === "SUPER_ADMIN" ? userForm.organizationId : currentUser?.organizationId || undefined,
        // Super Admin does NOT assign territory - territory is assigned by Company Admin
        territoryId: canonicalRole === "SUPER_ADMIN" ? undefined : userForm.territoryId,
      });
      setFormSuccess(`User ${userForm.firstName} ${userForm.lastName} (${userForm.role}) provisioned successfully!`);
      refetchUsers();
      refetchMRs();
      setTimeout(() => {
        setIsAddUserOpen(false);
      }, 1200);
    } catch (err: any) {
      setFormError(err?.message || "Failed to provision user. Please try again.");
    }
  };

  const handleOpenAssignTerritory = (rep: {
    id: string;
    name: string;
    currentTerritoryId?: string;
    currentManagerId?: string;
    designation?: string;
  }) => {
    setSelectedRepForTerritory(rep);
    setTargetTerritoryId(rep.currentTerritoryId || territories?.[0]?.id || "");
    setTargetManagerId(rep.currentManagerId || "");
    setTerritoryAssignError(null);
    setTerritoryAssignSuccess(null);
    setIsAssignTerritoryOpen(true);
  };

  const handleAssignTerritorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepForTerritory || !targetTerritoryId) return;

    try {
      await updateTerritoryMutation.mutateAsync({
        mrId: selectedRepForTerritory.id,
        territoryId: targetTerritoryId,
        managerId: targetManagerId || undefined,
      });
      setTerritoryAssignSuccess(`Territory updated successfully for ${selectedRepForTerritory.name}!`);
      refetchMRs();
      refetchUsers();
      setTimeout(() => {
        setIsAssignTerritoryOpen(false);
      }, 1100);
    } catch (err: any) {
      setTerritoryAssignError(err?.message || "Failed to assign territory.");
    }
  };

  const handleOpenAddTerritory = () => {
    setTerritoryForm({
      name: "",
      code: "",
      zone: "South",
      region: "",
      headquarters: "",
      area: "",
      description: "",
    });
    setTerritoryFormError(null);
    setTerritoryFormSuccess(null);
    setIsAddTerritoryOpen(true);
  };

  const handleCreateTerritorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTerritoryFormError(null);
    setTerritoryFormSuccess(null);

    if (!territoryForm.name || !territoryForm.code) {
      setTerritoryFormError("Territory Name and Code are required.");
      return;
    }

    try {
      await createTerritoryMutation.mutateAsync({
        ...territoryForm,
        organizationId: currentUser?.organizationId || undefined,
      });
      setTerritoryFormSuccess(`Territory "${territoryForm.name}" created successfully!`);
      refetchTerritories();
      setTimeout(() => {
        setIsAddTerritoryOpen(false);
      }, 1100);
    } catch (err: any) {
      setTerritoryFormError(err?.message || "Failed to create territory.");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedOrgId("ALL");
    setTerritoryId("ALL");
    setManagerId("ALL");
    setStatus("ALL");
    setPerformance("ALL");
  };

  // Super Admin view filters
  const superAdminPersonnel = (userList || []).filter((u) => {
    if (normalizeRole(u.role) === "SUPER_ADMIN") return false;
    const matchesOrg = selectedOrgId === "ALL" || u.organizationId === selectedOrgId;
    const matchesSearch =
      !search ||
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.employeeCode && u.employeeCode.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = status === "ALL" || u.status === status;
    return matchesOrg && matchesSearch && matchesStatus;
  });

  // Metric summaries for Company Admin & Territory Manager
  const totalReps = mrList?.length || 0;
  const inFieldReps = mrList?.filter((m) => m.status === "IN_FIELD").length || 0;
  const belowTargetCount = mrList?.filter((m) => m.performanceStatus === "BELOW_TARGET").length || 0;
  const totalBookedValue = mrList?.reduce((sum, m) => sum + m.ordersValue, 0) || 0;

  // Metric summaries for Super Admin
  const totalTenantPersonnel = userList?.filter((u) => normalizeRole(u.role) !== "SUPER_ADMIN").length || 0;
  const totalTenantOrgs = organizations?.length || 0;
  const totalCompanyAdmins = userList?.filter((u) => normalizeRole(u.role) === "ADMIN").length || 0;
  const totalFieldStaff = userList?.filter((u) => normalizeRole(u.role) === "MR" || normalizeRole(u.role) === "TERRITORY_MANAGER").length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={canonicalRole === "SUPER_ADMIN" ? "Company Personnel Directory" : "Field Force Directory & Team Management"}
        description={
          canonicalRole === "SUPER_ADMIN"
            ? "High-level personnel roster across tenant companies. Super Administrators can add companies, admins, medical reps, and managers. Territory assignment is governed by Company Admins."
            : "Monitor representative territory deployment, daily call compliance, sales quota pacing, and live operational status."
        }
        badge={
          <Badge variant="default">
            {canonicalRole === "SUPER_ADMIN" ? `${totalTenantPersonnel} Registered Personnel` : `${totalReps} Field Reps Active`}
          </Badge>
        }
        actions={
          canonicalRole === "SUPER_ADMIN" ? (
            <div className="flex items-center gap-2">
              <Link href="/companies">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs cursor-pointer">
                  <Building className="h-3.5 w-3.5" />
                  <span>Manage Companies</span>
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddUser}
                className="gap-1.5 h-8 text-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Personnel</span>
              </Button>
            </div>
          ) : canonicalRole === "ADMIN" ? (
            <div className="flex items-center gap-2">
              <Link href="/territories">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs cursor-pointer">
                  <MapPin className="h-3.5 w-3.5 text-sky-600" />
                  <span>Territories Master</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddTerritory}
                className="gap-1.5 h-8 text-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Territory</span>
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Quick Summary Strip */}
      {canonicalRole === "SUPER_ADMIN" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Company Personnel
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalTenantPersonnel}</span>
              <span className="text-xs text-slate-500 font-medium">Across all tenants</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Tenant Companies
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                {totalTenantOrgs}
              </span>
              <span className="text-xs text-sky-600 font-medium">Organizations</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Company Administrators
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalCompanyAdmins}
              </span>
              <span className="text-xs text-emerald-600 font-medium">Territory Authorities</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Field Staff & Managers
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {totalFieldStaff}
              </span>
              <span className="text-xs text-indigo-500 font-medium">MRs & Managers</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Field Force
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalReps}</span>
              <span className="text-xs text-emerald-600 font-semibold">{inFieldReps} In-Clinic Now</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Commercial Orders Booked
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalBookedValue)}
              </span>
              <span className="text-xs text-slate-500 font-medium">Month to Date</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Below Quota Run-Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {belowTargetCount} MRs
              </span>
              <span className="text-xs text-rose-500 font-medium">Needs Attention</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Coverage Territories
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span suppressHydrationWarning className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {territories?.length || 17}
              </span>
              <span className="text-xs text-sky-600 font-medium">Tamil Nadu Hubs</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-sky-600" />
              Directory Filters
            </span>
            {(search || selectedOrgId !== "ALL" || territoryId !== "ALL" || managerId !== "ALL" || status !== "ALL" || performance !== "ALL") && (
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
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            {canonicalRole === "SUPER_ADMIN" ? (
              <>
                {/* Organization Filter for Super Admin */}
                <div className="md:col-span-2">
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ALL">All Tenant Companies</option>
                    {organizations?.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="md:col-span-2">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ALL">All Account Statuses</option>
                    <option value="ACTIVE">Active Accounts</option>
                    <option value="INACTIVE">Inactive Accounts</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Territory Filter */}
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

                {/* Manager Filter */}
                <div>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ALL">All Managers</option>
                    {managers?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="IN_FIELD">In-Field (Inside Clinic)</option>
                    <option value="ACTIVE">Active (En Route)</option>
                    <option value="COMPLETED">Completed Calls</option>
                    <option value="IDLE">Idle</option>
                  </select>
                </div>

                {/* Performance Filter */}
                <div>
                  <select
                    value={performance}
                    onChange={(e) =>
                      setPerformance(e.target.value as "ALL" | "ON_TRACK" | "BELOW_TARGET" | "AHEAD")
                    }
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ALL">All Quota Pacing</option>
                    <option value="AHEAD">Ahead (&gt; 45%)</option>
                    <option value="ON_TRACK">On Track (42% - 45%)</option>
                    <option value="BELOW_TARGET">Below Target (&lt; 42%)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-600" />
              {canonicalRole === "SUPER_ADMIN" ? "Tenant Company Personnel Roster" : "Medical Representatives Directory"}
            </CardTitle>
            <CardDescription>
              {canonicalRole === "SUPER_ADMIN"
                ? "Overview of who all are there across companies. Operational sales figures and call details are protected."
                : "Click any representative row to inspect deep dive call logs, orders, and product detailing activity."}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Showing {canonicalRole === "SUPER_ADMIN" ? superAdminPersonnel.length : totalReps} Personnel
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {canonicalRole === "SUPER_ADMIN" ? (
            isUsersLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : superAdminPersonnel.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Personnel Found"
                  description="No registered company personnel match your current search query or organization filters."
                  actionLabel="Reset All Filters"
                  onAction={handleResetFilters}
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User / Employee ID</TableHead>
                    <TableHead>Company Organization</TableHead>
                    <TableHead>Role & Designation</TableHead>
                    <TableHead>Territory Allocation</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead className="text-right">Operational Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {superAdminPersonnel.map((user) => {
                    const org = organizations?.find((o) => o.id === user.organizationId);
                    const territory = territories?.find((t) => t.id === user.territoryId);
                    const normRole = normalizeRole(user.role);

                    return (
                      <TableRow key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {((user.firstName?.[0] || "") + (user.lastName?.[0] || "U")).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {user.firstName} {user.lastName}
                              </span>
                              <div className="font-mono text-[11px] text-slate-500">
                                {user.employeeCode || user.employeeId || user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {org?.name || user.organizationName || user.companyName || (user.organizationId ? "Corporate Enterprise" : "System Platform")}
                          </div>
                          <div className="text-[10px] text-slate-400">{org?.code || "Tenant Organization"}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            normRole === "ADMIN"
                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                              : normRole === "TERRITORY_MANAGER"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                              : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                          }`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {normRole === "ADMIN" ? (
                            <span className="text-xs text-slate-500 italic">Company-Wide Authority</span>
                          ) : territory ? (
                            <div>
                              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                {territory.name}
                              </div>
                              <div className="text-[10px] text-slate-400">Assigned by Company Admin</div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              <MapPin className="h-3 w-3" />
                              Unassigned (Pending Company Admin)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "ACTIVE" ? "success" : "default"} className="text-[10px]">
                            {user.status || "ACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-[11px] text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            Details Protected
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          ) : (
            isMRLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !mrList || mrList.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Representatives Found"
                  description="No field personnel match your current search query or territory/status filters."
                  actionLabel="Reset All Filters"
                  onAction={handleResetFilters}
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Representative & Employee ID</TableHead>
                    <TableHead>Territory</TableHead>
                    <TableHead>Reporting Manager</TableHead>
                    <TableHead>Duty Status</TableHead>
                    <TableHead>Today&apos;s Visits</TableHead>
                    <TableHead>Monthly Target</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrList.map((mr) => (
                    <TableRow
                      key={mr.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {mr.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <Link
                              href={`/field-force/${mr.id}`}
                              className="font-bold text-slate-900 hover:text-sky-600 transition-colors dark:text-slate-100 text-xs"
                            >
                              {mr.name}
                            </Link>
                            <div className="font-mono text-[11px] text-slate-500">
                              {mr.employeeId} • {mr.designation}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                          <span>{mr.territoryName}</span>
                          {canonicalRole === "ADMIN" && (
                            <button
                              onClick={() => handleOpenAssignTerritory({
                                id: mr.id,
                                name: mr.name,
                                currentTerritoryId: mr.territoryId,
                                currentManagerId: mr.managerId,
                                designation: mr.designation,
                              })}
                              title="Assign/Change Territory"
                              className="p-1 text-slate-400 hover:text-sky-600 rounded hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{mr.headquarters}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {mr.managerName}
                        </div>
                        <div className="text-[10px] text-slate-400">Area Manager</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mr.status === "IN_FIELD"
                              ? "success"
                              : mr.status === "COMPLETED"
                              ? "secondary"
                              : "default"
                          }
                          className="text-[10px]"
                        >
                          {mr.status.replace("_", " ")}
                        </Badge>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px] mt-0.5">
                          {mr.currentActivity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {mr.todayVisits.completed} / {mr.todayVisits.planned} calls
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="h-1.5 w-14 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                            <div
                              className="h-full bg-sky-600 rounded-full"
                              style={{ width: `${mr.todayVisits.complianceRate}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {mr.todayVisits.complianceRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(mr.monthlyTarget)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {formatCurrency(mr.monthlyAchieved)}
                          </span>
                          {mr.performanceStatus === "AHEAD" ? (
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          ) : mr.performanceStatus === "BELOW_TARGET" ? (
                            <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                          ) : (
                            <Target className="h-3.5 w-3.5 text-sky-600" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {mr.achievementRate}% of quota
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canonicalRole === "ADMIN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              onClick={() => handleOpenAssignTerritory({
                                id: mr.id,
                                name: mr.name,
                                currentTerritoryId: mr.territoryId,
                                currentManagerId: mr.managerId,
                                designation: mr.designation,
                              })}
                            >
                              <MapPin className="h-3 w-3 text-sky-600" />
                              <span>Assign Territory</span>
                            </Button>
                          )}
                          <Link href={`/field-force/${mr.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-slate-800"
                            >
                              <span>Details</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>

      {/* PROVISION USER MODAL */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title={canonicalRole === "SUPER_ADMIN" ? "Provision Company Personnel" : "Provision Territory Manager or MR"}
        description={
          canonicalRole === "SUPER_ADMIN"
            ? "Add Company Administrators, Medical Representatives, or Managers to tenant companies. Territory assignment is managed by Company Admins."
            : "Create a new Territory Manager or Medical Representative for your company and assign their territory."
        }
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* If SUPER_ADMIN, allow choosing Organization */}
            {canonicalRole === "SUPER_ADMIN" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Company Organization *
                </label>
                <select
                  required
                  value={userForm.organizationId}
                  onChange={(e) => setUserForm({ ...userForm, organizationId: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-semibold"
                >
                  {organizations?.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={userForm.firstName}
                onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                placeholder="e.g. Anand"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={userForm.lastName}
                onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                placeholder="e.g. Krishnan"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporate Email Address *
              </label>
              <input
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="anand.k@novispharma.com"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="+91 98400 12345"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                System Role *
              </label>
              <select
                required
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-semibold"
              >
                {canonicalRole === "SUPER_ADMIN" ? (
                  <>
                    <option value="ADMIN">ADMIN (Company Administrator)</option>
                    <option value="TERRITORY_MANAGER">TERRITORY_MANAGER (Area Sales / Territory Manager)</option>
                    <option value="MR">MR (Medical Representative)</option>
                  </>
                ) : (
                  <>
                    <option value="TERRITORY_MANAGER">TERRITORY_MANAGER (Area Sales Manager)</option>
                    <option value="MR">MR (Medical Representative)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Password
              </label>
              <input
                type="text"
                required
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            {/* Territory Assignment Governance */}
            {canonicalRole === "SUPER_ADMIN" ? (
              <div className="sm:col-span-2 rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-xs text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <Shield className="h-3.5 w-3.5 text-sky-600" />
                  <span>Territory Assignment Governance</span>
                </div>
                <span>
                  As Super Admin, you provision personnel into tenant companies. Territory assignment to Medical Representatives and Territory Managers is governed strictly by the Company Administrator.
                </span>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Territory *
                  </label>
                  <select
                    required
                    value={userForm.territoryId}
                    onChange={(e) => setUserForm({ ...userForm, territoryId: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Select Territory…</option>
                    {territories?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reporting Manager
                  </label>
                  <select
                    value={userForm.managerId}
                    onChange={(e) => setUserForm({ ...userForm, managerId: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Select Reporting Manager…</option>
                    {managers?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {createUserMutation.isPending ? "Creating Account..." : "Provision User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN TERRITORY MODAL (Company Admin Exclusive) */}
      <Modal
        isOpen={isAssignTerritoryOpen}
        onClose={() => setIsAssignTerritoryOpen(false)}
        title="Assign Territory to Field Personnel"
        description={`Allocate or change the authorized operational territory and reporting manager for ${selectedRepForTerritory?.name}.`}
        maxWidth="md"
      >
        <form onSubmit={handleAssignTerritorySubmit} className="space-y-4">
          {territoryAssignError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{territoryAssignError}</span>
            </div>
          )}

          {territoryAssignSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{territoryAssignSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Authorized Territory *
            </label>
            <select
              required
              value={targetTerritoryId}
              onChange={(e) => setTargetTerritoryId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-semibold"
            >
              <option value="">Select Territory…</option>
              {territories?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code}) — {t.region}
                </option>
              ))}
            </select>
          </div>

          {!selectedRepForTerritory?.designation?.toLowerCase().includes("manager") && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reporting Manager
              </label>
              <select
                value={targetManagerId}
                onChange={(e) => setTargetManagerId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-semibold"
              >
                <option value="">None / Direct Company Reporting</option>
                {managers?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Company Governance: </span>
            This field representative or manager will immediately gain authorized access to doctors, pharmacies, and operational scheduling mapped to this territory.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignTerritoryOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTerritoryMutation.isPending}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {updateTerritoryMutation.isPending ? "Assigning..." : "Save Territory Assignment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD TERRITORY MODAL (Company Admin) */}
      <Modal
        isOpen={isAddTerritoryOpen}
        onClose={() => setIsAddTerritoryOpen(false)}
        title="Add New Coverage Territory"
        description="Create an authorized operational sales territory for your company to assign to field representatives."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTerritorySubmit} className="space-y-4">
          {territoryFormError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{territoryFormError}</span>
            </div>
          )}

          {territoryFormSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{territoryFormSuccess}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Territory Name *
              </label>
              <input
                type="text"
                required
                value={territoryForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoCode = `TN-${val.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
                  setTerritoryForm((prev) => ({
                    ...prev,
                    name: val,
                    code: prev.code ? prev.code : autoCode,
                    headquarters: prev.headquarters ? prev.headquarters : val,
                    region: prev.region ? prev.region : `${val} District`,
                  }));
                }}
                placeholder="e.g. Salem Central"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Territory Code *
                </label>
                <input
                  type="text"
                  required
                  value={territoryForm.code}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, code: e.target.value })}
                  placeholder="e.g. TN-SLM-C"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Zone
                </label>
                <select
                  value={territoryForm.zone}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, zone: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="South">South Zone</option>
                  <option value="West">West Zone</option>
                  <option value="Central">Central Zone</option>
                  <option value="North">North Zone</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Region / District
                </label>
                <input
                  type="text"
                  value={territoryForm.region}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, region: e.target.value })}
                  placeholder="e.g. Salem District"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Headquarters / Hub City
                </label>
                <input
                  type="text"
                  value={territoryForm.headquarters}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, headquarters: e.target.value })}
                  placeholder="e.g. Salem"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Area / Key Prescriber Cluster
              </label>
              <input
                type="text"
                value={territoryForm.area}
                onChange={(e) => setTerritoryForm({ ...territoryForm, area: e.target.value })}
                placeholder="e.g. Fort - Fairlands - Alagapuram"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddTerritoryOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTerritoryMutation.isPending}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {createTerritoryMutation.isPending ? "Creating Territory..." : "Save Territory"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
