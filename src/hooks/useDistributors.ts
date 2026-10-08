import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { distributorService, DistributorQueryParams } from "../services";
import type { DistributorInput } from "../types";

export function useDistributors(params?: DistributorQueryParams) {
  return useQuery({
    queryKey: ["distributors", params],
    queryFn: () => distributorService.getDistributors(params),
  });
}

export function useDistributorDetail(id: string) {
  return useQuery({
    queryKey: ["distributors", "detail", id],
    queryFn: () => distributorService.getDistributorById(id),
    enabled: Boolean(id),
  });
}

export function useDistributorHistory(id: string) {
  return useQuery({
    queryKey: ["distributors", "history", id],
    queryFn: () => distributorService.getDistributorHistory(id),
    enabled: Boolean(id),
  });
}

export function useCreateDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DistributorInput) => distributorService.createDistributor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributors"] });
    },
  });
}

export function useUpdateDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DistributorInput> }) =>
      distributorService.updateDistributor(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["distributors"] });
      queryClient.invalidateQueries({ queryKey: ["distributors", "detail", variables.id] });
    },
  });
}
