import React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

interface TargetGaugeProps {
  monthlyTarget: number;
  monthlyAchieved: number;
  achievementRate: number;
  benchmarkRate: number;
  pacingStatus: "ON_TRACK" | "BEHIND" | "AHEAD";
  className?: string;
}

export function TargetGauge({
  monthlyTarget,
  monthlyAchieved,
  achievementRate,
  benchmarkRate,
  pacingStatus,
  className,
}: TargetGaugeProps) {
  const isAhead = pacingStatus === "AHEAD" || pacingStatus === "ON_TRACK";

  return (
    <div className={cn("space-y-4 rounded-xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900", className)}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Monthly Sales Quota Pacing (October 2026)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(monthlyAchieved)}
            </span>
            <span className="text-xs text-slate-500">
              / {formatCurrency(monthlyTarget)} Target
            </span>
          </div>
        </div>

        <Badge
          variant={isAhead ? "success" : "destructive"}
          className="gap-1.5 px-2.5 py-1 text-xs"
        >
          {isAhead ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {pacingStatus.replace("_", " ")}
        </Badge>
      </div>

      {/* Target Progress Bar with Benchmark Marker */}
      <div className="space-y-2">
        <div className="relative h-4 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
          {/* Current Achieved fill */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              isAhead ? "bg-gradient-to-r from-sky-500 to-emerald-500" : "bg-amber-500"
            )}
            style={{ width: `${Math.min(100, achievementRate)}%` }}
          />

          {/* Benchmark line marker (Day 8 of 31 ≈ 26%) */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-900 dark:bg-white z-10 opacity-70"
            style={{ left: `${benchmarkRate}%` }}
            title={`Day-8 Run Rate Target: ${benchmarkRate}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Current: {achievementRate}% Achieved
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Target className="h-3 w-3 text-slate-400" />
            Day-8 Expected Run-Rate: {benchmarkRate}%
          </span>
          <span>Target: 100%</span>
        </div>
      </div>
    </div>
  );
}
