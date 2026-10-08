import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services";

export function useDashboardData(territoryId?: string) {
  return useQuery({
    queryKey: ["dashboard", "manager-data", territoryId || "ALL"],
    queryFn: () => dashboardService.getManagerDashboard(territoryId),
  });
}

export function useDashboardKPIs(territoryId?: string) {
  return useQuery({
    queryKey: ["dashboard", "kpis", territoryId || "ALL"],
    queryFn: () => dashboardService.getKPIs(territoryId),
  });
}

export function useTerritoryPerformance() {
  return useQuery({
    queryKey: ["dashboard", "territory-performance"],
    queryFn: () => dashboardService.getTerritoryPerformance(),
  });
}
