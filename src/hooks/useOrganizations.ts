import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import type { CreateOrganizationInput, UpdateOrganizationInput, Organization } from "@/types";

export function useOrganizations(
  params?: { search?: string; isActive?: boolean },
  options?: { enabled?: boolean }
) {
  return useQuery<Organization[]>({
    queryKey: ["organizations", params],
    queryFn: () => organizationService.getOrganizations(params),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}

export function useOrganization(id?: string) {
  return useQuery<Organization>({
    queryKey: ["organization", id],
    queryFn: () => organizationService.getOrganizationById(id!),
    enabled: Boolean(id),
  });
}

export function usePublicOrganizationBySlug(slug?: string | null) {
  return useQuery<Organization>({
    queryKey: ["publicOrganization", slug],
    queryFn: () => organizationService.getPublicBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}

export function usePublicOrganizations() {
  return useQuery({
    queryKey: ["publicOrganizationsList"],
    queryFn: () => organizationService.getPublicList(),
    staleTime: 1000 * 60 * 5,
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

export function useRetryProvisioning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationService.retryProvisioning(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization", id] });
    },
  });
}

export function useTenantFeatures(orgId?: string) {
  return useQuery({
    queryKey: ["tenantFeatures", orgId],
    queryFn: () => organizationService.getTenantFeatures(orgId!),
    enabled: Boolean(orgId),
  });
}

export function useUpdateTenantFeatures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, features }: { orgId: string; features: any }) =>
      organizationService.updateTenantFeatures(orgId, features),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tenantFeatures", vars.orgId] });
      queryClient.invalidateQueries({ queryKey: ["organization", vars.orgId] });
    },
  });
}

export function useTenantUsers(orgId?: string, params?: { search?: string; status?: string; role?: string }) {
  return useQuery({
    queryKey: ["tenantUsers", orgId, params],
    queryFn: () => organizationService.getTenantUsers(orgId!, params),
    enabled: Boolean(orgId),
  });
}

export function useUserFeatures(userId?: string) {
  return useQuery({
    queryKey: ["userFeatures", userId],
    queryFn: () => organizationService.getUserFeatures(userId!),
    enabled: Boolean(userId),
  });
}

export function useUpdateUserFeatures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, features }: { userId: string; features: any }) =>
      organizationService.updateUserFeatures(userId, features),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["userFeatures", vars.userId] });
      queryClient.invalidateQueries({ queryKey: ["tenantUsers"] });
    },
  });
}
