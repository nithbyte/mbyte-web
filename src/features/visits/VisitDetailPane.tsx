"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GeofenceVerificationMap } from "./GeofenceVerificationMap";
import { formatDate } from "@/lib/utils";
import type { Visit, VisitStatus, VerificationStatus } from "@/types";
import {
  Stethoscope,
  Building2,
  Clock,
  User,
  ShieldCheck,
  FileText,
  Boxes,
  UserCheck,
  Star,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  X,
  Phone,
  Compass,
} from "lucide-react";

interface VisitDetailPaneProps {
  visit: Visit | null;
  onClose?: () => void;
  isManagerOrAdmin: boolean;
  onReviewException: (approved: boolean, comment: string) => Promise<void>;
  isReviewingException: boolean;
  onOpenAccompaniment: () => void;
}

export const VisitDetailPane: React.FC<VisitDetailPaneProps> = ({
  visit,
  onClose,
  isManagerOrAdmin,
  onReviewException,
  isReviewingException,
  onOpenAccompaniment,
}) => {
  const [exceptionComment, setExceptionComment] = useState("");

  if (!visit) {
    return (
      <div className="h-full min-h-[420px] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center mb-3">
          <Compass className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Visit Call Selected
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          Select a representative visit from the list to inspect clinic telemetry, geofence compliance, and detailing outcomes.
        </p>
      </div>
    );
  }

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

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
      {/* Top Header Card */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
              visit.customerType === "DOCTOR"
                ? "bg-sky-100 dark:bg-sky-950 text-sky-600"
                : "bg-amber-100 dark:bg-amber-950 text-amber-600"
            }`}
          >
            {visit.customerType === "DOCTOR" ? (
              <Stethoscope className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {visit.customerName}
              </h2>
              {getStatusBadge(visit.status)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {visit.specialty || "General Practice"} • {visit.customerType} • Priority: {visit.priority || "NORMAL"}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {visit.customerAddress || "Clinic address recorded in directory"}
            </p>
          </div>
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Scrollable details body */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-340px)] text-xs">
        {/* Geofence Radar & Map */}
        <GeofenceVerificationMap
          clinicLat={visit.verifiedLatitude}
          clinicLng={visit.verifiedLongitude}
          mrLat={visit.latitude ?? visit.verifiedLatitude}
          mrLng={visit.longitude ?? visit.verifiedLongitude}
          distanceMeters={visit.distanceMeters}
          verificationStatus={visit.verificationStatus}
          customerName={visit.customerName}
          mrName={visit.mrName || "Medical Representative"}
          customerAddress={visit.customerAddress}
        />

        {/* Rep & Timing Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Representative Card */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">
              Assigned Field Representative
            </span>
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-sky-600" />
              <span>{visit.mrName}</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Code: {visit.employeeCode || "NP-MR-101"} • Territory: {visit.territoryName}
            </div>
          </div>

          {/* Time Telemetry Card */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">
              Duration & Timing Window
            </span>
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-sky-600" />
              <span>
                {visit.scheduledStartTime || "10:00"} - {visit.scheduledEndTime || "10:30"}
              </span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Actual in-clinic:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {visit.durationSeconds
                  ? `${Math.floor(visit.durationSeconds / 60)}m ${visit.durationSeconds % 60}s`
                  : "Standard Call Duration"}
              </strong>
            </div>
          </div>
        </div>

        {/* GEOFENCE EXCEPTION REVIEW PANEL */}
        {visit.verificationStatus === "EXCEPTION_REQUESTED" && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Representative Requested Geofence Exception</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 italic">
              &ldquo;{visit.exceptionReason || "Physician relocated / GPS multipath reflection at clinic site."}&rdquo;
            </p>
            <div className="text-[11px] text-slate-500">
              Requested on: {visit.exceptionRequestedAt ? new Date(visit.exceptionRequestedAt).toLocaleString() : "Recently"}
            </div>

            {isManagerOrAdmin && (
              <div className="pt-2 border-t border-amber-500/20 space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Manager Authorization Comment:
                </label>
                <input
                  type="text"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="e.g. Doctor clinic verified on 2nd floor of complex over phone..."
                  value={exceptionComment}
                  onChange={(e) => setExceptionComment(e.target.value)}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isReviewingException}
                    onClick={() => onReviewException(false, exceptionComment)}
                    className="h-7 text-xs"
                  >
                    Reject Exception
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isReviewingException}
                    onClick={() => onReviewException(true, exceptionComment)}
                  >
                    Approve Exception
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {visit.verificationStatus === "EXCEPTION_APPROVED" && visit.exceptionReviewComments && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <span className="font-bold">Manager Exception Approved:</span> {visit.exceptionReviewComments}
            </div>
          </div>
        )}

        {/* Outcome and Detailing Notes */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5">
          <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
            <FileText className="h-3 w-3 text-sky-600" />
            Physician Detailing Response & Clinical Feedback
          </span>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed italic text-xs">
            &ldquo;{visit.feedbackNotes || visit.doctorFeedback || "Doctor reviewed clinical trial data and confirmed prescription support for current month."}&rdquo;
          </p>
          {visit.nextFollowUpDate && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-sky-700 dark:text-sky-400 font-semibold">
              Next scheduled follow-up: {formatDate(visit.nextFollowUpDate)}
            </div>
          )}
        </div>

        {/* Formulations Promoted & Samples */}
        {visit.visitProducts && visit.visitProducts.length > 0 && (
          <div className="space-y-2">
            <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
              <Boxes className="h-3 w-3 text-indigo-600" />
              Promoted Formulations & Distributed Samples
            </span>
            <div className="space-y-1.5">
              {visit.visitProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {p.productId === "prod_001" ? "CardioVas 10mg" : p.productId === "prod_003" ? "NormoTens 40mg" : "NovisMet 500mg"}
                    </div>
                    {p.feedback && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Feedback: {p.feedback}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
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

        {/* Manager Joint Field Accompaniments */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              Manager Joint Visit & Field Coaching
            </span>
            {isManagerOrAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[11px] flex items-center gap-1 text-blue-600 border-blue-600/40 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                onClick={onOpenAccompaniment}
              >
                <Plus className="w-3 h-3" />
                Record Accompaniment
              </Button>
            )}
          </div>

          {visit.accompaniments && visit.accompaniments.length > 0 ? (
            <div className="space-y-2 pt-1">
              {visit.accompaniments.map((acc: any) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Accompanied by {acc.manager?.user?.firstName || "Manager"} {acc.manager?.user?.lastName || ""}
                      <span className="font-normal text-slate-500 ml-1">({acc.manager?.employeeCode || "MGR"})</span>
                    </span>
                    {acc.rating && (
                      <div className="flex items-center text-amber-500 font-bold text-xs gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-current" /> {acc.rating} / 5
                      </div>
                    )}
                  </div>

                  {acc.jointObjectives && (
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Objectives:</strong> {acc.jointObjectives}
                    </p>
                  )}
                  {acc.strengthsObserved && (
                    <p className="text-emerald-700 dark:text-emerald-400">
                      <strong>Strengths:</strong> {acc.strengthsObserved}
                    </p>
                  )}
                  {acc.areasOfImprovement && (
                    <p className="text-amber-700 dark:text-amber-400">
                      <strong>Areas for Improvement:</strong> {acc.areasOfImprovement}
                    </p>
                  )}
                  {acc.coachingFeedback && (
                    <div className="p-2 rounded bg-blue-50/60 dark:bg-blue-950/40 border border-blue-500/20 text-blue-900 dark:text-blue-200 mt-1">
                      <strong>Manager Coaching Feedback:</strong> {acc.coachingFeedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic pt-1">
              No supervisory accompaniment recorded for this call.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
