"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type MByteLogoVariant = "full" | "compact" | "symbol" | "icon";
export type MByteLogoTheme = "light" | "dark" | "auto";

interface MByteLogoProps {
  variant?: MByteLogoVariant;
  theme?: MByteLogoTheme;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
  priority?: boolean;
}

export function MByteLogo({
  variant = "compact",
  theme = "auto",
  className,
  width,
  height,
  alt = "MByte - Pharma Field-Force Intelligence",
  priority = false,
}: MByteLogoProps) {
  // Dimension definitions preserving visual proportions
  const getDefaultDimensions = () => {
    switch (variant) {
      case "full":
        return { width: width || 220, height: height || 52 };
      case "compact":
        return { width: width || 170, height: height || 40 };
      case "symbol":
        return { width: width || 40, height: height || 40 };
      case "icon":
        return { width: width || 36, height: height || 36 };
    }
  };

  const dims = getDefaultDimensions();
  const isEmblem = variant === "symbol" || variant === "icon";

  // Dedicated minimal geometric M-Pulse SVG for icons and symbols
  if (isEmblem) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-xl bg-[#F5F3EE] p-1.5 border border-[#E5E1D9] dark:bg-[#1E1E1E] dark:border-[#333333] shadow-xs select-none shrink-0",
          className
        )}
        style={{ width: dims.width, height: dims.height }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* M Uprights */}
          <path
            d="M22 78V22L40 46"
            className="stroke-[#171717] dark:stroke-white transition-colors"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M78 78V36L64 50"
            className="stroke-[#171717] dark:stroke-white transition-colors"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Medical Telemetry / Pulse */}
          <path
            d="M22 52H36L44 32L54 74L78 22"
            stroke="#FF6B00"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // Full / Compact horizontal logo presentation
  if (theme === "dark") {
    return (
      <div className={cn("inline-flex items-center select-none shrink-0", className)}>
        <Image
          src="/brand/mbyte-logo-dark.svg"
          alt={alt}
          width={dims.width}
          height={dims.height}
          priority={priority}
          className="h-auto max-w-full object-contain"
        />
      </div>
    );
  }

  if (theme === "light") {
    return (
      <div className={cn("inline-flex items-center select-none shrink-0", className)}>
        <Image
          src="/brand/mbyte-logo.svg"
          alt={alt}
          width={dims.width}
          height={dims.height}
          priority={priority}
          className="h-auto max-w-full object-contain"
        />
      </div>
    );
  }

  // Auto theme (responsive to dark mode)
  return (
    <div className={cn("inline-flex items-center select-none shrink-0", className)}>
      <Image
        src="/brand/mbyte-logo.svg"
        alt={alt}
        width={dims.width}
        height={dims.height}
        priority={priority}
        className="block dark:hidden h-auto max-w-full object-contain"
      />
      <Image
        src="/brand/mbyte-logo-dark.svg"
        alt={alt}
        width={dims.width}
        height={dims.height}
        priority={priority}
        className="hidden dark:block h-auto max-w-full object-contain"
      />
    </div>
  );
}
