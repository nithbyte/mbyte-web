import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useManagers(organizationId?: string) {
  return useQuery({
    queryKey: ["managers", organizationId || "ALL"],
    queryFn: () => fieldForceService.getManagers(organizationId),
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      email: string;
      password?: string;
      phone?: string;
      role: string;
      organizationId?: string;
      territoryId?: string;
      managerId?: string;
    }) => fieldForceService.createUser(data),
  });
}

export function useUpdateMRTerritory() {
  return useMutation({
    mutationFn: ({
      mrId,
      territoryId,
      managerId,
    }: {
      mrId: string;
      territoryId: string;
      managerId?: string;
    }) => fieldForceService.updateMRTerritory(mrId, territoryId, managerId),
  });
}




export function useMRTerritories(mrId: string) {
  return useQuery({
    queryKey: ["mr-territories", mrId],
    queryFn: () => fieldForceService.getMRTerritories(mrId),
    enabled: Boolean(mrId),
  });
}

export function useAssignTerritories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mrId,
      territoryIds,
      primaryTerritoryId,
    }: {
      mrId: string;
      territoryIds: string[];
      primaryTerritoryId?: string;
    }) => fieldForceService.assignTerritories(mrId, territoryIds, primaryTerritoryId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["mr-territories", vars.mrId] });
      queryClient.invalidateQueries({ queryKey: ["mr-list"] });
      queryClient.invalidateQueries({ queryKey: ["field-force"] });
    },
  });
}

export function useSetPrimaryTerritory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mrId, territoryId }: { mrId: string; territoryId: string }) =>
      fieldForceService.setPrimaryTerritory(mrId, territoryId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["mr-territories", vars.mrId] });
      queryClient.invalidateQueries({ queryKey: ["mr-list"] });
      queryClient.invalidateQueries({ queryKey: ["field-force"] });
    },
  });
}

export function useRevokeTerritory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mrId, territoryId }: { mrId: string; territoryId: string }) =>
      fieldForceService.revokeTerritory(mrId, territoryId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["mr-territories", vars.mrId] });
      queryClient.invalidateQueries({ queryKey: ["mr-list"] });
      queryClient.invalidateQueries({ queryKey: ["field-force"] });
    },
  });
}
