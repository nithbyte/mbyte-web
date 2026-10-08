import { useQuery } from "@tanstack/react-query";
import { reportService } from "../services";
import type { ReportFilterParams } from "../types";

export function useVisitReport(filters?: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "visits", filters],
    queryFn: () => reportService.getVisitReport(filters),
  });
}

export function useMRPerformanceReport(filters?: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "mr-performance", filters],
    queryFn: () => reportService.getMRPerformanceReport(filters),
  });
}

export function useProductPresenceReport(filters?: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "product-presence", filters],
    queryFn: () => reportService.getProductPresenceReport(filters),
  });
}

export function useSalesReport(filters?: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "sales", filters],
    queryFn: () => reportService.getSalesReport(filters),
  });
}

export function useCollectionReport(filters?: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "collections", filters],
    queryFn: () => reportService.getCollectionReport(filters),
  });
}

export function useTargetAchievementReport(filters?: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "target-achievement", filters],
    queryFn: () => reportService.getTargetAchievementReport(filters),
  });
}
