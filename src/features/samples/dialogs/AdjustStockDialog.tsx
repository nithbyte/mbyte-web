"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SampleBatch, SampleMovementType } from "@/services/sampleService";

interface AdjustStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  mrs: any[];
  batches: SampleBatch[];
  adjustForm: {
    batchId: string;
    mrId: string;
    movementType: SampleMovementType;
    quantity: number;
    notes: string;
  };
  setAdjustForm: React.Dispatch<React.SetStateAction<{
    batchId: string;
    mrId: string;
    movementType: SampleMovementType;
    quantity: number;
    notes: string;
  }>>;
  isSubmitting: boolean;
}

export const AdjustStockDialog: React.FC<AdjustStockDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mrs,
  batches,
  adjustForm,
  setAdjustForm,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sample Stock Adjustment"
      description="Record inventory write-offs for damaged, expired, or audited physical stock discrepancies."
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Stock Location / Custody *</label>
          <select
            value={adjustForm.mrId}
            onChange={(e) => setAdjustForm({ ...adjustForm, mrId: e.target.value })}
            className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
          >
            <option value="">Company Central Warehouse</option>
            {mrs.map((mr) => (
              <option key={mr.id} value={mr.id}>
                MR: {mr.name} ({mr.employeeCode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Sample Batch *</label>
          <select
            value={adjustForm.batchId}
            onChange={(e) => setAdjustForm({ ...adjustForm, batchId: e.target.value })}
            className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
            required
          >
            <option value="">Select batch to adjust...</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.product?.brandName} (Lot: {b.batchNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Adjustment Reason *</label>
            <select
              value={adjustForm.movementType}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, movementType: e.target.value as SampleMovementType })
              }
              className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
            >
              <option value="ADJUSTMENT_DAMAGE">Damage / Broken Packaging</option>
              <option value="ADJUSTMENT_EXPIRED">Expired Stock Write-off</option>
              <option value="RECONCILIATION_CORRECTION">Physical Count Correction</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Quantity to Deduct *</label>
            <Input
              type="number"
              min="1"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value, 10) || 1 })}
              required
              className="text-xs h-9"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Audit Rationale Notes *</label>
          <Input
            placeholder="e.g. Broken vial seals verified during physical audit"
            value={adjustForm.notes}
            onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
            required
            className="text-xs h-9"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
            {isSubmitting ? "Adjusting..." : "Record Adjustment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
