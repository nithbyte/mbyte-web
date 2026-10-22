"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SampleBatch } from "@/services/sampleService";

interface ReceiveStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  batches: SampleBatch[];
  receiveForm: {
    batchId: string;
    quantity: number;
    reference: string;
    receivedDate: string;
    notes: string;
  };
  setReceiveForm: React.Dispatch<React.SetStateAction<{
    batchId: string;
    quantity: number;
    reference: string;
    receivedDate: string;
    notes: string;
  }>>;
  isSubmitting: boolean;
}

export const ReceiveStockDialog: React.FC<ReceiveStockDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batches,
  receiveForm,
  setReceiveForm,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Central Warehouse Stock"
      description="Ingest fresh consignment stock from manufacturing plants into company central inventory."
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Select Sample Batch *</label>
          <select
            value={receiveForm.batchId}
            onChange={(e) => setReceiveForm({ ...receiveForm, batchId: e.target.value })}
            className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
            required
          >
            <option value="">Select registered batch lot...</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.product?.brandName} (Lot: {b.batchNumber}) — Exp: {new Date(b.expiryDate).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Quantity Received (Packs) *</label>
            <Input
              type="number"
              min="1"
              value={receiveForm.quantity}
              onChange={(e) => setReceiveForm({ ...receiveForm, quantity: parseInt(e.target.value, 10) || 1 })}
              required
              className="text-xs h-9"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Receipt Date</label>
            <Input
              type="date"
              value={receiveForm.receivedDate}
              onChange={(e) => setReceiveForm({ ...receiveForm, receivedDate: e.target.value })}
              className="text-xs h-9"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Challan / GRN Reference</label>
          <Input
            placeholder="e.g. GRN-2026-9021"
            value={receiveForm.reference}
            onChange={(e) => setReceiveForm({ ...receiveForm, reference: e.target.value })}
            className="text-xs h-9"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Delivery / Consignment Notes</label>
          <Input
            placeholder="e.g. Direct transfer from Plant B"
            value={receiveForm.notes}
            onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
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
            {isSubmitting ? "Receiving..." : "Confirm Stock Receipt"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
