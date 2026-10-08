import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: "sky" | "emerald" | "amber" | "violet" | "indigo" | "rose";
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  progress?: {
    value: number; // 0 to 100
    label?: string;
  };
  className?: string;
}

const colorMap = {
  sky: "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
  amber: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
  violet: "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800",
  rose: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800",
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "sky",
  trend,
  progress,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-900/90",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {value}
          </div>
        </div>

        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border transition-transform hover:scale-105",
            colorMap[iconColor]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(trend || description) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center font-semibold",
                trend.isPositive !== false
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-slate-500 dark:text-slate-400">
              {description}
            </span>
          )}
        </div>
      )}

      {progress && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{progress.label || "Target Progress"}</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {progress.value}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-500 dark:bg-sky-500"
              style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
