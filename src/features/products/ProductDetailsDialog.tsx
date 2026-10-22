"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Product } from "@/types";
import {
  Tag,
  FileText,
  Percent,
  BookOpen,
  ExternalLink,
  Pencil,
  Boxes,
} from "lucide-react";

interface ProductDetailsDialogProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onViewPresence: (product: Product) => void;
  onViewVisualAids: (product: Product) => void;
}

export const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  product,
  onClose,
  onEdit,
  onViewPresence,
  onViewVisualAids,
}) => {
  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      title={product?.name || "Product Details"}
      description={`${product?.genericName} • SKU: ${product?.sku}`}
    >
      {product && (
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Top Banner with Image and Core Info */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="h-24 w-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shrink-0">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {product.name}
                </h3>
                <Badge variant={product.isActive ? "success" : "secondary"}>
                  {product.isActive ? "Active in Distribution" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {product.genericName}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  <Tag className="h-3 w-3 text-sky-600" />
                  {product.categoryName}
                </span>
                <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
                  SKU: {product.sku}
                </span>
                <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {product.dosageForm} ({product.packSize})
                </span>
              </div>
            </div>
          </div>

          {/* Description & Clinical Profile */}
          <div className="space-y-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-sky-600" />
              Product Description & Clinical Regimen
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {product.description}
            </p>

            {product.indications && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Indications: </span>
                <span className="text-slate-600 dark:text-slate-400">{product.indications}</span>
              </div>
            )}

            {product.contraindications && (
              <div>
                <span className="font-semibold text-rose-700 dark:text-rose-400">Contraindications: </span>
                <span className="text-slate-600 dark:text-slate-400">{product.contraindications}</span>
              </div>
            )}
          </div>

          {/* Commercial Pricing Grid */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-emerald-600" />
              Commercial Pricing Architecture
            </h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">MRP</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatCurrency(product.mrp)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Max Retail Price</div>
              </div>

              <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-center">
                <div className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold uppercase">
                  PTR
                </div>
                <div className="text-sm font-bold text-sky-900 dark:text-sky-100 mt-0.5">
                  {formatCurrency(product.ptr)}
                </div>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">Price to Chemist</div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-center">
                <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold uppercase">
                  PTS
                </div>
                <div className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mt-0.5">
                  {formatCurrency(product.pts)}
                </div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">Price to Stockist</div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 text-center">
                <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase">
                  GST Slab
                </div>
                <div className="text-sm font-bold text-amber-900 dark:text-amber-100 mt-0.5">
                  {product.gstPercent}%
                </div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                  Margin: {Math.round(((product.mrp - product.ptr) / product.mrp) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Visual Aids Summary in Details Modal */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                Attached Visual Aids ({product.visualAids?.length || 0})
              </h4>
              {product.visualAids && product.visualAids.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] text-sky-600"
                  onClick={() => onViewVisualAids(product)}
                >
                  View All Decks
                </Button>
              )}
            </div>

            {product.visualAids && product.visualAids.length > 0 ? (
              <div className="space-y-2">
                {product.visualAids.slice(0, 2).map((va) => (
                  <div
                    key={va.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                        {va.type}
                      </span>
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {va.title}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Version {va.version} • Published {formatDate(va.publishedDate || va.publishedAt || "")}
                        </div>
                      </div>
                    </div>
                    <a
                      href={va.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 transition-colors"
                      title="Open Detailing Deck"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic">
                No detailing decks attached for this formulation yet.
              </p>
            )}
          </div>

          {/* Quick action footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              className="text-sky-700 hover:text-sky-800 border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30"
              onClick={() => onEdit(product)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit Formulation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewPresence(product)}
            >
              <Boxes className="h-3.5 w-3.5 mr-1" />
              View Chemist Stock Audits
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Close Specifications
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
