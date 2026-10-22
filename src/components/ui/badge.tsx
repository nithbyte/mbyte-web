import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B00] dark:focus:ring-[#FF6B00] focus:ring-offset-2 tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900",
        secondary:
          "border-transparent bg-[#F5F3EE] text-slate-800 hover:bg-[#EDEAE3] dark:bg-[#2C2C2C] dark:text-[#F5F3EE]",
        destructive:
          "border-transparent bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
        outline: "text-slate-700 border-[#E5E1D9] dark:text-slate-200 dark:border-[#333333] dark:bg-[#242424]",
        success:
          "border-emerald-200 bg-emerald-50 text-[#15803D] dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        warning:
          "border-amber-200 bg-amber-50 text-[#B45309] dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        info: "border-blue-200 bg-blue-50 text-[#2563EB] dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        brand: "border-orange-200 bg-orange-50 text-[#FF6B00] dark:border-orange-900/60 dark:bg-[#FF6B00]/10 dark:text-[#FF6B00]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
