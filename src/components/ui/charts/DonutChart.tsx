import React from "react";
import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
  hexColor: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerTitle?: string;
  centerSubtitle?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function DonutChart({
  segments,
  centerTitle,
  centerSubtitle,
  size = 160,
  strokeWidth = 18,
  className,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  // Pre-calculate segments immutably
  const computedSegments = segments.reduce<
    Array<DonutSegment & { fraction: number; offset: number }>
  >((acc, seg, idx) => {
    const prevOffset = idx === 0 ? 0 : acc[idx - 1].offset + acc[idx - 1].fraction;
    const fraction = seg.value / total;
    return [...acc, { ...seg, fraction, offset: prevOffset }];
  }, []);

  return (
    <div className={cn("flex flex-col sm:flex-row items-center gap-6", className)}>
      {/* SVG Donut */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />

          {computedSegments.map((segment, index) => {
            const strokeDasharray = `${segment.fraction * circumference} ${circumference}`;
            const strokeDashoffset = -segment.offset * circumference;

            return (
              <circle
                key={segment.label + index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.hexColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out hover:opacity-80"
              />
            );
          })}
        </svg>

        {/* Center Labels */}
        {(centerTitle || centerSubtitle) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            {centerTitle && (
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {centerTitle}
              </span>
            )}
            {centerSubtitle && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {centerSubtitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5 w-full">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: segment.hexColor }}
              />
              <span className="text-slate-600 dark:text-slate-300 truncate font-medium">
                {segment.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {segment.value}
              </span>
              <span className="text-[11px] text-slate-400 font-mono w-9 text-right">
                {segment.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
