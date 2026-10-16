import { useQuery, useMutation } from "@tanstack/react-query";
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
    mutationFn: ({ mrId, territoryId }: { mrId: string; territoryId: string }) =>
      fieldForceService.updateMRTerritory(mrId, territoryId),
  });
}


