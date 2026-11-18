"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  RefreshCw,
  ArrowRight,
  Building2,
  Info,
} from "lucide-react";
import { useAnalyzeSecondarySales, useApplySecondarySales } from "@/hooks";
import type { Distributor, Product } from "@/types";
import type {
  AnalyzedSecondarySalesItem,
  SecondarySalesAnalysisResponse,
} from "@/services/distributorService";

interface EditableRow extends AnalyzedSecondarySalesItem {
  selected: boolean;
  selectedProductId: string;
  editedClosingStock: number;
  synced: boolean;
}

interface SecondarySalesUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  distributors: Distributor[];
  products: Product[];
  initialDistributor?: Distributor | null;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_CLOSING_STOCK = 10_000_000;

function extractErrorMessage(err: any, fallback: string): string {
  const details = err?.details || err?.response?.data?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.join(" • ");
  }
  const nestedMsg =
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message;
  if (Array.isArray(nestedMsg)) return nestedMsg.join(" • ");
  if (typeof nestedMsg === "string" && nestedMsg.trim().length > 0) return nestedMsg;
  return fallback;
}

export function SecondarySalesUploadModal({
  isOpen,
  onClose,
  distributors,
  products,
  initialDistributor,
}: SecondarySalesUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDistributorId, setSelectedDistributorId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoApply, setAutoApply] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<SecondarySalesAnalysisResponse | null>(null);
  const [editableRows, setEditableRows] = useState<EditableRow[]>([]);

  const analyzeMutation = useAnalyzeSecondarySales();
  const applyMutation = useApplySecondarySales();

  useEffect(() => {
    if (isOpen) {
      setSelectedDistributorId(initialDistributor?.id || distributors?.[0]?.id || "");
      setSelectedFile(null);
      setAnalysis(null);
      setEditableRows([]);
      setErrorMessage(null);
      setSuccessMessage(null);
      setAutoApply(false);
    }
  }, [isOpen, initialDistributor, distributors]);

  const handleFilePicked = (file: File | null | undefined) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "xlsx", "xls", "xlsm", "xlsb", "csv", "tsv"].includes(ext)) {
      setErrorMessage(
        "Unsupported file type. Please upload a PDF (.pdf), Excel (.xlsx / .xls), or CSV (.csv) report."
      );
      return;
    }
    if (file.size === 0) {
      setErrorMessage("The selected file is empty (0 bytes). Please select a valid stockist report.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("File exceeds the 10 MB upload limit. Please split or compress the report.");
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedFile(file);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleProducts = (products || []).slice(0, 5);
    const header = "Product Name,SKU,Opening Stock,Purchase,Secondary Sales,Closing Stock,Batch No,Expiry";
    const rows =
      sampleProducts.length > 0
        ? sampleProducts.map((p: any, idx) => {
            const name = (p.brandName || p.name || `Product ${idx + 1}`).replace(/,/g, " ");
            const sku = p.sku || `SKU-00${idx + 1}`;
            const opening = 100 + idx * 20;
            const purchase = 50;
            const sales = 40 + idx * 15;
            const closing = Math.max(0, opening + purchase - sales);
            return `${name},${sku},${opening},${purchase},${sales},${closing},B2026-${idx + 1},12/2028`;
          })
        : [
            "Dolo 650,DOLO-650,120,50,65,105,B2026-01,12/2028",
            "Augmentin 625,AUG-625,80,40,112,8,B2026-02,10/2027",
          ];

    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stockist_secondary_sales_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    if (!selectedDistributorId) {
      setErrorMessage("Please select a target stockist / distributor first.");
      return;
    }
    if (!selectedFile) {
      setErrorMessage("Please select a PDF, Excel (.xlsx/.xls), or CSV secondary sales report to analyze.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await analyzeMutation.mutateAsync({
        distributorId: selectedDistributorId,
        file: selectedFile,
        autoApply,
      });

      const appliedIds = new Set(result.appliedRowIds || []);
      setAnalysis(result);
      setEditableRows(
        (result.items || []).map((item) => {
          const wasSynced = appliedIds.has(item.rowId);
          return {
            ...item,
            selected: Boolean(item.matchedProductId) && !wasSynced,
            selectedProductId: item.matchedProductId || "",
            editedClosingStock: Math.min(MAX_CLOSING_STOCK, Math.max(0, Number(item.closingStock) || 0)),
            synced: wasSynced,
          };
        })
      );

      if (result.autoApplied && (result.appliedCount || 0) > 0) {
        const remaining = (result.items || []).length - appliedIds.size;
        setSuccessMessage(
          remaining > 0
            ? `Automatically updated live stock for ${result.appliedCount} high-confidence product(s) at ${result.distributor.name}. You can review and apply the remaining ${remaining} row(s) below.`
            : `Analyzed ${result.summary.totalRows} rows and automatically updated stock for ${result.appliedCount} matched product(s) at ${result.distributor.name}!`
        );
      }
    } catch (err: any) {
      setErrorMessage(
        extractErrorMessage(
          err,
          "Failed to analyze the secondary sales report. Verify the file format and try again."
        )
      );
    }
  };

  const handleApplyStocks = async () => {
    if (!analysis || !selectedDistributorId) return;

    const readyItems = editableRows.filter((r) => !r.synced && r.selected && r.selectedProductId);
    if (readyItems.length === 0) {
      setErrorMessage("Select and match at least one unsynced product row before updating stockist inventory.");
      return;
    }

    // Client-side aggregate cap guard (matches backend MAX_REASONABLE_STOCK_QTY)
    const totalsByProduct = new Map<string, number>();
    for (const r of readyItems) {
      const qty = Math.min(MAX_CLOSING_STOCK, Math.max(0, Math.round(Number(r.editedClosingStock) || 0)));
      const next = (totalsByProduct.get(r.selectedProductId) || 0) + qty;
      if (next > MAX_CLOSING_STOCK) {
        setErrorMessage(
          `Combined closing stock (${next.toLocaleString()}) for one of the selected products exceeds the maximum limit of ${MAX_CLOSING_STOCK.toLocaleString()}.`
        );
        return;
      }
      totalsByProduct.set(r.selectedProductId, next);
    }

    setErrorMessage(null);
    try {
      const res = await applyMutation.mutateAsync({
        distributorId: selectedDistributorId,
        payload: {
          fileName: analysis.fileName,
          reportPeriod: analysis.reportPeriod,
          items: readyItems.map((r) => ({
            productId: r.selectedProductId,
            closingStock: Math.min(MAX_CLOSING_STOCK, Math.max(0, Math.round(Number(r.editedClosingStock) || 0))),
            ...(r.openingQty !== null && r.openingQty !== undefined ? { openingQty: r.openingQty } : {}),
            ...(r.purchaseQty !== null && r.purchaseQty !== undefined ? { purchaseQty: r.purchaseQty } : {}),
            ...(r.salesQty !== null && r.salesQty !== undefined ? { salesQty: r.salesQty } : {}),
            ...(r.batchNumber ? { batchNumber: r.batchNumber } : {}),
            ...(r.expiryDate ? { expiryDate: r.expiryDate } : {}),
          })),
        },
      });

      const appliedSet = new Set(readyItems.map((r) => r.rowId));
      setEditableRows((prev) =>
        prev.map((row) =>
          appliedSet.has(row.rowId) ? { ...row, synced: true, selected: false } : row
        )
      );

      setSuccessMessage(
        `Successfully updated live stocks for ${res.updatedCount} product(s) at ${res.distributorName}!`
      );
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, "Failed to apply stock updates."));
    }
  };

  const updateRow = (rowId: string, patch: Partial<EditableRow>) => {
    setEditableRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row))
    );
  };

  const handleProductSelectionChange = (row: EditableRow, nextProductId: string) => {
    const prevStockForSelected =
      nextProductId && analysis?.existingStocks
        ? analysis.existingStocks[nextProductId] ?? 0
        : 0;

    let nextClosing = row.editedClosingStock;
    if (
      nextProductId &&
      row.stockCalculationMode === "PREVIOUS_MINUS_SALES" &&
      row.salesQty !== null
    ) {
      nextClosing = Math.max(0, Math.round(prevStockForSelected - row.salesQty));
    }

    updateRow(row.rowId, {
      selectedProductId: nextProductId,
      selected: Boolean(nextProductId) && !row.synced,
      previousStock: prevStockForSelected,
      editedClosingStock: nextClosing,
    });
  };

  const pendingMatchedRows = useMemo(
    () => editableRows.filter((r) => !r.synced && Boolean(r.selectedProductId)),
    [editableRows]
  );

  const selectedPendingRows = useMemo(
    () => pendingMatchedRows.filter((r) => r.selected),
    [pendingMatchedRows]
  );

  const duplicateProductCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of selectedPendingRows) {
      counts.set(r.selectedProductId, (counts.get(r.selectedProductId) || 0) + 1);
    }
    return counts;
  }, [selectedPendingRows]);

  const allPendingSelected =
    pendingMatchedRows.length > 0 &&
    selectedPendingRows.length === pendingMatchedRows.length;

  const selectedCount = selectedPendingRows.length;
  const activeDistributorName =
    distributors.find((d) => d.id === selectedDistributorId)?.name || "Selected Stockist";

  const getStatusBadge = (qty: number) => {
    if (qty <= 0) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
          OUT OF STOCK
        </span>
      );
    }
    if (qty <= 10) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          LOW STOCK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
        AVAILABLE
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Stockist Secondary Sales Report"
      description="Upload a stockist secondary sales & stock statement (PDF, Excel, or CSV) to automatically analyze sales and set live closing stocks."
      maxWidth="2xl"
    >
      <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
        {/* Error / Success / Warning Banners */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {analysis?.warnings && analysis.warnings.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <ul className="space-y-1 list-disc list-inside">
              {analysis.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* STEP 1: Stockist Selection & File Dropzone */}
        {!analysis && (
          <div className="space-y-4">
            {/* Stockist Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Stockist / Distributor *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={selectedDistributorId}
                  onChange={(e) => setSelectedDistributorId(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                >
                  <option value="">Select Stockist / Distributor…</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.territoryName || "Territory"} ({d.contactPerson})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* File Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                handleFilePicked(dropped);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-[#FF6B00] bg-orange-50/70 dark:bg-orange-950/20"
                  : selectedFile
                  ? "border-emerald-400 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-[#FF6B00] hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.xlsm,.xlsb,.csv,.tsv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleFilePicked(file);
                  // Reset input so selecting the same fixed filename triggers onChange again
                  e.target.value = "";
                }}
              />

              {selectedFile ? (
                <div className="space-y-1.5">
                  <div className="mx-auto w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                    {selectedFile.name.toLowerCase().endsWith(".pdf") ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <FileSpreadsheet className="h-6 w-6" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze for{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {activeDistributorName}
                    </span>
                  </p>
                  <p className="text-[11px] text-[#FF6B00] font-semibold">
                    Click to choose a different file
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Drop Stockist Secondary Sales Report here or click to browse
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Supports standard pharma stockist statements in <strong>PDF (.pdf)</strong>,{" "}
                    <strong>Excel (.xlsx, .xls)</strong>, or <strong>CSV (.csv)</strong> up to 10 MB with
                    Opening, Purchase, Sales, and Closing Stock columns.
                  </p>
                </div>
              )}
            </div>

            {/* Auto-Apply Option + Sample Template */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-3.5 py-2.5">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoApply}
                  onChange={(e) => setAutoApply(e.target.checked)}
                  className="rounded border-slate-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                />
                <span>
                  <strong>Auto-apply immediately</strong> for high-confidence (80%+) unambiguous matches
                </span>
              </label>

              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6B00] hover:underline cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Sample Template</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAnalyze}
                disabled={!selectedFile || !selectedDistributorId || analyzeMutation.isPending}
                className="gap-1.5"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing Report…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{autoApply ? "Analyze & Set Stocks" : "Analyze Report"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Review Analyzed Rows & Confirm Stock Sync */}
        {analysis && (
          <div className="space-y-4">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Extracted</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {analysis.summary.totalRows}
                </div>
                <div className="text-[10px] text-slate-400">{analysis.fileType} rows</div>
              </div>
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5">
                <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                  Matched
                </div>
                <div className="text-lg font-extrabold text-emerald-800 dark:text-emerald-200">
                  {editableRows.filter((r) => Boolean(r.selectedProductId)).length}
                </div>
                <div className="text-[10px] text-emerald-600/80">Ready to sync</div>
              </div>
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-2.5">
                <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                  Unmatched
                </div>
                <div className="text-lg font-extrabold text-amber-800 dark:text-amber-200">
                  {editableRows.filter((r) => !r.selectedProductId).length}
                </div>
                <div className="text-[10px] text-amber-600/80">Map manually</div>
              </div>
              <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-2.5">
                <div className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300">
                  Secondary Sales
                </div>
                <div className="text-lg font-extrabold text-sky-900 dark:text-sky-100">
                  {analysis.summary.totalSalesQty.toLocaleString()}
                </div>
                <div className="text-[10px] text-sky-600/80">Total units sold</div>
              </div>
              <div className="rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/30 p-2.5">
                <div className="text-[10px] font-bold uppercase text-[#FF6B00]">
                  New Closing Stock
                </div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {editableRows
                    .filter((r) => (r.synced || r.selected) && r.selectedProductId)
                    .reduce((s, r) => s + (Number(r.editedClosingStock) || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">Units across selected</div>
              </div>
            </div>

            {/* File Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="info">{analysis.fileType}</Badge>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {analysis.fileName}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Stockist: {analysis.distributor.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAnalysis(null);
                  setEditableRows([]);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#FF6B00] cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Upload Another File</span>
              </button>
            </div>

            {/* Editable Analysis Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-2.5 w-8">
                      <input
                        type="checkbox"
                        title="Select / deselect all pending matched rows"
                        checked={allPendingSelected}
                        disabled={pendingMatchedRows.length === 0}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditableRows((prev) =>
                            prev.map((row) =>
                              !row.synced && row.selectedProductId
                                ? { ...row, selected: checked }
                                : row
                            )
                          );
                        }}
                        className="rounded border-slate-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                      />
                    </th>
                    <th className="p-2.5">Report Product</th>
                    <th className="p-2.5 min-w-[200px]">Matched Catalog Product</th>
                    <th className="p-2.5 text-center">Op / Pur / Sale</th>
                    <th className="p-2.5 text-center">Prev → New Stock</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {editableRows.map((row) => {
                    const hasMatch = Boolean(row.selectedProductId);
                    const duplicateCount =
                      !row.synced && row.selected && row.selectedProductId
                        ? duplicateProductCounts.get(row.selectedProductId) || 0
                        : 0;
                    return (
                      <tr
                        key={row.rowId}
                        className={
                          row.synced
                            ? "bg-emerald-50/40 dark:bg-emerald-950/10"
                            : !hasMatch
                            ? "bg-amber-50/40 dark:bg-amber-950/10"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                        }
                      >
                        <td className="p-2.5">
                          {row.synced ? (
                            <CheckCircle2
                              className="h-4 w-4 text-emerald-600"
                              aria-label="Already synced"
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={row.selected && hasMatch}
                              disabled={!hasMatch}
                              onChange={(e) => updateRow(row.rowId, { selected: e.target.checked })}
                              className="rounded border-slate-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                            />
                          )}
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.rawProductName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {[
                              row.rawSku ? `SKU: ${row.rawSku}` : null,
                              row.batchNumber ? `Batch: ${row.batchNumber}` : null,
                              row.expiryDate ? `Exp: ${row.expiryDate}` : null,
                            ]
                              .filter(Boolean)
                              .join(" • ") || "Detected from report"}
                          </div>
                          {row.rowWarning && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                              ⚠ {row.rowWarning}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5">
                          <select
                            value={row.selectedProductId}
                            disabled={row.synced}
                            onChange={(e) => handleProductSelectionChange(row, e.target.value)}
                            className={`w-full h-8 px-2 rounded-md border text-xs bg-white dark:bg-slate-950 disabled:opacity-70 ${
                              hasMatch
                                ? "border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-slate-100"
                                : "border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            <option value="">— Unmatched (Select Product) —</option>
                            {products.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.brandName || p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                          {row.synced ? (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-semibold">
                              ✓ Synced to live stock
                            </div>
                          ) : row.matchConfidence > 0 && row.selectedProductId === row.matchedProductId ? (
                            <div
                              className={`text-[10px] mt-0.5 font-medium ${
                                row.ambiguous || row.matchConfidence < 80
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {row.ambiguous
                                ? `Ambiguous match (${row.matchConfidence}% — verify product)`
                                : `Auto-matched (${row.matchConfidence}% confidence)`}
                            </div>
                          ) : null}
                          {duplicateCount > 1 && (
                            <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5 font-medium">
                              ℹ {duplicateCount} rows mapped here — stocks will be summed
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {row.openingQty ?? "—"} / {row.purchaseQty ?? "—"} /{" "}
                          <span className="font-bold text-sky-700 dark:text-sky-400">
                            {row.salesQty ?? "—"}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-mono text-[11px] text-slate-400">
                              {row.previousStock}
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                            <input
                              type="number"
                              min={0}
                              max={MAX_CLOSING_STOCK}
                              disabled={row.synced}
                              value={row.editedClosingStock}
                              onChange={(e) =>
                                updateRow(row.rowId, {
                                  editedClosingStock: Math.min(
                                    MAX_CLOSING_STOCK,
                                    Math.max(0, Math.round(Number(e.target.value) || 0))
                                  ),
                                })
                              }
                              className="w-20 h-7 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-center font-mono font-bold text-xs text-slate-900 dark:text-white disabled:opacity-70"
                            />
                          </div>
                          <div className="text-[9px] text-center text-slate-400 mt-0.5">
                            {row.stockCalculationMode === "CLOSING_COLUMN"
                              ? "From Closing Stock"
                              : row.stockCalculationMode === "OPENING_PURCHASE_MINUS_SALES"
                              ? "Op + Pur − Sales"
                              : "Prev Stock − Sales"}
                          </div>
                        </td>
                        <td className="p-2.5 text-right">
                          {getStatusBadge(row.editedClosingStock)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                <strong>{selectedCount}</strong> product row(s) ready to update at{" "}
                <strong>{analysis.distributor.name}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
                {editableRows.some((r) => !r.synced) && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApplyStocks}
                    disabled={selectedCount === 0 || applyMutation.isPending}
                    className="gap-1.5"
                  >
                    {applyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating Stocks…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {analysis.autoApplied
                            ? `Apply Remaining (${selectedCount})`
                            : `Apply & Set Stocks (${selectedCount})`}
                        </span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
