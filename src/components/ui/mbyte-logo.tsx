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
  alt = "MByte - Pharma Field Force Platform",
  priority = false,
}: MByteLogoProps) {
  // Determine source file names based on variant
  const getSrc = (t: "light" | "dark") => {
    switch (variant) {
      case "full":
        return t === "dark" ? "/logo-dark.png" : "/logo-light.png";
      case "compact":
        return t === "dark" ? "/logo-compact-dark.png" : "/logo-compact-light.png";
      case "symbol":
        return t === "dark" ? "/symbol-dark.png" : "/symbol-light.png";
      case "icon":
        return t === "dark" ? "/icon-dark.png" : "/icon-light.png";
    }
  };

  // Default dimensions based on variant
  const getDefaultDimensions = () => {
    switch (variant) {
      case "full":
        return { width: width || 220, height: height || 91 };
      case "compact":
        return { width: width || 160, height: height || 48 };
      case "symbol":
        return { width: width || 44, height: height || 38 };
      case "icon":
        return { width: width || 44, height: height || 44 };
    }
  };

  const dims = getDefaultDimensions();

  if (theme === "dark") {
    return (
      <div className={cn("inline-flex items-center select-none", className)}>
        <Image
          src={getSrc("dark")}
          alt={alt}
          width={dims.width}
          height={dims.height}
          priority={priority}
          className="h-auto w-auto object-contain"
        />
      </div>
    );
  }

  if (theme === "light") {
    return (
      <div className={cn("inline-flex items-center select-none", className)}>
        <Image
          src={getSrc("light")}
          alt={alt}
          width={dims.width}
          height={dims.height}
          priority={priority}
          className="h-auto w-auto object-contain"
        />
      </div>
    );
  }

  // Auto theme: Renders both with CSS classes to prevent flash of wrong theme
  return (
    <div className={cn("inline-flex items-center select-none", className)}>
      <Image
        src={getSrc("light")}
        alt={alt}
        width={dims.width}
        height={dims.height}
        priority={priority}
        className="block dark:hidden h-auto w-auto object-contain"
      />
      <Image
        src={getSrc("dark")}
        alt={alt}
        width={dims.width}
        height={dims.height}
        priority={priority}
        className="hidden dark:block h-auto w-auto object-contain"
      />
    </div>
  );
}
