"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types";
import { productService } from "@/services/productService";
import {
  BookOpen,
  Upload,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  FileText,
  X,
  UploadCloud,
} from "lucide-react";

export interface VisualAidFormData {
  title: string;
  type: string;
  fileUrl: string;
  thumbnailUrl?: string;
  description: string;
  version: string;
}

interface VisualAidUploadDialogProps {
  product: Product | null;
  onClose: () => void;
  onSubmit: () => void;
  form: VisualAidFormData;
  setForm: React.Dispatch<React.SetStateAction<VisualAidFormData>>;
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{
    name: string;
    size: number;
    previewUrl?: string;
    isImage: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = async (file: File) => {
    setUploadError(null);

    // Validate size limit (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File exceeds maximum allowed size (50 MB). Please choose a smaller file.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

    setUploadedFileMeta({
      name: file.name,
      size: file.size,
      previewUrl,
      isImage,
    });

    // Auto-select type
    if (isImage) {
      setForm((f) => ({ ...f, type: "IMAGE" }));
    } else if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
      setForm((f) => ({ ...f, type: "PDF" }));
    } else if (file.name.match(/\.(ppt|pptx)$/i)) {
      setForm((f) => ({ ...f, type: "SLIDES" }));
    }

    // Auto-fill title if currently empty
    setForm((f) => {
      if (!f.title.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const formattedTitle = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : "";
        return { ...f, title: formattedTitle };
      }
      return f;
    });

    // Upload to backend storage
    setIsUploading(true);
    try {
      const uploadRes = await productService.uploadVisualAidFile(file);
      setForm((f) => ({
        ...f,
        fileUrl: uploadRes.fileUrl,
        thumbnailUrl: isImage ? uploadRes.fileUrl : f.thumbnailUrl,
      }));
    } catch (err: any) {
      console.error("Visual aid upload error:", err);
      setUploadError(err?.message || "Failed to upload file to server. A local preview will be used.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemoveUploadedFile = () => {
    setUploadedFileMeta(null);
    setUploadError(null);
    setForm((f) => ({ ...f, fileUrl: "", thumbnailUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
            <span>
              Upload product images or clinical detailing slides for field MRs. You can also specify an external CDN URL directly.
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* FILE UPLOAD / DRAG & DROP AREA */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Upload Image or Document File</span>
              <span className="text-[11px] font-normal text-slate-500">PNG, JPG, WebP, SVG, PDF up to 50MB</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.ppt,.pptx"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {!uploadedFileMeta ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150 ${
                  isDragging
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 scale-[0.99]"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-900/80 hover:border-sky-400"
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-950/80 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Drag & drop your image here, or{" "}
                      <span className="text-sky-600 dark:text-sky-400 underline decoration-sky-400/50 underline-offset-2">
                        browse files
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Visual aid charts, product pack shots, mechanism of action graphics
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  {uploadedFileMeta.isImage && uploadedFileMeta.previewUrl ? (
                    <div className="h-14 w-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0">
                      <img
                        src={uploadedFileMeta.previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {uploadedFileMeta.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatFileSize(uploadedFileMeta.size)}
                      </span>
                      {isUploading ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-sky-600 font-medium">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Uploading to storage…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Uploaded & Linked
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500"
                    onClick={handleRemoveUploadedFile}
                    disabled={isUploading}
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {uploadError && (
              <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {uploadError}
              </p>
            )}
          </div>

          {/* DECK TITLE */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Deck Title *
            </label>
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

          {/* ASSET TYPE & VERSION */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Asset Type *
              </label>
              <select
                id="va-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {["IMAGE", "PDF", "SLIDES", "VIDEO", "PRESENTATION", "BROCHURE"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Version
              </label>
              <Input
                id="va-version"
                placeholder="e.g. 1.0"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* ASSET FILE URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
              <span>Asset File URL *</span>
              {form.fileUrl.startsWith("data:") ? (
                <span className="text-[10px] text-amber-600 font-medium">Local Data Preview</span>
              ) : form.fileUrl ? (
                <span className="text-[10px] text-emerald-600 font-medium">Linked to Storage</span>
              ) : null}
            </label>
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

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Description
            </label>
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
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting || isUploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting || isUploading}
            id="btn-save-visual-aid"
            className="gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading File…
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Publish Visual Aid
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
