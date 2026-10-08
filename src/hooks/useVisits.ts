import { useQuery } from "@tanstack/react-query";
import { visitService, VisitQueryParams } from "../services";

export function useTodayVisits(territoryId?: string) {
  return useQuery({
    queryKey: ["visits", "today", territoryId || "ALL"],
    queryFn: () => visitService.getTodayVisits(territoryId),
  });
}

export function useVisits(params?: VisitQueryParams) {
  return useQuery({
    queryKey: ["visits", params],
    queryFn: () => visitService.getVisits(params),
  });
}

export function useVisitCounts(params?: VisitQueryParams) {
  return useQuery({
    queryKey: ["visits", "counts", params],
    queryFn: () => visitService.getVisitCounts(params),
  });
}

export function useVisitDates() {
  return useQuery({
    queryKey: ["visits", "dates"],
    queryFn: () => visitService.getUniqueVisitDates(),
  });
}

export function useVisitDetail(id: string) {
  return useQuery({
    queryKey: ["visits", "detail", id],
    queryFn: () => visitService.getVisitById(id),
    enabled: Boolean(id),
  });
}
