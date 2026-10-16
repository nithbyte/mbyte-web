import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import type { CreateOrganizationInput, UpdateOrganizationInput, Organization } from "@/types";

export function useOrganizations(params?: { search?: string; isActive?: boolean }) {
  return useQuery<Organization[]>({
    queryKey: ["organizations", params],
    queryFn: () => organizationService.getOrganizations(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOrganization(id?: string) {
  return useQuery<Organization>({
    queryKey: ["organization", id],
    queryFn: () => organizationService.getOrganizationById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateOrganizationInput) =>
      organizationService.createOrganization(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOrganizationInput }) =>
      organizationService.updateOrganization(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization", variables.id] });
    },
  });
}
