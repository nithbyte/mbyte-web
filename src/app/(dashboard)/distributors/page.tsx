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
  useDistributors,
  useDistributorHistory,
  useCreateDistributor,
  useUpdateDistributor,
  useTerritories,
} from "@/hooks";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Distributor, DistributorInput } from "@/types";
import {
  Truck,
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
  FileText,
  UserCheck,
  CreditCard,
  Building,
} from "lucide-react";

export default function DistributorsPage() {
  const [search, setSearch] = useState("");
  const [territoryId, setTerritoryId] = useState("ALL");

  // Queries
  const { data: territories } = useTerritories();
  const { data: distributors, isLoading, isError, refetch } = useDistributors({
    search,
    territoryId,
  });

  // Mutations
  const createMutation = useCreateDistributor();
  const updateMutation = useUpdateDistributor();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [historyDistributor, setHistoryDistributor] = useState<Distributor | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Distributor | null>(null);

  // Form state
  const initialForm: DistributorInput = {
    name: "",
    contactPerson: "",
    phone: "+91",
    email: "",
    address: "",
    dlNumber: "TN-DIST-",
    gstin: "33A",
    territoryId: "ter_mdu_north",
  };
  const [formState, setFormState] = useState<DistributorInput>(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateDistributorForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formState.name.trim() || formState.name.trim().length < 2) {
      errors.name = "Distributor firm name must be at least 2 characters long.";
    }
    if (!formState.contactPerson.trim() || formState.contactPerson.trim().length < 2) {
      errors.contactPerson = "Primary contact person name is required.";
    }
    const cleanPhone = formState.phone.replace(/[^0-9+]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Valid contact number with at least 10 digits is required.";
    }
    if (!formState.address.trim() || formState.address.trim().length < 5) {
      errors.address = "Warehouse / office address must be at least 5 characters.";
    }
    if (!formState.dlNumber.trim() || formState.dlNumber.trim().length < 3) {
      errors.dlNumber = "Valid Drug License (DL) number is required.";
    }
    if (!formState.gstin.trim() || formState.gstin.trim().length < 10) {
      errors.gstin = "Valid GST Identification Number (GSTIN) is required.";
    }
    if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = "Please enter a valid email address.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setFormState(initialForm);
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (dst: Distributor) => {
    setEditingDistributor(dst);
    setFormErrors({});
    setFormState({
      name: dst.name,
      contactPerson: dst.contactPerson,
      phone: dst.phone,
      email: dst.email || "",
      address: dst.address,
      dlNumber: dst.dlNumber,
      gstin: dst.gstin,
      territoryId: dst.territoryId,
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDistributorForm()) return;
    await createMutation.mutateAsync(formState);
    setIsCreateOpen(false);
    setFormErrors({});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDistributor) return;
    if (!validateDistributorForm()) return;
    await updateMutation.mutateAsync({
      id: editingDistributor.id,
      input: formState,
    });
    setEditingDistributor(null);
    setFormErrors({});
  };

  const handleResetFilters = () => {
    setSearch("");
    setTerritoryId("ALL");
  };

  // History query for selected distributor
  const { data: historyItems, isLoading: isHistoryLoading } = useDistributorHistory(
    historyDistributor?.id || ""
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor & Stockist Master Registry"
        description="Authorized pharmaceutical wholesale stockists, consignment agents, wholesale drug licenses, and supply fulfillment centers."
        badge={<Badge variant="default">{distributors?.length || 0} Registered Stockists</Badge>}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            <span>Register New Distributor</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Search Stockists & Wholesalers
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Distributor name, contact, phone, GSTIN..."
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
              Showing {distributors?.length || 0} results
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Truck className="h-4 w-4 text-sky-600" />
            Authorized Pharma Stockists & Clearing Agents
          </CardTitle>
          <CardDescription>
            Valid wholesale licenses (20B/21B), GSTIN identities, credit terms, and order history
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
                title="Failed to Load Distributors"
                description="An error occurred while fetching stockist and distributor records."
                onRetry={() => refetch()}
              />
            </div>
          ) : !distributors || distributors.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Distributors Found"
                description="No stockists or wholesale distributors match the chosen territory or search criteria."
                actionLabel="Reset All Filters"
                onAction={handleResetFilters}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distributor & Warehouse</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>GSTIN / DL #</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributors.map((dst) => (
                  <TableRow key={dst.id}>
                      <TableCell>
                        <button
                          onClick={() => setSelectedDetails(dst)}
                          className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                        >
                          {dst.name}
                        </button>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{dst.address}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                          {dst.contactPerson}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">Key Account Contact</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{dst.territoryName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            GST: {dst.gstin}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                            {dst.dlNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {dst.phone}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(dst.creditLimit || 3000000)}
                        </div>
                        <div className="text-[10px] text-slate-400">{dst.paymentTerms || "Net 30 Days"}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-slate-600 hover:text-sky-600"
                            onClick={() => setSelectedDetails(dst)}
                            title="View Stockist Details"
                          >
                            Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-slate-600 hover:text-sky-600"
                            onClick={() => handleOpenEdit(dst)}
                            title="Edit Stockist Master"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 border-slate-200 dark:border-slate-700"
                            onClick={() => setHistoryDistributor(dst)}
                            title="Order Fulfillment History"
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
        title="Register New Wholesale Distributor"
        description="Add an authorized pharmaceutical stockist or carrying & forwarding agency."
      >
        <form onSubmit={handleSaveCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Distributor / Agency Name *
              </label>
              <Input
                required
                placeholder="e.g. Madurai Central Pharma Wholesalers"
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
                Contact Person *
              </label>
              <Input
                required
                placeholder="e.g. R. Subramanian"
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
                placeholder="+91984501000"
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
                GSTIN Number *
              </label>
              <Input
                required
                placeholder="33AACFD2000D1Z3"
                value={formState.gstin}
                onChange={(e) => {
                  setFormState({ ...formState, gstin: e.target.value });
                  if (formErrors.gstin) setFormErrors((prev) => ({ ...prev, gstin: "" }));
                }}
                className={formErrors.gstin ? "h-9 text-xs font-mono uppercase border-rose-400 focus:border-rose-500" : "h-9 text-xs font-mono uppercase"}
              />
              {formErrors.gstin && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.gstin}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Wholesale Drug License (DL #) *
              </label>
              <Input
                required
                placeholder="TN-MDU-20B-DIST-900"
                value={formState.dlNumber}
                onChange={(e) => {
                  setFormState({ ...formState, dlNumber: e.target.value });
                  if (formErrors.dlNumber) setFormErrors((prev) => ({ ...prev, dlNumber: "" }));
                }}
                className={formErrors.dlNumber ? "h-9 text-xs font-mono border-rose-400 focus:border-rose-500" : "h-9 text-xs font-mono"}
              />
              {formErrors.dlNumber && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.dlNumber}</p>
              )}
            </div>

            <div className="col-span-2">
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
                Warehouse / Office Address *
              </label>
              <Input
                required
                placeholder="Warehouse Plot 10, Industrial Estate, Madurai"
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
                placeholder="orders@distributor.com"
                value={formState.email || ""}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="h-9 text-xs"
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
              {createMutation.isPending ? "Registering..." : "Save Distributor"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={Boolean(editingDistributor)}
        onClose={() => setEditingDistributor(null)}
        title="Edit Distributor Master Details"
        description={`Update licensing, address, and contact for ${editingDistributor?.name}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Distributor / Agency Name *
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
                Contact Person *
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
                GSTIN Number *
              </label>
              <Input
                required
                value={formState.gstin}
                onChange={(e) => {
                  setFormState({ ...formState, gstin: e.target.value });
                  if (formErrors.gstin) setFormErrors((prev) => ({ ...prev, gstin: "" }));
                }}
                className={formErrors.gstin ? "h-9 text-xs font-mono uppercase border-rose-400 focus:border-rose-500" : "h-9 text-xs font-mono uppercase"}
              />
              {formErrors.gstin && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.gstin}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Wholesale Drug License (DL #) *
              </label>
              <Input
                required
                value={formState.dlNumber}
                onChange={(e) => {
                  setFormState({ ...formState, dlNumber: e.target.value });
                  if (formErrors.dlNumber) setFormErrors((prev) => ({ ...prev, dlNumber: "" }));
                }}
                className={formErrors.dlNumber ? "h-9 text-xs font-mono border-rose-400 focus:border-rose-500" : "h-9 text-xs font-mono"}
              />
              {formErrors.dlNumber && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{formErrors.dlNumber}</p>
              )}
            </div>

            <div className="col-span-2">
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
                Warehouse / Office Address *
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
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingDistributor(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Update Distributor"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedDetails)}
        onClose={() => setSelectedDetails(null)}
        title={selectedDetails?.name || "Distributor Profile"}
        description={`Wholesale pharma supply partner & consignment details`}
      >
        {selectedDetails && (
          <div className="space-y-4 text-xs">
            {/* Top Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 mb-1 flex items-center gap-1.5 font-medium">
                  <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                  Key Account Contact
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedDetails.contactPerson}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Authorized Agency Signatory</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 mb-1 flex items-center gap-1.5 font-medium">
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  Tax & DL Verification
                </div>
                <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  GSTIN: {selectedDetails.gstin}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  DL: {selectedDetails.dlNumber}
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <div className="flex items-start gap-2">
                <Building className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Warehouse Address:{" "}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">{selectedDetails.address}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Assigned Territory: {selectedDetails.territoryName}
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
            </div>

            {/* Commercial Parameters */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2.5 rounded bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
                <div className="text-[11px] text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Stockist Credit Limit
                </div>
                <div className="text-sm font-bold text-sky-900 dark:text-sky-100 mt-0.5">
                  {formatCurrency(selectedDetails.creditLimit || 3000000)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  Payment Agreement
                </div>
                <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">
                  {selectedDetails.paymentTerms || "Net 30 Days"}
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
                Edit Distributor
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const curr = selectedDetails;
                  setSelectedDetails(null);
                  setHistoryDistributor(curr);
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
        isOpen={Boolean(historyDistributor)}
        onClose={() => setHistoryDistributor(null)}
        title={`Fulfillment & Activity History: ${historyDistributor?.name}`}
        description={`Commercial stock orders fulfilled, invoices dispatched, and network history`}
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
                            <Truck className="h-3 w-3" />
                            Dispatched
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
                        Consignment Value: {formatCurrency(item.amount)}
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
              No historical dispatch orders or transactions recorded yet for this distributor.
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryDistributor(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
