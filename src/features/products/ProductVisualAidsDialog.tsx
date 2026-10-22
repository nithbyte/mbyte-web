"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Product } from "@/types";
import { ExternalLink } from "lucide-react";

interface ProductVisualAidsDialogProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductVisualAidsDialog: React.FC<ProductVisualAidsDialogProps> = ({
  product,
  onClose,
}) => {
  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      title={`Clinical Visual Aids: ${product?.name}`}
      description="Interactive detailing presentations, clinical trial evidence, and promotional collateral for medical representatives."
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {product?.visualAids && product.visualAids.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {product.visualAids.map((va) => (
              <div
                key={va.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-start gap-3"
              >
                <div className="h-16 w-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white shrink-0">
                  <img
                    src={va.thumbnailUrl}
                    alt={va.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                      {va.type} Deck
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      v{va.version} • {formatDate(va.publishedDate || va.publishedAt || "")}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {va.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {va.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      {va.fileSizeBytes ? `${(va.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : "Optimized for Tablet"}
                    </span>
                    <a
                      href={va.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                    >
                      <span>Open Detailing Deck</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No visual aids uploaded for this product formulation.
          </div>
        )}

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
    </Modal>
  );
};
