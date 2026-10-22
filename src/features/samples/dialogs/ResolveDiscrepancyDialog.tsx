"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SampleLedgerEntry } from "@/services/sampleService";

interface ResolveDiscrepancyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  targetDiscrepancyEntry: SampleLedgerEntry | null;
  resolveForm: {
    action: "RETURN_TO_WAREHOUSE" | "WRITE_OFF_DAMAGE";
    notes: string;
  };
  setResolveForm: React.Dispatch<React.SetStateAction<{
    action: "RETURN_TO_WAREHOUSE" | "WRITE_OFF_DAMAGE";
    notes: string;
  }>>;
  isSubmitting: boolean;
}

export const ResolveDiscrepancyDialog: React.FC<ResolveDiscrepancyDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  targetDiscrepancyEntry,
  resolveForm,
  setResolveForm,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolve Delivery Discrepancy"
      description="Authorized resolution for damaged, missing, or rejected sample dispatches."
    >
      {targetDiscrepancyEntry && (
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1.5 border">
            <p>
              <span className="font-semibold text-muted-foreground">Target MR: </span>
              <span className="text-foreground">
                {targetDiscrepancyEntry.targetMr?.user?.firstName} {targetDiscrepancyEntry.targetMr?.user?.lastName}
              </span>
            </p>
            <p>
              <span className="font-semibold text-muted-foreground">Product & Lot: </span>
              <span className="text-foreground font-mono">
                {targetDiscrepancyEntry.product?.brandName} ({targetDiscrepancyEntry.batch?.batchNumber})
              </span>
            </p>
            <p>
              <span className="font-semibold text-muted-foreground">Reported Notes: </span>
              <span className="text-foreground italic">{targetDiscrepancyEntry.notes}</span>
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Resolution Action *</label>
            <select
              value={resolveForm.action}
              onChange={(e) => setResolveForm({ ...resolveForm, action: e.target.value as any })}
              className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
            >
              <option value="RETURN_TO_WAREHOUSE">Reconcile to Central Warehouse Inventory</option>
              <option value="WRITE_OFF_DAMAGE">Write Off Discrepancy as Transit Damage</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Resolution Audit Remarks *</label>
            <Input
              placeholder="e.g. Damage report verified by regional supervisor"
              value={resolveForm.notes}
              onChange={(e) => setResolveForm({ ...resolveForm, notes: e.target.value })}
              required
              className="text-xs h-9"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? "Resolving..." : "Confirm Resolution"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
