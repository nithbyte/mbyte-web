import { apiClient } from "../lib/api-client";
import { mockTerritories } from "../mock";
import type { Territory, CreateTerritoryInput } from "../types";

function mapApiTerritory(t: any): Territory {
  return {
    id: t.id,
    organizationId: t.organizationId,
    name: t.name,
    code: t.code,
    region: t.region || t.zone || "Tamil Nadu",
    zone: t.zone || "South",
    headquarters: t.headquarters || t.area || t.name,
    area: t.area,
    state: "Tamil Nadu",
    activeMRsCount: t.activeMRsCount || t.mrs?.length || 0,
  };
}

export const territoryService = {
  async getTerritories(organizationId?: string): Promise<Territory[]> {
    try {
      const res = await apiClient.get<any[]>("/territories", {
        params: {
          limit: 100,
          organizationId: organizationId !== "ALL" ? organizationId : undefined,
        },
      });
      if (Array.isArray(res) && res.length > 0) {
        return res.map(mapApiTerritory);
      }
    } catch (err) {
      console.warn("Real /territories API call failed, falling back to mock:", err);
    }

    let list = [...mockTerritories];
    if (organizationId && organizationId !== "ALL") {
      list = list.filter((t: any) => !t.organizationId || t.organizationId === organizationId);
    }
    return Promise.resolve(list.map(mapApiTerritory));
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
    return Promise.resolve(t ? mapApiTerritory(t) : null);
  },

  async createTerritory(data: CreateTerritoryInput): Promise<Territory> {
    try {
      const res = await apiClient.post<any>("/territories", {
        code: data.code,
        name: data.name,
        zone: data.zone || "South",
        region: data.region || "Tamil Nadu",
        area: data.area || data.name,
        description: data.description || `${data.name} operational coverage territory`,
        organizationId: data.organizationId,
      });
      if (res && res.id) {
        return mapApiTerritory(res);
      }
    } catch (err) {
      console.warn("Real /territories POST failed, falling back to mock creation:", err);
    }

    const newMockTerritory = {
      id: `ter_${Date.now()}`,
      organizationId: data.organizationId || "org_novis_001",
      code: data.code,
      name: data.name,
      zone: data.zone || "South",
      region: data.region || "Tamil Nadu",
      area: data.area || data.name,
      headquarters: data.headquarters || data.name,
      isActive: true,
      activeMRsCount: 0,
    };
    mockTerritories.push(newMockTerritory as any);
    return mapApiTerritory(newMockTerritory);
  },
};

