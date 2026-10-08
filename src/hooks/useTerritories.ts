import { useQuery } from "@tanstack/react-query";
import { territoryService } from "../services";

export function useTerritories() {
  return useQuery({
    queryKey: ["territories"],
    queryFn: () => territoryService.getTerritories(),
  });
}
