"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types";
import { BookOpen, Upload, AlertCircle } from "lucide-react";

interface VisualAidUploadDialogProps {
  product: Product | null;
  onClose: () => void;
  onSubmit: () => void;
  form: {
    title: string;
    type: string;
    fileUrl: string;
    description: string;
    version: string;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    title: string;
    type: string;
    fileUrl: string;
    description: string;
    version: string;
  }>>;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

export const VisualAidUploadDialog: React.FC<VisualAidUploadDialogProps> = ({
  product,
  onClose,
  onSubmit,
  form,
  setForm,
  errors,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      title={`Upload Visual Aid: ${product?.name || ""}`}
      description={`Add a detailing deck, clinical evidence PDF, or promotional presentation for ${product?.genericName || "this product"}.`}
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span>Visual aids help MRs present clinical evidence in the field. Provide a URL to your file hosted on S3, SharePoint, or any CDN.</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Deck Title *</label>
            <Input
              id="va-title"
              placeholder="e.g. Noviscard Clinical Efficacy – 2026 Update"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={`h-9 text-xs ${errors.title ? "border-rose-400" : ""}`}
            />
            {errors.title && (
              <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Asset Type *</label>
              <select
                id="va-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {["PDF", "SLIDES", "VIDEO", "IMAGE", "PRESENTATION", "BROCHURE"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Version</label>
              <Input
                id="va-version"
                placeholder="e.g. 1.0"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Asset File URL *</label>
            <Input
              id="va-file-url"
              placeholder="https://cdn.novis.com/visual-aids/noviscard-2026.pdf"
              value={form.fileUrl}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
              className={`h-9 text-xs font-mono ${errors.fileUrl ? "border-rose-400" : ""}`}
            />
            {errors.fileUrl && (
              <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.fileUrl}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <textarea
              id="va-description"
              placeholder="Brief summary of what this visual aid covers..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting}
            id="btn-save-visual-aid"
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            {isSubmitting ? "Uploading…" : "Publish Visual Aid"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
