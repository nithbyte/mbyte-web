import { useQuery } from "@tanstack/react-query";
import { commercialService } from "../services";

export function useCommercialKPIs() {
  return useQuery({
    queryKey: ["commercial", "kpis"],
    queryFn: () => commercialService.getCommercialKPIs(),
  });
}

export function useCommercialTrends() {
  return useQuery({
    queryKey: ["commercial", "trends"],
    queryFn: () => commercialService.getDailyTrends(),
  });
}

export function useCommercialLeaderboard() {
  return useQuery({
    queryKey: ["commercial", "leaderboard"],
    queryFn: () => commercialService.getMrLeaderboard(),
  });
}
