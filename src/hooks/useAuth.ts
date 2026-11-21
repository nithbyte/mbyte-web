import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { useFilterStore } from "@/store";
import type { User } from "@/types";

export function useCurrentUser() {
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
    initialData: storeUser || undefined,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return {
    ...query,
    data: query.data ?? storeUser ?? null,
  };
}

export function useUserList() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => authService.getAllUsers(),
    staleTime: 1000 * 60 * 15,
  });
}

export function useSwitchUser() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (userId: string) => authService.switchUser(userId),
    onSuccess: (switchedUser) => {
      // Clear all cached queries so previous company data is never retained in memory
      queryClient.clear();
      setUser(switchedUser);
      queryClient.setQueryData(["currentUser"], switchedUser);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: {
      email: string;
      password?: string;
      tenantSlug?: string;
      companyCode?: string;
      organizationId?: string;
    }) => authService.login(credentials),
    onSuccess: (data) => {
      if (data?.user) {
        // Clear all cached queries and territory filters from previous sessions
        queryClient.clear();
        useFilterStore.getState().setSelectedTerritoryId("ALL");
        setUser(data.user);
        queryClient.setQueryData(["currentUser"], data.user);
      }
    },
  });
}

export function useSelectCompany() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      organizationId,
      selectionToken,
    }: {
      organizationId: string;
      selectionToken: string;
    }) => authService.selectCompany(organizationId, selectionToken),
    onSuccess: ({ user }) => {
      queryClient.clear();
      useFilterStore.getState().setSelectedTerritoryId("ALL");
      setUser(user);
      queryClient.setQueryData(["currentUser"], user);
    },
  });
}

export function useSwitchTenant() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (organizationId: string) => authService.switchTenant(organizationId),
    onSuccess: ({ user }) => {
      queryClient.clear();
      useFilterStore.getState().setSelectedTerritoryId("ALL");
      setUser(user);
      queryClient.setQueryData(["currentUser"], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onMutate: async () => {
      // Stop in-flight queries before tokens are cleared to prevent post-logout 401s
      logout();
      await queryClient.cancelQueries();
    },
    onSettled: () => {
      // Clear all cached data and territory filters on logout
      queryClient.clear();
      useFilterStore.getState().setSelectedTerritoryId("ALL");
      logout();
    },
  });
}
