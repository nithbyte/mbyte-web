/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
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
import { useProducts, useProductCategories, useVisualAids } from "@/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Product } from "@/types";
import {
  Package,
  Search,
  Filter,
  RotateCcw,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  Layers,
  Percent,
  Tag,
  Boxes,
  BookOpen,
  Compass,
} from "lucide-react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Queries
  const { data: categories } = useProductCategories();
  const { data: allVisualAids } = useVisualAids();
  const { data: products, isLoading } = useProducts({
    search,
    categoryId: selectedCategory,
    status: selectedStatus,
  });

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [visualAidsModalProduct, setVisualAidsModalProduct] = useState<Product | null>(null);
  const [presenceModalProduct, setPresenceModalProduct] = useState<Product | null>(null);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  };

  // KPI Calculations
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p) => p.isActive).length || 0;
  const totalVisualAids = allVisualAids?.length || 0;
  const avgAvailability =
    products && products.length > 0
      ? Math.round(
          products.reduce(
            (acc, p) => acc + (p.presenceSummary?.availabilityRate || 0),
            0
          ) / products.length
        )
      : 80;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmaceutical Product Management & Formulations"
        description="Comprehensive SKU registry, category classification, commercial price structures, detailing visual aids, and field presence audits."
        badge={<Badge variant="default">{totalProducts} Formulations Listed</Badge>}
        actions={
          <Link href="/products/presence">
            <Button variant="primary" size="sm" className="h-8 gap-1.5 text-xs">
              <Compass className="h-3.5 w-3.5" />
              <span>Presence Intelligence & GIS Map</span>
            </Button>
          </Link>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Formulations</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalProducts}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {activeProducts} Active in Distribution
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Therapeutic Lines</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {categories?.length || 4}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Cardio, Diabetic, Pain & Gastro</p>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Visual Detailing Aids</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalVisualAids}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-2">
            Interactive Field Decks
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Chemist Presence Rate</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {avgAvailability}%
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Verified in Retail Audits</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Search Products & Active Ingredients
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search brand name, generic molecule, SKU, or pack size..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Therapeutic Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Therapeutic Categories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.productCount || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Market Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active in Market</option>
                <option value="INACTIVE">Inactive / Hold</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 gap-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 mt-6 shrink-0"
              title="Reset Search and Filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table */}
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
                onAction={handleResetFilters}
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
                            onClick={() => setSelectedProduct(p)}
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
                              onClick={() => setVisualAidsModalProduct(p)}
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
                              onClick={() => setPresenceModalProduct(p)}
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
                              onClick={() => setSelectedProduct(p)}
                              title="Full Product Specifications"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 border-slate-200 dark:border-slate-800"
                              onClick={() => setPresenceModalProduct(p)}
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

      {/* MODAL 1: FULL PRODUCT DETAILS & SPECIFICATIONS */}
      <Modal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || "Product Details"}
        description={`${selectedProduct?.genericName} • SKU: ${selectedProduct?.sku}`}
      >
        {selectedProduct && (
          <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
            {/* Top Banner with Image and Core Info */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="h-24 w-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shrink-0">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedProduct.name}
                  </h3>
                  <Badge variant={selectedProduct.isActive ? "success" : "secondary"}>
                    {selectedProduct.isActive ? "Active in Distribution" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {selectedProduct.genericName}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <Tag className="h-3 w-3 text-sky-600" />
                    {selectedProduct.categoryName}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
                    SKU: {selectedProduct.sku}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {selectedProduct.dosageForm} ({selectedProduct.packSize})
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
                {selectedProduct.description}
              </p>

              {selectedProduct.indications && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Indications: </span>
                  <span className="text-slate-600 dark:text-slate-400">{selectedProduct.indications}</span>
                </div>
              )}

              {selectedProduct.contraindications && (
                <div>
                  <span className="font-semibold text-rose-700 dark:text-rose-400">Contraindications: </span>
                  <span className="text-slate-600 dark:text-slate-400">{selectedProduct.contraindications}</span>
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
                    {formatCurrency(selectedProduct.mrp)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Max Retail Price</div>
                </div>

                <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-center">
                  <div className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold uppercase">
                    PTR
                  </div>
                  <div className="text-sm font-bold text-sky-900 dark:text-sky-100 mt-0.5">
                    {formatCurrency(selectedProduct.ptr)}
                  </div>
                  <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">Price to Chemist</div>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-center">
                  <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold uppercase">
                    PTS
                  </div>
                  <div className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mt-0.5">
                    {formatCurrency(selectedProduct.pts)}
                  </div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">Price to Stockist</div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 text-center">
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase">
                    GST Slab
                  </div>
                  <div className="text-sm font-bold text-amber-900 dark:text-amber-100 mt-0.5">
                    {selectedProduct.gstPercent}%
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                    Margin: {Math.round(((selectedProduct.mrp - selectedProduct.ptr) / selectedProduct.mrp) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Aids Summary in Details Modal */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                  Attached Visual Aids ({selectedProduct.visualAids?.length || 0})
                </h4>
                {selectedProduct.visualAids && selectedProduct.visualAids.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-sky-600"
                    onClick={() => {
                      const prod = selectedProduct;
                      setSelectedProduct(null);
                      setVisualAidsModalProduct(prod);
                    }}
                  >
                    View All Decks
                  </Button>
                )}
              </div>

              {selectedProduct.visualAids && selectedProduct.visualAids.length > 0 ? (
                <div className="space-y-2">
                  {selectedProduct.visualAids.slice(0, 2).map((va) => (
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
                onClick={() => {
                  const prod = selectedProduct;
                  setSelectedProduct(null);
                  setPresenceModalProduct(prod);
                }}
              >
                <Boxes className="h-3.5 w-3.5 mr-1" />
                View Chemist Stock Audits
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedProduct(null)}
              >
                Close Specifications
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: VISUAL AIDS EXPLORER MODAL */}
      <Modal
        isOpen={Boolean(visualAidsModalProduct)}
        onClose={() => setVisualAidsModalProduct(null)}
        title={`Clinical Visual Aids: ${visualAidsModalProduct?.name}`}
        description={`Interactive detailing presentations, clinical trial evidence, and promotional collateral for medical representatives.`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {visualAidsModalProduct?.visualAids && visualAidsModalProduct.visualAids.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {visualAidsModalProduct.visualAids.map((va) => (
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
              onClick={() => setVisualAidsModalProduct(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: PRODUCT PRESENCE SUMMARY & AUDIT LOG */}
      <Modal
        isOpen={Boolean(presenceModalProduct)}
        onClose={() => setPresenceModalProduct(null)}
        title={`Retail Chemist Presence Summary: ${presenceModalProduct?.name}`}
        description={`Stock availability rate, low stock alerts, and chemist shelf audits recorded by MRs in the field.`}
      >
        {presenceModalProduct && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Overview Stats */}
            {presenceModalProduct.presenceSummary && (
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Audits</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {presenceModalProduct.presenceSummary.totalAudits}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                    Available
                  </div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {presenceModalProduct.presenceSummary.availableCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase">
                    Low Stock
                  </div>
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {presenceModalProduct.presenceSummary.lowStockCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50">
                  <div className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold uppercase">
                    Out of Stock
                  </div>
                  <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {presenceModalProduct.presenceSummary.outOfStockCount}
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

              {presenceModalProduct.presenceSummary?.recentAudits &&
              presenceModalProduct.presenceSummary.recentAudits.length > 0 ? (
                <div className="space-y-2">
                  {presenceModalProduct.presenceSummary.recentAudits.map((audit) => (
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
                onClick={() => setPresenceModalProduct(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
