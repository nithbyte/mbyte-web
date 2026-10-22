"use client";

import React from "react";
import { Card } from "@/components/ui/card";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Download, ShieldCheck, FileCheck } from "lucide-react";
import { SampleLedgerEntry, SampleMovementType } from "@/services/sampleService";

interface SampleLedgerTabProps {
  ledgerEntries: SampleLedgerEntry[];
  filterMovementType: string;
  setFilterMovementType: (type: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onExportCSV: () => void;
  onViewReceipt: (visitId: string) => void;
  getMovementBadgeVariant: (type: SampleMovementType) => "default" | "success" | "warning" | "destructive" | "secondary";
}

export const SampleLedgerTab: React.FC<SampleLedgerTabProps> = ({
  ledgerEntries,
  filterMovementType,
  setFilterMovementType,
  searchTerm,
  setSearchTerm,
  onExportCSV,
  onViewReceipt,
  getMovementBadgeVariant,
}) => {
  return (
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
          <Button variant="outline" size="sm" onClick={onExportCSV} className="h-8 text-xs">
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
              {ledgerEntries.length === 0 ? (
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
                ledgerEntries.map((entry) => (
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
                          onClick={() => onViewReceipt(entry.visitId!)}
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
  );
};
