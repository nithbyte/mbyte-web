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
import { EmptyState } from "@/components/ui/empty-state";
import { FlaskConical, Plus, Gift } from "lucide-react";
import { SampleBatch, isPromoGiftProduct, formatSampleExpiry } from "@/services/sampleService";

interface SampleBatchesTabProps {
  batches: SampleBatch[];
  nowTimestamp: number;
  onOpenRegisterBatch: () => void;
}

export const SampleBatchesTab: React.FC<SampleBatchesTabProps> = ({
  batches,
  nowTimestamp,
  onOpenRegisterBatch,
}) => {
  return (
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
          onClick={onOpenRegisterBatch}
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
                const isGift = isPromoGiftProduct(batch.product);
                const isExpired = !isGift && nowTimestamp > 0 && new Date(batch.expiryDate).getTime() < nowTimestamp;
                return (
                  <TableRow key={batch.id} className="hover:bg-muted/30">
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-1 rounded">
                        {batch.batchNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-foreground">{batch.product?.brandName}</p>
                        {isGift && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 px-1.5 py-0.5 text-[9px] font-bold">
                            <Gift className="w-2.5 h-2.5" />
                            GIFT / INPUT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {batch.product?.genericName} • {isGift ? batch.product?.packSize || "1 pc" : batch.product?.dosageForm}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{batch.product?.sku}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      {formatSampleExpiry(batch.expiryDate, batch.product)}
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
  );
};
