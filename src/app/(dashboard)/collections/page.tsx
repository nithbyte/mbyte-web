"use client";

import React, { useState } from "react";
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
import {
  useCollections,
  useCollectionKPIs,
  useCollectionTrend,
  useCollectionDetail,
  useMRList,
} from "@/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Receipt,
  ShoppingCart,
  TrendingUp,
  Search,
  Eye,
  CheckCircle2,
  Calendar,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import { PaymentMode } from "@/types";

export default function CollectionsPage() {
  const [modeFilter, setModeFilter] = useState<PaymentMode | "ALL">("ALL");
  const [mrFilter, setMrFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedColId, setSelectedColId] = useState<string | null>(null);

  const { data: kpis, isLoading: kpisLoading } = useCollectionKPIs({
    mrId: mrFilter !== "ALL" ? mrFilter : undefined,
  });

  const { data: trendData, isLoading: trendLoading } = useCollectionTrend();
  const { data: mrs } = useMRList();

  const { data: collections, isLoading: colsLoading } = useCollections({
    mode: modeFilter,
    mrId: mrFilter,
    date: dateFilter || undefined,
    search: searchQuery || undefined,
  });

  const { data: activeCol, isLoading: colDetailLoading } = useCollectionDetail(selectedColId);

  const resetFilters = () => {
    setModeFilter("ALL");
    setMrFilter("ALL");
    setDateFilter("");
    setSearchQuery("");
  };

  const getModeBadgeVariant = (mode: PaymentMode): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    switch (mode) {
      case "UPI":
        return "info";
      case "CHEQUE":
        return "warning";
      case "CASH":
        return "success";
      case "BANK_TRANSFER":
        return "default";
      default:
        return "secondary";
    }
  };

  const maxTrendAmount = Math.max(...(trendData?.map((t) => t.amount) || [1]), 1000);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Commercial Collections & Payment Receipts"
        description="Official payment vouchers realized against chemist invoice outstandings across UPI, Cheque, Bank Transfer, and Cash."
        badge={<Badge variant="success">{collections?.length || 0} Receipts Displayed</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/commercial">
              <Button variant="outline" size="sm" className="gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Commercial Overview
              </Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ShoppingCart className="h-4 w-4 text-sky-600" />
                Booked Orders
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Collections */}
        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today&apos;s Realized Receipts
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.todayValue || 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {kpis?.todayCount || 0} vouchers
                  </span>
                  <span>collected on Oct 08</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Collections Total */}
        <Card className="border-l-4 border-l-teal-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Collections (MTD)
              </span>
              <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.monthlyValue || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {kpis?.monthlyCount || 0} receipts
                  </span>{" "}
                  reconciled in October
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UPI & Bank Transfer */}
        <Card className="border-l-4 border-l-sky-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Digital & UPI Inflow
              </span>
              <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                  {formatCurrency((kpis?.upiTotal || 0) + (kpis?.bankTransferTotal || 0))}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  UPI: {formatCurrency(kpis?.upiTotal || 0)} • RTGS: {formatCurrency(kpis?.bankTransferTotal || 0)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cheque & Cash Clearance */}
        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cheque & Cash Inflow
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                <FileCheck2 className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency((kpis?.chequeTotal || 0) + (kpis?.cashTotal || 0))}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Cheques: {formatCurrency(kpis?.chequeTotal || 0)} • Cash: {formatCurrency(kpis?.cashTotal || 0)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Collection Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Daily Collections Trend (October 2026)
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time deposits and invoice collections brought in by medical representatives
              </CardDescription>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Total MTD: {formatCurrency(kpis?.monthlyValue || 0)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="pt-2">
              <div className="flex items-end justify-between gap-3 h-32 border-b border-slate-200 dark:border-slate-800 pb-2">
                {trendData?.map((item) => {
                  const pct = Math.min(100, Math.max(8, Math.round((item.amount / maxTrendAmount) * 100)));
                  return (
                    <div
                      key={item.date}
                      className="group relative flex flex-1 flex-col items-center justify-end h-full"
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 z-20 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white shadow-md transition-opacity whitespace-nowrap dark:bg-slate-800">
                        <div>{item.label}: {formatCurrency(item.amount)}</div>
                        <div className="text-[9px] text-emerald-400">{item.count} receipts realized</div>
                      </div>

                      <div
                        className="w-full max-w-[36px] rounded-t-md bg-emerald-500 group-hover:bg-emerald-400 transition-all duration-300"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between gap-3 pt-2 text-[11px] text-slate-500">
                {trendData?.map((item) => (
                  <div key={item.date} className="flex-1 text-center font-medium">
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search receipt #, customer, or reference #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Mode Filter */}
              <select
                aria-label="Filter by payment mode"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as PaymentMode | "ALL")}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value="ALL">All Payment Modes</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
              </select>

              {/* MR Filter */}
              <select
                aria-label="Filter by field representative"
                value={mrFilter}
                onChange={(e) => setMrFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value="ALL">All Representatives</option>
                {mrs?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.employeeId})
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              <select
                aria-label="Filter by collection date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value="">All Dates</option>
                <option value="2026-10-08">Today (08 Oct 2026)</option>
                <option value="2026-10-07">07 Oct 2026</option>
                <option value="2026-10-06">06 Oct 2026</option>
                <option value="2026-10-05">05 Oct 2026</option>
                <option value="2026-10-04">04 Oct 2026</option>
              </select>
            </div>

            {/* Reset */}
            {(modeFilter !== "ALL" || mrFilter !== "ALL" || dateFilter || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 gap-1.5 h-9"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collections Table */}
      <Card>
        <CardContent className="p-0">
          {colsLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !collections || collections.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold">No collection receipts found</div>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting the payment mode, representative, or date filter criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt # & Date</TableHead>
                  <TableHead>Customer (Chemist / Clinic)</TableHead>
                  <TableHead>Field Representative</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Ref / Cheque #</TableHead>
                  <TableHead className="text-right">Amount Collected</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((col) => (
                  <TableRow key={col.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                    <TableCell>
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {col.receiptNumber}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(col.paymentDate)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                        {col.pharmacyName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                        {col.customerAddress}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {col.mrName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {col.mrEmployeeCode}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getModeBadgeVariant(col.paymentMode)} className="text-[10px] font-semibold">
                        {col.paymentMode}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      {col.referenceNumber || "Cash Direct"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(col.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">Reconciled</div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedColId(col.id)}
                        className="h-8 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Collection Details Modal */}
      <Modal
        isOpen={Boolean(selectedColId)}
        onClose={() => setSelectedColId(null)}
        title={activeCol ? `Payment Voucher #${activeCol.receiptNumber}` : "Payment Details"}
        description={activeCol ? `Reconciled on ${formatDate(activeCol.paymentDate)} • Mode: ${activeCol.paymentMode}` : ""}
        maxWidth="md"
      >
        {colDetailLoading || !activeCol ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            {/* Highlighted Amount */}
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Amount Realized & Deposited
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-300 mt-1">
                {formatCurrency(activeCol.amount)}
              </div>
              <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Reconciled into Corporate Ledger
              </div>
            </div>

            {/* Customer & MR Information */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Customer / Chemist:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">
                  {activeCol.pharmacyName}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Address:</span>
                <span className="text-slate-700 dark:text-slate-300 text-right max-w-[200px]">
                  {activeCol.customerAddress}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Field Representative:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-right">
                  {activeCol.mrName} ({activeCol.mrEmployeeCode})
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Territory:</span>
                <span className="text-slate-700 dark:text-slate-300 text-right">
                  {activeCol.territoryName}
                </span>
              </div>
            </div>

            {/* Transaction Telemetry */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Payment Mode:</span>
                <Badge variant={getModeBadgeVariant(activeCol.paymentMode)} className="text-[10px]">
                  {activeCol.paymentMode}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Reference / Cheque #:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {activeCol.referenceNumber || "CASH_DIRECT"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Payment Date:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDate(activeCol.paymentDate)}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-slate-600 dark:text-slate-300">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Voucher Remarks & Allocation
              </div>
              <div>{activeCol.notes || "Official collection voucher issued during scheduled representative call."}</div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedColId(null)}>
                Close Voucher
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
