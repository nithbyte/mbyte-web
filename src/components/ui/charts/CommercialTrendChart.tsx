"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { DailyCommercialTrend } from "@/types";
import { ShoppingCart, Receipt } from "lucide-react";

interface CommercialTrendChartProps {
  data: DailyCommercialTrend[];
  height?: number;
  className?: string;
}

export function CommercialTrendChart({
  data,
  height = 200,
  className = "",
}: CommercialTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<"both" | "orders" | "collections">("both");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400">
        No commercial trend data available
      </div>
    );
  }

  // Calculate maximum value for chart scaling
  const maxOrder = Math.max(...data.map((d) => d.orderAmount), 1);
  const maxCollection = Math.max(...data.map((d) => d.collectionAmount), 1);
  const overallMax = Math.max(maxOrder, maxCollection, 1000);

  const totalOrders = data.reduce((s, d) => s + d.orderAmount, 0);
  const totalCollections = data.reduce((s, d) => s + d.collectionAmount, 0);
  const totalOrderCount = data.reduce((s, d) => s + d.orderCount, 0);
  const totalColCount = data.reduce((s, d) => s + d.collectionCount, 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-sky-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Orders: <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(totalOrders)}</span>
              <span className="text-slate-400 font-normal ml-1">({totalOrderCount} booked)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-emerald-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Collections: <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(totalCollections)}</span>
              <span className="text-slate-400 font-normal ml-1">({totalColCount} receipts)</span>
            </span>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveMetric("both")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeMetric === "both"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Combined
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("orders")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeMetric === "orders"
                ? "bg-sky-500 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Orders Only
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("collections")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeMetric === "collections"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Collections Only
          </button>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="relative pt-6">
        <div
          className="flex items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-2"
          style={{ height }}
        >
          {data.map((item, idx) => {
            const orderPct = Math.min(100, Math.max(6, Math.round((item.orderAmount / overallMax) * 100)));
            const colPct = Math.min(100, Math.max(6, Math.round((item.collectionAmount / overallMax) * 100)));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.date}
                className="relative flex flex-1 flex-col items-center justify-end h-full group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-20 z-30 min-w-[170px] rounded-lg bg-slate-900 p-2 text-xs text-white shadow-xl dark:bg-slate-800 border border-slate-700 pointer-events-none animate-in fade-in zoom-in-95">
                    <div className="font-semibold text-slate-300 pb-1 border-b border-slate-700/60 flex items-center justify-between">
                      <span>{item.label}</span>
                      <span className="text-[10px] text-slate-400">2026</span>
                    </div>
                    {(activeMetric === "both" || activeMetric === "orders") && (
                      <div className="flex items-center justify-between pt-1 text-sky-400">
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" /> Orders ({item.orderCount}):
                        </span>
                        <span className="font-bold text-white">{formatCurrency(item.orderAmount)}</span>
                      </div>
                    )}
                    {(activeMetric === "both" || activeMetric === "collections") && (
                      <div className="flex items-center justify-between pt-1 text-emerald-400">
                        <span className="flex items-center gap-1">
                          <Receipt className="h-3 w-3" /> Collected ({item.collectionCount}):
                        </span>
                        <span className="font-bold text-white">{formatCurrency(item.collectionAmount)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bars Container */}
                <div className="flex items-end justify-center gap-1 w-full max-w-[44px]">
                  {/* Order Bar */}
                  {(activeMetric === "both" || activeMetric === "orders") && (
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        isHovered ? "bg-sky-400 scale-y-105" : "bg-sky-500 hover:bg-sky-400"
                      }`}
                      style={{ height: `${orderPct}%` }}
                    />
                  )}

                  {/* Collection Bar */}
                  {(activeMetric === "both" || activeMetric === "collections") && (
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        isHovered ? "bg-emerald-400 scale-y-105" : "bg-emerald-500 hover:bg-emerald-400"
                      }`}
                      style={{ height: `${colPct}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Date Labels */}
        <div className="flex justify-between gap-3 px-2 pt-2">
          {data.map((item, idx) => (
            <div
              key={item.date}
              className={`flex-1 text-center text-[11px] font-medium transition-colors ${
                hoveredIdx === idx
                  ? "text-sky-600 dark:text-sky-400 font-bold"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
