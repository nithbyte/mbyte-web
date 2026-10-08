import { useQuery } from "@tanstack/react-query";
import { collectionService } from "../services";
import type { CollectionQueryParams } from "../types";

export function useCollections(params?: CollectionQueryParams) {
  return useQuery({
    queryKey: ["collections", params],
    queryFn: () => collectionService.getCollections(params),
  });
}

export function useRecentCollections(limit: number = 5) {
  return useQuery({
    queryKey: ["collections", "recent", limit],
    queryFn: () => collectionService.getRecentCollections(limit),
  });
}

export function useCollectionDetail(id: string | null) {
  return useQuery({
    queryKey: ["collections", "detail", id],
    queryFn: () => (id ? collectionService.getCollectionById(id) : null),
    enabled: Boolean(id),
  });
}

export function useCollectionKPIs(params?: { mrId?: string; territoryId?: string }) {
  return useQuery({
    queryKey: ["collections", "kpis", params],
    queryFn: () => collectionService.getCollectionKPIs(params),
  });
}

export function useCollectionTrend() {
  return useQuery({
    queryKey: ["collections", "trend"],
    queryFn: () => collectionService.getCollectionTrend(),
  });
}
