import { mockTerritories } from "../mock";
import type { Territory } from "../types";

export const territoryService = {
  async getTerritories(): Promise<Territory[]> {
    // Simulated async boundary
    return Promise.resolve([...mockTerritories]);
  },

  async getTerritoryById(id: string): Promise<Territory | null> {
    const t = mockTerritories.find((item) => item.id === id);
    return Promise.resolve(t || null);
  },
};
