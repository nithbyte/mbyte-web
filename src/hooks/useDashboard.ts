import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services";

export function useDashboardData(territoryId?: string, operatingDate?: string) {
  return useQuery({
    queryKey: ["dashboard", "manager-data", territoryId || "ALL", operatingDate || "TODAY"],
    queryFn: () => dashboardService.getManagerDashboard(territoryId, operatingDate),
    refetchInterval: 15_000,
  });
}

export function useDashboardKPIs(territoryId?: string, operatingDate?: string) {
  return useQuery({
    queryKey: ["dashboard", "kpis", territoryId || "ALL", operatingDate || "TODAY"],
    queryFn: () => dashboardService.getKPIs(territoryId, operatingDate),
    refetchInterval: 15_000,
  });
}

export function useTerritoryPerformance(operatingDate?: string) {
  return useQuery({
    queryKey: ["dashboard", "territory-performance", operatingDate || "TODAY"],
    queryFn: () => dashboardService.getTerritoryPerformance(operatingDate),
  });
}
