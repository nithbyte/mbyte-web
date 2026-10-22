"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  User,
  Stethoscope,
  Building2,
  Boxes,
  Calendar,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";

interface ScheduleVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => Promise<void>;
  isPending: boolean;
  eligibleMRs: any[];
  eligibleDoctors: any[];
  eligiblePharmacies: any[];
  isTerritoryManager: boolean;
  managerTerritoryName?: string;
  defaultDate?: string;
}

const INITIAL_VISIT_FORM = {
  mrId: "",
  customerId: "",
  customerType: "DOCTOR" as "DOCTOR" | "PHARMACY",
  scheduledDate: "",
  scheduledStartTime: "10:00",
  scheduledEndTime: "10:30",
  priority: "ROUTINE",
  notes: "",
};

export const ScheduleVisitDialog: React.FC<ScheduleVisitDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  eligibleMRs,
  eligibleDoctors,
  eligiblePharmacies,
  isTerritoryManager,
  managerTerritoryName,
  defaultDate,
}) => {
  const [form, setForm] = useState(INITIAL_VISIT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...INITIAL_VISIT_FORM,
        scheduledDate: defaultDate && defaultDate !== "ALL" ? defaultDate : prev.scheduledDate,
      }));
      setErrors({});
    }
  }, [isOpen, defaultDate]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.mrId) errs.mrId = "Please assign a Medical Representative.";
    if (!form.customerId) errs.customerId = "Please select a target doctor or pharmacy.";
    if (!form.scheduledDate) errs.scheduledDate = "Scheduled date is required.";
    if (!form.scheduledStartTime) errs.scheduledStartTime = "Start time is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(form);
    setForm(INITIAL_VISIT_FORM);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule New Field Visit"
      description="Plan a doctor or pharmacy call and assign it to a Medical Representative for execution."
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {isTerritoryManager && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <span className="font-bold">Territory Enforced:</span> Assignments are restricted to Medical Representatives and customers within your assigned territory ({managerTerritoryName || "Assigned Territory"}).
          </div>
        )}

        {/* Assignment */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <User className="h-3.5 w-3.5 text-sky-600" />
            Representative Assignment
          </h4>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Medical Representative *
            </label>
            <select
              id="visit-mr"
              value={form.mrId}
              onChange={(e) => setForm((f) => ({ ...f, mrId: e.target.value }))}
              className={`w-full h-9 px-3 rounded-md border bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                errors.mrId ? "border-rose-400" : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <option value="">Select Representative…</option>
              {eligibleMRs.map((mr) => (
                <option key={mr.id} value={mr.id}>
                  {mr.name} — {mr.territoryName || "Territory"}
                </option>
              ))}
            </select>
            {errors.mrId && (
              <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.mrId}
              </p>
            )}
          </div>
        </div>

        {/* Target Customer */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
            Target Customer
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, customerType: "DOCTOR", customerId: "" }))}
              className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${
                form.customerType === "DOCTOR"
                  ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/40"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 hover:border-sky-300"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5 mx-auto mb-0.5" />
              Doctor
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, customerType: "PHARMACY", customerId: "" }))}
              className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${
                form.customerType === "PHARMACY"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 hover:border-emerald-300"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 mx-auto mb-0.5" />
              Pharmacy
            </button>
            <button
              type="button"
              disabled
              className="py-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400 cursor-not-allowed"
            >
              <Boxes className="h-3.5 w-3.5 mx-auto mb-0.5" />
              Stockist
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {form.customerType === "DOCTOR" ? "Doctor" : "Pharmacy"} *
            </label>
            <select
              id="visit-customer"
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
              className={`w-full h-9 px-3 rounded-md border bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                errors.customerId ? "border-rose-400" : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <option value="">
                Select {form.customerType === "DOCTOR" ? "Doctor" : "Pharmacy"}…
              </option>
              {form.customerType === "DOCTOR"
                ? eligibleDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.specialty ? ` — ${d.specialty}` : ""}
                    </option>
                  ))
                : eligiblePharmacies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
            </select>
            {errors.customerId && (
              <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.customerId}
              </p>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5 text-amber-600" />
            Schedule & Timing
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Date *
              </label>
              <input
                id="visit-date"
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                className={`w-full h-9 px-3 rounded-md border bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                  errors.scheduledDate ? "border-rose-400" : "border-slate-200 dark:border-slate-800"
                }`}
              />
              {errors.scheduledDate && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.scheduledDate}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Start Time *
              </label>
              <input
                id="visit-start-time"
                type="time"
                value={form.scheduledStartTime}
                onChange={(e) => setForm((f) => ({ ...f, scheduledStartTime: e.target.value }))}
                className={`w-full h-9 px-3 rounded-md border bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                  errors.scheduledStartTime ? "border-rose-400" : "border-slate-200 dark:border-slate-800"
                }`}
              />
              {errors.scheduledStartTime && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.scheduledStartTime}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                End Time
              </label>
              <input
                id="visit-end-time"
                type="time"
                value={form.scheduledEndTime}
                onChange={(e) => setForm((f) => ({ ...f, scheduledEndTime: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Priority
              </label>
              <select
                id="visit-priority"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ROUTINE">Routine</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent</option>
                <option value="FOLLOW_UP">Follow-Up</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Internal Notes
              </label>
              <Input
                id="visit-notes"
                placeholder="Optional briefing notes for MR…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isPending}
            id="btn-save-visit"
            className="gap-1.5"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            {isPending ? "Scheduling…" : "Schedule & Assign Visit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
