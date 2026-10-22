"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Package,
  Truck,
  RotateCcw,
  AlertTriangle,
  Building2,
  User,
} from "lucide-react";

interface SampleKpiCardsProps {
  stats: {
    warehouseStock: number;
    mrStock: number;
    inTransitStock: number;
    totalAccountedStock: number;
    totalBatches: number;
    nearExpiryBatches: any[];
    lowStockBatches: any[];
    pendingDispatchesCount: number;
    discrepanciesCount: number;
  };
}

export const SampleKpiCards: React.FC<SampleKpiCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* 1. Total Accounted Stock */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Accounted Units</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalAccountedStock.toLocaleString()}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600">
            <Package className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-mono">
          Across {stats.totalBatches} registered active batches
        </p>
      </Card>

      {/* 2. Warehouse Vault Stock */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Central Warehouse Stock</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.warehouseStock.toLocaleString()}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-2">
          {stats.lowStockBatches.length > 0
            ? `${stats.lowStockBatches.length} batch(es) at threshold alert`
            : "All lines adequately provisioned"}
        </p>
      </Card>

      {/* 3. Field Representative Custody */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Field MR Custody</p>
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.mrStock.toLocaleString()}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <User className="h-5 w-5" />
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
          <span>In rep medical bags</span>
          {stats.inTransitStock > 0 && (
            <span className="font-semibold text-amber-600 font-mono">
              +{stats.inTransitStock} in transit
            </span>
          )}
        </div>
      </Card>

      {/* 4. Near Expiry Alert */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Near-Expiry Attention</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats.nearExpiryBatches.length}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {stats.nearExpiryBatches.length > 0
            ? "Batches expiring within 90 days"
            : "No batches expiring within 90 days"}
        </p>
      </Card>
    </div>
  );
};
