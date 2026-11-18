"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift } from "lucide-react";

const GIFT_PRESETS = [
  { label: "Paperweight", name: "Crystal Paperweight", giftType: "Paperweight", unitLabel: "1 pc" },
  { label: "Branded Pen", name: "Branded Metal Pen", giftType: "Pen / Stationery", unitLabel: "1 pc" },
  { label: "Desk Calendar", name: "Doctor Desk Calendar", giftType: "Diary / Calendar", unitLabel: "1 pc" },
  { label: "Doctor Diary", name: "Executive Clinical Diary", giftType: "Diary / Calendar", unitLabel: "1 pc" },
  { label: "Rx Pad", name: "Prescription Pad", giftType: "Rx Pad / Literature", unitLabel: "1 pad" },
  { label: "Coffee Mug", name: "Ceramic Desk Mug", giftType: "Desk Accessory", unitLabel: "1 pc" },
];

export interface GiftInputFormState {
  name: string;
  giftType: string;
  unitLabel: string;
  sku: string;
  batchNumber: string;
  initialStockQuantity: number;
  notes: string;
}

interface AddGiftInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  giftForm: GiftInputFormState;
  setGiftForm: React.Dispatch<React.SetStateAction<GiftInputFormState>>;
  isSubmitting: boolean;
}

export const AddGiftInputDialog: React.FC<AddGiftInputDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  giftForm,
  setGiftForm,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Promotional Gift / Field Input"
      description="Register non-pharma gifts (paperweights, pens, diaries, Rx pads, mugs) into warehouse stock so you can dispatch them to MRs."
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        {/* Quick Presets */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Quick Pick Common Gifts
          </label>
          <div className="flex flex-wrap gap-1.5">
            {GIFT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  setGiftForm((prev) => ({
                    ...prev,
                    name: preset.name,
                    giftType: preset.giftType,
                    unitLabel: preset.unitLabel,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors cursor-pointer"
              >
                <Gift className="w-3 h-3" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Gift / Input Name *</label>
          <Input
            placeholder="e.g. Crystal Paperweight, Branded Metal Pen..."
            value={giftForm.name}
            onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
            required
            className="text-xs h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Gift Category *</label>
            <select
              value={giftForm.giftType}
              onChange={(e) => setGiftForm({ ...giftForm, giftType: e.target.value })}
              className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
              required
            >
              <option value="Paperweight">Paperweight</option>
              <option value="Pen / Stationery">Pen / Stationery</option>
              <option value="Diary / Calendar">Diary / Calendar</option>
              <option value="Rx Pad / Literature">Rx Pad / Literature</option>
              <option value="Desk Accessory">Desk Accessory</option>
              <option value="Promotional Gift">Other Promotional Gift</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Unit Label</label>
            <Input
              placeholder="e.g. 1 pc, 1 box, 1 pad"
              value={giftForm.unitLabel}
              onChange={(e) => setGiftForm({ ...giftForm, unitLabel: e.target.value })}
              className="text-xs h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Item Code / SKU (Optional)</label>
            <Input
              placeholder="Auto-generated if blank"
              value={giftForm.sku}
              onChange={(e) => setGiftForm({ ...giftForm, sku: e.target.value })}
              className="text-xs h-9 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Lot / Batch Code (Optional)</label>
            <Input
              placeholder="Auto-generated if blank"
              value={giftForm.batchNumber}
              onChange={(e) => setGiftForm({ ...giftForm, batchNumber: e.target.value })}
              className="text-xs h-9 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">
            Initial Warehouse Opening Stock (Units) *
          </label>
          <Input
            type="number"
            min="0"
            value={giftForm.initialStockQuantity}
            onChange={(e) =>
              setGiftForm({ ...giftForm, initialStockQuantity: parseInt(e.target.value, 10) || 0 })
            }
            required
            className="text-xs h-9"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Promotional gifts do not expire and are kept separate from your commercial medicine catalog.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Notes / Description (Optional)</label>
          <Input
            placeholder="e.g. Branded glass paperweight for doctors, chemists, and clinic staff"
            value={giftForm.notes}
            onChange={(e) => setGiftForm({ ...giftForm, notes: e.target.value })}
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
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? "Adding Gift..." : "Add Gift & Stock"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
