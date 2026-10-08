import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  const displayMessage = description || message || "An unexpected error occurred while communicating with the service. Please try again.";
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-xs dark:bg-rose-900/60 dark:text-rose-400">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-rose-900 dark:text-rose-200">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
        {displayMessage}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="text-xs font-semibold gap-1.5 border-rose-200 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-200"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
}
