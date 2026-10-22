"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, AlertTriangle } from "lucide-react";
import { SampleInventoryBalance, SampleBatch } from "@/services/sampleService";

interface SampleReportsTabProps {
  products: any[];
  balances: SampleInventoryBalance[];
  kpiStats: {
    nearExpiryBatches: SampleBatch[];
  };
  nowTimestamp: number;
  onExportCSV: (reportType: "balances" | "ledger" | "dispatches") => void;
}

export const SampleReportsTab: React.FC<SampleReportsTabProps> = ({
  products,
  balances,
  kpiStats,
  nowTimestamp,
  onExportCSV,
}) => {
  return (
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
          onClick={() => onExportCSV("balances")}
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
  );
};
