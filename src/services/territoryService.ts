import { apiClient } from "../lib/api-client";
import { mockTerritories } from "../mock";
import type { Territory } from "../types";

function mapApiTerritory(t: any): Territory {
  return {
    id: t.id,
    name: t.name,
    code: t.code,
    region: t.region || t.zone || "Tamil Nadu",
    state: "Tamil Nadu",
    activeMRsCount: t.activeMRsCount || t.mrs?.length || 2,
  };
}

export const territoryService = {
  async getTerritories(): Promise<Territory[]> {
    try {
      const res = await apiClient.get<any[]>("/territories", { params: { limit: 50 } });
      if (Array.isArray(res) && res.length > 0) {
        return res.map(mapApiTerritory);
      }
    } catch (err) {
      console.warn("Real /territories API call failed, falling back to mock:", err);
    }

    return Promise.resolve([...mockTerritories]);
  },

  async getTerritoryById(id: string): Promise<Territory | null> {
    try {
      const res = await apiClient.get<any>(`/territories/${id}`);
      if (res && res.id) {
        return mapApiTerritory(res);
      }
    } catch {
      // fallback
    }

    const t = mockTerritories.find((item) => item.id === id);
    return Promise.resolve(t || null);
  },
};
