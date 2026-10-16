"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Shield,
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
  Users,
  Layers,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { useOrganizations, useCreateOrganization, useUpdateOrganization, useCurrentUser } from "@/hooks";
import { normalizeRole, type Organization, type CreateOrganizationInput, type UpdateOrganizationInput } from "@/types";
import { Modal } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function CompaniesPage() {
  const { data: currentUser } = useCurrentUser();
  const canonicalRole = normalizeRole(currentUser?.role);

  const { data: organizations, isLoading, refetch } = useOrganizations();
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateOrganizationInput>({
    name: "",
    slug: "",
    code: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    geofenceRadius: 200,
    currency: "INR",
    timezone: "Asia/Kolkata",
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal state
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editForm, setEditForm] = useState<UpdateOrganizationInput>({});
  const [editError, setEditError] = useState<string | null>(null);

  // Filter organizations
  const filteredOrgs = (organizations || []).filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && org.isActive) ||
      (statusFilter === "INACTIVE" && !org.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalCompanies = organizations?.length || 0;
  const activeCompanies = organizations?.filter((o) => o.isActive).length || 0;

  const handleOpenCreate = () => {
    setCreateForm({
      name: "",
      slug: "",
      code: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      geofenceRadius: 200,
      currency: "INR",
      timezone: "Asia/Kolkata",
    });
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const code = val
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 4)
      .toUpperCase();

    setCreateForm((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === "" || prev.slug.startsWith(val.slice(0, 3).toLowerCase()) ? slug : prev.slug,
      code: prev.code === "" ? code : prev.code,
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.name || !createForm.code || !createForm.slug || !createForm.contactEmail) {
      setCreateError("Company Name, Code, Slug, and Contact Email are required.");
      return;
    }

    try {
      await createMutation.mutateAsync(createForm);
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      setCreateError(err?.message || "Failed to register company. Please try again.");
    }
  };

  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone || "",
      address: org.address || "",
      geofenceRadius: org.geofenceRadius,
      isActive: org.isActive,
    });
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    setEditError(null);

    try {
      await updateMutation.mutateAsync({
        id: editingOrg.id,
        dto: editForm,
      });
      setEditingOrg(null);
      refetch();
    } catch (err: any) {
      setEditError(err?.message || "Failed to update company.");
    }
  };

  const handleToggleStatus = async (org: Organization) => {
    try {
      await updateMutation.mutateAsync({
        id: org.id,
        dto: { isActive: !org.isActive },
      });
      refetch();
    } catch (err: any) {
      alert(`Could not toggle status: ${err?.message || "Network error"}`);
    }
  };

  // If non-superadmin accesses this page, render permission block
  if (canonicalRole !== "SUPER_ADMIN") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
        <Shield className="mx-auto h-12 w-12 text-amber-600 dark:text-amber-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Super Admin Authorization Required
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Company registration, multi-tenant partitioning, and platform-wide governance are strictly restricted to Super Administrators.
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tenant Companies & Organizations
            </h1>
            <Badge variant="default" className="bg-purple-600 text-white font-mono text-[10px]">
              SUPER_ADMIN
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Provision, isolate, and configure multi-tenant pharmaceutical organizations and geofencing parameters.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-sky-600/20 hover:from-sky-500 hover:to-indigo-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Company</span>
        </button>
      </div>

      {/* Metric summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Companies
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {totalCompanies}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Across all registered tenants
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Tenants
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {activeCompanies}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live operational field force
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tenant Isolation
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Strictly Partitioned
            </div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
              Zero cross-tenant leakage
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              GPS Geofence Standard
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              200m
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              PostGIS authoritative radius
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name, code, slug, or email..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Companies</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Company & Code</th>
                <th className="px-4 py-3.5">Primary Contact</th>
                <th className="px-4 py-3.5">Geofence Policy</th>
                <th className="px-4 py-3.5">Currency / Timezone</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Loading registered tenant companies...
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No companies found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-xs">
                          {org.code.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {org.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {org.code}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              /{org.slug}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{org.contactEmail}</span>
                      </div>
                      {org.contactPhone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{org.contactPhone}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{org.geofenceRadius} meters</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Strict GPS boundary
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {org.currency}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {org.timezone}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {org.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-400/20 dark:bg-slate-800 dark:text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/field-force?orgId=${org.id}`}
                          title="Manage company users"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Users className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => handleOpenEdit(org)}
                          title="Edit company settings"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(org)}
                          title={org.isActive ? "Deactivate company" : "Activate company"}
                          className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                            org.isActive
                              ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Company Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Tenant Company"
        description="Add a new pharmaceutical organization with dedicated database tenant partitioning."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Legal Name *
              </label>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Apex Healthcare India Private Limited"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Code (Unique) *
              </label>
              <input
                type="text"
                required
                value={createForm.code}
                onChange={(e) =>
                  setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g. APEX"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono font-bold text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                URL Identifier / Slug *
              </label>
              <input
                type="text"
                required
                value={createForm.slug}
                onChange={(e) =>
                  setCreateForm({ ...createForm, slug: e.target.value.toLowerCase() })
                }
                placeholder="e.g. apex-healthcare"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={createForm.contactEmail}
                onChange={(e) =>
                  setCreateForm({ ...createForm, contactEmail: e.target.value })
                }
                placeholder="admin@apexhealth.in"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={createForm.contactPhone || ""}
                onChange={(e) =>
                  setCreateForm({ ...createForm, contactPhone: e.target.value })
                }
                placeholder="+91 98400 00000"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Headquarters Address
              </label>
              <input
                type="text"
                value={createForm.address || ""}
                onChange={(e) =>
                  setCreateForm({ ...createForm, address: e.target.value })
                }
                placeholder="e.g. Plot 14, Guindy Industrial Estate, Chennai, TN"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Geofence Radius (Meters)
              </label>
              <input
                type="number"
                min={50}
                max={1000}
                value={createForm.geofenceRadius}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    geofenceRadius: parseInt(e.target.value, 10) || 200,
                  })
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Currency
              </label>
              <select
                value={createForm.currency}
                onChange={(e) =>
                  setCreateForm({ ...createForm, currency: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ US Dollar)</option>
                <option value="AED">AED (Dirham)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {createMutation.isPending ? "Creating Organization..." : "Register Company"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={Boolean(editingOrg)}
        onClose={() => setEditingOrg(null)}
        title={`Edit Company: ${editingOrg?.name || ""}`}
        description="Update corporate contact details, address, and GPS geofence threshold."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={editForm.contactEmail || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, contactEmail: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={editForm.contactPhone || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, contactPhone: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address
              </label>
              <input
                type="text"
                value={editForm.address || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Geofence Radius (Meters)
              </label>
              <input
                type="number"
                min={50}
                max={1000}
                value={editForm.geofenceRadius || 200}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    geofenceRadius: parseInt(e.target.value, 10) || 200,
                  })
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={editForm.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) =>
                  setEditForm({ ...editForm, isActive: e.target.value === "ACTIVE" })
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Deactivated</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingOrg(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {updateMutation.isPending ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
