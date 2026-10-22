"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Stethoscope,
  Building2,
  Clock,
  MapPin,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import type { Visit, VisitStatus, VerificationStatus } from "@/types";

interface VisitMasterListProps {
  visits: Visit[];
  selectedVisitId: string | null;
  onSelectVisit: (visit: Visit) => void;
  isLoading: boolean;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const VisitMasterList: React.FC<VisitMasterListProps> = ({
  visits,
  selectedVisitId,
  onSelectVisit,
  isLoading,
  onResetFilters,
  hasActiveFilters,
}) => {
  // Status Badge Helper
  const getStatusBadge = (status: VisitStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="success" className="gap-1 text-[10px] font-semibold py-0 px-1.5 h-5">
            <CheckCircle className="h-2.5 w-2.5" />
            COMPLETED
          </Badge>
        );
      case "IN_PROGRESS":
      case "LOCATION_VERIFIED":
        return (
          <Badge variant="info" className="gap-1 text-[10px] font-semibold py-0 px-1.5 h-5">
            <Clock className="h-2.5 w-2.5" />
            IN PROGRESS
          </Badge>
        );
      case "MISSED":
        return (
          <Badge variant="warning" className="gap-1 text-[10px] font-semibold py-0 px-1.5 h-5">
            <AlertTriangle className="h-2.5 w-2.5" />
            MISSED
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive" className="gap-1 text-[10px] font-semibold py-0 px-1.5 h-5">
            <XCircle className="h-2.5 w-2.5" />
            CANCELLED
          </Badge>
        );
      case "PLANNED":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] font-semibold py-0 px-1.5 h-5">
            <Calendar className="h-2.5 w-2.5" />
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
          <Badge variant="success" className="gap-0.5 text-[9px] font-mono py-0 px-1.5 h-4.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="h-2.5 w-2.5 text-emerald-600" />
            <span>GPS OK ({distance ?? 18}m)</span>
          </Badge>
        );
      case "OUTSIDE_RADIUS":
        return (
          <Badge variant="destructive" className="gap-0.5 text-[9px] font-mono py-0 px-1.5 h-4.5">
            <AlertTriangle className="h-2.5 w-2.5" />
            <span>OUTSIDE ({distance ?? 120}m)</span>
          </Badge>
        );
      case "MANUAL_EXCEPTION":
      case "EXCEPTION_APPROVED":
        return (
          <Badge variant="warning" className="gap-0.5 text-[9px] font-mono py-0 px-1.5 h-4.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
            <ShieldCheck className="h-2.5 w-2.5 text-amber-600" />
            <span>EXCEPTION</span>
          </Badge>
        );
      case "EXCEPTION_REQUESTED":
        return (
          <Badge variant="warning" className="gap-0.5 text-[9px] font-mono py-0 px-1.5 h-4.5 border-amber-500 text-amber-600">
            <Clock className="h-2.5 w-2.5" />
            <span>PENDING REVIEW</span>
          </Badge>
        );
      case "UNVERIFIED":
      default:
        return (
          <Badge variant="secondary" className="text-[9px] font-mono py-0 px-1.5 h-4.5">
            <span>UNVERIFIED</span>
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-3 space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No Field Visits Found"
          description={
            hasActiveFilters
              ? "No scheduled visits match the active date, representative, or status filters."
              : "No representative visits recorded for this operating date."
          }
          actionLabel={hasActiveFilters ? "Reset Filters" : undefined}
          onAction={hasActiveFilters ? onResetFilters : undefined}
        />
      </div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label="Field Visit Master List"
      className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[420px]"
    >
      {visits.map((v) => {
        const isSelected = v.id === selectedVisitId;

        return (
          <button
            key={v.id}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelectVisit(v)}
            className={`w-full text-left p-3.5 transition-all flex items-start gap-3 relative focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isSelected
                ? "bg-sky-50/70 dark:bg-sky-950/30 border-l-4 border-l-[#0052FF]"
                : "hover:bg-slate-50 dark:hover:bg-slate-900/60 border-l-4 border-l-transparent"
            }`}
          >
            {/* Customer Type Icon Badge */}
            <div
              className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                v.customerType === "DOCTOR"
                  ? "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
              }`}
            >
              {v.customerType === "DOCTOR" ? (
                <Stethoscope className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Header: Name + Status */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-xs font-bold truncate ${
                    isSelected
                      ? "text-[#0052FF] dark:text-sky-400"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {v.customerName}
                </span>
                <div className="shrink-0">{getStatusBadge(v.status)}</div>
              </div>

              {/* Specialty / Address */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {v.specialty || "Clinic / Retail"} • {v.customerAddress || "Territory Address"}
              </div>

              {/* MR & Territory */}
              <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">
                <span className="flex items-center gap-1 font-semibold truncate">
                  <User className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{v.mrName}</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1 text-slate-500 truncate text-[10px]">
                  <MapPin className="h-2.5 w-2.5 text-sky-600 shrink-0" />
                  <span className="truncate">{v.territoryName}</span>
                </span>
              </div>

              {/* Footer: Time Window + GPS Badge */}
              <div className="flex items-center justify-between pt-1 text-[10px]">
                <span className="flex items-center gap-1 font-mono text-slate-500">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>
                    {v.scheduledStartTime || "10:00"} - {v.scheduledEndTime || "10:30"}
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  {getVerificationBadge(v.verificationStatus, v.distanceMeters)}
                  <ChevronRight
                    className={`h-3 w-3 transition-transform ${
                      isSelected ? "text-[#0052FF] translate-x-0.5" : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
