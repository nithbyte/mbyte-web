import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import type { User } from "@/types";

export function useCurrentUser() {
  const { setUser } = useAuthStore();

  const query = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
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
      setUser(switchedUser);
      queryClient.setQueryData(["currentUser"], switchedUser);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["field-force"] });
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: { email: string; password?: string }) =>
      authService.login(credentials),
    onSuccess: ({ user }) => {
      setUser(user);
      queryClient.setQueryData(["currentUser"], user);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
