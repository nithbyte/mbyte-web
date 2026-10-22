"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RegisterBatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  products: any[];
  batchForm: {
    productId: string;
    batchNumber: string;
    expiryDate: string;
    manufacturingDate: string;
    initialStockQuantity: number;
  };
  setBatchForm: React.Dispatch<React.SetStateAction<{
    productId: string;
    batchNumber: string;
    expiryDate: string;
    manufacturingDate: string;
    initialStockQuantity: number;
  }>>;
  isSubmitting: boolean;
}

export const RegisterBatchDialog: React.FC<RegisterBatchDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  batchForm,
  setBatchForm,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Sample Batch"
      description="Add a compliant sample production lot with batch number and expiration date."
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Associated Product *</label>
          <select
            value={batchForm.productId}
            onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })}
            className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
            required
          >
            <option value="">Select a pharmaceutical product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.brandName} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Batch / Lot Number *</label>
          <Input
            placeholder="e.g. LOT-2026-CARD01"
            value={batchForm.batchNumber}
            onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
            required
            className="text-xs h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Expiry Date *</label>
            <Input
              type="date"
              value={batchForm.expiryDate}
              onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
              required
              className="text-xs h-9"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Manufacturing Date</label>
            <Input
              type="date"
              value={batchForm.manufacturingDate}
              onChange={(e) => setBatchForm({ ...batchForm, manufacturingDate: e.target.value })}
              className="text-xs h-9"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">
            Initial Warehouse Opening Stock (Packs)
          </label>
          <Input
            type="number"
            min="0"
            value={batchForm.initialStockQuantity}
            onChange={(e) =>
              setBatchForm({ ...batchForm, initialStockQuantity: parseInt(e.target.value, 10) || 0 })
            }
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? "Registering..." : "Register Batch"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
