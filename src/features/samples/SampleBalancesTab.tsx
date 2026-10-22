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
import { Search, Download, Package } from "lucide-react";
import { SampleInventoryBalance } from "@/services/sampleService";

interface SampleBalancesTabProps {
  balances: SampleInventoryBalance[];
  filterHolder: "ALL" | "WAREHOUSE" | "MR";
  setFilterHolder: (holder: "ALL" | "WAREHOUSE" | "MR") => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  nowTimestamp: number;
  onExportCSV: () => void;
}

export const SampleBalancesTab: React.FC<SampleBalancesTabProps> = ({
  balances,
  filterHolder,
  setFilterHolder,
  searchTerm,
  setSearchTerm,
  nowTimestamp,
  onExportCSV,
}) => {
  return (
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
          <Button variant="outline" size="sm" onClick={onExportCSV} className="h-8 text-xs">
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
              {balances.length === 0 ? (
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
                balances.map((b) => {
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
  );
};
