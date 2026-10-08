import { useQuery } from "@tanstack/react-query";
import { presenceService } from "../services";
import type { PresenceQueryParams } from "../types";

export function usePresenceAudits(params?: PresenceQueryParams) {
  return useQuery({
    queryKey: ["presence-audits", params],
    queryFn: () => presenceService.getPresenceAudits(params),
  });
}

export function usePresenceCounts(params?: PresenceQueryParams) {
  return useQuery({
    queryKey: ["presence-counts", params],
    queryFn: () => presenceService.getPresenceCounts(params),
  });
}

export function useAuditDates() {
  return useQuery({
    queryKey: ["presence-dates"],
    queryFn: () => presenceService.getUniqueAuditDates(),
  });
}
