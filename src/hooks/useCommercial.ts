import { useQuery } from "@tanstack/react-query";
import { commercialService } from "../services";

export function useCommercialKPIs(params?: { territoryId?: string; date?: string }) {
  return useQuery({
    queryKey: ["commercial", "kpis", params],
    queryFn: () => commercialService.getCommercialKPIs(params),
  });
}

export function useCommercialTrends(params?: { territoryId?: string; date?: string }) {
  return useQuery({
    queryKey: ["commercial", "trends", params],
    queryFn: () => commercialService.getDailyTrends(params),
  });
}

export function useCommercialLeaderboard(params?: { territoryId?: string; date?: string }) {
  return useQuery({
    queryKey: ["commercial", "leaderboard", params],
    queryFn: () => commercialService.getMrLeaderboard(params),
  });
}
