"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AtWorkBadgeProps {
  punchInTime?: string | null;
  className?: string;
}

export function AtWorkBadge({ punchInTime, className }: AtWorkBadgeProps) {
  const formattedTime = React.useMemo(() => {
    if (!punchInTime) return null;
    try {
      const d = new Date(punchInTime);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  }, [punchInTime]);

  return (
    <span
      title={formattedTime ? `Punched in at ${formattedTime}` : "Currently punched in for today's shift"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold leading-none text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      <span>At Work</span>
    </span>
  );
}
