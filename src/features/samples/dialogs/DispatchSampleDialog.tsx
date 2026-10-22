"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { SampleBatch, SampleInventoryBalance } from "@/services/sampleService";

interface DispatchSampleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  mrs: any[];
  batches: SampleBatch[];
  balances: SampleInventoryBalance[];
  dispatchForm: {
    targetMrId: string;
    reference: string;
    notes: string;
    items: { batchId: string; quantity: number }[];
  };
  setDispatchForm: React.Dispatch<React.SetStateAction<{
    targetMrId: string;
    reference: string;
    notes: string;
    items: { batchId: string; quantity: number }[];
  }>>;
  isSubmitting: boolean;
}

export const DispatchSampleDialog: React.FC<DispatchSampleDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mrs,
  batches,
  balances,
  dispatchForm,
  setDispatchForm,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Samples to Medical Representative"
      description="Allocate warehouse samples to an MR. Samples move into in-transit custody until physically acknowledged."
      maxWidth="xl"
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Target Medical Representative *</label>
          <select
            value={dispatchForm.targetMrId}
            onChange={(e) => setDispatchForm({ ...dispatchForm, targetMrId: e.target.value })}
            className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
            required
          >
            <option value="">Select recipient MR...</option>
            {mrs.map((mr) => (
              <option key={mr.id} value={mr.id}>
                {mr.name} ({mr.employeeCode}) — {mr.territoryName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Consignment Reference Code</label>
          <Input
            placeholder="e.g. DSP-2026-CHAL01"
            value={dispatchForm.reference}
            onChange={(e) => setDispatchForm({ ...dispatchForm, reference: e.target.value })}
            className="text-xs h-9"
          />
        </div>

        {/* Dynamic Batch Items List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-foreground">Sample Batch Items *</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() =>
                setDispatchForm({
                  ...dispatchForm,
                  items: [...dispatchForm.items, { batchId: "", quantity: 10 }],
                })
              }
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Product Item
            </Button>
          </div>

          {dispatchForm.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border">
              <div className="flex-1">
                <select
                  value={item.batchId}
                  onChange={(e) => {
                    const updated = [...dispatchForm.items];
                    updated[idx].batchId = e.target.value;
                    setDispatchForm({ ...dispatchForm, items: updated });
                  }}
                  className="w-full text-xs h-8 rounded-md border border-input bg-background px-2"
                  required
                >
                  <option value="">Select batch lot...</option>
                  {batches.map((b) => {
                    const whBal = balances.find((x) => x.batchId === b.id && x.isWarehouse);
                    const whQty = whBal ? whBal.quantity : 0;
                    return (
                      <option key={b.id} value={b.id} disabled={whQty <= 0}>
                        {b.product?.brandName} (Lot: {b.batchNumber}) — {whQty} available
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => {
                    const updated = [...dispatchForm.items];
                    updated[idx].quantity = parseInt(e.target.value, 10) || 1;
                    setDispatchForm({ ...dispatchForm, items: updated });
                  }}
                  required
                  className="text-xs h-8"
                />
              </div>
              {dispatchForm.items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  onClick={() => {
                    const updated = dispatchForm.items.filter((_, i) => i !== idx);
                    setDispatchForm({ ...dispatchForm, items: updated });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Consignment Notes</label>
          <Input
            placeholder="e.g. Monthly allocation for campaign"
            value={dispatchForm.notes}
            onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
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
            {isSubmitting ? "Dispatching..." : "Confirm Dispatch"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
