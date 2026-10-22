"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Package,
  CheckCircle2,
  Layers,
  BookOpen,
  Boxes,
} from "lucide-react";

interface ProductKpiCardsProps {
  totalProducts: number;
  activeProducts: number;
  categoriesCount: number;
  totalVisualAids: number;
  avgAvailability: number;
}

export const ProductKpiCards: React.FC<ProductKpiCardsProps> = ({
  totalProducts,
  activeProducts,
  categoriesCount,
  totalVisualAids,
  avgAvailability,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Formulations</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalProducts}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600">
            <Package className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {activeProducts} Active in Distribution
        </p>
      </Card>

      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Therapeutic Lines</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {categoriesCount || 4}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Cardio, Diabetic, Pain & Gastro</p>
      </Card>

      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Visual Detailing Aids</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalVisualAids}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-2">
          Interactive Field Decks
        </p>
      </Card>

      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Chemist Presence Rate</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {avgAvailability}%
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Boxes className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Verified in Retail Audits</p>
      </Card>
    </div>
  );
};
