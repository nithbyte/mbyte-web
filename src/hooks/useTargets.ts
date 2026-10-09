import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { targetService } from "../services";

export function useTargets(params?: {
  mrId?: string;
  territoryId?: string;
  year?: number;
  month?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["targets", params],
    queryFn: () => targetService.getTargets(params),
  });
}

export function useTargetDetail(id: string | null) {
  return useQuery({
    queryKey: ["targets", "detail", id],
    queryFn: () => (id ? targetService.getTargetById(id) : null),
    enabled: Boolean(id),
  });
}

export function useTargetAchievementSummary(
  year: number = 2026,
  month: number = 10,
  mrId?: string,
  territoryId?: string
) {
  return useQuery({
    queryKey: ["targets", "achievement-summary", year, month, mrId || "ALL", territoryId || "ALL"],
    queryFn: () => targetService.getAchievementSummary(year, month, mrId, territoryId),
  });
}

export function useCreateTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => targetService.createTarget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets"] });
    },
  });
}

export function useUpdateTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => targetService.updateTarget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets"] });
    },
  });
}
