import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services";
import type { OrderQueryParams, OrderStatus } from "../types";

export function useOrders(params?: OrderQueryParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => orderService.getOrders(params),
  });
}

export function useRecentOrders(
  limit: number = 5,
  params?: { territoryId?: string; date?: string }
) {
  return useQuery({
    queryKey: ["orders", "recent", limit, params],
    queryFn: () => orderService.getRecentOrders(limit, params),
  });
}

export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => (id ? orderService.getOrderById(id) : null),
    enabled: Boolean(id),
  });
}

export function useOrderKPIs(params?: { mrId?: string; territoryId?: string; date?: string }) {
  return useQuery({
    queryKey: ["orders", "kpis", params],
    queryFn: () => orderService.getOrderKPIs(params),
  });
}

export function useOrderTrend(params?: { territoryId?: string; mrId?: string; date?: string }) {
  return useQuery({
    queryKey: ["orders", "trend", params],
    queryFn: () => orderService.getOrderTrend(params),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      remarks,
    }: {
      id: string;
      status: OrderStatus;
      remarks?: string;
    }) => orderService.updateOrderStatus(id, status, remarks),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["commercial"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      orderService.cancelOrder(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["commercial"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
