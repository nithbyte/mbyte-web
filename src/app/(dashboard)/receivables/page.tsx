"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { invoiceService } from "@/services/invoiceService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  Invoice,
  CustomerAging,
  CustomerStatement,
  ReceivablesSummary,
  InvoiceStatus,
} from "@/types/invoice";
import {
  FileSpreadsheet,
  TrendingUp,
  Search,
  Eye,
  CheckCircle2,
  Calendar,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  DollarSign,
  PlusCircle,
  FileText,
  Building,
  User,
} from "lucide-react";

export default function ReceivablesPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "aging">("invoices");
  const [summary, setSummary] = useState<ReceivablesSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agingList, setAgingList] = useState<CustomerAging[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Statement Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  // Allocation Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [allocCollectionId, setAllocCollectionId] = useState("");
  const [allocAmount, setAllocAmount] = useState("");
  const [allocNotes, setAllocNotes] = useState("");
  const [allocLoading, setAllocLoading] = useState(false);
  const [allocError, setAllocError] = useState("");
  const [allocSuccess, setAllocSuccess] = useState("");

  // Reversal Modal State
  const [reversalAllocId, setReversalAllocId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversalLoading, setReversalLoading] = useState(false);
  const [reversalError, setReversalError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, invRes, ageRes] = await Promise.all([
        invoiceService.getSummary(),
        invoiceService.getInvoices({ status: statusFilter === "ALL" ? undefined : statusFilter }),
        invoiceService.getAging(),
      ]);
      setSummary(sumRes);
      setInvoices(invRes.data);
      setAgingList(ageRes);
    } catch (err) {
      console.error("Failed to load receivables data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenStatement = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setStatementLoading(true);
    try {
      const data = await invoiceService.getStatement(customerId);
      setStatement(data);
    } catch (err) {
      console.error("Failed to load statement:", err);
    } finally {
      setStatementLoading(false);
    }
  };

  const handleOpenAllocation = async (invoice: Invoice) => {
    const fullInv = await invoiceService.getInvoice(invoice.id);
    setSelectedInvoice(fullInv || invoice);
    setAllocCollectionId("");
    setAllocAmount(String(fullInv?.balanceAmount || invoice.balanceAmount));
    setAllocNotes("");
    setAllocError("");
    setAllocSuccess("");
  };

  const handleSubmitAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setAllocError("");
    setAllocSuccess("");
    setAllocLoading(true);

    try {
      await invoiceService.allocatePayment(selectedInvoice.id, {
        collectionId: allocCollectionId.trim(),
        allocatedAmount: parseFloat(allocAmount),
        notes: allocNotes.trim() || undefined,
      });
      setAllocSuccess("Payment successfully allocated against invoice.");
      // Refresh current invoice
      const updated = await invoiceService.getInvoice(selectedInvoice.id);
      setSelectedInvoice(updated);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to allocate payment";
      setAllocError(msg);
    } finally {
      setAllocLoading(false);
    }
  };

  const handleReverseAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalAllocId || !reversalReason.trim()) return;
    setReversalError("");
    setReversalLoading(true);

    try {
      await invoiceService.reverseAllocation(reversalAllocId, reversalReason.trim());
      setReversalAllocId(null);
      setReversalReason("");
      if (selectedInvoice) {
        const updated = await invoiceService.getInvoice(selectedInvoice.id);
        setSelectedInvoice(updated);
      }
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to reverse allocation";
      setReversalError(msg);
    } finally {
      setReversalLoading(false);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">PAID</Badge>;
      case "PARTIALLY_PAID":
        return <Badge variant="warning">PARTIALLY PAID</Badge>;
      case "ISSUED":
        return <Badge variant="info">ISSUED</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">DRAFT</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.order?.orderNumber && inv.order.orderNumber.toLowerCase().includes(q))
    );
  });

  const filteredAging = agingList.filter((a) =>
    a.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts Receivable & Invoicing"
        description="Manage commercial invoices, match payment collections, monitor overdue aging, and view customer account statements."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchData();
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Outstanding AR
              </span>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                formatCurrency(summary?.totalOutstanding || 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total Billed: {formatCurrency(summary?.totalInvoiced || 0)}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current (0 - 30 Days)
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                formatCurrency(summary?.aging?.current0To30 || 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-emerald-600 font-medium">
            Within active credit terms
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overdue (31 - 60 Days)
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                formatCurrency(summary?.aging?.overdue31To60 || 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-600 font-medium">
            Requires follow-up reminder
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Delinquent (61+ Days)
              </span>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                formatCurrency(
                  (summary?.aging?.overdue61To90 || 0) + (summary?.aging?.overdue90Plus || 0)
                )
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-rose-600 font-medium">
            High priority collection escalation
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-3">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "invoices" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("invoices")}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Invoices & Payment Allocations
          </Button>
          <Button
            variant={activeTab === "aging" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("aging")}
          >
            <Clock className="h-4 w-4 mr-1.5" />
            Overdue Aging Breakdown
          </Button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoice or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {activeTab === "invoices" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-md border border-input bg-background"
            >
              <option value="ALL">All Statuses</option>
              <option value="ISSUED">Issued</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab 1: Invoices Table */}
      {activeTab === "invoices" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Commercial Invoices</CardTitle>
            <CardDescription>
              Orders must be explicitly invoiced. Booked orders are distinct from authoritative billing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No invoices found matching current criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          <div>{inv.invoiceNumber}</div>
                          {inv.order && (
                            <div className="text-xs text-muted-foreground">
                              Order: {inv.order.orderNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{inv.customerName}</div>
                          <div className="text-xs text-muted-foreground">{inv.customerType}</div>
                        </TableCell>
                        <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              new Date(inv.dueDate) < new Date() && inv.balanceAmount > 0
                                ? "text-rose-600 font-medium"
                                : ""
                            }
                          >
                            {formatDate(inv.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(inv.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {formatCurrency(inv.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          <span className={inv.balanceAmount > 0 ? "text-rose-600" : "text-muted-foreground"}>
                            {formatCurrency(inv.balanceAmount)}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(inv.status)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAllocation(inv)}
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            Allocations
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStatement(inv.customerId)}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Statement
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Overdue Aging Breakdown */}
      {activeTab === "aging" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Authoritative Accounts Receivable Aging</CardTitle>
            <CardDescription>
              Aged receivables grouped by customer according to exact invoice due dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredAging.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No outstanding balances or overdue customers found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Current (0-30d)</TableHead>
                      <TableHead className="text-right">Overdue (31-60d)</TableHead>
                      <TableHead className="text-right">Overdue (61-90d)</TableHead>
                      <TableHead className="text-right">Delinquent (90+d)</TableHead>
                      <TableHead className="text-right">Total Outstanding</TableHead>
                      <TableHead className="text-right">Statement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAging.map((item) => (
                      <TableRow key={item.customerId}>
                        <TableCell className="font-medium">
                          {item.customerName}
                          <div className="text-xs text-muted-foreground">
                            {item.invoiceCount} open invoice(s)
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.customerType}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">
                          {formatCurrency(item.current0To30)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600 font-medium">
                          {formatCurrency(item.overdue31To60)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600 font-medium">
                          {formatCurrency(item.overdue61To90)}
                        </TableCell>
                        <TableCell className="text-right text-rose-600 font-bold">
                          {formatCurrency(item.overdue90Plus)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-base">
                          {formatCurrency(item.totalOutstanding)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenStatement(item.customerId)}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            View Ledger
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Statement Modal */}
      {selectedCustomerId && (
        <Modal
          isOpen={!!selectedCustomerId}
          onClose={() => {
            setSelectedCustomerId(null);
            setStatement(null);
          }}
          title={statement ? `Statement of Account — ${statement.customerName}` : "Loading Statement..."}
        >
          <div className="space-y-4">
            {statementLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : statement ? (
              <>
                <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Customer</span>
                    <span className="font-medium">{statement.customerName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">As of Date</span>
                    <span className="font-medium">{formatDate(statement.asOfDate)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Current Balance</span>
                    <span className="font-bold text-rose-600">
                      {formatCurrency(statement.currentBalance)}
                    </span>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Running Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statement.entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                            No ledger entries found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        statement.entries.map((ent, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs">{formatDate(ent.date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  ent.type === "INVOICE"
                                    ? "outline"
                                    : ent.type === "ALLOCATION"
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {ent.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-mono">{ent.referenceNumber}</TableCell>
                            <TableCell className="text-right text-xs">
                              {ent.debit > 0 ? formatCurrency(ent.debit) : "—"}
                            </TableCell>
                            <TableCell className="text-right text-xs text-emerald-600">
                              {ent.credit > 0 ? formatCurrency(ent.credit) : "—"}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold">
                              {formatCurrency(ent.runningBalance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                  <span>Authoritative ledger compiled from invoiced debits and matched collection credits.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomerId(null);
                      setStatement(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </Modal>
      )}

      {/* Payment Allocation Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => {
            setSelectedInvoice(null);
            setAllocSuccess("");
            setAllocError("");
          }}
          title={`Payment Allocations — ${selectedInvoice.invoiceNumber}`}
        >
          <div className="space-y-4">
            {/* Invoice Quick Summary */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Customer</span>
                <span className="font-medium">{selectedInvoice.customerName}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Total Amount</span>
                <span className="font-medium">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Balance Remaining</span>
                <span className="font-bold text-rose-600">
                  {formatCurrency(selectedInvoice.balanceAmount)}
                </span>
              </div>
            </div>

            {/* Existing Allocations List */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Existing Allocations
              </h4>
              <div className="border rounded-md max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Allocated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedInvoice.allocations || selectedInvoice.allocations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground">
                          No payments allocated yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedInvoice.allocations.map((alloc) => (
                        <TableRow key={alloc.id}>
                          <TableCell className="text-xs font-mono">
                            {alloc.collection?.receiptNumber || alloc.collectionId.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(alloc.allocatedAt)}</TableCell>
                          <TableCell className="text-right text-xs font-medium">
                            {formatCurrency(alloc.allocatedAmount)}
                          </TableCell>
                          <TableCell>
                            {alloc.isReversed ? (
                              <Badge variant="destructive">REVERSED</Badge>
                            ) : (
                              <Badge variant="success">ACTIVE</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!alloc.isReversed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-600 h-7 text-xs"
                                onClick={() => setReversalAllocId(alloc.id)}
                              >
                                Reverse
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Reversal Inline Form */}
            {reversalAllocId && (
              <form onSubmit={handleReverseAllocation} className="p-3 border border-rose-200 bg-rose-50/50 rounded-lg space-y-2">
                <h5 className="text-xs font-bold text-rose-800">Financial History Correction</h5>
                <p className="text-xs text-rose-700">
                  Reversals maintain an immutable audit trail. The collection receipt remains valid in historical records.
                </p>
                <Input
                  placeholder="Enter detailed reason for reversal (required)..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  required
                  className="text-xs h-8"
                />
                {reversalError && <p className="text-xs text-rose-600">{reversalError}</p>}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setReversalAllocId(null);
                      setReversalReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={reversalLoading || !reversalReason.trim()}
                  >
                    {reversalLoading ? "Reversing..." : "Confirm Reversal"}
                  </Button>
                </div>
              </form>
            )}

            {/* Allocate New Payment Form */}
            {selectedInvoice.balanceAmount > 0 && !reversalAllocId && (
              <form onSubmit={handleSubmitAllocation} className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Allocate Payment From Collection
                </h4>
                {allocError && <p className="text-xs text-rose-600">{allocError}</p>}
                {allocSuccess && <p className="text-xs text-emerald-600">{allocSuccess}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Collection Receipt ID
                    </label>
                    <Input
                      placeholder="col_... or receipt uuid"
                      value={allocCollectionId}
                      onChange={(e) => setAllocCollectionId(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Allocated Amount (₹)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      max={selectedInvoice.balanceAmount}
                      value={allocAmount}
                      onChange={(e) => setAllocAmount(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Notes / Allocation Memo (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Cleared via Cheque #102948"
                    value={allocNotes}
                    onChange={(e) => setAllocNotes(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInvoice(null)}
                  >
                    Done
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={allocLoading || !allocCollectionId.trim() || !allocAmount}
                  >
                    {allocLoading ? "Allocating..." : "Apply Allocation"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
