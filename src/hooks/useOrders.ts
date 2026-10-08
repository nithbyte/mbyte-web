import { useQuery } from "@tanstack/react-query";
import { orderService } from "../services";
import type { OrderQueryParams } from "../types";

export function useOrders(params?: OrderQueryParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => orderService.getOrders(params),
  });
}

export function useRecentOrders(limit: number = 5) {
  return useQuery({
    queryKey: ["orders", "recent", limit],
    queryFn: () => orderService.getRecentOrders(limit),
  });
}

export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => (id ? orderService.getOrderById(id) : null),
    enabled: Boolean(id),
  });
}

export function useOrderKPIs(params?: { mrId?: string; territoryId?: string }) {
  return useQuery({
    queryKey: ["orders", "kpis", params],
    queryFn: () => orderService.getOrderKPIs(params),
  });
}

export function useOrderTrend() {
  return useQuery({
    queryKey: ["orders", "trend"],
    queryFn: () => orderService.getOrderTrend(),
  });
}
