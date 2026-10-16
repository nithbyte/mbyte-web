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
import { Modal } from "@/components/ui/dialog";
import {
  useTerritories,
  useCreateTerritory,
  useCurrentUser,
  useMRList,
  useUpdateMRTerritory,
} from "@/hooks";
import { normalizeRole } from "@/types";
import {
  MapPin,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  ArrowRight,
  UserPlus,
} from "lucide-react";

export default function TerritoriesPage() {
  const { data: currentUser } = useCurrentUser();
  const canonicalRole = normalizeRole(currentUser?.role);
  const companyOrgId = canonicalRole === "SUPER_ADMIN" ? undefined : currentUser?.organizationId || undefined;

  const { data: territories, isLoading, refetch } = useTerritories(companyOrgId);
  const { data: mrList, refetch: refetchMRs } = useMRList({ organizationId: companyOrgId });
  const createTerritoryMutation = useCreateTerritory();
  const updateTerritoryMutation = useUpdateMRTerritory();

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("ALL");

  // Add Territory Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    zone: "South",
    region: "",
    headquarters: "",
    area: "",
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Quick Assign Rep Modal state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<{ id: string; name: string } | null>(null);
  const [selectedMRId, setSelectedMRId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setForm({
      name: "",
      code: "",
      zone: "South",
      region: "",
      headquarters: "",
      area: "",
      description: "",
    });
    setFormError(null);
    setFormSuccess(null);
    setIsAddOpen(true);
  };

  const handleNameChange = (val: string) => {
    const autoCode = `TN-${val.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    setForm((prev) => ({
      ...prev,
      name: val,
      code: prev.code ? prev.code : autoCode,
      headquarters: prev.headquarters ? prev.headquarters : val,
      region: prev.region ? prev.region : `${val} District`,
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!form.name || !form.code) {
      setFormError("Territory Name and Code are required.");
      return;
    }

    try {
      await createTerritoryMutation.mutateAsync({
        ...form,
        organizationId: currentUser?.organizationId || undefined,
      });
      setFormSuccess(`Territory "${form.name}" created successfully! It is now available for field assignment.`);
      refetch();
      setTimeout(() => {
        setIsAddOpen(false);
      }, 1200);
    } catch (err: any) {
      setFormError(err?.message || "Failed to create territory. Please check the code uniqueness.");
    }
  };

  const handleOpenAssign = (territory: { id: string; name: string }) => {
    setSelectedTerritory(territory);
    setSelectedMRId(mrList?.[0]?.id || "");
    setAssignError(null);
    setAssignSuccess(null);
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTerritory || !selectedMRId) return;

    try {
      await updateTerritoryMutation.mutateAsync({
        mrId: selectedMRId,
        territoryId: selectedTerritory.id,
      });
      setAssignSuccess(`Representative assigned to ${selectedTerritory.name} successfully!`);
      refetch();
      refetchMRs();
      setTimeout(() => {
        setIsAssignOpen(false);
      }, 1100);
    } catch (err: any) {
      setAssignError(err?.message || "Failed to assign representative.");
    }
  };

  // Filter territories
  const filteredTerritories = (territories || []).filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      (t.region && t.region.toLowerCase().includes(search.toLowerCase())) ||
      (t.headquarters && t.headquarters.toLowerCase().includes(search.toLowerCase()));

    const matchesZone = zoneFilter === "ALL" || (t.zone && t.zone.toLowerCase() === zoneFilter.toLowerCase());
    return matchesSearch && matchesZone;
  });

  const totalTerritories = territories?.length || 0;
  const totalAssignedMRs = mrList?.filter((m) => m.territoryId).length || 0;
  const unassignedMRs = mrList?.filter((m) => !m.territoryId).length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Territory Master & Regional Coverage"
        description="Define and manage operational sales territories for your company. Assign authorized Medical Representatives and Territory Managers to coverage hubs."
        badge={<Badge variant="default">{totalTerritories} Authorized Hubs</Badge>}
        actions={
          (canonicalRole === "ADMIN" || canonicalRole === "SUPER_ADMIN") ? (
            <div className="flex items-center gap-2">
              <Link href="/field-force">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs cursor-pointer">
                  <Users className="h-3.5 w-3.5" />
                  <span>Field Force Directory</span>
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAdd}
                className="gap-1.5 h-8 text-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Territory</span>
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Quick Territory Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Authorized Territories
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalTerritories}</span>
            <span className="text-xs text-sky-600 font-semibold">Active Hubs</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Assigned Field Personnel
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalAssignedMRs} MRs
            </span>
            <span className="text-xs text-emerald-600 font-medium">Mapped to Territories</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Unassigned Personnel
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {unassignedMRs} Reps
            </span>
            <span className="text-xs text-amber-500 font-medium">Pending Allocation</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Territory Authority
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Company Admin</span>
            <span className="text-xs text-slate-500 font-medium">Exclusive Governance</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-sky-600" />
              Territory Filters
            </span>
            {(search || zoneFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] gap-1 text-slate-500 hover:text-slate-900"
                onClick={() => {
                  setSearch("");
                  setZoneFilter("ALL");
                }}
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by territory name, code, region, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <div>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-medium"
              >
                <option value="ALL">All Zones</option>
                <option value="South">South Zone</option>
                <option value="West">West Zone</option>
                <option value="Central">Central Zone</option>
                <option value="North">North Zone</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Territories Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600" />
              Company Territories Directory
            </CardTitle>
            <CardDescription>
              Territories authorized for doctor prescriber coverage and pharmacy visits
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Showing {filteredTerritories.length} Territories
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTerritories.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Territories Found"
                description="No operational territories match your search query."
                actionLabel="Add Territory"
                onAction={handleOpenAdd}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Territory & Code</TableHead>
                  <TableHead>Zone & Region</TableHead>
                  <TableHead>Headquarters / Hub</TableHead>
                  <TableHead>Assigned Medical Representatives</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerritories.map((t) => {
                  const assignedReps = (mrList || []).filter(
                    (m) => m.territoryId === t.id || m.territoryName === t.name
                  );

                  return (
                    <TableRow key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {t.name}
                            </span>
                            <div className="font-mono text-[11px] text-slate-500">{t.code}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {t.region || "Tamil Nadu"}
                        </div>
                        <div className="text-[10px] text-slate-400">{t.zone || "South"} Zone</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {t.headquarters || t.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{t.area || "Prescriber Cluster"}</div>
                      </TableCell>

                      <TableCell>
                        {assignedReps.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {assignedReps.map((rep) => (
                              <Link
                                key={rep.id}
                                href={`/field-force/${rep.id}`}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <span>{rep.name}</span>
                              </Link>
                            ))}
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({assignedReps.length} reps)
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            No reps assigned
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="success" className="text-[10px]">
                          Active Coverage
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {canonicalRole === "ADMIN" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-slate-800"
                            onClick={() => handleOpenAssign({ id: t.id, name: t.name })}
                          >
                            <UserPlus className="h-3 w-3" />
                            <span>Assign MR</span>
                          </Button>
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

      {/* ADD TERRITORY MODAL */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Sales Territory"
        description="Define a new geographical coverage hub for your company's field force."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
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

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Territory Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
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
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. TN-SLM-C"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Zone
                </label>
                <select
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value })}
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
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
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
                  value={form.headquarters}
                  onChange={(e) => setForm({ ...form, headquarters: e.target.value })}
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
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="e.g. Fort - Fairlands - Alagapuram"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
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

      {/* QUICK ASSIGN MR MODAL */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Representative to Territory"
        description={`Allocate field representative to ${selectedTerritory?.name}.`}
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          {assignError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{assignError}</span>
            </div>
          )}

          {assignSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{assignSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Field Representative *
            </label>
            <select
              required
              value={selectedMRId}
              onChange={(e) => setSelectedMRId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-semibold"
            >
              <option value="">Select Representative…</option>
              {mrList?.map((mr) => (
                <option key={mr.id} value={mr.id}>
                  {mr.name} ({mr.employeeId}) — Currently: {mr.territoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTerritoryMutation.isPending}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {updateTerritoryMutation.isPending ? "Assigning..." : "Assign Representative"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
