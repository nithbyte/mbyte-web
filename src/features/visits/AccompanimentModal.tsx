"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AccompanimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: {
    durationMinutes: number;
    jointObjectives: string;
    coachingFeedback: string;
    isPrivateCoaching: boolean;
    strengthsObserved: string;
    areasOfImprovement: string;
    rating: number;
  }) => Promise<void>;
  isSaving: boolean;
}

export const AccompanimentModal: React.FC<AccompanimentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  const [form, setForm] = useState({
    durationMinutes: 30,
    jointObjectives: "",
    coachingFeedback: "",
    isPrivateCoaching: true,
    strengthsObserved: "",
    areasOfImprovement: "",
    rating: 4,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Joint Field Visit Accompaniment"
      description="Log supervisory coaching, performance evaluation, and field coaching observations for this visit."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Accompaniment Duration (Minutes)
            </label>
            <Input
              type="number"
              min={5}
              max={240}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Performance Rating (1-5)
            </label>
            <select
              className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-1"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            >
              <option value={5}>5 - Outstanding (Role Model)</option>
              <option value={4}>4 - Exceeds Expectations</option>
              <option value={3}>3 - Meets Standard Expectations</option>
              <option value={2}>2 - Needs Coaching & Improvement</option>
              <option value={1}>1 - Unsatisfactory Call Delivery</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Joint Visit Call Objectives
          </label>
          <Input
            placeholder="e.g. Coach MR on objection handling for CardioVas 10mg..."
            value={form.jointObjectives}
            onChange={(e) => setForm({ ...form, jointObjectives: e.target.value })}
            className="mt-1 text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Strengths Observed
          </label>
          <textarea
            rows={2}
            className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Good clinical paper citation, professional doctor rapport..."
            value={form.strengthsObserved}
            onChange={(e) => setForm({ ...form, strengthsObserved: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Areas of Improvement
          </label>
          <textarea
            rows={2}
            className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Closing for secondary prescription commitment, time pacing..."
            value={form.areasOfImprovement}
            onChange={(e) => setForm({ ...form, areasOfImprovement: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Private Manager Coaching Feedback
          </label>
          <textarea
            rows={2}
            className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Confidential coaching observations (only visible to Managers and Admins)..."
            value={form.coachingFeedback}
            onChange={(e) => setForm({ ...form, coachingFeedback: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isPrivate"
            checked={form.isPrivateCoaching}
            onChange={(e) => setForm({ ...form, isPrivateCoaching: e.target.checked })}
            className="rounded border-slate-300"
          />
          <label htmlFor="isPrivate" className="text-xs text-slate-500 dark:text-slate-400">
            Keep coaching feedback confidential to Managers and Admins
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSaving} variant="primary">
            {isSaving ? "Saving..." : "Save Accompaniment Record"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
