import { useQuery } from "@tanstack/react-query";
import { collectionService } from "../services";
import type { CollectionQueryParams } from "../types";

export function useCollections(params?: CollectionQueryParams) {
  return useQuery({
    queryKey: ["collections", params],
    queryFn: () => collectionService.getCollections(params),
  });
}

export function useRecentCollections(
  limit: number = 5,
  params?: { territoryId?: string; date?: string }
) {
  return useQuery({
    queryKey: ["collections", "recent", limit, params],
    queryFn: () => collectionService.getRecentCollections(limit, params),
  });
}

export function useCollectionDetail(id: string | null) {
  return useQuery({
    queryKey: ["collections", "detail", id],
    queryFn: () => (id ? collectionService.getCollectionById(id) : null),
    enabled: Boolean(id),
  });
}

export function useCollectionKPIs(params?: { mrId?: string; territoryId?: string; date?: string }) {
  return useQuery({
    queryKey: ["collections", "kpis", params],
    queryFn: () => collectionService.getCollectionKPIs(params),
  });
}

export function useCollectionTrend(params?: { territoryId?: string; mrId?: string; date?: string }) {
  return useQuery({
    queryKey: ["collections", "trend", params],
    queryFn: () => collectionService.getCollectionTrend(params),
  });
}
