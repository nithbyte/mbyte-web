import React from "react";
import { cn } from "@/lib/utils";

export interface BarChartItem {
  label: string;
  value: number;
  subLabel?: string;
  color?: string;
  formattedValue?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
  className?: string;
}

export function HorizontalBarChart({
  data,
  maxValue,
  showValues = true,
  className,
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => {
        const percent = Math.min(100, Math.round((item.value / max) * 100));
        return (
          <div key={item.label + index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                {item.subLabel && (
                  <span className="text-[11px] text-slate-400">{item.subLabel}</span>
                )}
                {showValues && (
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {item.formattedValue || item.value}
                  </span>
                )}
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  item.color || "bg-sky-600"
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function VerticalBarChart({
  data,
  maxValue,
  height = 140,
  className,
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("flex flex-col justify-end", className)}>
      <div
        className="flex items-end justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800"
        style={{ height }}
      >
        {data.map((item, index) => {
          const heightPercent = Math.min(100, Math.max(8, Math.round((item.value / max) * 100)));
          return (
            <div
              key={item.label + index}
              className="group relative flex flex-1 flex-col items-center justify-end h-full"
            >
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 z-10 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white transition-opacity shadow-md whitespace-nowrap">
                {item.label}: {item.formattedValue || item.value}
              </div>

              <div
                className={cn(
                  "w-full max-w-[32px] rounded-t-md transition-all duration-500 ease-out group-hover:opacity-90",
                  item.color || "bg-sky-600"
                )}
                style={{ height: `${heightPercent}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels below */}
      <div className="flex justify-between gap-2 pt-2">
        {data.map((item, index) => (
          <div
            key={item.label + index}
            className="flex-1 text-center text-[10px] font-medium text-slate-500 truncate"
            title={item.label}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
