import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services";
import { useAuthStore } from "@/store/useAuthStore";

export function useNotifications(params?: {
  isRead?: boolean;
  page?: number;
  limit?: number;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationService.getNotifications(params),
    enabled: isAuthenticated,
  });
}

export function useUnreadNotificationsCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: isAuthenticated ? 30000 : false,
    enabled: isAuthenticated,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
