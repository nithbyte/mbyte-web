import { useQuery } from "@tanstack/react-query";
import { fieldForceService } from "../services";
import type { MRListFilterParams } from "../types";

export function useFieldForce(territoryId?: string) {
  return useQuery({
    queryKey: ["field-force", territoryId || "ALL"],
    queryFn: () => fieldForceService.getFieldForce(territoryId),
  });
}

export function useMRList(filters?: MRListFilterParams) {
  return useQuery({
    queryKey: ["mr-list", filters],
    queryFn: () => fieldForceService.getMRList(filters),
  });
}

export function useMRDetails(id: string) {
  return useQuery({
    queryKey: ["mr-details", id],
    queryFn: () => fieldForceService.getMRDetails(id),
    enabled: Boolean(id),
  });
}

export function useManagers() {
  return useQuery({
    queryKey: ["managers"],
    queryFn: () => fieldForceService.getManagers(),
  });
}
