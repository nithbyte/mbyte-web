"use client";

import React, { useState, useMemo } from "react";
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
import {
  usePresenceAudits,
  usePresenceCounts,
  useAuditDates,
  useProducts,
  useTerritories,
  usePharmacies,
  useMRList,
} from "@/hooks";
import { formatDate } from "@/lib/utils";
import type { ProductPresenceAudit, ProductPresenceStatus, PresenceQueryParams } from "@/types";
import {
  MapPin,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Boxes,
  Eye,
  Calendar,
  User,
  Building2,
  Package,
  Compass,
  Radio,
  FileSpreadsheet,
} from "lucide-react";

export default function ProductPresencePage() {
  // Filter States
  const [selectedProduct, setSelectedProduct] = useState("ALL");
  const [selectedTerritory, setSelectedTerritory] = useState("ALL");
  const [selectedMR, setSelectedMR] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  // UI View Mode (Table vs Map vs Both)
  const [viewTab, setViewTab] = useState<"ALL" | "MAP_ONLY" | "TABLE_ONLY">("ALL");
  const [mapLayer, setMapLayer] = useState<"ROADMAP" | "SATELLITE" | "HEATMAP">("ROADMAP");
  const [pinnedAudit, setPinnedAudit] = useState<ProductPresenceAudit | null>(null);
  const [inspectedAudit, setInspectedAudit] = useState<ProductPresenceAudit | null>(null);

  // Filter params object
  const queryParams: PresenceQueryParams = useMemo(
    () => ({
      productId: selectedProduct,
      territoryId: selectedTerritory,
      mrId: selectedMR,
      pharmacyId: selectedCustomer,
      date: selectedDate,
      status: selectedStatus,
      search,
    }),
    [selectedProduct, selectedTerritory, selectedMR, selectedCustomer, selectedDate, selectedStatus, search]
  );

  // Queries
  const { data: audits, isLoading } = usePresenceAudits(queryParams);
  const { data: counts } = usePresenceCounts(queryParams);
  const { data: products } = useProducts();
  const { data: territories } = useTerritories();
  const { data: pharmacies } = usePharmacies();
  const { data: mrList } = useMRList();
  const { data: auditDates } = useAuditDates();

  const handleResetFilters = () => {
    setSelectedProduct("ALL");
    setSelectedTerritory("ALL");
    setSelectedMR("ALL");
    setSelectedCustomer("ALL");
    setSelectedDate("ALL");
    setSelectedStatus("ALL");
    setSearch("");
  };

  const hasActiveFilters =
    selectedProduct !== "ALL" ||
    selectedTerritory !== "ALL" ||
    selectedMR !== "ALL" ||
    selectedCustomer !== "ALL" ||
    selectedDate !== "ALL" ||
    selectedStatus !== "ALL" ||
    Boolean(search.trim());

  // Status badge styling helper
  const getStatusBadge = (status: ProductPresenceStatus, quantity?: number) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <Badge variant="success" className="gap-1 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            <span>AVAILABLE</span>
            {quantity !== undefined && <span className="opacity-80">({quantity})</span>}
          </Badge>
        );
      case "LOW_STOCK":
        return (
          <Badge variant="warning" className="gap-1 text-[11px] font-semibold">
            <AlertTriangle className="h-3 w-3" />
            <span>LOW STOCK</span>
            {quantity !== undefined && <span className="opacity-80">({quantity})</span>}
          </Badge>
        );
      case "OUT_OF_STOCK":
        return (
          <Badge variant="destructive" className="gap-1 text-[11px] font-semibold">
            <XCircle className="h-3 w-3" />
            <span>OUT OF STOCK</span>
          </Badge>
        );
      case "UNKNOWN":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[11px] font-semibold">
            <HelpCircle className="h-3 w-3" />
            <span>UNKNOWN</span>
          </Badge>
        );
    }
  };

  // Map pin color helper
  const getPinColor = (status: ProductPresenceStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-500 text-white border-emerald-300 ring-emerald-400";
      case "LOW_STOCK":
        return "bg-amber-500 text-white border-amber-300 ring-amber-400 animate-pulse";
      case "OUT_OF_STOCK":
        return "bg-rose-600 text-white border-rose-300 ring-rose-500 animate-pulse";
      case "UNKNOWN":
      default:
        return "bg-slate-500 text-white border-slate-300 ring-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Product Presence & Stock Intelligence"
        description="Comprehensive retail shelf availability telemetry, stock shortages, MR field audits, and geospatial distribution."
        badge={
          <Badge variant="default" className="gap-1">
            <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
            <span>{counts?.total || 0} Shelf Audits Logged</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/products">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Package className="h-3.5 w-3.5" />
                <span>Formulations Catalog</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                alert(`Exporting telemetry report for ${counts?.total || 0} audit records.`);
              }}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export Telemetry</span>
            </Button>
          </div>
        }
      />

      {/* COUNTS & SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* TOTAL AUDITS */}
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Audits</span>
            <Boxes className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {counts?.total || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Checked across retail pharmacies</p>
        </Card>

        {/* AVAILABLE COUNT */}
        <Card
          onClick={() => setSelectedStatus(selectedStatus === "AVAILABLE" ? "ALL" : "AVAILABLE")}
          className={`p-4 cursor-pointer transition-all border ${
            selectedStatus === "AVAILABLE"
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Available
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {counts?.available || 0}
          </div>
          <p className="text-[11px] text-emerald-600/80 font-medium mt-1">
            {counts?.total ? Math.round(((counts.available || 0) / counts.total) * 100) : 0}% of
            shelf audits
          </p>
        </Card>

        {/* LOW STOCK COUNT */}
        <Card
          onClick={() => setSelectedStatus(selectedStatus === "LOW_STOCK" ? "ALL" : "LOW_STOCK")}
          className={`p-4 cursor-pointer transition-all border ${
            selectedStatus === "LOW_STOCK"
              ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Low Stock
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {counts?.lowStock || 0}
          </div>
          <p className="text-[11px] text-amber-600/80 font-medium mt-1">
            {counts?.total ? Math.round(((counts.lowStock || 0) / counts.total) * 100) : 0}% replenishment needed
          </p>
        </Card>

        {/* OUT OF STOCK COUNT */}
        <Card
          onClick={() => setSelectedStatus(selectedStatus === "OUT_OF_STOCK" ? "ALL" : "OUT_OF_STOCK")}
          className={`p-4 cursor-pointer transition-all border ${
            selectedStatus === "OUT_OF_STOCK"
              ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              Out of Stock
            </span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {counts?.outOfStock || 0}
          </div>
          <p className="text-[11px] text-rose-600/80 font-medium mt-1">
            {counts?.total ? Math.round(((counts.outOfStock || 0) / counts.total) * 100) : 0}% stock-out risk
          </p>
        </Card>

        {/* UNKNOWN COUNT */}
        <Card
          onClick={() => setSelectedStatus(selectedStatus === "UNKNOWN" ? "ALL" : "UNKNOWN")}
          className={`p-4 cursor-pointer transition-all border ${
            selectedStatus === "UNKNOWN"
              ? "border-slate-500 bg-slate-100/50 dark:bg-slate-800/50 ring-2 ring-slate-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Unknown Status
            </span>
            <HelpCircle className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
            {counts?.unknown || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pending physical verification
          </p>
        </Card>
      </div>

      {/* OVERALL SHELF RATIO PROGRESS BAR */}
      {counts && counts.total > 0 && (
        <Card className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5 text-sky-600" />
              Aggregate Retail Shelf Health: {counts.availabilityRate}% Available
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Available ({counts.available})
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Low Stock ({counts.lowStock})
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Out of Stock ({counts.outOfStock})
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Unknown ({counts.unknown})
              </span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${(counts.available / counts.total) * 100}%` }}
              title={`Available: ${counts.available}`}
            />
            <div
              className="bg-amber-400 h-full transition-all"
              style={{ width: `${(counts.lowStock / counts.total) * 100}%` }}
              title={`Low Stock: ${counts.lowStock}`}
            />
            <div
              className="bg-rose-500 h-full transition-all"
              style={{ width: `${(counts.outOfStock / counts.total) * 100}%` }}
              title={`Out of Stock: ${counts.outOfStock}`}
            />
            <div
              className="bg-slate-400 h-full transition-all"
              style={{ width: `${(counts.unknown / counts.total) * 100}%` }}
              title={`Unknown: ${counts.unknown}`}
            />
          </div>
        </Card>
      )}

      {/* MULTI-FILTER TOOLBAR */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-sky-600" />
              Presence Telemetry Filters
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 text-[11px] gap-1 text-slate-500 hover:text-slate-900"
              >
                <RotateCcw className="h-3 w-3" />
                Reset All Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. PRODUCT FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Product Formulation
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Products</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. TERRITORY FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Territory Zone
              </label>
              <select
                value={selectedTerritory}
                onChange={(e) => setSelectedTerritory(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Territories</option>
                {territories?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. MR FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Field Representative
              </label>
              <select
                value={selectedMR}
                onChange={(e) => setSelectedMR(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All MRs</option>
                {mrList?.map((mr) => (
                  <option key={mr.id} value={mr.id}>
                    {mr.name} ({mr.employeeId})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. CUSTOMER (PHARMACY) FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Chemist / Pharmacy
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Pharmacies</option>
                {pharmacies?.map((phm) => (
                  <option key={phm.id} value={phm.id}>
                    {phm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. DATE FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Audit Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Dates</option>
                {auditDates?.map((d) => (
                  <option key={d} value={d}>
                    {formatDate(d)}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. STATUS FILTER */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Shelf Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="LOW_STOCK">LOW STOCK</option>
                <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="flex items-center gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customer name, product, MR name, batch number, or field notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900 shrink-0">
              <button
                onClick={() => setViewTab("ALL")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewTab === "ALL"
                    ? "bg-white dark:bg-slate-800 text-sky-600 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewTab("MAP_ONLY")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewTab === "MAP_ONLY"
                    ? "bg-white dark:bg-slate-800 text-sky-600 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Map View
              </button>
              <button
                onClick={() => setViewTab("TABLE_ONLY")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewTab === "TABLE_ONLY"
                    ? "bg-white dark:bg-slate-800 text-sky-600 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Table View
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* MAP PLACEHOLDER FOR GOOGLE MAPS INTEGRATION */}
      {(viewTab === "ALL" || viewTab === "MAP_ONLY") && (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
          <CardHeader className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Compass className="h-4 w-4 text-sky-600" />
                Geospatial Retail Shelf Stock Map
              </CardTitle>
              <CardDescription className="text-xs">
                Interactive GIS telemetry map designed for future Google Maps API integration (`@react-google-maps/api`)
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Google Maps JS API v3 Ready • ID: mbyte_pharma_gis
              </span>

              <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-950 text-[11px]">
                <button
                  onClick={() => setMapLayer("ROADMAP")}
                  className={`px-2 py-0.5 rounded ${
                    mapLayer === "ROADMAP" ? "bg-sky-50 text-sky-600 font-semibold" : "text-slate-500"
                  }`}
                >
                  Roadmap
                </button>
                <button
                  onClick={() => setMapLayer("SATELLITE")}
                  className={`px-2 py-0.5 rounded ${
                    mapLayer === "SATELLITE" ? "bg-sky-50 text-sky-600 font-semibold" : "text-slate-500"
                  }`}
                >
                  Satellite
                </button>
                <button
                  onClick={() => setMapLayer("HEATMAP")}
                  className={`px-2 py-0.5 rounded ${
                    mapLayer === "HEATMAP" ? "bg-sky-50 text-sky-600 font-semibold" : "text-slate-500"
                  }`}
                >
                  Heatmap
                </button>
              </div>
            </div>
          </CardHeader>

          {/* Map Visual Canvas */}
          <div className="relative h-80 w-full bg-slate-900 overflow-hidden select-none">
            {/* Simulated Geospatial Grid Background */}
            <div
              className={`absolute inset-0 opacity-40 ${
                mapLayer === "SATELLITE"
                  ? "bg-gradient-to-br from-emerald-950 via-slate-900 to-sky-950"
                  : mapLayer === "HEATMAP"
                  ? "bg-gradient-to-tr from-rose-950/40 via-amber-950/30 to-emerald-950/40"
                  : "bg-slate-900"
              }`}
              style={{
                backgroundImage:
                  "radial-gradient(#38bdf8 0.75px, transparent 0.75px), radial-gradient(#64748b 0.75px, #0f172a 0.75px)",
                backgroundSize: "30px 30px",
                backgroundPosition: "0 0, 15px 15px",
              }}
            />

            {/* Simulated Road Lines / Coordinate vectors */}
            <svg className="absolute inset-0 h-full w-full opacity-30 stroke-sky-500/40" fill="none">
              <path d="M-50,120 Q300,80 600,190 T1400,100" strokeWidth="2.5" />
              <path d="M120,-20 Q200,200 450,220 T900,320" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M400,-10 L420,400" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M800,-10 L820,400" strokeWidth="1" strokeDasharray="3 3" />
            </svg>

            {/* Radar scan animation on map */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full border border-sky-500/20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full border border-sky-500/30 pointer-events-none" />

            {/* Map Territory Label */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5 font-mono">
              <MapPin className="h-3 w-3 text-rose-500" />
              <span>Center: Madurai Central (9.9252° N, 78.1198° E) • Zoom: 12.5x</span>
            </div>

            {/* Pins on the Map */}
            <div className="absolute inset-0 p-8">
              {audits && audits.length > 0 ? (
                audits.slice(0, 18).map((audit, index) => {
                  // Distribute pins dynamically across map canvas
                  const topPercent = 20 + ((index * 37) % 65);
                  const leftPercent = 10 + ((index * 49) % 80);

                  return (
                    <div
                      key={audit.id}
                      style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                      className="absolute group -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                      onClick={() => setPinnedAudit(audit)}
                    >
                      {/* Pin marker */}
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform group-hover:scale-125 ${getPinColor(
                          audit.status
                        )}`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </div>

                      {/* Hover Tooltip */}
                      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                        <div className="bg-slate-900/95 text-white text-[11px] p-2 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap min-w-[160px]">
                          <div className="font-bold text-sky-400">{audit.pharmacyName}</div>
                          <div className="text-slate-300 font-medium">{audit.productName}</div>
                          <div className="flex items-center justify-between gap-2 mt-1 pt-1 border-t border-slate-800 text-[10px]">
                            <span className="font-mono text-slate-400">{audit.status}</span>
                            <span className="text-emerald-400 font-bold">
                              {audit.currentQuantity ?? audit.quantity} units
                            </span>
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No geolocation coordinates match current filter.
                </div>
              )}
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-[10px] uppercase text-slate-400 mb-1">
                Stock Status Map Legend
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Low Stock
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Out of Stock
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  Unknown
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* PRESENCE AUDITS TABLE */}
      {(viewTab === "ALL" || viewTab === "TABLE_ONLY") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="h-4 w-4 text-sky-600" />
                Verified Retail Chemist Shelf Audits
              </CardTitle>
              <CardDescription>
                Live field observations recorded by Medical Representatives during detailing calls
              </CardDescription>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {audits?.length || 0} audit records
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer (Pharmacy)</TableHead>
                    <TableHead>Product Formulation</TableHead>
                    <TableHead>Shelf Status</TableHead>
                    <TableHead>Medical Representative (MR)</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Territory</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits && audits.length > 0 ? (
                    audits.map((a) => (
                      <TableRow key={a.id}>
                        {/* 1. CUSTOMER */}
                        <TableCell>
                          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{a.pharmacyName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs pl-5">
                            {a.pharmacyAddress || "Madurai Commercial Zone"}
                          </div>
                        </TableCell>

                        {/* 2. PRODUCT */}
                        <TableCell>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {a.productName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            SKU: {a.productSku || "NP-01"}
                          </div>
                        </TableCell>

                        {/* 3. STATUS */}
                        <TableCell>
                          {getStatusBadge(a.status, a.currentQuantity ?? a.quantity)}
                        </TableCell>

                        {/* 4. MR */}
                        <TableCell>
                          <div className="font-medium text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>{a.mrName || "Field MR"}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 pl-5">
                            {a.employeeCode || a.mrId}
                          </div>
                        </TableCell>

                        {/* 5. LAST CHECKED */}
                        <TableCell>
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formatDate(a.checkedAt || a.auditedAt)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pl-4">
                            Batch: {a.batchNumber || "BT-2026"}
                          </div>
                        </TableCell>

                        {/* 6. TERRITORY */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                            <span>{a.territoryName || "Madurai North"}</span>
                          </div>
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-slate-600 hover:text-sky-600"
                            onClick={() => setInspectedAudit(a)}
                            title="Inspect Audit Record"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-500 text-xs">
                        No product presence audits match the specified filter combinations.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: PIN CLICKED DETAILS (FROM MAP) */}
      <Modal
        isOpen={Boolean(pinnedAudit)}
        onClose={() => setPinnedAudit(null)}
        title={pinnedAudit ? `Pharmacy Audit: ${pinnedAudit.pharmacyName}` : "Audit Pin"}
        description="Geospatial retail telemetry snapshot from field representative detailing visit"
      >
        {pinnedAudit && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {pinnedAudit.productName}
                </span>
                {getStatusBadge(pinnedAudit.status, pinnedAudit.currentQuantity ?? pinnedAudit.quantity)}
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Chemist: {pinnedAudit.pharmacyName} • Territory: {pinnedAudit.territoryName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
                <div className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold uppercase">
                  Audited Quantity
                </div>
                <div className="text-base font-bold text-sky-900 dark:text-sky-100 mt-0.5">
                  {pinnedAudit.currentQuantity ?? pinnedAudit.quantity ?? 0} Units
                </div>
              </div>

              <div className="p-2.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold uppercase">
                  Auditor Representative
                </div>
                <div className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mt-0.5">
                  {pinnedAudit.mrName || "Field Rep"}
                </div>
              </div>
            </div>

            <div className="space-y-1 text-slate-600 dark:text-slate-400">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Address: </span>
                <span>{pinnedAudit.pharmacyAddress}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Coordinates: </span>
                <span className="font-mono">
                  ({pinnedAudit.latitude?.toFixed(4)}, {pinnedAudit.longitude?.toFixed(4)})
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Checked At: </span>
                <span>{formatDate(pinnedAudit.checkedAt || pinnedAudit.auditedAt)}</span>
              </div>
              {pinnedAudit.notes && (
                <div className="pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Field Notes: </span>
                  <p className="italic text-slate-500 bg-white dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                    &ldquo;{pinnedAudit.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={() => setPinnedAudit(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: FULL AUDIT INSPECTION (FROM TABLE) */}
      <Modal
        isOpen={Boolean(inspectedAudit)}
        onClose={() => setInspectedAudit(null)}
        title={inspectedAudit ? `Audit Inspection: ${inspectedAudit.productName}` : "Audit Record"}
        description={`Audit ID #${inspectedAudit?.id} • Shelf stock telemetry log`}
      >
        {inspectedAudit && (
          <div className="space-y-4 text-xs">
            {/* Status overview */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {inspectedAudit.productName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  SKU: {inspectedAudit.productSku || "NP-CAD-01"}
                </div>
              </div>
              <div>
                {getStatusBadge(inspectedAudit.status, inspectedAudit.currentQuantity ?? inspectedAudit.quantity)}
              </div>
            </div>

            {/* Grid specs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Customer / Pharmacy
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {inspectedAudit.pharmacyName}
                </div>
                <div className="text-slate-500 text-[11px]">{inspectedAudit.pharmacyAddress}</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Field Auditor (MR)
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {inspectedAudit.mrName}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Employee Code: {inspectedAudit.employeeCode || "NP-MR-101"}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Stock Inventory & Batch
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {inspectedAudit.currentQuantity ?? inspectedAudit.quantity} Units On Shelf
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Batch: {inspectedAudit.batchNumber} • Exp: {inspectedAudit.expiryDate}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  Territory & Geofence
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {inspectedAudit.territoryName}
                </div>
                <div className="text-emerald-600 font-mono text-[11px]">
                  Verified ({inspectedAudit.latitude?.toFixed(4)}, {inspectedAudit.longitude?.toFixed(4)})
                </div>
              </div>
            </div>

            {/* Field notes */}
            {inspectedAudit.notes && (
              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                  Representative Field Observation Notes:
                </span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed italic">
                  &ldquo;{inspectedAudit.notes}&rdquo;
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={() => setInspectedAudit(null)}>
                Close Audit Record
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
