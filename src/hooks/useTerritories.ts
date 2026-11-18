import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { territoryService } from "../services";
import { useAuthStore } from "@/store/useAuthStore";
import type { CreateTerritoryInput, UpdateTerritoryInput } from "../types";

export function useTerritories(organizationId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["territories", organizationId || "ALL"],
    queryFn: () => territoryService.getTerritories(organizationId),
    enabled: isAuthenticated,
  });
}

export function useCreateTerritory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTerritoryInput) => territoryService.createTerritory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["territories"] });
      queryClient.invalidateQueries({ queryKey: ["mr-list"] });
      queryClient.invalidateQueries({ queryKey: ["field-force"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTerritory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTerritoryInput }) =>
      territoryService.updateTerritory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["territories"] });
      queryClient.invalidateQueries({ queryKey: ["mr-list"] });
      queryClient.invalidateQueries({ queryKey: ["field-force"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteTerritory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => territoryService.deleteTerritory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["territories"] });
      queryClient.invalidateQueries({ queryKey: ["mr-list"] });
      queryClient.invalidateQueries({ queryKey: ["field-force"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

