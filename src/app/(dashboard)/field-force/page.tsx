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
import { useMRList, useManagers, useTerritories, useCurrentUser, useCreateUser, useOrganizations } from "@/hooks";
import { formatCurrency } from "@/lib/utils";
import { normalizeRole } from "@/types";
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
} from "lucide-react";

export default function FieldForcePage() {
  const { data: currentUser } = useCurrentUser();
  const canonicalRole = normalizeRole(currentUser?.role);
  const createUserMutation = useCreateUser();
  const { data: organizations } = useOrganizations();

  const [search, setSearch] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("ALL");
  const [territoryId, setTerritoryId] = useState("ALL");
  const [managerId, setManagerId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [performance, setPerformance] = useState<"ALL" | "ON_TRACK" | "BELOW_TARGET" | "AHEAD">("ALL");

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

  const { data: territories } = useTerritories();
  const { data: managers } = useManagers();
  const { data: mrList, isLoading, refetch } = useMRList({
    search,
    territoryId: canonicalRole === "TERRITORY_MANAGER" && currentUser?.territoryId ? currentUser.territoryId : territoryId,
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
      role: canonicalRole === "SUPER_ADMIN" ? "ADMIN" : "TERRITORY_MANAGER",
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
      });
      setFormSuccess(`User ${userForm.firstName} ${userForm.lastName} (${userForm.role}) provisioned successfully!`);
      refetch();
      setTimeout(() => {
        setIsAddUserOpen(false);
      }, 1200);
    } catch (err: any) {
      setFormError(err?.message || "Failed to provision user. Please try again.");
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

  // Metric summaries
  const totalReps = mrList?.length || 0;
  const inFieldReps = mrList?.filter((m) => m.status === "IN_FIELD").length || 0;
  const belowTargetCount = mrList?.filter((m) => m.performanceStatus === "BELOW_TARGET").length || 0;
  const totalBookedValue = mrList?.reduce((sum, m) => sum + m.ordersValue, 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={canonicalRole === "SUPER_ADMIN" ? "Company Administrators" : "Field Force Directory & Team Management"}
        description={
          canonicalRole === "SUPER_ADMIN"
            ? "Provision and manage corporate Administrator accounts for tenant pharmaceutical companies."
            : "Monitor representative territory deployment, daily call compliance, sales quota pacing, and live operational status."
        }
        badge={
          <Badge variant="default">
            {canonicalRole === "SUPER_ADMIN" ? "Tenant Company Governance" : `${totalReps} Field Reps Active`}
          </Badge>
        }
        actions={
          (canonicalRole === "SUPER_ADMIN" || canonicalRole === "ADMIN") ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddUser}
              className="gap-1.5 h-8 text-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{canonicalRole === "SUPER_ADMIN" ? "Add Company Admin" : "Add Territory Manager / MR"}</span>
            </Button>
          ) : undefined
        }
      />

      {/* Quick Performance Summary Strip */}
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

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-sky-600" />
              Directory Filters
            </span>
            {(search || territoryId !== "ALL" || managerId !== "ALL" || status !== "ALL" || performance !== "ALL") && (
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
          </div>
        </CardContent>
      </Card>

      {/* MR Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-600" />
              Medical Representatives Directory
            </CardTitle>
            <CardDescription>
              Click any representative row to inspect deep dive call logs, orders, and product detailing activity
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Showing {totalReps} Representatives
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
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
                    {/* Name & ID */}
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
                            {mr.employeeId}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Territory */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {mr.territoryName}
                      </div>
                      <div className="text-[11px] text-slate-400">{mr.headquarters}</div>
                    </TableCell>

                    {/* Manager */}
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {mr.managerName}
                    </TableCell>

                    {/* Status */}
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

                    {/* Today's Visits */}
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

                    {/* Monthly Target */}
                    <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(mr.monthlyTarget)}
                    </TableCell>

                    {/* Achievement */}
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

                    {/* Action */}
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* PROVISION USER / REP MODAL */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title={canonicalRole === "SUPER_ADMIN" ? "Provision Company User / Representative" : "Provision Territory Manager or MR"}
        description={canonicalRole === "SUPER_ADMIN" ? "Create an administrator, territory manager, or field representative with company assignment." : "Create a new territory manager or medical representative for your company."}
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
                  <option value="ADMIN">ADMIN (Company Administrator)</option>
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

            {userForm.role !== "ADMIN" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Territory
                  </label>
                  <select
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
    </div>
  );
}
