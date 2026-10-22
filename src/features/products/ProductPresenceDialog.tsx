"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Product } from "@/types";
import { Boxes } from "lucide-react";

interface ProductPresenceDialogProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductPresenceDialog: React.FC<ProductPresenceDialogProps> = ({
  product,
  onClose,
}) => {
  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      title={`Retail Chemist Presence Summary: ${product?.name}`}
      description="Stock availability rate, low stock alerts, and chemist shelf audits recorded by MRs in the field."
    >
      {product && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Overview Stats */}
          {product.presenceSummary && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Audits</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {product.presenceSummary.totalAudits}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                  Available
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {product.presenceSummary.availableCount}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase">
                  Low Stock
                </div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {product.presenceSummary.lowStockCount}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50">
                <div className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold uppercase">
                  Out of Stock
                </div>
                <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {product.presenceSummary.outOfStockCount}
                </div>
              </div>
            </div>
          )}

          {/* Recent Chemist Audits */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5 text-sky-600" />
              Recent Verified Chemist Audits
            </h4>

            {product.presenceSummary?.recentAudits &&
            product.presenceSummary.recentAudits.length > 0 ? (
              <div className="space-y-2">
                {product.presenceSummary.recentAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {audit.pharmacyName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Audited on {formatDate(audit.auditedAt || audit.checkedAt || "")} • Batch: {audit.batchNumber || "BT-2026"}
                      </div>
                      {audit.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          &ldquo;{audit.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      {audit.status === "AVAILABLE" && (
                        <Badge variant="success" className="text-[10px]">
                          Available ({audit.currentQuantity ?? audit.quantity} units)
                        </Badge>
                      )}
                      {audit.status === "LOW_STOCK" && (
                        <Badge variant="warning" className="text-[10px]">
                          Low Stock ({audit.currentQuantity ?? audit.quantity} units)
                        </Badge>
                      )}
                      {audit.status === "OUT_OF_STOCK" && (
                        <Badge variant="destructive" className="text-[10px]">
                          Out of Stock (0 units)
                        </Badge>
                      )}
                      {audit.status === "UNKNOWN" && (
                        <Badge variant="secondary" className="text-[10px]">
                          Unknown
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic py-4 text-center">
                No chemist presence audits recorded for this formulation yet.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
