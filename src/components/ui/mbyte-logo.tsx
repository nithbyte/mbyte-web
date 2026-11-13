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
        return { width: width || 220, height: height || 90 };
      case "compact":
        return { width: width || 170, height: height || 46 };
      case "symbol":
        return { width: width || 42, height: height || 40 };
      case "icon":
        return { width: width || 36, height: height || 34 };
    }
  };

  const dims = getDefaultDimensions();
  const isEmblem = variant === "symbol" || variant === "icon";

  // Dedicated 3D M-Capsule Emblem
  if (isEmblem) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center select-none shrink-0",
          className
        )}
        style={{ width: dims.width, height: dims.height }}
      >
        <Image
          src="/mbyte-emblem.png"
          alt={alt}
          width={dims.width}
          height={dims.height}
          priority={priority}
          className="w-full h-full object-contain filter drop-shadow(0 2px 8px rgba(255,107,0,0.2))"
        />
      </div>
    );
  }

  const lightSrc =
    variant === "full"
      ? "/brand/mbyte-logo-light.png"
      : "/brand/mbyte-logo-compact-light.png";

  const darkSrc =
    variant === "full"
      ? "/brand/mbyte-logo-dark.png"
      : "/brand/mbyte-logo-compact-dark.png";

  // Explicit theme
  if (theme === "dark") {
    return (
      <div className={cn("inline-flex items-center select-none shrink-0", className)}>
        <Image
          src={darkSrc}
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
          src={lightSrc}
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
        src={lightSrc}
        alt={alt}
        width={dims.width}
        height={dims.height}
        priority={priority}
        className="block dark:hidden h-auto max-w-full object-contain"
      />
      <Image
        src={darkSrc}
        alt={alt}
        width={dims.width}
        height={dims.height}
        priority={priority}
        className="hidden dark:block h-auto max-w-full object-contain"
      />
    </div>
  );
}
