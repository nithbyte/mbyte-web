import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { territoryService } from "../services";
import type { CreateTerritoryInput } from "../types";

export function useTerritories(organizationId?: string) {
  return useQuery({
    queryKey: ["territories", organizationId || "ALL"],
    queryFn: () => territoryService.getTerritories(organizationId),
  });
}

export function useCreateTerritory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTerritoryInput) => territoryService.createTerritory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["territories"] });
      queryClient.invalidateQueries({ queryKey: ["mr-list"] });
    },
  });
}

