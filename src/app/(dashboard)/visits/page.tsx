"use client";

import React, { useState, useMemo } from "react";
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
import {
  useVisits,
  useVisitCounts,
  useVisitDates,
  useTerritories,
  useMRList,
  useDoctors,
  usePharmacies,
} from "@/hooks";
import { formatDate } from "@/lib/utils";
import type { Visit, VisitStatus, VerificationStatus, VisitQueryParams } from "@/types";
import {
  Navigation,
  Radio,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  Search,
  Filter,
  RotateCcw,
  Building2,
  Stethoscope,
  Eye,
  FileText,
  Boxes,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";

export default function VisitsPage() {
  // Filters State
  const [selectedDate, setSelectedDate] = useState("2026-10-08"); // Today in mock data
  const [selectedMR, setSelectedMR] = useState("ALL");
  const [selectedTerritory, setSelectedTerritory] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  // Details Modal State
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Query Params
  const queryParams: VisitQueryParams = useMemo(
    () => ({
      date: selectedDate,
      mrId: selectedMR,
      territoryId: selectedTerritory,
      customerId: selectedCustomer,
      status: selectedStatus,
      search,
    }),
    [selectedDate, selectedMR, selectedTerritory, selectedCustomer, selectedStatus, search]
  );

  // Queries
  const { data: visits, isLoading } = useVisits(queryParams);
  const { data: counts } = useVisitCounts({
    date: selectedDate,
    mrId: selectedMR,
    territoryId: selectedTerritory,
  });
  const { data: visitDates } = useVisitDates();
  const { data: territories } = useTerritories();
  const { data: mrList } = useMRList();
  const { data: doctors } = useDoctors();
  const { data: pharmacies } = usePharmacies();

  const handleResetFilters = () => {
    setSelectedDate("2026-10-08");
    setSelectedMR("ALL");
    setSelectedTerritory("ALL");
    setSelectedCustomer("ALL");
    setSelectedStatus("ALL");
    setSearch("");
  };

  const hasActiveFilters =
    selectedDate !== "2026-10-08" ||
    selectedMR !== "ALL" ||
    selectedTerritory !== "ALL" ||
    selectedCustomer !== "ALL" ||
    selectedStatus !== "ALL" ||
    Boolean(search.trim());

  // Status Badge Helper
  const getStatusBadge = (status: VisitStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="success" className="gap-1 text-[11px] font-semibold">
            <CheckCircle className="h-3 w-3" />
            COMPLETED
          </Badge>
        );
      case "IN_PROGRESS":
      case "LOCATION_VERIFIED":
        return (
          <Badge variant="info" className="gap-1 text-[11px] font-semibold">
            <Clock className="h-3 w-3" />
            IN PROGRESS
          </Badge>
        );
      case "MISSED":
        return (
          <Badge variant="warning" className="gap-1 text-[11px] font-semibold">
            <AlertTriangle className="h-3 w-3" />
            MISSED
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive" className="gap-1 text-[11px] font-semibold">
            <XCircle className="h-3 w-3" />
            CANCELLED
          </Badge>
        );
      case "PLANNED":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
            <Calendar className="h-3 w-3" />
            PLANNED
          </Badge>
        );
    }
  };

  // Verification Badge Helper
  const getVerificationBadge = (verStatus: VerificationStatus, distance?: number) => {
    switch (verStatus) {
      case "VERIFIED":
        return (
          <Badge variant="success" className="gap-1 text-[10px] font-mono">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            <span>VERIFIED ({distance ?? 18}m)</span>
          </Badge>
        );
      case "OUTSIDE_RADIUS":
        return (
          <Badge variant="destructive" className="gap-1 text-[10px] font-mono">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            <span>OUTSIDE RADIUS ({distance ?? 120}m)</span>
          </Badge>
        );
      case "MANUAL_EXCEPTION":
        return (
          <Badge variant="warning" className="gap-1 text-[10px] font-mono">
            <ShieldCheck className="h-3 w-3 text-amber-600" />
            <span>EXCEPTION APPROVED</span>
          </Badge>
        );
      case "UNVERIFIED":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] font-mono">
            <span>UNVERIFIED</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Field Visit Management & Detailing Operations"
        description="Daily representative doctor calls, in-clinic detailing logs, GPS geofence radius verification, and visit completion telemetry."
        badge={
          <Badge variant="success" className="gap-1">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>Live Field Feed</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate("2026-10-08")}
              className={`h-8 gap-1.5 text-xs ${
                selectedDate === "2026-10-08" ? "bg-sky-50 text-sky-600 border-sky-300 font-bold" : ""
              }`}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>Today: Oct 8, 2026</span>
            </Button>
          </div>
        }
      />

      {/* KPI SUMMARY CARDS: TODAY'S VISITS, COMPLETED, IN PROGRESS, MISSED, CANCELLED */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. TODAY'S VISITS */}
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today&apos;s Calls</span>
            <Navigation className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {counts?.todayTotal || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled for selected date</p>
        </Card>

        {/* 2. COMPLETED */}
        <Card
          onClick={() => setSelectedStatus(selectedStatus === "COMPLETED" ? "ALL" : "COMPLETED")}
          className={`p-4 cursor-pointer transition-all border ${
            selectedStatus === "COMPLETED"
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Completed
            </span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {counts?.completed || 0}
          </div>
          <p className="text-[11px] text-emerald-600/80 font-medium mt-1">
            {counts?.todayTotal ? Math.round(((counts.completed || 0) / counts.todayTotal) * 100) : 0}% of planned calls
          </p>
        </Card>

        {/* 3. IN PROGRESS */}
        <Card
          onClick={() => setSelectedStatus(selectedStatus === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
          className={`p-4 cursor-pointer transition-all border ${
            selectedStatus === "IN_PROGRESS"
              ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 ring-2 ring-sky-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
              In Progress
            </span>
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            {counts?.inProgress || 0}
          </div>
          <p className="text-[11px] text-sky-600/80 font-medium mt-1">
            At clinic / verified radius
          </p>
        </Card>

        {/* 4. MISSED */}
        <Card
          onClick={() => setSelectedStatus(selectedStatus === "MISSED" ? "ALL" : "MISSED")}
          className={`p-4 cursor-pointer transition-all border ${
            selectedStatus === "MISSED"
              ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Missed
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {counts?.missed || 0}
          </div>
          <p className="text-[11px] text-amber-600/80 font-medium mt-1">
            Unvisited doctor quota
          </p>
        </Card>

        {/* 5. CANCELLED */}
        <Card
          onClick={() => setSelectedStatus(selectedStatus === "CANCELLED" ? "ALL" : "CANCELLED")}
          className={`p-4 cursor-pointer transition-all border ${
            selectedStatus === "CANCELLED"
              ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              Cancelled
            </span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {counts?.cancelled || 0}
          </div>
          <p className="text-[11px] text-rose-600/80 font-medium mt-1">
            Doctor unavailable / emergency
          </p>
        </Card>

        {/* 6. GPS VERIFIED RATE */}
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">GPS Accuracy</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {counts?.gpsVerifiedRate || 95}%
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Within 50m registered pin
          </p>
        </Card>
      </div>

      {/* MULTI-FILTER TOOLBAR */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-sky-600" />
              Field Visit Search & Audit Filters
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 text-[11px] gap-1 text-slate-500 hover:text-slate-900"
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
                Call Schedule Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                suppressHydrationWarning
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Recorded Dates</option>
                {visitDates?.map((d) => (
                  <option key={d} value={d}>
                    {d === "2026-10-08" ? `Today (${formatDate(d)})` : formatDate(d)}
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
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Medical Representatives</option>
                {mrList?.map((mr) => (
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
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Territory Zones</option>
                {territories?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. CUSTOMER FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Customer (Doctor / Pharmacy)
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                suppressHydrationWarning
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Target Customers</option>
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
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
              placeholder="Search customer name, doctor specialty, MR name, clinic address, or detailing feedback notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* VISITS TABLE */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Navigation className="h-4 w-4 text-sky-600" />
              Representative Field Call Roster & Geofence Logs
            </CardTitle>
            <CardDescription>
              Audit distance deviation, scheduled vs actual duration, and detailing outcomes
            </CardDescription>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            Showing {visits?.length || 0} visits
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !visits || visits.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Representative Calls Found"
                description="No field visits match the selected date, representative, customer, or call status."
                actionLabel="Reset All Filters"
                onAction={handleResetFilters}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer / Clinic</TableHead>
                  <TableHead>Field Representative</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Time Schedule</TableHead>
                  <TableHead>Call Status</TableHead>
                  <TableHead>GPS Verification</TableHead>
                  <TableHead>Outcome / Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v) => (
                    <TableRow key={v.id}>
                      {/* Customer */}
                      <TableCell>
                        <div className="flex items-start gap-1.5">
                          {v.customerType === "DOCTOR" ? (
                            <Stethoscope className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
                          ) : (
                            <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <button
                              onClick={() => setSelectedVisit(v)}
                              className="font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-sky-600 text-left transition-colors"
                            >
                              {v.customerName}
                            </button>
                            <div className="text-[11px] text-slate-500">
                              {v.specialty || "Clinic / Pharmacy"}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {v.customerAddress}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* MR */}
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{v.mrName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 pl-4.5">
                          {v.employeeCode}
                        </div>
                      </TableCell>

                      {/* Territory */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin className="h-3 w-3 text-sky-600 shrink-0" />
                          <span>{v.territoryName}</span>
                        </div>
                      </TableCell>

                      {/* Time Schedule */}
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{v.scheduledStartTime || "09:00 AM"}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Date: {formatDate(v.scheduledDate || v.plannedDate)}
                        </div>
                        {v.durationSeconds && (
                          <div className="text-[10px] font-mono text-emerald-600">
                            Duration: {Math.round(v.durationSeconds / 60)} mins
                          </div>
                        )}
                      </TableCell>

                      {/* Call Status */}
                      <TableCell>{getStatusBadge(v.status)}</TableCell>

                      {/* GPS Verification */}
                      <TableCell>
                        {getVerificationBadge(v.verificationStatus, v.distanceMeters)}
                      </TableCell>

                      {/* Outcome / Notes */}
                      <TableCell>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs italic">
                          &ldquo;{v.feedbackNotes || v.doctorFeedback || "Detailed core therapeutic portfolio"}&rdquo;
                        </div>
                        {v.nextFollowUpDate && (
                          <div className="text-[10px] text-sky-600 font-medium mt-0.5">
                            Follow-Up: {formatDate(v.nextFollowUpDate)}
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-slate-600 hover:text-sky-600"
                          onClick={() => setSelectedVisit(v)}
                          title="Inspect Detailing Call Record"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* VISIT DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedVisit)}
        onClose={() => setSelectedVisit(null)}
        title={selectedVisit ? `Call Details: ${selectedVisit.customerName}` : "Visit Record"}
        description={`Audit ID #${selectedVisit?.id} • Scheduled ${formatDate(selectedVisit?.scheduledDate || "")} at ${selectedVisit?.scheduledStartTime}`}
      >
        {selectedVisit && (
          <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
            {/* Top Status & Verification Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600">
                  {selectedVisit.customerType === "DOCTOR" ? (
                    <Stethoscope className="h-5 w-5" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedVisit.customerName}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {selectedVisit.specialty} • {selectedVisit.customerType}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(selectedVisit.status)}
                {getVerificationBadge(selectedVisit.verificationStatus, selectedVisit.distanceMeters)}
              </div>
            </div>

            {/* MR Profile & Customer Address Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Field Representative (MR)
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-sky-600" />
                  <span>{selectedVisit.mrName}</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Employee Code: {selectedVisit.employeeCode || "NP-MR-101"}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Territory: {selectedVisit.territoryName}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Customer Clinic / Store Address
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedVisit.customerAddress}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Priority Tier: {selectedVisit.priority || "NORMAL"}
                </div>
                <div className="text-emerald-600 font-mono text-[11px]">
                  GPS Pin: ({selectedVisit.verifiedLatitude?.toFixed(4)}, {selectedVisit.verifiedLongitude?.toFixed(4)})
                </div>
              </div>
            </div>

            {/* Time Breakdown Grid (Scheduled vs Actual) */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                <Clock className="h-3 w-3 text-sky-600" />
                Time Schedule & Call Duration Telemetry
              </span>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold">Scheduled Window</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedVisit.scheduledStartTime} - {selectedVisit.scheduledEndTime}
                  </div>
                </div>

                <div className="p-2 rounded bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
                  <div className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold">
                    Actual Start / End
                  </div>
                  <div className="text-xs font-bold text-sky-900 dark:text-sky-100 mt-0.5 font-mono">
                    {selectedVisit.actualStartTime
                      ? new Date(selectedVisit.actualStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : selectedVisit.scheduledStartTime}
                    {" - "}
                    {selectedVisit.actualEndTime
                      ? new Date(selectedVisit.actualEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : selectedVisit.scheduledEndTime}
                  </div>
                </div>

                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    Total In-Clinic Duration
                  </div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">
                    {selectedVisit.durationSeconds
                      ? `${Math.floor(selectedVisit.durationSeconds / 60)}m ${selectedVisit.durationSeconds % 60}s`
                      : "18 mins (Standard)"}
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Verification & Geofence Distance */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Geofence Verification & Distance Compliance
              </span>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold">Distance Deviation</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                    {selectedVisit.distanceMeters ?? 18.5} meters
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    Within allowable 50-meter clinic geofence
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold">Verified Coordinates</div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    ({selectedVisit.verifiedLatitude?.toFixed(6)}, {selectedVisit.verifiedLongitude?.toFixed(6)})
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    GPS Accuracy: ±{selectedVisit.gpsAccuracy || 12}m
                  </div>
                </div>
              </div>
            </div>

            {/* Outcome and Representative Notes */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                <FileText className="h-3 w-3 text-sky-600" />
                Physician Response & Detailing Outcome Notes
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed italic text-xs">
                &ldquo;{selectedVisit.feedbackNotes || selectedVisit.doctorFeedback}&rdquo;
              </p>

              {selectedVisit.nextFollowUpDate && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-sky-700 dark:text-sky-400 font-medium">
                  Follow-up call booked for: {formatDate(selectedVisit.nextFollowUpDate)}
                </div>
              )}
            </div>

            {/* Products Discussed & Samples */}
            {selectedVisit.visitProducts && selectedVisit.visitProducts.length > 0 && (
              <div className="space-y-2">
                <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                  <Boxes className="h-3 w-3 text-indigo-600" />
                  Formulations Promoted & Samples Distributed
                </span>

                <div className="space-y-1.5">
                  {selectedVisit.visitProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {p.productId === "prod_001" ? "CardioVas 10mg" : p.productId === "prod_003" ? "NormoTens 40mg" : "NovisMet 500mg"}
                        </div>
                        {p.feedback && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Feedback: {p.feedback}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {p.promoted && (
                          <Badge variant="outline" className="text-[10px]">
                            Promoted
                          </Badge>
                        )}
                        {p.samplesQty && (
                          <Badge variant="info" className="text-[10px]">
                            {p.samplesQty} Samples
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={() => setSelectedVisit(null)}>
                Close Call Record
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
