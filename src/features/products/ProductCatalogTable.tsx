"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import {
  Package,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  BookOpen,
  Boxes,
  Upload,
  Pencil,
} from "lucide-react";

interface ProductCatalogTableProps {
  products?: Product[];
  isLoading: boolean;
  totalProducts: number;
  onResetFilters: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenVisualAidsModal: (product: Product) => void;
  onOpenPresenceModal: (product: Product) => void;
  onOpenUploadVA: (product: Product) => void;
}

export const ProductCatalogTable: React.FC<ProductCatalogTableProps> = ({
  products,
  isLoading,
  totalProducts,
  onResetFilters,
  onSelectProduct,
  onOpenEditProduct,
  onOpenVisualAidsModal,
  onOpenPresenceModal,
  onOpenUploadVA,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Package className="h-4 w-4 text-sky-600" />
            Pharmaceutical Product Catalog
          </CardTitle>
          <CardDescription>
            Detailed brand formulations, molecular composition, pricing structure, detailing assets, and retail presence
          </CardDescription>
        </div>
        <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Showing {totalProducts} products
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Formulations Found"
              description="No pharmaceutical products match your current search query or category/status filters."
              actionLabel="Reset All Filters"
              onAction={onResetFilters}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Brand & Molecule</TableHead>
                <TableHead>SKU & Pack Size</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Pricing Structure</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visual Aids</TableHead>
                <TableHead>Presence Summary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const presence = p.presenceSummary;
                const visualAidList = p.visualAids || [];

                return (
                  <TableRow key={p.id}>
                    {/* Thumbnail */}
                    <TableCell className="pr-0">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </TableCell>

                    {/* Name and Generic */}
                    <TableCell>
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="text-left font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-sky-600 transition-colors"
                      >
                        {p.name}
                      </button>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                        {p.genericName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.dosageForm} • {p.strength}
                      </div>
                    </TableCell>

                    {/* SKU & Pack */}
                    <TableCell>
                      <span className="inline-block text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {p.sku}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.packSize}</div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {p.categoryName}
                      </Badge>
                    </TableCell>

                    {/* Pricing */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          MRP: {formatCurrency(p.mrp)}
                        </div>
                        <div className="text-[11px] text-sky-700 dark:text-sky-400 font-medium">
                          PTR: {formatCurrency(p.ptr)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          PTS: {formatCurrency(p.pts)} • GST {p.gstPercent}%
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {p.isActive ? (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    {/* Visual Aids */}
                    <TableCell>
                      {visualAidList.length > 0 ? (
                        <button
                          onClick={() => onOpenVisualAidsModal(p)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                          title="Click to view detailing decks"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                          <span>{visualAidList.length} Decks</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None</span>
                      )}
                    </TableCell>

                    {/* Presence Summary */}
                    <TableCell>
                      {presence && presence.totalAudits > 0 ? (
                        <button
                          onClick={() => onOpenPresenceModal(p)}
                          className="text-left group cursor-pointer"
                          title="Click for full presence audit breakdown"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 transition-colors">
                              {presence.availabilityRate}% Available
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({presence.totalAudits} audits)
                            </span>
                          </div>
                          <div className="w-28 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{
                                width: `${(presence.availableCount / presence.totalAudits) * 100}%`,
                              }}
                              title={`Available: ${presence.availableCount}`}
                            />
                            <div
                              className="bg-amber-400 h-full"
                              style={{
                                width: `${(presence.lowStockCount / presence.totalAudits) * 100}%`,
                              }}
                              title={`Low Stock: ${presence.lowStockCount}`}
                            />
                            <div
                              className="bg-rose-500 h-full"
                              style={{
                                width: `${(presence.outOfStockCount / presence.totalAudits) * 100}%`,
                              }}
                              title={`Out of Stock: ${presence.outOfStockCount}`}
                            />
                          </div>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">No audits yet</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-slate-600 hover:text-sky-600"
                          onClick={() => onSelectProduct(p)}
                          title="Full Product Specifications"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs text-sky-700 hover:text-sky-800 border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100"
                          onClick={() => onOpenEditProduct(p)}
                          title="Edit Formulation & Commercial Pricing"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs text-amber-700 hover:text-amber-800 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100"
                          onClick={() => onOpenUploadVA(p)}
                          title="Upload Visual Aid for this product"
                        >
                          <Upload className="h-3.5 w-3.5 mr-1" />
                          Add Visual Aid
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 border-slate-200 dark:border-slate-800"
                          onClick={() => onOpenPresenceModal(p)}
                          title="View Chemist Stock Audits"
                        >
                          <Boxes className="h-3.5 w-3.5 mr-1 text-sky-600" />
                          Presence
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
