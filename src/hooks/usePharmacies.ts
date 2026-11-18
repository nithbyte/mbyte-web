import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pharmacyService, PharmacyQueryParams } from "../services";
import type { PharmacyInput } from "../types";

export function usePharmacies(params?: PharmacyQueryParams) {
  return useQuery({
    queryKey: ["pharmacies", params],
    queryFn: () => pharmacyService.getPharmacies(params),
  });
}

export function usePharmacyDetail(id: string) {
  return useQuery({
    queryKey: ["pharmacies", "detail", id],
    queryFn: () => pharmacyService.getPharmacyById(id),
    enabled: Boolean(id),
  });
}

export function usePharmacyHistory(id: string) {
  return useQuery({
    queryKey: ["pharmacies", "history", id],
    queryFn: () => pharmacyService.getPharmacyHistory(id),
    enabled: Boolean(id),
  });
}

export function useCreatePharmacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PharmacyInput) => pharmacyService.createPharmacy(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
    },
  });
}

export function useUpdatePharmacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PharmacyInput> }) =>
      pharmacyService.updatePharmacy(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacies", "detail", variables.id] });
    },
  });
}

export function usePendingPharmacies(params?: PharmacyQueryParams) {
  return useQuery({
    queryKey: ["pharmacies", "pending", params],
    queryFn: () => pharmacyService.getPendingPharmacies(params),
  });
}

export function useRejectedPharmacies(params?: PharmacyQueryParams) {
  return useQuery({
    queryKey: ["pharmacies", "rejected", params],
    queryFn: () => pharmacyService.getPharmacies({ ...params, approvalStatus: "REJECTED" }),
  });
}

export function useApprovePharmacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyService.approvePharmacy(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacies", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacies", "rejected"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacies", "detail", id] });
    },
  });
}

export function useRejectPharmacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      pharmacyService.rejectPharmacy(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacies", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacies", "rejected"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacies", "detail", variables.id] });
    },
  });
}
