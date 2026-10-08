"use client";

import React, { Suspense } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useSidebarStore } from "@/store";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <Suspense fallback={<div className="w-16 lg:w-64" />}>
        <Sidebar />
      </Suspense>
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <Suspense fallback={<div className="h-16" />}>
          <Header />
        </Suspense>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
