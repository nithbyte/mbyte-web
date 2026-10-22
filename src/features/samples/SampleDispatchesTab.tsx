"use client";

import React from "react";
import { Card } from "@/components/ui/card";
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
import { Truck, Send, Download } from "lucide-react";
import { SampleLedgerEntry, SampleAckStatus } from "@/services/sampleService";

interface SampleDispatchesTabProps {
  dispatches: SampleLedgerEntry[];
  filterDispatchStatus: string;
  setFilterDispatchStatus: (status: string) => void;
  onOpenDispatchModal: () => void;
  onExportCSV: () => void;
  onOpenResolveModal: (entry: SampleLedgerEntry) => void;
  getAckBadgeVariant: (status: SampleAckStatus) => "default" | "success" | "warning" | "destructive" | "secondary";
}

export const SampleDispatchesTab: React.FC<SampleDispatchesTabProps> = ({
  dispatches,
  filterDispatchStatus,
  setFilterDispatchStatus,
  onOpenDispatchModal,
  onExportCSV,
  onOpenResolveModal,
  getAckBadgeVariant,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium mr-1">Ack Status:</span>
          {(["ALL", "PENDING", "ACKNOWLEDGED", "PARTIALLY_ACKNOWLEDGED", "REJECTED"] as const).map((st) => (
            <Button
              key={st}
              variant={filterDispatchStatus === st ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => setFilterDispatchStatus(st)}
            >
              {st.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
            onClick={onOpenDispatchModal}
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            New Dispatch
          </Button>
          <Button variant="outline" size="sm" onClick={onExportCSV} className="h-8 text-xs">
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs font-semibold">Dispatch Date</TableHead>
                <TableHead className="text-xs font-semibold">Target MR & Territory</TableHead>
                <TableHead className="text-xs font-semibold">Product & Lot</TableHead>
                <TableHead className="text-xs font-semibold text-right">Dispatched Qty</TableHead>
                <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                <TableHead className="text-xs font-semibold">Delivery Notes & Discrepancies</TableHead>
                <TableHead className="text-xs font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8">
                    <EmptyState
                      icon={Truck}
                      title="No dispatches found"
                      description="Dispatches sent to Medical Representatives will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                dispatches.map((d) => {
                  const hasDiscrepancy =
                    d.acknowledgmentStatus === "REJECTED" ||
                    d.acknowledgmentStatus === "PARTIALLY_ACKNOWLEDGED" ||
                    d.notes?.includes("DISCREPANCY");
                  const isResolved = d.notes?.includes("RESOLVED");

                  return (
                    <TableRow key={d.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-semibold text-foreground">
                          {d.targetMr?.user?.firstName} {d.targetMr?.user?.lastName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{d.targetMr?.territory?.name || "Territory"}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-semibold text-foreground">{d.product?.brandName}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">Lot: {d.batch?.batchNumber}</p>
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-foreground">
                        {d.quantity} packs
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getAckBadgeVariant(d.acknowledgmentStatus)} className="text-[10px]">
                          {d.acknowledgmentStatus.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-sm">
                        <p className="text-foreground truncate">{d.notes || "Standard consignment allocation"}</p>
                        {d.acknowledgedAt && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Confirmed: {new Date(d.acknowledgedAt).toLocaleString()}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasDiscrepancy && !isResolved ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => onOpenResolveModal(d)}
                          >
                            Resolve Discrepancy
                          </Button>
                        ) : isResolved ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                            Resolved
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
