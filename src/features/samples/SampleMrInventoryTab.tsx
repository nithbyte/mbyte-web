"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  SampleInventoryBalance,
  SampleLedgerEntry,
  SampleMovementType,
} from "@/services/sampleService";

interface SampleMrInventoryTabProps {
  mrs: any[];
  selectedMrId: string;
  setSelectedMrId: (id: string) => void;
  selectedMrDetails: any;
  mrSpecificBalances: SampleInventoryBalance[];
  mrSpecificMovements: SampleLedgerEntry[];
  getMovementBadgeVariant: (type: SampleMovementType) => "default" | "success" | "warning" | "destructive" | "secondary";
}

export const SampleMrInventoryTab: React.FC<SampleMrInventoryTabProps> = ({
  mrs,
  selectedMrId,
  setSelectedMrId,
  selectedMrDetails,
  mrSpecificBalances,
  mrSpecificMovements,
  getMovementBadgeVariant,
}) => {
  return (
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
  );
};
