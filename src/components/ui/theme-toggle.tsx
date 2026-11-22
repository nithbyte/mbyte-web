"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/60 backdrop-blur-xl text-slate-600 hover:bg-white/90 hover:border-white shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] transition-all cursor-pointer",
        className
      )}
      title={resolvedTheme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-sky-400" />
      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}
        </span>
      )}
    </button>
  );
}
