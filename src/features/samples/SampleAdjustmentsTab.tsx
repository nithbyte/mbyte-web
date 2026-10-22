"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { SlidersHorizontal, Plus } from "lucide-react";
import { SampleLedgerEntry, SampleMovementType } from "@/services/sampleService";

interface SampleAdjustmentsTabProps {
  adjustmentsAndReturns: SampleLedgerEntry[];
  onOpenAdjustModal: () => void;
  getMovementBadgeVariant: (type: SampleMovementType) => "default" | "success" | "warning" | "destructive" | "secondary";
}

export const SampleAdjustmentsTab: React.FC<SampleAdjustmentsTabProps> = ({
  adjustmentsAndReturns,
  onOpenAdjustModal,
  getMovementBadgeVariant,
}) => {
  return (
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
          onClick={onOpenAdjustModal}
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
  );
};
