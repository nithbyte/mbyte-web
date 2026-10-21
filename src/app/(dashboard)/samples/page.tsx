"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FlaskConical,
  Package,
  Truck,
  RotateCcw,
  Plus,
  Send,
  AlertTriangle,
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  SlidersHorizontal,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Trash2,
  FileText,
  Layers,
  ArrowRightLeft,
  XCircle,
} from "lucide-react";
import {
  sampleService,
  SampleBatch,
  SampleInventoryBalance,
  SampleLedgerEntry,
  SampleMovementType,
  SampleAckStatus,
  DoctorSampleReceipt,
} from "@/services/sampleService";
import { productService } from "@/services/productService";
import { fieldForceService } from "@/services/fieldForceService";

export default function SampleInventoryPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "balances" | "dispatches" | "mr-inventory" | "batches" | "adjustments" | "ledger" | "reports"
  >("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Data
  const [balances, setBalances] = useState<SampleInventoryBalance[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<SampleLedgerEntry[]>([]);
  const [batches, setBatches] = useState<SampleBatch[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [mrs, setMrs] = useState<any[]>([]);
  const [discrepancies, setDiscrepancies] = useState<SampleLedgerEntry[]>([]);
  const [reportsSummary, setReportsSummary] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHolder, setFilterHolder] = useState<"ALL" | "WAREHOUSE" | "MR">("ALL");
  const [filterMovementType, setFilterMovementType] = useState<string>("ALL");
  const [filterDispatchStatus, setFilterDispatchStatus] = useState<string>("ALL");
  const [selectedMrId, setSelectedMrId] = useState<string>("");

  // Modals
  const [isRegisterBatchOpen, setIsRegisterBatchOpen] = useState(false);
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<DoctorSampleReceipt | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [targetDiscrepancyEntry, setTargetDiscrepancyEntry] = useState<SampleLedgerEntry | null>(null);

  // Form States
  const [batchForm, setBatchForm] = useState({
    productId: "",
    batchNumber: "",
    expiryDate: "",
    manufacturingDate: "",
    initialStockQuantity: 100,
  });

  const [receiveForm, setReceiveForm] = useState({
    batchId: "",
    quantity: 50,
    reference: "",
    receivedDate: "",
    notes: "",
  });

  // Multi-item dispatch form
  const [dispatchForm, setDispatchForm] = useState<{
    targetMrId: string;
    reference: string;
    notes: string;
    items: { batchId: string; quantity: number }[];
  }>({
    targetMrId: "",
    reference: "",
    notes: "",
    items: [{ batchId: "", quantity: 10 }],
  });

  const [adjustForm, setAdjustForm] = useState({
    batchId: "",
    mrId: "",
    movementType: "ADJUSTMENT_DAMAGE" as SampleMovementType,
    quantity: 1,
    notes: "",
  });

  const [resolveForm, setResolveForm] = useState<{
    action: "RETURN_TO_WAREHOUSE" | "WRITE_OFF_DAMAGE";
    notes: string;
  }>({
    action: "RETURN_TO_WAREHOUSE",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(0);

  // Initial Data Fetch
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedBalances, fetchedLedger, fetchedBatches, fetchedProducts, fetchedMRs, fetchedDiscs, fetchedSummary] =
        await Promise.all([
          sampleService.getBalances().catch(() => []),
          sampleService.getLedger({ limit: 200 }).catch(() => ({ items: [], total: 0 })),
          sampleService.getBatches().catch(() => []),
          productService.getProducts().catch(() => []),
          fieldForceService.getMRList().catch(() => []),
          sampleService.getDiscrepancies().catch(() => []),
          sampleService.getReportsSummary().catch(() => null),
        ]);

      setBalances(fetchedBalances);
      setLedgerEntries(fetchedLedger.items);
      setBatches(fetchedBatches);
      setProducts(fetchedProducts);
      setMrs(fetchedMRs);
      setDiscrepancies(fetchedDiscs);
      setReportsSummary(fetchedSummary);

      if (fetchedMRs.length > 0 && !selectedMrId) {
        setSelectedMrId(fetchedMRs[0].id);
      }
    } catch (err: any) {
      console.warn("Failed to load sample inventory data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMrId]);

  useEffect(() => {
    setIsMounted(true);
    setNowTimestamp(Date.now());
    loadData();
  }, [loadData]);

  // Derived KPI Stats
  const kpiStats = useMemo(() => {
    let warehouseStock = 0;
    let mrStock = 0;
    let inTransitStock = 0;

    balances.forEach((b) => {
      if (b.isWarehouse) {
        warehouseStock += b.quantity;
      } else {
        mrStock += b.quantity;
        inTransitStock += b.inTransitQuantity;
      }
    });

    const now = nowTimestamp;
    const ninetyDays = now + 90 * 86400000;

    const nearExpiryBatches =
      now > 0
        ? batches.filter((b) => {
            const exp = new Date(b.expiryDate).getTime();
            return exp > now && exp <= ninetyDays;
          })
        : [];

    const lowStockBatches = balances.filter((b) => b.isWarehouse && b.quantity > 0 && b.quantity <= 25);

    const pendingDispatches = ledgerEntries.filter(
      (e) => e.movementType === "DISPATCH_TO_MR" && e.acknowledgmentStatus === "PENDING"
    );

    return {
      warehouseStock,
      mrStock,
      inTransitStock,
      totalAccountedStock: warehouseStock + mrStock + inTransitStock,
      totalBatches: batches.length,
      nearExpiryBatches,
      lowStockBatches,
      pendingDispatchesCount: pendingDispatches.length,
      discrepanciesCount: discrepancies.length,
    };
  }, [balances, batches, ledgerEntries, discrepancies, nowTimestamp]);

  // Dispatches List derived from ledger
  const dispatchLedgerItems = useMemo(() => {
    return ledgerEntries.filter((e) => e.movementType === "DISPATCH_TO_MR");
  }, [ledgerEntries]);

  const filteredDispatches = useMemo(() => {
    return dispatchLedgerItems.filter((e) => {
      if (filterDispatchStatus !== "ALL" && e.acknowledgmentStatus !== filterDispatchStatus) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const brandMatch = e.product?.brandName?.toLowerCase().includes(term);
        const batchMatch = e.batch?.batchNumber?.toLowerCase().includes(term);
        const mrMatch =
          e.targetMr?.user?.firstName?.toLowerCase().includes(term) ||
          e.targetMr?.user?.lastName?.toLowerCase().includes(term);
        const noteMatch = e.notes?.toLowerCase().includes(term);
        if (!brandMatch && !batchMatch && !mrMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [dispatchLedgerItems, filterDispatchStatus, searchTerm]);

  // MR Inventory breakdown
  const mrSpecificBalances = useMemo(() => {
    if (!selectedMrId) return [];
    return balances.filter((b) => b.mrId === selectedMrId && !b.isWarehouse);
  }, [balances, selectedMrId]);

  const mrSpecificMovements = useMemo(() => {
    if (!selectedMrId) return [];
    return ledgerEntries.filter((e) => e.targetMrId === selectedMrId || e.sourceMrId === selectedMrId);
  }, [ledgerEntries, selectedMrId]);

  const selectedMrDetails = useMemo(() => {
    return mrs.find((m) => m.id === selectedMrId);
  }, [mrs, selectedMrId]);

  // Adjustments & Returns List
  const adjustmentsAndReturns = useMemo(() => {
    return ledgerEntries.filter((e) =>
      [
        "RETURN_TO_COMPANY",
        "ADJUSTMENT_DAMAGE",
        "ADJUSTMENT_EXPIRED",
        "RECONCILIATION_CORRECTION",
      ].includes(e.movementType)
    );
  }, [ledgerEntries]);

  // Filtered Balances
  const filteredBalances = useMemo(() => {
    return balances.filter((b) => {
      if (filterHolder === "WAREHOUSE" && !b.isWarehouse) return false;
      if (filterHolder === "MR" && b.isWarehouse) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const brandMatch = b.product?.brandName?.toLowerCase().includes(term);
        const batchMatch = b.batch?.batchNumber?.toLowerCase().includes(term);
        const mrMatch =
          b.mr?.user?.firstName?.toLowerCase().includes(term) ||
          b.mr?.user?.lastName?.toLowerCase().includes(term);
        if (!brandMatch && !batchMatch && !mrMatch) return false;
      }

      return true;
    });
  }, [balances, filterHolder, searchTerm]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      if (filterMovementType !== "ALL" && entry.movementType !== filterMovementType) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const brandMatch = entry.product?.brandName?.toLowerCase().includes(term);
        const batchMatch = entry.batch?.batchNumber?.toLowerCase().includes(term);
        const docMatch = entry.doctor?.name?.toLowerCase().includes(term);
        const actorMatch = entry.performedBy?.firstName?.toLowerCase().includes(term);
        if (!brandMatch && !batchMatch && !docMatch && !actorMatch) return false;
      }
      return true;
    });
  }, [ledgerEntries, filterMovementType, searchTerm]);

  // Form Handlers
  const handleRegisterBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.productId || !batchForm.batchNumber || !batchForm.expiryDate) {
      setStatusMessage({ type: "error", text: "Please fill in all required batch fields." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await sampleService.createBatch({
        productId: batchForm.productId,
        batchNumber: batchForm.batchNumber.trim(),
        expiryDate: batchForm.expiryDate,
        manufacturingDate: batchForm.manufacturingDate || undefined,
        initialStockQuantity: Number(batchForm.initialStockQuantity) || 0,
      });

      setStatusMessage({ type: "success", text: `Batch ${batchForm.batchNumber} registered successfully.` });
      setIsRegisterBatchOpen(false);
      setBatchForm({
        productId: "",
        batchNumber: "",
        expiryDate: "",
        manufacturingDate: "",
        initialStockQuantity: 100,
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to register sample batch." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.batchId || receiveForm.quantity <= 0) {
      setStatusMessage({ type: "error", text: "Please select a batch and enter a valid quantity." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await sampleService.receiveStock({
        batchId: receiveForm.batchId,
        quantity: Number(receiveForm.quantity),
        notes: [
          receiveForm.reference ? `Ref: ${receiveForm.reference}` : null,
          receiveForm.receivedDate ? `Date: ${receiveForm.receivedDate}` : null,
          receiveForm.notes || null,
        ]
          .filter(Boolean)
          .join(" | "),
      });

      setStatusMessage({ type: "success", text: "Stock received into warehouse ledger." });
      setIsReceiveStockOpen(false);
      setReceiveForm({ batchId: "", quantity: 50, reference: "", receivedDate: "", notes: "" });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to receive warehouse stock." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchForm.targetMrId) {
      setStatusMessage({ type: "error", text: "Please select a target Medical Representative." });
      return;
    }

    const validItems = dispatchForm.items.filter((item) => item.batchId && item.quantity > 0);
    if (validItems.length === 0) {
      setStatusMessage({ type: "error", text: "Please specify at least one batch item with quantity > 0." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await sampleService.dispatchMultiToMr({
        targetMrId: dispatchForm.targetMrId,
        reference: dispatchForm.reference || undefined,
        items: validItems,
        notes: dispatchForm.notes || undefined,
      });

      setStatusMessage({
        type: "success",
        text: `Consignment dispatched successfully to MR. Items placed in in-transit custody pending physical acknowledgment.`,
      });
      setIsDispatchOpen(false);
      setDispatchForm({
        targetMrId: "",
        reference: "",
        notes: "",
        items: [{ batchId: "", quantity: 10 }],
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to dispatch samples." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.batchId || adjustForm.quantity <= 0 || !adjustForm.notes) {
      setStatusMessage({ type: "error", text: "Please enter batch, quantity, and audit justification." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await sampleService.adjustStock({
        batchId: adjustForm.batchId,
        mrId: adjustForm.mrId || undefined,
        movementType: adjustForm.movementType,
        quantity: Number(adjustForm.quantity),
        notes: adjustForm.notes,
      });

      setStatusMessage({ type: "success", text: "Inventory adjusted and movement ledger recorded." });
      setIsAdjustOpen(false);
      setAdjustForm({
        batchId: "",
        mrId: "",
        movementType: "ADJUSTMENT_DAMAGE",
        quantity: 1,
        notes: "",
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to adjust stock." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveDiscrepancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDiscrepancyEntry || !resolveForm.notes) {
      setStatusMessage({ type: "error", text: "Audit notes are required to resolve delivery discrepancies." });
      return;
    }

    setIsSubmitting(true);
    try {
      await sampleService.resolveDiscrepancy({
        ledgerEntryId: targetDiscrepancyEntry.id,
        action: resolveForm.action,
        notes: resolveForm.notes,
      });

      setStatusMessage({
        type: "success",
        text: `Discrepancy successfully resolved via ${resolveForm.action.replace(/_/g, " ")}.`,
      });
      setIsResolveModalOpen(false);
      setTargetDiscrepancyEntry(null);
      setResolveForm({ action: "RETURN_TO_WAREHOUSE", notes: "" });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to resolve discrepancy." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewReceipt = async (visitId: string) => {
    try {
      const receipt = await sampleService.getDoctorReceipt(visitId);
      if (receipt) {
        setSelectedReceipt(receipt);
        setIsReceiptModalOpen(true);
      } else {
        alert("No doctor signature receipt found for this visit record.");
      }
    } catch {
      alert("Failed to load doctor receipt.");
    }
  };

  // CSV Export utility
  const handleExportCSV = (reportType: "balances" | "ledger" | "dispatches") => {
    let rows: Record<string, any>[] = [];
    let filename = `sample_inventory_${reportType}`;

    if (reportType === "balances") {
      rows = balances.map((b) => ({
        Product: b.product?.brandName || "Unknown",
        Generic: b.product?.genericName || "",
        SKU: b.product?.sku || "",
        BatchNumber: b.batch?.batchNumber || "",
        ExpiryDate: b.batch?.expiryDate ? new Date(b.batch.expiryDate).toLocaleDateString() : "",
        Location: b.isWarehouse ? "Central Warehouse" : `${b.mr?.user?.firstName} ${b.mr?.user?.lastName}`,
        Territory: b.mr?.territory?.name || "Warehouse",
        OnHandQuantity: b.quantity,
        InTransitQuantity: b.inTransitQuantity,
      }));
    } else if (reportType === "dispatches") {
      rows = dispatchLedgerItems.map((d) => ({
        Date: new Date(d.createdAt).toISOString(),
        TargetMR: `${d.targetMr?.user?.firstName || ""} ${d.targetMr?.user?.lastName || ""}`,
        Product: d.product?.brandName || "",
        Batch: d.batch?.batchNumber || "",
        Quantity: d.quantity,
        Status: d.acknowledgmentStatus,
        Notes: d.notes || "",
      }));
    } else {
      rows = ledgerEntries.map((l) => ({
        Timestamp: new Date(l.createdAt).toISOString(),
        MovementType: l.movementType,
        Product: l.product?.brandName || "",
        Batch: l.batch?.batchNumber || "",
        Quantity: l.quantity,
        BalanceBefore: l.balanceBefore,
        BalanceAfter: l.balanceAfter,
        Doctor: l.doctor?.name || "",
        PerformedBy: `${l.performedBy?.firstName || ""} ${l.performedBy?.lastName || ""}`,
        Notes: l.notes || "",
      }));
    }

    if (rows.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const val = row[header] ?? "";
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMovementBadgeVariant = (
    type: SampleMovementType
  ): "default" | "success" | "warning" | "destructive" | "secondary" => {
    switch (type) {
      case "COMPANY_RECEIPT":
      case "MR_RECEIPT_ACKNOWLEDGED":
        return "success";
      case "DISPATCH_TO_MR":
        return "warning";
      case "DISTRIBUTED_TO_DOCTOR":
        return "default";
      case "RETURN_TO_COMPANY":
        return "secondary";
      case "ADJUSTMENT_DAMAGE":
      case "ADJUSTMENT_EXPIRED":
        return "destructive";
      default:
        return "default";
    }
  };

  const getAckBadgeVariant = (status: SampleAckStatus) => {
    switch (status) {
      case "ACKNOWLEDGED":
        return "success";
      case "PARTIALLY_ACKNOWLEDGED":
        return "warning";
      case "REJECTED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sample & Input Management"
        description="Authoritative pharmaceutical sample custody, allocation, field acknowledgment, doctor visit distribution receipts, discrepancy routing, and immutable inventory movement audit."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusMessage(null);
                setIsReceiveStockOpen(true);
              }}
            >
              <Package className="w-4 h-4 mr-2" />
              Receive Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusMessage(null);
                setIsAdjustOpen(true);
              }}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Stock Adjustment
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                setStatusMessage(null);
                setIsDispatchOpen(true);
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Dispatch to MR
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setStatusMessage(null);
                setIsRegisterBatchOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Batch Lot
            </Button>
          </div>
        }
      />

      {statusMessage && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Warehouse Stock
              </p>
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 mt-1">
                {kpiStats.warehouseStock.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Central warehouse available</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                In-Transit Stock
              </p>
              <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1">
                {kpiStats.inTransitStock.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kpiStats.pendingDispatchesCount} pending MR confirmations
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
              <Truck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                MR Field Custody
              </p>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                {kpiStats.mrStock.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">On-hand across MR team</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <User className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Accounted Stock
              </p>
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400 mt-1">
                {kpiStats.totalAccountedStock.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kpiStats.discrepanciesCount > 0 ? (
                  <span className="text-red-500 font-semibold">{kpiStats.discrepanciesCount} discrepancies</span>
                ) : (
                  "Zero balance drift"
                )}
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NAVIGATION TABS (ALL 8 REQUIRED SECTIONS) */}
      <div className="flex border-b border-border/60 gap-2 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Inventory Overview", icon: Layers, count: null },
          { id: "balances", label: "Custody Balances", icon: Package, count: balances.length },
          { id: "dispatches", label: "Dispatch Tracking", icon: Truck, count: dispatchLedgerItems.length },
          { id: "mr-inventory", label: "MR Field Inventory", icon: User, count: mrs.length },
          { id: "batches", label: "Product & Batch Catalog", icon: FlaskConical, count: batches.length },
          { id: "adjustments", label: "Returns & Adjustments", icon: SlidersHorizontal, count: adjustmentsAndReturns.length },
          { id: "ledger", label: "Movement Audit Ledger", icon: FileCheck, count: ledgerEntries.length },
          { id: "reports", label: "Inventory Reports & Export", icon: FileSpreadsheet, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== null && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: INVENTORY OVERVIEW & ALERTS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* CRITICAL ALERTS BANNER */}
          {(kpiStats.nearExpiryBatches.length > 0 || kpiStats.lowStockBatches.length > 0 || discrepancies.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kpiStats.nearExpiryBatches.length > 0 && (
                <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Near-Expiry Warning ({kpiStats.nearExpiryBatches.length} Lots)
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        Batches expiring within 90 days. Prioritize allocation or cycle return.
                      </p>
                      <button
                        onClick={() => setActiveTab("reports")}
                        className="text-xs font-semibold text-amber-800 underline mt-1.5"
                      >
                        View affected lots →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {kpiStats.lowStockBatches.length > 0 && (
                <Card className="border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                        Low Central Stock ({kpiStats.lowStockBatches.length} Batches)
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                        Central warehouse balance is ≤ 25 packs. Ingest new manufacturing receipts.
                      </p>
                      <button
                        onClick={() => setIsReceiveStockOpen(true)}
                        className="text-xs font-semibold text-blue-800 underline mt-1.5"
                      >
                        Receive stock now →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {discrepancies.length > 0 && (
                <Card className="border-red-300 bg-red-50/50 dark:bg-red-950/20">
                  <CardContent className="p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-red-900 dark:text-red-300">
                        Discrepancies Pending Resolution ({discrepancies.length})
                      </h4>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                        Field delivery rejections or partial acknowledgments awaiting manager action.
                      </p>
                      <button
                        onClick={() => setActiveTab("dispatches")}
                        className="text-xs font-semibold text-red-800 underline mt-1.5"
                      >
                        Review & resolve →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* RECENT INVENTORY TRANSACTIONS */}
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Recent Inventory Ledger Movements
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest 10 immutable stock transactions across warehouse, MRs, and physicians.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("ledger")} className="text-xs">
                View Full Ledger →
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                    <TableHead className="text-xs font-semibold">Movement</TableHead>
                    <TableHead className="text-xs font-semibold">Product & Batch</TableHead>
                    <TableHead className="text-xs font-semibold">Entity Involved</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Qty</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Balance</TableHead>
                    <TableHead className="text-xs font-semibold">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.slice(0, 10).map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getMovementBadgeVariant(entry.movementType)} className="text-[10px]">
                          {entry.movementType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-semibold text-foreground">{entry.product?.brandName}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">Lot: {entry.batch?.batchNumber}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.doctor ? (
                          <span className="font-semibold text-foreground">Dr. {entry.doctor.name}</span>
                        ) : entry.targetMr ? (
                          <span>MR: {entry.targetMr.user?.firstName} {entry.targetMr.user?.lastName}</span>
                        ) : entry.sourceMr ? (
                          <span>Returned from MR: {entry.sourceMr.user?.firstName}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Central Warehouse</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs">
                        {entry.quantity} packs
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {entry.balanceBefore} → <span className="font-semibold text-foreground">{entry.balanceAfter}</span>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground max-w-xs truncate">
                        {entry.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: CUSTODY BALANCES */}
      {activeTab === "balances" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Holding Location:</span>
              {(["ALL", "WAREHOUSE", "MR"] as const).map((holder) => (
                <Button
                  key={holder}
                  variant={filterHolder === holder ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs px-2.5"
                  onClick={() => setFilterHolder(holder)}
                >
                  {holder === "ALL" ? "All Locations" : holder === "WAREHOUSE" ? "Central Warehouse" : "MR Field Custody"}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter product, batch or MR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExportCSV("balances")} className="h-8 text-xs">
                <Download className="w-3.5 h-3.5 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>

          <Card className="shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Product & Brand</TableHead>
                    <TableHead className="text-xs font-semibold">Batch / Lot No.</TableHead>
                    <TableHead className="text-xs font-semibold">Expiry Date</TableHead>
                    <TableHead className="text-xs font-semibold">Holding Location / Custody</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Available On-Hand</TableHead>
                    <TableHead className="text-xs font-semibold text-right">In-Transit</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Last Movement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-8">
                        <EmptyState
                          icon={Package}
                          title="No inventory balances found"
                          description="Try adjusting your filter or receive stock into the warehouse."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBalances.map((b) => {
                      const isExpiringSoon =
                        nowTimestamp > 0 &&
                        b.batch?.expiryDate &&
                        new Date(b.batch.expiryDate).getTime() < nowTimestamp + 90 * 86400000;
                      return (
                        <TableRow key={b.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {b.product?.brandName || "Product"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {b.product?.genericName} • {b.product?.packSize}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded">
                              {b.batch?.batchNumber || "UNSPECIFIED"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-foreground">
                                {b.batch?.expiryDate ? new Date(b.batch.expiryDate).toLocaleDateString() : "N/A"}
                              </span>
                              {isExpiringSoon && (
                                <Badge variant="warning" className="text-[10px] py-0 px-1">
                                  &lt; 90d
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {b.isWarehouse ? (
                              <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                Central Warehouse
                              </Badge>
                            ) : (
                              <div>
                                <p className="text-xs font-medium text-foreground">
                                  {b.mr?.user ? `${b.mr.user.firstName} ${b.mr.user.lastName}` : b.mr?.employeeCode}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{b.mr?.territory?.name || "Territory"}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-xs font-bold ${b.quantity > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                              {b.quantity.toLocaleString()} packs
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {b.inTransitQuantity > 0 ? (
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                +{b.inTransitQuantity} in-transit
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {new Date(b.updatedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: DISPATCH & ACKNOWLEDGMENT TRACKING */}
      {activeTab === "dispatches" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium mr-1">Ack Status:</span>
              {(["ALL", "PENDING", "ACKNOWLEDGED", "PARTIALLY_ACKNOWLEDGED", "REJECTED"] as const).map((st) => (
                <Button
                  key={st}
                  variant={filterDispatchStatus === st ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs px-2.5"
                  onClick={() => setFilterDispatchStatus(st)}
                >
                  {st.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
                onClick={() => setIsDispatchOpen(true)}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                New Dispatch
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportCSV("dispatches")} className="h-8 text-xs">
                <Download className="w-3.5 h-3.5 mr-1" />
                Export
              </Button>
            </div>
          </div>

          <Card className="shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Dispatch Date</TableHead>
                    <TableHead className="text-xs font-semibold">Target MR & Territory</TableHead>
                    <TableHead className="text-xs font-semibold">Product & Lot</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Dispatched Qty</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Delivery Notes & Discrepancies</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDispatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-8">
                        <EmptyState
                          icon={Truck}
                          title="No dispatches found"
                          description="Dispatches sent to Medical Representatives will appear here."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDispatches.map((d) => {
                      const hasDiscrepancy =
                        d.acknowledgmentStatus === "REJECTED" ||
                        d.acknowledgmentStatus === "PARTIALLY_ACKNOWLEDGED" ||
                        d.notes?.includes("DISCREPANCY");
                      const isResolved = d.notes?.includes("RESOLVED");

                      return (
                        <TableRow key={d.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {new Date(d.createdAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <p className="text-xs font-semibold text-foreground">
                              {d.targetMr?.user?.firstName} {d.targetMr?.user?.lastName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{d.targetMr?.territory?.name || "Territory"}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs font-semibold text-foreground">{d.product?.brandName}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">Lot: {d.batch?.batchNumber}</p>
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-foreground">
                            {d.quantity} packs
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getAckBadgeVariant(d.acknowledgmentStatus)} className="text-[10px]">
                              {d.acknowledgmentStatus.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-sm">
                            <p className="text-foreground truncate">{d.notes || "Standard consignment allocation"}</p>
                            {d.acknowledgedAt && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Confirmed: {new Date(d.acknowledgedAt).toLocaleString()}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasDiscrepancy && !isResolved ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => {
                                  setTargetDiscrepancyEntry(d);
                                  setIsResolveModalOpen(true);
                                }}
                              >
                                Resolve Discrepancy
                              </Button>
                            ) : isResolved ? (
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                                Resolved
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: MR FIELD INVENTORY BREAKDOWN */}
      {activeTab === "mr-inventory" && (
        <div className="space-y-4">
          <Card className="p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[280px]">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Select Medical Representative:
                </label>
                <select
                  value={selectedMrId}
                  onChange={(e) => setSelectedMrId(e.target.value)}
                  className="w-full h-9 text-xs rounded-md border border-input bg-background px-3"
                >
                  {mrs.map((mr) => (
                    <option key={mr.id} value={mr.id}>
                      {mr.name} ({mr.employeeCode}) — {mr.territoryName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMrDetails && (
                <div className="flex items-center gap-6 pt-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Assigned Territory</span>
                    <p className="text-sm font-bold text-foreground">{selectedMrDetails.territoryName || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Current Available Stock</span>
                    <p className="text-sm font-bold text-emerald-600">
                      {mrSpecificBalances.reduce((sum, b) => sum + b.quantity, 0)} packs
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">In-Transit Delivery</span>
                    <p className="text-sm font-bold text-amber-600">
                      {mrSpecificBalances.reduce((sum, b) => sum + b.inTransitQuantity, 0)} packs
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold">Active Sample Batches in MR Custody</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Product</TableHead>
                    <TableHead className="text-xs font-semibold">Batch Number</TableHead>
                    <TableHead className="text-xs font-semibold">Expiry Date</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Available On-Hand</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Pending Acknowledgment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrSpecificBalances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-6 text-center text-xs text-muted-foreground">
                        No sample stock currently held by this representative.
                      </TableCell>
                    </TableRow>
                  ) : (
                    mrSpecificBalances.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs font-semibold">{b.product?.brandName}</TableCell>
                        <TableCell className="text-xs font-mono">{b.batch?.batchNumber}</TableCell>
                        <TableCell className="text-xs">
                          {b.batch?.expiryDate ? new Date(b.batch.expiryDate).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-emerald-600">
                          {b.quantity} packs
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-amber-600">
                          {b.inTransitQuantity > 0 ? `+${b.inTransitQuantity}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold">Representative Handover & Distribution History</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Movement</TableHead>
                    <TableHead className="text-xs font-semibold">Product & Batch</TableHead>
                    <TableHead className="text-xs font-semibold">Doctor / Entity</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Quantity</TableHead>
                    <TableHead className="text-xs font-semibold">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrSpecificMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                        No transactions recorded for this representative.
                      </TableCell>
                    </TableRow>
                  ) : (
                    mrSpecificMovements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getMovementBadgeVariant(m.movementType)} className="text-[10px]">
                            {m.movementType.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {m.product?.brandName} ({m.batch?.batchNumber})
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {m.doctor ? `Dr. ${m.doctor.name}` : "Warehouse Return / Dispatch"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold">{m.quantity} packs</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{m.notes || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: BATCHES MASTER REGISTRY */}
      {activeTab === "batches" && (
        <Card className="shadow-xs overflow-hidden">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-500" />
                Product & Sample Batch Master Catalog
              </CardTitle>
              <CardDescription className="text-xs">
                Manufacturing lots registered with expiration dates, manufacturing dates, and active compliance status.
              </CardDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
              onClick={() => setIsRegisterBatchOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Register Batch Lot
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">Batch / Lot Number</TableHead>
                  <TableHead className="text-xs font-semibold">Product Name</TableHead>
                  <TableHead className="text-xs font-semibold">SKU</TableHead>
                  <TableHead className="text-xs font-semibold">Manufacturing Date</TableHead>
                  <TableHead className="text-xs font-semibold">Expiration Date</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Registered On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-8">
                      <EmptyState
                        icon={FlaskConical}
                        title="No batches registered"
                        description="Register a new pharmaceutical sample batch using the button above."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => {
                    const isExpired = nowTimestamp > 0 && new Date(batch.expiryDate).getTime() < nowTimestamp;
                    return (
                      <TableRow key={batch.id} className="hover:bg-muted/30">
                        <TableCell>
                          <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-1 rounded">
                            {batch.batchNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-semibold text-foreground">{batch.product?.brandName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {batch.product?.genericName} • {batch.product?.dosageForm}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{batch.product?.sku}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {isExpired ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Expired
                            </Badge>
                          ) : batch.isActive ? (
                            <Badge variant="success" className="text-[10px]">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(batch.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* TAB 6: RETURNS & ADJUSTMENTS */}
      {activeTab === "adjustments" && (
        <Card className="shadow-xs overflow-hidden">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                Returns, Damage Adjustments & Audit Reconciliations
              </CardTitle>
              <CardDescription className="text-xs">
                Audited reversals and compensating movements for damaged packs, expired stock, and physical audit corrections.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsAdjustOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Adjustment
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Adjustment Type</TableHead>
                  <TableHead className="text-xs font-semibold">Product & Lot</TableHead>
                  <TableHead className="text-xs font-semibold">Party / Custodian</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Quantity</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Balance Impact</TableHead>
                  <TableHead className="text-xs font-semibold">Audit Justification Notes</TableHead>
                  <TableHead className="text-xs font-semibold">Audited By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustmentsAndReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center text-xs text-muted-foreground">
                      No stock returns or adjustments recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustmentsAndReturns.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getMovementBadgeVariant(entry.movementType)} className="text-[10px]">
                          {entry.movementType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {entry.product?.brandName} ({entry.batch?.batchNumber})
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.sourceMr ? `MR: ${entry.sourceMr.user?.firstName} ${entry.sourceMr.user?.lastName}` : "Central Warehouse"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-red-600">
                        -{entry.quantity} packs
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {entry.balanceBefore} → {entry.balanceAfter}
                      </TableCell>
                      <TableCell className="text-xs text-foreground max-w-sm truncate">{entry.notes}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.performedBy?.firstName} {entry.performedBy?.lastName}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* TAB 7: MOVEMENT AUDIT LEDGER */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Filter Movement:</span>
              <select
                value={filterMovementType}
                onChange={(e) => setFilterMovementType(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2.5"
              >
                <option value="ALL">All Movements</option>
                <option value="COMPANY_RECEIPT">Central Warehouse Receipt</option>
                <option value="DISPATCH_TO_MR">Dispatched to MR</option>
                <option value="MR_RECEIPT_ACKNOWLEDGED">MR Acknowledged Receipt</option>
                <option value="DISTRIBUTED_TO_DOCTOR">Handed to Doctor</option>
                <option value="RETURN_TO_COMPANY">Returned to Warehouse</option>
                <option value="ADJUSTMENT_DAMAGE">Damage Write-off</option>
                <option value="ADJUSTMENT_EXPIRED">Expired Write-off</option>
                <option value="RECONCILIATION_CORRECTION">Audit Reconciliation</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter product, batch or doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExportCSV("ledger")} className="h-8 text-xs">
                <Download className="w-3.5 h-3.5 mr-1" />
                Export Ledger
              </Button>
            </div>
          </div>

          <Card className="shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                    <TableHead className="text-xs font-semibold">Movement Type</TableHead>
                    <TableHead className="text-xs font-semibold">Product & Lot</TableHead>
                    <TableHead className="text-xs font-semibold">Entity / Recipient</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Qty</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Balance Change</TableHead>
                    <TableHead className="text-xs font-semibold">Recorded By & Notes</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Receipt Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLedger.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-8">
                        <EmptyState
                          icon={FileCheck}
                          title="No movement ledger entries found"
                          description="Transactions will appear here as soon as samples are dispatched, acknowledged, or distributed."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLedger.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getMovementBadgeVariant(entry.movementType)} className="text-[11px] whitespace-nowrap">
                            {entry.movementType.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-semibold text-foreground">{entry.product?.brandName}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">Lot: {entry.batch?.batchNumber}</p>
                        </TableCell>
                        <TableCell className="text-xs">
                          {entry.doctor ? (
                            <div>
                              <span className="font-semibold text-foreground">Dr. {entry.doctor.name}</span>
                              <p className="text-[10px] text-muted-foreground">{entry.doctor.clinicName}</p>
                            </div>
                          ) : entry.targetMr ? (
                            <span>MR: {entry.targetMr.user?.firstName} {entry.targetMr.user?.lastName}</span>
                          ) : entry.sourceMr ? (
                            <span>Returned from: {entry.sourceMr.user?.firstName}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Central Warehouse</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-foreground">
                          {entry.quantity} packs
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          <span className="text-muted-foreground">{entry.balanceBefore}</span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span className="font-semibold text-foreground">{entry.balanceAfter}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="text-foreground">
                            {entry.performedBy ? `${entry.performedBy.firstName} ${entry.performedBy.lastName}` : "System"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-xs">{entry.notes || "—"}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.visitId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                              onClick={() => handleViewReceipt(entry.visitId!)}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              View Signature
                            </Button>
                          ) : entry.acknowledgmentStatus === "PENDING" ? (
                            <Badge variant="warning" className="text-[10px]">Pending MR Ack</Badge>
                          ) : entry.acknowledgmentStatus === "ACKNOWLEDGED" ? (
                            <Badge variant="success" className="text-[10px]">Verified</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">Rejected</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 8: INVENTORY REPORTS & CSV EXPORT */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground">Pharmaceutical Sample Inventory Summary Report</h3>
              <p className="text-xs text-muted-foreground">
                Consolidated balance breakdown, batch expiries, physician distribution volumes, and audit trails.
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              onClick={() => handleExportCSV("balances")}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download Full Inventory CSV
            </Button>
          </div>

          {/* PRODUCT-WISE STOCK SUMMARY */}
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold">Stock Position by Product & SKU</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Product Name</TableHead>
                    <TableHead className="text-xs font-semibold">SKU</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Central Warehouse Qty</TableHead>
                    <TableHead className="text-xs font-semibold text-right">In-Transit Qty</TableHead>
                    <TableHead className="text-xs font-semibold text-right">MR Field Custody Qty</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Accounted Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const prodBalances = balances.filter((b) => b.productId === p.id);
                    let wh = 0;
                    let it = 0;
                    let mr = 0;
                    prodBalances.forEach((b) => {
                      if (b.isWarehouse) wh += b.quantity;
                      else {
                        mr += b.quantity;
                        it += b.inTransitQuantity;
                      }
                    });
                    const total = wh + it + mr;

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {p.name || p.brandName}
                          <span className="text-[11px] text-muted-foreground block font-normal">{p.genericName}</span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{p.sku}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-blue-600">{wh} packs</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-amber-600">{it} packs</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-emerald-600">{mr} packs</TableCell>
                        <TableCell className="text-right text-xs font-bold text-foreground">{total} packs</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* NEAR EXPIRY BATCH AUDIT */}
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Near-Expiry Batch Lots (Expiring within 90 days)
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Product</TableHead>
                    <TableHead className="text-xs font-semibold">Batch Lot</TableHead>
                    <TableHead className="text-xs font-semibold">Expiry Date</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Days Remaining</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpiStats.nearExpiryBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-6 text-center text-xs text-muted-foreground">
                        No batch lots expiring within the next 90 days. All active stock is fresh.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kpiStats.nearExpiryBatches.map((b) => {
                      const daysLeft = Math.ceil(
                        (new Date(b.expiryDate).getTime() - (nowTimestamp || Date.now())) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="text-xs font-semibold">{b.product?.brandName}</TableCell>
                          <TableCell className="text-xs font-mono font-bold">{b.batchNumber}</TableCell>
                          <TableCell className="text-xs">{new Date(b.expiryDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-amber-600">
                            {daysLeft} days
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="warning" className="text-[10px]">Near Expiry</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: REGISTER BATCH */}
      <Modal
        isOpen={isRegisterBatchOpen}
        onClose={() => setIsRegisterBatchOpen(false)}
        title="Register New Sample Batch"
        description="Add a compliant sample production lot with batch number and expiration date."
      >
        <form onSubmit={handleRegisterBatch} className="space-y-4 pt-2">
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
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRegisterBatchOpen(false)}>
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

      {/* MODAL 2: RECEIVE WAREHOUSE STOCK */}
      <Modal
        isOpen={isReceiveStockOpen}
        onClose={() => setIsReceiveStockOpen(false)}
        title="Receive Central Warehouse Stock"
        description="Ingest fresh consignment stock from manufacturing plants into company central inventory."
      >
        <form onSubmit={handleReceiveStock} className="space-y-4 pt-2">
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
            <Button type="button" variant="outline" size="sm" onClick={() => setIsReceiveStockOpen(false)}>
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

      {/* MODAL 3: DISPATCH TO MR (MULTI-ITEM CAPABLE) */}
      <Modal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        title="Dispatch Samples to Medical Representative"
        description="Allocate warehouse samples to an MR. Samples move into in-transit custody until physically acknowledged."
        maxWidth="xl"
      >
        <form onSubmit={handleDispatch} className="space-y-4 pt-2">
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
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDispatchOpen(false)}>
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

      {/* MODAL 4: INVENTORY ADJUSTMENT */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Sample Stock Adjustment"
        description="Record inventory write-offs for damaged, expired, or audited physical stock discrepancies."
      >
        <form onSubmit={handleAdjust} className="space-y-4 pt-2">
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
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? "Adjusting..." : "Record Adjustment"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: RESOLVE DISCREPANCY */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Delivery Discrepancy"
        description="Authorized resolution for damaged, missing, or rejected sample dispatches."
      >
        {targetDiscrepancyEntry && (
          <form onSubmit={handleResolveDiscrepancy} className="space-y-4 pt-2">
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
              <Button type="button" variant="outline" size="sm" onClick={() => setIsResolveModalOpen(false)}>
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

      {/* MODAL 6: DOCTOR RECEIPT INSPECTION */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Physician Sample Receipt Verification"
        description="Cryptographic and digital audit evidence of physician physical handover."
      >
        {selectedReceipt ? (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-muted/40 rounded-lg space-y-2 border">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Dr. {selectedReceipt.doctor?.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedReceipt.doctor?.clinicName} • {selectedReceipt.doctor?.specialty}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{selectedReceipt.doctor?.address}</p>
                </div>
                <Badge variant="success" className="text-xs">
                  {selectedReceipt.confirmationMethod.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-background border rounded-lg">
                <span className="text-muted-foreground font-medium block">Acknowledged At:</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {new Date(selectedReceipt.acknowledgedAt).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-background border rounded-lg">
                <span className="text-muted-foreground font-medium block">Attending MR:</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {selectedReceipt.mr?.user
                    ? `${selectedReceipt.mr.user.firstName} ${selectedReceipt.mr.user.lastName}`
                    : "Representative"}
                </span>
              </div>
            </div>

            {selectedReceipt.gpsLatitude && selectedReceipt.gpsLongitude && (
              <div className="p-2.5 bg-background border rounded-lg text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>GPS Verification Coordinates:</span>
                </div>
                <span className="font-mono font-semibold text-foreground">
                  {selectedReceipt.gpsLatitude.toFixed(6)}, {selectedReceipt.gpsLongitude.toFixed(6)}
                </span>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-foreground block mb-1">Doctor Feedback / Remarks:</span>
              <p className="text-xs p-2.5 bg-muted/30 border rounded-lg text-foreground italic">
                "{selectedReceipt.doctorComments || "Physician verified physical sample handover without remarks."}"
              </p>
            </div>

            {selectedReceipt.signatureData && (
              <div>
                <span className="text-xs font-semibold text-foreground block mb-1">Digital Acknowledgment Proof:</span>
                <div className="p-3 bg-muted/20 border border-dashed rounded-lg flex items-center justify-center min-h-[80px]">
                  {selectedReceipt.signatureData.startsWith("data:image") ? (
                    <img
                      src={selectedReceipt.signatureData}
                      alt="Doctor Signature"
                      className="max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      <span className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded">
                        {selectedReceipt.signatureData}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsReceiptModalOpen(false)}>
                Close Receipt
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
