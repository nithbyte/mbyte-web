import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorService, DoctorQueryParams } from "../services";
import type { DoctorInput } from "../types";

export function useDoctors(params?: DoctorQueryParams) {
  return useQuery({
    queryKey: ["doctors", params],
    queryFn: () => doctorService.getDoctors(params),
  });
}

export function useDoctorDetail(id: string) {
  return useQuery({
    queryKey: ["doctors", "detail", id],
    queryFn: () => doctorService.getDoctorById(id),
    enabled: Boolean(id),
  });
}

export function useDoctorHistory(id: string) {
  return useQuery({
    queryKey: ["doctors", "history", id],
    queryFn: () => doctorService.getDoctorHistory(id),
    enabled: Boolean(id),
  });
}

export function useSpecialties() {
  return useQuery({
    queryKey: ["doctors", "specialties"],
    queryFn: () => doctorService.getSpecialties(),
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DoctorInput) => doctorService.createDoctor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DoctorInput> }) =>
      doctorService.updateDoctor(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors", "detail", variables.id] });
    },
  });
}
export function usePendingDoctors(params?: DoctorQueryParams) {
  return useQuery({
    queryKey: ["doctors", "pending", params],
    queryFn: () => doctorService.getPendingDoctors(params),
  });
}

export function useRejectedDoctors(params?: DoctorQueryParams) {
  return useQuery({
    queryKey: ["doctors", "rejected", params],
    queryFn: () => doctorService.getDoctors({ ...params, approvalStatus: "REJECTED" }),
  });
}

export function useApproveDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => doctorService.approveDoctor(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["doctors", "rejected"] });
      queryClient.invalidateQueries({ queryKey: ["doctors", "detail", id] });
    },
  });
}

export function useRejectDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      doctorService.rejectDoctor(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["doctors", "rejected"] });
      queryClient.invalidateQueries({ queryKey: ["doctors", "detail", variables.id] });
    },
  });
}
