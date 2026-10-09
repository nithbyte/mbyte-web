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
  useDoctorHistory,
  useCreateDoctor,
  useUpdateDoctor,
  useSpecialties,
  useTerritories,
} from "@/hooks";
import { formatDate } from "@/lib/utils";
import type { Doctor, DoctorInput, DoctorTier } from "@/types";
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
} from "lucide-react";

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [territoryId, setTerritoryId] = useState("ALL");
  const [specialty, setSpecialty] = useState("ALL");
  const [tier, setTier] = useState("ALL");

  // Queries
  const { data: territories } = useTerritories();
  const { data: specialties } = useSpecialties();
  const { data: doctors, isLoading, isError, refetch } = useDoctors({
    search,
    territoryId,
    specialty,
    tier,
  });

  // Mutations
  const createMutation = useCreateDoctor();
  const updateMutation = useUpdateDoctor();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [historyDoctor, setHistoryDoctor] = useState<Doctor | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Doctor | null>(null);

  // Form state
  const initialForm: DoctorInput = {
    name: "",
    specialty: "Cardiology",
    qualification: "MBBS, MD",
    clinicName: "",
    address: "",
    phone: "+91",
    email: "",
    territoryId: "ter_mdu_north",
    tier: "A_PLUS",
    visitFrequency: 4,
    latitude: 9.9252,
    longitude: 78.1198,
  };
  const [formState, setFormState] = useState<DoctorInput>(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateDoctorForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formState.name.trim() || formState.name.trim().length < 2) {
      errors.name = "Doctor name must be at least 2 characters long.";
    }
    const cleanPhone = formState.phone.replace(/[^0-9+]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Valid contact number with at least 10 digits is required.";
    }
    if (!formState.address.trim() || formState.address.trim().length < 5) {
      errors.address = "Clinic address must be at least 5 characters long.";
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

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormErrors({});
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
      visitFrequency: doc.visitFrequency,
      latitude: doc.latitude,
      longitude: doc.longitude,
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDoctorForm()) return;
    await createMutation.mutateAsync(formState);
    setIsCreateOpen(false);
    setFormErrors({});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    if (!validateDoctorForm()) return;
    await updateMutation.mutateAsync({
      id: editingDoctor.id,
      input: formState,
    });
    setEditingDoctor(null);
    setFormErrors({});
  };

  const handleResetFilters = () => {
    setSearch("");
    setTerritoryId("ALL");
    setSpecialty("ALL");
    setTier("ALL");
  };

  // History query for selected doctor
  const { data: historyItems, isLoading: isHistoryLoading } = useDoctorHistory(
    historyDoctor?.id || ""
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Master Directory & Clinic Registry"
        description="Comprehensive healthcare professional profiling, specialty categorization, geolocation pins, and visit targets."
        badge={<Badge variant="default">{doctors?.length || 0} Registered Doctors</Badge>}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            <span>Enroll New Doctor</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-sky-600" />
              Search & Master Filters
            </span>
            {(search || territoryId !== "ALL" || specialty !== "ALL" || tier !== "ALL") && (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
              Physician name, specialty, priority tier, registered GPS coordinates, and call history
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {doctors?.length || 0} Doctors Found
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
                description="No doctors match the selected territory, specialty, priority tier, or search criteria."
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
                  <TableHead>Territory</TableHead>
                  <TableHead>Geolocation Pin</TableHead>
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

                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{doc.territoryName}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-[11px] text-slate-500">
                        {doc.latitude.toFixed(4)}, {doc.longitude.toFixed(4)}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {doc.phone}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
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

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Contact Phone *</label>
              <Input
                placeholder="+91984201000"
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
              <label className="font-semibold text-slate-700 dark:text-slate-300">Clinic / Hospital Name</label>
              <Input
                placeholder="e.g. Heart & Vascular Clinic"
                value={formState.clinicName}
                onChange={(e) => setFormState({ ...formState, clinicName: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Full Clinic Address *</label>
              <Input
                placeholder="12, Main Road, Goripalayam, Madurai"
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
              <label className="font-semibold text-slate-700 dark:text-slate-300">Latitude (GPS) *</label>
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
              <label className="font-semibold text-slate-700 dark:text-slate-300">Longitude (GPS) *</label>
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
        description="Update doctor contact information, priority tier, or registered coordinates."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Doctor Full Name *</label>
              <Input
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

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Contact Phone *</label>
              <Input
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
              <label className="font-semibold text-slate-700 dark:text-slate-300">Clinic Name</label>
              <Input
                value={formState.clinicName}
                onChange={(e) => setFormState({ ...formState, clinicName: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Address *</label>
              <Input
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

      {/* MODAL 3: DOCTOR PROFILE DETAILS */}
      <Modal
        isOpen={Boolean(selectedDetails)}
        onClose={() => setSelectedDetails(null)}
        title={selectedDetails ? `${selectedDetails.name} Profile Details` : "Doctor Details"}
        description="Comprehensive physician master data record and geofencing parameters."
      >
        {selectedDetails && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-bold dark:bg-sky-950 dark:text-sky-300">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedDetails.name}</div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium">{selectedDetails.specialty} • {selectedDetails.qualification}</div>
                </div>
              </div>
              <Badge variant={selectedDetails.tier === "A_PLUS" ? "default" : "info"}>
                Tier {selectedDetails.tier.replace("_", "+")}
              </Badge>
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
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Geofence Pin</span>
                <div className="font-mono font-semibold text-emerald-600">
                  ({selectedDetails.latitude}, {selectedDetails.longitude})
                </div>
                <div className="text-slate-500">50m radius strict validation</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: DOCTOR INTERACTION HISTORY */}
      <Modal
        isOpen={Boolean(historyDoctor)}
        onClose={() => setHistoryDoctor(null)}
        title={historyDoctor ? `Interaction History: ${historyDoctor.name}` : "Doctor History"}
        description="Chronological log of representative visits, product detailing, and physician feedback."
      >
        <div className="space-y-3">
          {isHistoryLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : historyItems && historyItems.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {historyItems.map((item) => (
                <div key={item.id} className="py-3 flex items-start gap-3 text-xs">
                  <div className="mt-0.5">
                    {item.type === "VISIT" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-sky-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{formatDate(item.date)}</span>
                    </div>
                    <p className="text-slate-500">{item.subtitle}</p>
                    {item.notes && <p className="text-slate-700 dark:text-slate-300 italic">{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">No previous visit records found.</p>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setHistoryDoctor(null)}>
              Close History
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
