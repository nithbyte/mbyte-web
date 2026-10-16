import { apiClient } from "../lib/api-client";
import { mockTerritories } from "../mock";
import { authService } from "./authService";
import { isOrgMatch } from "../lib/utils";
import type { Territory, CreateTerritoryInput } from "../types";

function mapApiTerritory(t: any): Territory {
  return {
    id: t.id,
    organizationId: t.organizationId,
    name: t.name,
    code: t.code,
    region: t.region || t.zone || "Operational Region",
    zone: t.zone || "Zone",
    headquarters: t.headquarters || t.area || t.name,
    area: t.area,
    state: t.state || t.region || "Operational State",
    activeMRsCount: t.activeMRsCount || t.mrs?.length || 0,
  };
}

export const territoryService = {
  async getTerritories(organizationId?: string): Promise<Territory[]> {
    try {
      const res = await apiClient.get<any>("/territories", {
        params: {
          limit: 100,
          organizationId: organizationId !== "ALL" ? organizationId : undefined,
        },
      });
      const items = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : null);
      if (items !== null) {
        return items.map(mapApiTerritory);
      }
    } catch (err) {
      console.warn("Real /territories API call failed, falling back to mock:", err);
    }

    let list = [...mockTerritories];
    const currentUser = await authService.getCurrentUser();
    const effectiveOrgId = (organizationId && organizationId !== "ALL")
      ? organizationId
      : (currentUser?.role !== "SUPER_ADMIN" ? currentUser?.organizationId : undefined);

    if (effectiveOrgId) {
      list = list.filter((t: any) => isOrgMatch(t.organizationId, effectiveOrgId));
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
    const currentUser = await authService.getCurrentUser();
    const effectiveOrgId = data.organizationId || currentUser?.organizationId || "";

    try {
      const res = await apiClient.post<any>("/territories", {
        code: data.code,
        name: data.name,
        zone: data.zone || "Zone",
        region: data.region || "Operational Region",
        area: data.area || data.name,
        description: data.description || `${data.name} operational coverage territory`,
        organizationId: effectiveOrgId,
      });
      if (res && res.id) {
        return mapApiTerritory(res);
      }
    } catch (err) {
      console.warn("Real /territories POST failed, falling back to mock creation:", err);
    }

    const newMockTerritory = {
      id: `ter_${Date.now()}`,
      organizationId: effectiveOrgId,
      code: data.code,
      name: data.name,
      zone: data.zone || "Zone",
      region: data.region || "Operational Region",
      area: data.area || data.name,
      headquarters: data.headquarters || data.name,
      isActive: true,
      activeMRsCount: 0,
    };
    mockTerritories.push(newMockTerritory as any);
    return mapApiTerritory(newMockTerritory);
  },
};
