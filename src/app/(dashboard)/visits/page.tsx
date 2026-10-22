"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import {
  useVisits,
  useVisitCounts,
  useVisitDates,
  useTerritories,
  useMRList,
  useDoctors,
  usePharmacies,
  useIsMounted,
  useCreateVisit,
  useCurrentUser,
} from "@/hooks";
import { useFilterStore } from "@/store";
import { visitService } from "@/services/visitService";
import { getLocalTodayDate, formatOperatingDateDisplay } from "@/lib/utils";
import { normalizeRole, type Visit, type VisitQueryParams } from "@/types";
import {
  VisitMasterList,
  VisitDetailPane,
  AccompanimentModal,
  ScheduleVisitDialog,
} from "@/features/visits";
import {
  Radio,
  Calendar,
  Search,
  Filter,
  RotateCcw,
  CalendarCheck,
  Plus,
  Navigation,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function VisitsPage() {
  const isMounted = useIsMounted();
  const { operatingDate, setOperatingDate, selectedTerritoryId } = useFilterStore();

  // Filters State
  const [todayDate, setTodayDate] = useState<string>("");
  const selectedDate = operatingDate;
  const setSelectedDate = setOperatingDate;
  const [selectedMR, setSelectedMR] = useState("ALL");
  const [selectedTerritory, setSelectedTerritory] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setTodayDate(getLocalTodayDate());
  }, []);

  // Workspace Split-Screen Selection
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Geofence Exception Review State
  const [isReviewingException, setIsReviewingException] = useState(false);

  // Joint Accompaniment Modal State
  const [isAccompanimentOpen, setIsAccompanimentOpen] = useState(false);
  const [isSavingAccompaniment, setIsSavingAccompaniment] = useState(false);

  // Schedule Visit Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const createVisitMutation = useCreateVisit();

  // Effective Territory Filter (Local Page Filter + Shared Header Store)
  const effectiveTerritory =
    selectedTerritory !== "ALL"
      ? selectedTerritory
      : selectedTerritoryId !== "ALL"
      ? selectedTerritoryId
      : "ALL";

  // Query Params
  const queryParams: VisitQueryParams = useMemo(
    () => ({
      date: selectedDate,
      mrId: selectedMR,
      territoryId: effectiveTerritory,
      customerId: selectedCustomer,
      status: selectedStatus,
      search,
    }),
    [selectedDate, selectedMR, effectiveTerritory, selectedCustomer, selectedStatus, search]
  );

  // Queries
  const { data: visits = [], isLoading } = useVisits(queryParams);
  const { data: counts } = useVisitCounts({
    date: selectedDate,
    mrId: selectedMR,
    territoryId: effectiveTerritory,
  });
  const { data: visitDates } = useVisitDates();
  const { data: territories } = useTerritories();
  const { data: mrList } = useMRList();
  const { data: doctors } = useDoctors();
  const { data: pharmacies } = usePharmacies();
  const { data: currentUser } = useCurrentUser();

  const canonicalRole = normalizeRole(currentUser?.role);
  const isTerritoryManager = canonicalRole === "TERRITORY_MANAGER";
  const isMR = canonicalRole === "MR";
  const isManagerOrAdmin = !isMR;
  const managerTerritoryId = isTerritoryManager ? currentUser?.territoryId : null;

  // Sync selectedVisit if current list changes or active visit is updated
  useEffect(() => {
    if (visits.length > 0) {
      if (!selectedVisit) {
        // Auto-select the first visit for immediate desktop workspace inspection
        setSelectedVisit(visits[0]);
      } else {
        // Keep updated reference to selected visit if it exists in current query result
        const refreshed = visits.find((v) => v.id === selectedVisit.id);
        if (refreshed) {
          setSelectedVisit(refreshed);
        }
      }
    } else {
      setSelectedVisit(null);
    }
  }, [visits]);

  // Handle visit selection from list
  const handleSelectVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    // On mobile viewports (<1024px), open the slide-over dialog
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileDetailOpen(true);
    }
  };

  // Role-scoped eligible MRs for scheduling
  const eligibleMRs = useMemo(() => {
    if (!mrList) return [];
    if (isTerritoryManager && managerTerritoryId) {
      const filtered = mrList.filter(
        (m) => m.territoryId === managerTerritoryId || m.managerId === currentUser?.id
      );
      return filtered.length > 0 ? filtered : mrList;
    }
    return mrList;
  }, [mrList, isTerritoryManager, managerTerritoryId, currentUser?.id]);

  // Role-scoped eligible Doctors for scheduling
  const eligibleDoctors = useMemo(() => {
    if (!doctors) return [];
    if (isTerritoryManager && managerTerritoryId) {
      const filtered = doctors.filter((d) => d.territoryId === managerTerritoryId);
      return filtered.length > 0 ? filtered : doctors;
    }
    return doctors;
  }, [doctors, isTerritoryManager, managerTerritoryId]);

  // Role-scoped eligible Pharmacies for scheduling
  const eligiblePharmacies = useMemo(() => {
    if (!pharmacies) return [];
    if (isTerritoryManager && managerTerritoryId) {
      const filtered = pharmacies.filter((p) => p.territoryId === managerTerritoryId);
      return filtered.length > 0 ? filtered : pharmacies;
    }
    return pharmacies;
  }, [pharmacies, isTerritoryManager, managerTerritoryId]);

  const handleResetFilters = () => {
    setSelectedDate(getLocalTodayDate());
    setSelectedMR("ALL");
    setSelectedTerritory("ALL");
    setSelectedCustomer("ALL");
    setSelectedStatus("ALL");
    setSearch("");
  };

  // Geofence exception approval / rejection
  const handleReviewException = async (approved: boolean, comment: string) => {
    if (!selectedVisit) return;
    setIsReviewingException(true);
    try {
      const updated = await visitService.reviewGeofenceException(
        selectedVisit.id,
        approved,
        comment
      );
      setSelectedVisit(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to review exception");
    } finally {
      setIsReviewingException(false);
    }
  };

  // Joint accompaniment coaching submission
  const handleSaveAccompaniment = async (formData: any) => {
    if (!selectedVisit) return;
    setIsSavingAccompaniment(true);
    try {
      await visitService.recordAccompaniment(selectedVisit.id, formData);
      setIsAccompanimentOpen(false);
      const accs = await visitService.getAccompaniments(selectedVisit.id);
      setSelectedVisit({ ...selectedVisit, accompaniments: accs });
      alert("Joint visit accompaniment recorded successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to record accompaniment");
    } finally {
      setIsSavingAccompaniment(false);
    }
  };

  // Schedule visit submission
  const handleScheduleSubmit = async (formData: any) => {
    await createVisitMutation.mutateAsync(formData);
    setIsScheduleOpen(false);
  };

  const hasActiveFilters =
    selectedDate === "ALL" ||
    selectedMR !== "ALL" ||
    selectedTerritory !== "ALL" ||
    selectedCustomer !== "ALL" ||
    selectedStatus !== "ALL" ||
    Boolean(search.trim());

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Field Visit Management & Detailing Operations"
        description="Desktop field operations workspace: live doctor calls, in-clinic detailing logs, PostGIS 200m geofence radius audit, and supervisory accompaniment."
        badge={
          <Badge variant="success" className="gap-1">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>Live Field Telemetry</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(todayDate || getLocalTodayDate())}
              className={`h-8 gap-1.5 text-xs ${
                todayDate && selectedDate === todayDate
                  ? "border-sky-500 text-sky-700 bg-sky-50 dark:bg-sky-950/40"
                  : ""
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Today</span>
            </Button>
            {isManagerOrAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsScheduleOpen(true)}
                className="h-8 gap-1.5 text-xs"
                id="btn-schedule-visit"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Schedule Visit</span>
              </Button>
            )}
          </div>
        }
      />

      {/* KPI METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scheduled</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {counts?.todayTotal ?? visits.length}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600">
            <CalendarCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {counts?.completed ?? visits.filter((v) => v.status === "COMPLETED").length}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">In Progress</span>
            <div className="text-xl font-extrabold text-sky-600 mt-0.5">
              {counts?.inProgress ?? visits.filter((v) => v.status === "IN_PROGRESS" || v.status === "LOCATION_VERIFIED").length}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Missed Calls</span>
            <div className="text-xl font-extrabold text-amber-600 mt-0.5">
              {counts?.missed ?? visits.filter((v) => v.status === "MISSED").length}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Planned / Due</span>
            <div className="text-xl font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
              {counts?.planned ?? visits.filter((v) => v.status === "PLANNED").length}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
            <Navigation className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* MULTI-FILTER TOOLBAR */}
      <Card className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-sky-600" />
              Field Visit Search & Filter Criteria
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 text-[11px] gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* 1. DATE FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Schedule Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                suppressHydrationWarning
                className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Recorded Dates</option>
                {selectedDate && selectedDate !== "ALL" && !visitDates?.includes(selectedDate) && (
                  <option value={selectedDate}>
                    {formatOperatingDateDisplay(selectedDate)}
                  </option>
                )}
                {isMounted &&
                  visitDates?.map((d) => (
                    <option key={d} value={d}>
                      {formatOperatingDateDisplay(d)}
                    </option>
                  ))}
              </select>
            </div>

            {/* 2. MR FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Field Representative
              </label>
              <select
                value={selectedMR}
                onChange={(e) => setSelectedMR(e.target.value)}
                suppressHydrationWarning
                className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Representatives</option>
                {isMounted &&
                  mrList?.map((mr) => (
                    <option key={mr.id} value={mr.id}>
                      {mr.name} ({mr.employeeId})
                    </option>
                  ))}
              </select>
            </div>

            {/* 3. TERRITORY FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Territory Zone
              </label>
              <select
                value={selectedTerritory}
                onChange={(e) => setSelectedTerritory(e.target.value)}
                suppressHydrationWarning
                className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Territories</option>
                {isMounted &&
                  territories?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* 4. CUSTOMER FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Customer (Doctor / Retail)
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                suppressHydrationWarning
                className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Target Customers</option>
                {isMounted && (
                  <>
                    <optgroup label="Doctors & Clinics">
                      {doctors?.slice(0, 15).map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialty})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Pharmacies & Chemists">
                      {pharmacies?.slice(0, 10).map((phm) => (
                        <option key={phm.id} value={phm.id}>
                          {phm.name}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
            </div>

            {/* 5. STATUS FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Call Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                suppressHydrationWarning
                className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Call Statuses</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="MISSED">MISSED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="PLANNED">PLANNED</option>
              </select>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search doctor name, clinic address, representative name, or feedback notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* SPLIT-SCREEN WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: Master Visit List (5 cols on desktop, full width on mobile) */}
        <div className="lg:col-span-5 xl:col-span-5">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Navigation className="h-3.5 w-3.5 text-sky-600" />
                  Scheduled Calls Roster
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {visits.length} Calls
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <VisitMasterList
                visits={visits}
                selectedVisitId={selectedVisit?.id || null}
                onSelectVisit={handleSelectVisit}
                isLoading={isLoading}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: Desktop Detail Pane (7 cols on desktop, sticky position) */}
        <div className="hidden lg:block lg:col-span-7 xl:col-span-7 lg:sticky lg:top-20">
          <VisitDetailPane
            visit={selectedVisit}
            isManagerOrAdmin={isManagerOrAdmin}
            onReviewException={handleReviewException}
            isReviewingException={isReviewingException}
            onOpenAccompaniment={() => setIsAccompanimentOpen(true)}
          />
        </div>
      </div>

      {/* MOBILE / TABLET SLIDE-OVER MODAL (<1024px) */}
      <Modal
        isOpen={isMobileDetailOpen}
        onClose={() => setIsMobileDetailOpen(false)}
        title={selectedVisit ? `Call Details: ${selectedVisit.customerName}` : "Visit Record"}
        description={`Audit ID #${selectedVisit?.id} • Scheduled ${selectedVisit?.scheduledStartTime}`}
      >
        <div className="max-h-[75vh] overflow-y-auto">
          <VisitDetailPane
            visit={selectedVisit}
            onClose={() => setIsMobileDetailOpen(false)}
            isManagerOrAdmin={isManagerOrAdmin}
            onReviewException={handleReviewException}
            isReviewingException={isReviewingException}
            onOpenAccompaniment={() => setIsAccompanimentOpen(true)}
          />
        </div>
      </Modal>

      {/* JOINT FIELD ACCOMPANIMENT MODAL */}
      <AccompanimentModal
        isOpen={isAccompanimentOpen}
        onClose={() => setIsAccompanimentOpen(false)}
        onSave={handleSaveAccompaniment}
        isSaving={isSavingAccompaniment}
      />

      {/* SCHEDULE VISIT MODAL */}
      <ScheduleVisitDialog
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSubmit={handleScheduleSubmit}
        isPending={createVisitMutation.isPending}
        eligibleMRs={eligibleMRs}
        eligibleDoctors={eligibleDoctors}
        eligiblePharmacies={eligiblePharmacies}
        isTerritoryManager={isTerritoryManager}
        managerTerritoryName={currentUser?.territoryName}
        defaultDate={selectedDate}
      />
    </div>
  );
}
