"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Package,
  Truck,
  RotateCcw,
  Plus,
  Send,
  FileCheck,
  User,
  SlidersHorizontal,
  FileSpreadsheet,
  Layers,
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

// Modular feature components
import {
  SampleKpiCards,
  SampleOverviewTab,
  SampleBalancesTab,
  SampleDispatchesTab,
  SampleMrInventoryTab,
  SampleBatchesTab,
  SampleAdjustmentsTab,
  SampleLedgerTab,
  SampleReportsTab,
  RegisterBatchDialog,
  ReceiveStockDialog,
  DispatchSampleDialog,
  AdjustStockDialog,
  ResolveDiscrepancyDialog,
  VerifyDoctorReceiptDialog,
} from "@/features/samples";

export default function SampleInventoryPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "balances" | "dispatches" | "mr-inventory" | "batches" | "adjustments" | "ledger" | "reports"
  >("overview");
  const [, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Data
  const [balances, setBalances] = useState<SampleInventoryBalance[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<SampleLedgerEntry[]>([]);
  const [batches, setBatches] = useState<SampleBatch[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [mrs, setMrs] = useState<any[]>([]);
  const [discrepancies, setDiscrepancies] = useState<SampleLedgerEntry[]>([]);
  const [, setReportsSummary] = useState<any>(null);

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
      setStatusMessage({ type: "error", text: "Please select a batch and specify a valid quantity." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const combinedNotes = [
        receiveForm.reference ? `Ref: ${receiveForm.reference}` : "",
        receiveForm.receivedDate ? `Date: ${receiveForm.receivedDate}` : "",
        receiveForm.notes,
      ]
        .filter(Boolean)
        .join(" | ");

      await sampleService.receiveStock({
        batchId: receiveForm.batchId,
        quantity: Number(receiveForm.quantity),
        notes: combinedNotes || undefined,
      });

      setStatusMessage({ type: "success", text: "Stock received into Central Warehouse successfully." });
      setIsReceiveStockOpen(false);
      setReceiveForm({
        batchId: "",
        quantity: 50,
        reference: "",
        receivedDate: "",
        notes: "",
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to receive warehouse stock." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchForm.targetMrId || dispatchForm.items.length === 0) {
      setStatusMessage({ type: "error", text: "Please select an MR and at least one sample item." });
      return;
    }

    const validItems = dispatchForm.items.filter((i) => i.batchId && i.quantity > 0);
    if (validItems.length === 0) {
      setStatusMessage({ type: "error", text: "Please select valid batch lots and quantities." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const combinedNotes = [
        dispatchForm.reference ? `Ref: ${dispatchForm.reference}` : "",
        dispatchForm.notes,
      ]
        .filter(Boolean)
        .join(" | ");

      await Promise.all(
        validItems.map((item) =>
          sampleService.dispatchToMr({
            targetMrId: dispatchForm.targetMrId,
            batchId: item.batchId,
            quantity: Number(item.quantity),
            notes: combinedNotes || undefined,
          })
        )
      );

      setStatusMessage({
        type: "success",
        text: `Successfully dispatched ${validItems.length} product line(s) to representative.`,
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
      setStatusMessage({ type: "error", text: "Please specify batch, quantity and audit rationale notes." });
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

      setStatusMessage({ type: "success", text: "Stock adjustment recorded in audit ledger." });
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
    const filename = `sample_inventory_${reportType}`;

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
      <SampleKpiCards stats={kpiStats} />

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
        <SampleOverviewTab
          kpiStats={kpiStats}
          discrepancies={discrepancies}
          ledgerEntries={ledgerEntries}
          onNavigateTab={setActiveTab}
          onOpenReceiveStock={() => setIsReceiveStockOpen(true)}
          getMovementBadgeVariant={getMovementBadgeVariant}
        />
      )}

      {/* TAB 2: CUSTODY BALANCES */}
      {activeTab === "balances" && (
        <SampleBalancesTab
          balances={filteredBalances}
          filterHolder={filterHolder}
          setFilterHolder={setFilterHolder}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          nowTimestamp={nowTimestamp}
          onExportCSV={() => handleExportCSV("balances")}
        />
      )}

      {/* TAB 3: DISPATCH & ACKNOWLEDGMENT TRACKING */}
      {activeTab === "dispatches" && (
        <SampleDispatchesTab
          dispatches={filteredDispatches}
          filterDispatchStatus={filterDispatchStatus}
          setFilterDispatchStatus={setFilterDispatchStatus}
          onOpenDispatchModal={() => setIsDispatchOpen(true)}
          onExportCSV={() => handleExportCSV("dispatches")}
          onOpenResolveModal={(entry) => {
            setTargetDiscrepancyEntry(entry);
            setIsResolveModalOpen(true);
          }}
          getAckBadgeVariant={getAckBadgeVariant}
        />
      )}

      {/* TAB 4: MR FIELD INVENTORY BREAKDOWN */}
      {activeTab === "mr-inventory" && (
        <SampleMrInventoryTab
          mrs={mrs}
          selectedMrId={selectedMrId}
          setSelectedMrId={setSelectedMrId}
          selectedMrDetails={selectedMrDetails}
          mrSpecificBalances={mrSpecificBalances}
          mrSpecificMovements={mrSpecificMovements}
          getMovementBadgeVariant={getMovementBadgeVariant}
        />
      )}

      {/* TAB 5: BATCHES MASTER REGISTRY */}
      {activeTab === "batches" && (
        <SampleBatchesTab
          batches={batches}
          nowTimestamp={nowTimestamp}
          onOpenRegisterBatch={() => setIsRegisterBatchOpen(true)}
        />
      )}

      {/* TAB 6: RETURNS & ADJUSTMENTS */}
      {activeTab === "adjustments" && (
        <SampleAdjustmentsTab
          adjustmentsAndReturns={adjustmentsAndReturns}
          onOpenAdjustModal={() => setIsAdjustOpen(true)}
          getMovementBadgeVariant={getMovementBadgeVariant}
        />
      )}

      {/* TAB 7: MOVEMENT AUDIT LEDGER */}
      {activeTab === "ledger" && (
        <SampleLedgerTab
          ledgerEntries={filteredLedger}
          filterMovementType={filterMovementType}
          setFilterMovementType={setFilterMovementType}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onExportCSV={() => handleExportCSV("ledger")}
          onViewReceipt={handleViewReceipt}
          getMovementBadgeVariant={getMovementBadgeVariant}
        />
      )}

      {/* TAB 8: INVENTORY REPORTS & CSV EXPORT */}
      {activeTab === "reports" && (
        <SampleReportsTab
          products={products}
          balances={balances}
          kpiStats={kpiStats}
          nowTimestamp={nowTimestamp}
          onExportCSV={handleExportCSV}
        />
      )}

      {/* MODAL 1: REGISTER BATCH */}
      <RegisterBatchDialog
        isOpen={isRegisterBatchOpen}
        onClose={() => setIsRegisterBatchOpen(false)}
        onSubmit={handleRegisterBatch}
        products={products}
        batchForm={batchForm}
        setBatchForm={setBatchForm}
        isSubmitting={isSubmitting}
      />

      {/* MODAL 2: RECEIVE WAREHOUSE STOCK */}
      <ReceiveStockDialog
        isOpen={isReceiveStockOpen}
        onClose={() => setIsReceiveStockOpen(false)}
        onSubmit={handleReceiveStock}
        batches={batches}
        receiveForm={receiveForm}
        setReceiveForm={setReceiveForm}
        isSubmitting={isSubmitting}
      />

      {/* MODAL 3: DISPATCH TO MR (MULTI-ITEM CAPABLE) */}
      <DispatchSampleDialog
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onSubmit={handleDispatch}
        mrs={mrs}
        batches={batches}
        balances={balances}
        dispatchForm={dispatchForm}
        setDispatchForm={setDispatchForm}
        isSubmitting={isSubmitting}
      />

      {/* MODAL 4: INVENTORY ADJUSTMENT */}
      <AdjustStockDialog
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        onSubmit={handleAdjust}
        mrs={mrs}
        batches={batches}
        adjustForm={adjustForm}
        setAdjustForm={setAdjustForm}
        isSubmitting={isSubmitting}
      />

      {/* MODAL 5: RESOLVE DISCREPANCY */}
      <ResolveDiscrepancyDialog
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onSubmit={handleResolveDiscrepancy}
        targetDiscrepancyEntry={targetDiscrepancyEntry}
        resolveForm={resolveForm}
        setResolveForm={setResolveForm}
        isSubmitting={isSubmitting}
      />

      {/* MODAL 6: DOCTOR RECEIPT INSPECTION */}
      <VerifyDoctorReceiptDialog
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        selectedReceipt={selectedReceipt}
      />
    </div>
  );
}
