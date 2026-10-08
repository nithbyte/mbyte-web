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
  usePharmacies,
  usePharmacyHistory,
  useCreatePharmacy,
  useUpdatePharmacy,
  useTerritories,
} from "@/hooks";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Pharmacy, PharmacyInput } from "@/types";
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
  Receipt,
  ShoppingCart,
  Boxes,
  UserCheck,
} from "lucide-react";

export default function PharmaciesPage() {
  const [search, setSearch] = useState("");
  const [territoryId, setTerritoryId] = useState("ALL");

  // Queries
  const { data: territories } = useTerritories();
  const { data: pharmacies, isLoading, isError, refetch } = usePharmacies({
    search,
    territoryId,
  });

  // Mutations
  const createMutation = useCreatePharmacy();
  const updateMutation = useUpdatePharmacy();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [historyPharmacy, setHistoryPharmacy] = useState<Pharmacy | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Pharmacy | null>(null);

  // Form state
  const initialForm: PharmacyInput = {
    name: "",
    contactPerson: "",
    phone: "+91",
    email: "",
    address: "",
    drugLicenseNumber: "TN-MDU-",
    territoryId: "ter_mdu_north",
    latitude: 9.9252,
    longitude: 78.1198,
  };
  const [formState, setFormState] = useState<PharmacyInput>(initialForm);
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
    setFormState(initialForm);
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
      territoryId: phm.territoryId,
      latitude: phm.latitude,
      longitude: phm.longitude,
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePharmacyForm()) return;
    await createMutation.mutateAsync(formState);
    setIsCreateOpen(false);
    setFormErrors({});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPharmacy) return;
    if (!validatePharmacyForm()) return;
    await updateMutation.mutateAsync({
      id: editingPharmacy.id,
      input: formState,
    });
    setEditingPharmacy(null);
    setFormErrors({});
  };

  const handleResetFilters = () => {
    setSearch("");
    setTerritoryId("ALL");
  };

  // History query for selected pharmacy
  const { data: historyItems, isLoading: isHistoryLoading } = usePharmacyHistory(
    historyPharmacy?.id || ""
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacies & Chemist Master Registry"
        description="Retail chemists, dispensary owners, valid drug licenses, geolocation coordinates, and commercial trade history."
        badge={<Badge variant="default">{pharmacies?.length || 0} Registered Pharmacies</Badge>}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            <span>Enroll New Chemist</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
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
              Showing {pharmacies?.length || 0} results
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
            Valid drug license numbers, owners, geo-coordinates, and commercial interaction history
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
                  <TableHead>Territory</TableHead>
                  <TableHead>Drug License #</TableHead>
                  <TableHead>Coordinates</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{phm.territoryName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          {phm.drugLicenseNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-800">
                          <MapPin className="h-2.5 w-2.5 text-rose-500" />
                          {phm.latitude.toFixed(4)}, {phm.longitude.toFixed(4)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {phm.phone}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
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

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Enroll New Pharmacy / Chemist"
        description="Add a registered retail or institutional chemist to the master database."
      >
        <form onSubmit={handleSaveCreate} className="space-y-4">
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
                placeholder="+91984210000"
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
                placeholder="TN-MDU-20B-1004"
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
                placeholder="Shop 12, Main Bazaar Road, Madurai"
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

            <div className="col-span-2">
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

            <div className="col-span-2">
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
        description={`Master registration, drug licensing, and profile overview`}
      >
        {selectedDetails && (
          <div className="space-y-4 text-xs">
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
                  {selectedDetails.drugLicenseNumber}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">State Drug Control Valid</div>
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
                  {selectedDetails.phone}
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
                  {formatCurrency(selectedDetails.creditLimit || 500000)}
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

      {/* HISTORY MODAL */}
      <Modal
        isOpen={Boolean(historyPharmacy)}
        onClose={() => setHistoryPharmacy(null)}
        title={`Audit & Activity History: ${historyPharmacy?.name}`}
        description={`Commercial orders, payment receipts, stock audits, and registration log`}
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
                  {/* Timeline Dot */}
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
