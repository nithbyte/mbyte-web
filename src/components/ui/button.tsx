import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] dark:focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white hover:bg-slate-800 shadow-sm dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200",
        primary:
          "bg-[#FF6B00] text-white hover:bg-[#F45100] active:bg-[#C23B00] shadow-sm dark:bg-[#FF6B00] dark:text-white dark:hover:bg-[#F45100]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-600",
        outline:
          "border border-[#E5E1D9] bg-white hover:bg-[#F5F3EE] hover:text-slate-900 text-slate-700 shadow-xs dark:border-[#333333] dark:bg-[#242424] dark:hover:bg-[#2C2C2C] dark:text-slate-200",
        secondary:
          "bg-[#F5F3EE] text-slate-900 hover:bg-[#EDEAE3] dark:bg-[#2C2C2C] dark:text-slate-100 dark:hover:bg-[#333333]",
        ghost:
          "hover:bg-[#F5F3EE] hover:text-slate-900 text-slate-600 dark:hover:bg-[#2C2C2C] dark:hover:text-slate-100 dark:text-slate-300",
        link: "text-[#FF6B00] underline-offset-4 hover:underline dark:text-[#FF6B00]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
