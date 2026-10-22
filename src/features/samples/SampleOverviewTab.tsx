"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  SampleBatch,
  SampleLedgerEntry,
  SampleMovementType,
} from "@/services/sampleService";

interface SampleOverviewTabProps {
  kpiStats: {
    nearExpiryBatches: SampleBatch[];
    lowStockBatches: any[];
  };
  discrepancies: SampleLedgerEntry[];
  ledgerEntries: SampleLedgerEntry[];
  onNavigateTab: (tab: "overview" | "balances" | "dispatches" | "mr-inventory" | "batches" | "adjustments" | "ledger" | "reports") => void;
  onOpenReceiveStock: () => void;
  getMovementBadgeVariant: (type: SampleMovementType) => "default" | "success" | "warning" | "destructive" | "secondary";
}

export const SampleOverviewTab: React.FC<SampleOverviewTabProps> = ({
  kpiStats,
  discrepancies,
  ledgerEntries,
  onNavigateTab,
  onOpenReceiveStock,
  getMovementBadgeVariant,
}) => {
  return (
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
                    onClick={() => onNavigateTab("reports")}
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
                    onClick={onOpenReceiveStock}
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
                    onClick={() => onNavigateTab("dispatches")}
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
          <Button variant="ghost" size="sm" onClick={() => onNavigateTab("ledger")} className="text-xs">
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
  );
};
