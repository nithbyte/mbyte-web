"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductInput } from "@/types";
import { Package, FileText, Percent, AlertCircle } from "lucide-react";

interface ProductFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: () => void;
  form: ProductInput;
  setForm: React.Dispatch<React.SetStateAction<ProductInput>>;
  errors: Record<string, string>;
  categories?: any[];
  isSubmitting: boolean;
  productName?: string;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  isOpen,
  mode,
  onClose,
  onSubmit,
  form,
  setForm,
  errors,
  categories,
  isSubmitting,
  productName,
}) => {
  const isEdit = mode === "edit";
  const title = isEdit ? `Edit Product: ${productName || ""}` : "Add New Pharmaceutical Product";
  const description = isEdit
    ? "Update brand details, molecule composition, trade pricing, and market status for this formulation."
    : "Register a new formulation in the product catalog. All fields marked with * are required.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {errors.submit && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Section: Identity */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Package className="h-3.5 w-3.5 text-sky-600" />
            Product Identity
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Brand Name *</label>
              <Input
                id={isEdit ? "edit-product-brand-name" : "product-brand-name"}
                placeholder="e.g. Noviscard 5mg"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={`h-9 text-xs ${errors.name ? "border-rose-400" : ""}`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Generic Name / Molecule *</label>
              <Input
                id={isEdit ? "edit-product-generic-name" : "product-generic-name"}
                placeholder="e.g. Amlodipine"
                value={form.genericName}
                onChange={(e) => setForm((f) => ({ ...f, genericName: e.target.value }))}
                className={`h-9 text-xs ${errors.genericName ? "border-rose-400" : ""}`}
              />
              {errors.genericName && (
                <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.genericName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SKU Code *</label>
              <Input
                id={isEdit ? "edit-product-sku" : "product-sku"}
                placeholder="e.g. NVC-5MG-10X10"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                className={`h-9 text-xs font-mono ${errors.sku ? "border-rose-400" : ""}`}
              />
              {errors.sku && (
                <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.sku}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Therapeutic Category *</label>
              <select
                id={isEdit ? "edit-product-category" : "product-category"}
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className={`w-full h-9 px-3 rounded-md border bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 ${errors.categoryId ? "border-rose-400" : "border-slate-200 dark:border-slate-800"}`}
              >
                <option value="">Select Category…</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.categoryId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section: Formulation Details */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5 text-indigo-600" />
            Formulation Details
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dosage Form *</label>
              <select
                id={isEdit ? "edit-product-dosage-form" : "product-dosage-form"}
                value={form.dosageForm}
                onChange={(e) => setForm((f) => ({ ...f, dosageForm: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Ointment", "Drops", "Inhaler", "Powder", "Gel", "Suppository"].map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Strength {!isEdit && "*"}</label>
              <Input
                id={isEdit ? "edit-product-strength" : "product-strength"}
                placeholder="e.g. 500mg"
                value={form.strength}
                onChange={(e) => setForm((f) => ({ ...f, strength: e.target.value }))}
                className={`h-9 text-xs ${errors.strength ? "border-rose-400" : ""}`}
              />
              {errors.strength && (
                <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.strength}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Pack Size</label>
              <Input
                id={isEdit ? "edit-product-pack-size" : "product-pack-size"}
                placeholder="e.g. 10x10"
                value={form.packSize}
                onChange={(e) => setForm((f) => ({ ...f, packSize: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description / Clinical Profile</label>
            <textarea
              id={isEdit ? "edit-product-description" : "product-description"}
              placeholder="Brief clinical description, indications, and usage..."
              value={form.description || ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
            />
          </div>
        </div>

        {/* Section: Pricing */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Percent className="h-3.5 w-3.5 text-emerald-600" />
            Commercial Pricing Architecture
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">MRP (₹) *</label>
              <Input
                id={isEdit ? "edit-product-mrp" : "product-mrp"}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.mrp || ""}
                onChange={(e) => setForm((f) => ({ ...f, mrp: parseFloat(e.target.value) || 0 }))}
                className={`h-9 text-xs font-mono ${errors.mrp ? "border-rose-400" : ""}`}
              />
              {errors.mrp && <p className="text-[11px] text-rose-500 mt-0.5">{errors.mrp}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">PTR (₹) *</label>
              <Input
                id={isEdit ? "edit-product-ptr" : "product-ptr"}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.ptr || ""}
                onChange={(e) => setForm((f) => ({ ...f, ptr: parseFloat(e.target.value) || 0 }))}
                className={`h-9 text-xs font-mono ${errors.ptr ? "border-rose-400" : ""}`}
              />
              {errors.ptr && <p className="text-[11px] text-rose-500 mt-0.5">{errors.ptr}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">PTS (₹) *</label>
              <Input
                id={isEdit ? "edit-product-pts" : "product-pts"}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.pts || ""}
                onChange={(e) => setForm((f) => ({ ...f, pts: parseFloat(e.target.value) || 0 }))}
                className={`h-9 text-xs font-mono ${errors.pts ? "border-rose-400" : ""}`}
              />
              {errors.pts && <p className="text-[11px] text-rose-500 mt-0.5">{errors.pts}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">GST %</label>
              <select
                id={isEdit ? "edit-product-gst" : "product-gst"}
                value={form.gstPercent}
                onChange={(e) => setForm((f) => ({ ...f, gstPercent: parseInt(e.target.value, 10) }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {[0, 5, 12, 18, 28].map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            </div>
          </div>
          {form.mrp > 0 && form.ptr > 0 && (
            <div className="text-[11px] text-slate-500 p-2 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              Chemist margin: <span className="font-bold text-emerald-600">{Math.round(((form.mrp - form.ptr) / form.mrp) * 100)}%</span>
              {" "} • Stockist margin: <span className="font-bold text-indigo-600">{Math.round(((form.ptr - form.pts) / form.ptr) * 100)}%</span>
            </div>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3 px-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {form.isActive ? "Active in Distribution" : "Inactive / On Hold"}
            </span>
          </label>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting}
            id={isEdit ? "btn-update-product" : "btn-save-product"}
          >
            {isSubmitting
              ? isEdit
                ? "Updating Formulation…"
                : "Saving…"
              : isEdit
              ? "Save Changes"
              : "Save Product to Catalog"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
