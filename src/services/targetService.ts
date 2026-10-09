import { apiClient } from "../lib/api-client";
import { mockTargets, mockMRs, mockTerritories } from "../mock";

export interface TargetItem {
  id: string;
  organizationId: string;
  mrId: string;
  mrName?: string;
  employeeCode?: string;
  territoryId?: string;
  territoryName?: string;
  productId?: string | null;
  productName?: string | null;
  year: number;
  month: number;
  targetAmount: number;
  achievedAmount: number;
  targetQuantity?: number;
  achievedQuantity?: number;
  visitTarget?: number;
  visitAchieved?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TargetAchievementSummary {
  year: number;
  month: number;
  totalTargetAmount: number;
  totalAchievedAmount: number;
  overallSalesPercent: number;
  totalVisitTarget: number;
  totalVisitAchieved: number;
  overallVisitPercent: number;
  targetCount: number;
  targets: Array<{
    id: string;
    mrId: string;
    mrName: string;
    employeeCode: string;
    territoryName: string;
    productName: string | null;
    targetAmount: number;
    achievedAmount: number;
    salesAchievementPercent: number;
    visitTarget: number;
    visitAchieved: number;
    visitAchievementPercent: number;
  }>;
}

function mapTargetItem(item: any): TargetItem {
  return {
    id: item.id,
    organizationId: item.organizationId,
    mrId: item.mrId,
    mrName: item.mr?.user ? `${item.mr.user.firstName} ${item.mr.user.lastName}` : item.mr?.name || item.mrName,
    employeeCode: item.mr?.employeeCode || item.employeeCode,
    territoryId: item.territoryId,
    territoryName: item.territory?.name || item.territoryName,
    productId: item.productId,
    productName: item.product?.name || item.productName,
    year: Number(item.year),
    month: Number(item.month),
    targetAmount: Number(item.targetAmount || 0),
    achievedAmount: Number(item.achievedAmount || 0),
    targetQuantity: item.targetQuantity,
    achievedQuantity: item.achievedQuantity,
    visitTarget: item.visitTarget,
    visitAchieved: item.visitAchieved,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const targetService = {
  async getTargets(params?: {
    mrId?: string;
    territoryId?: string;
    year?: number;
    month?: number;
    limit?: number;
  }): Promise<TargetItem[]> {
    try {
      const raw = await apiClient.get<any>("/targets", { params: { limit: params?.limit || 100, ...params } });
      const list = Array.isArray(raw) ? raw : (raw as any)?.data || [];
      if (list && list.length > 0) {
        return list.map(mapTargetItem);
      }
    } catch (err) {
      console.warn("Failed to fetch targets from API, falling back to mock:", err);
    }

    // Fallback to mock
    let list = [...mockTargets] as any[];
    if (params?.mrId && params.mrId !== "ALL") list = list.filter((t) => t.mrId === params.mrId);
    if (params?.territoryId && params.territoryId !== "ALL") list = list.filter((t) => t.territoryId === params.territoryId);
    if (params?.year) list = list.filter((t) => t.year === params.year);
    if (params?.month) list = list.filter((t) => t.month === params.month);

    return list.map((t) => {
      const mr = mockMRs.find((m) => m.id === t.mrId);
      const ter = mockTerritories.find((te) => te.id === t.territoryId);
      return {
        ...t,
        mrName: mr?.user ? `${mr.user.firstName} ${mr.user.lastName}` : mr?.employeeCode,
        employeeCode: mr?.employeeCode,
        territoryName: ter?.name,
      };
    });
  },

  async getTargetById(id: string): Promise<TargetItem | null> {
    try {
      const raw = await apiClient.get<any>(`/targets/${id}`);
      if (raw && raw.id) {
        return mapTargetItem(raw);
      }
    } catch {
      // Fallback
    }

    const t = mockTargets.find((item) => item.id === id);
    if (!t) return null;
    const mr = mockMRs.find((m) => m.id === (t as any).mrId);
    const ter = mockTerritories.find((te) => te.id === t.territoryId);
    return {
      ...(t as any),
      mrId: (t as any).mrId || "",
      mrName: mr?.user ? `${mr.user.firstName} ${mr.user.lastName}` : mr?.employeeCode,
      employeeCode: mr?.employeeCode,
      territoryName: ter?.name,
    } as TargetItem;
  },

  async getAchievementSummary(
    year: number = 2026,
    month: number = 10,
    mrId?: string,
    territoryId?: string
  ): Promise<TargetAchievementSummary> {
    try {
      const raw = await apiClient.get<any>("/targets/achievement-summary", {
        params: { year, month, mrId, territoryId },
      });
      if (raw && raw.totalTargetAmount != null) {
        return {
          year: raw.year,
          month: raw.month,
          totalTargetAmount: Number(raw.totalTargetAmount),
          totalAchievedAmount: Number(raw.totalAchievedAmount),
          overallSalesPercent: Number(raw.overallSalesPercent),
          totalVisitTarget: Number(raw.totalVisitTarget),
          totalVisitAchieved: Number(raw.totalVisitAchieved),
          overallVisitPercent: Number(raw.overallVisitPercent),
          targetCount: Number(raw.targetCount),
          targets: raw.targets || [],
        };
      }
    } catch (err) {
      console.warn("Failed to fetch achievement summary from API, falling back to mock:", err);
    }

    return {
      year,
      month,
      totalTargetAmount: 450000,
      totalAchievedAmount: 182500,
      overallSalesPercent: 40.56,
      totalVisitTarget: 200,
      totalVisitAchieved: 84,
      overallVisitPercent: 42,
      targetCount: 1,
      targets: [
        {
          id: "mock_target_01",
          mrId: "mr_mdu_01",
          mrName: "Karthik Raman",
          employeeCode: "EMP-MR-001",
          territoryName: "Chennai Central",
          productName: null,
          targetAmount: 450000,
          achievedAmount: 182500,
          salesAchievementPercent: 40.56,
          visitTarget: 200,
          visitAchieved: 84,
          visitAchievementPercent: 42,
        },
      ],
    };
  },

  async createTarget(data: any): Promise<TargetItem> {
    const raw = await apiClient.post<any>("/targets", data);
    return mapTargetItem(raw);
  },

  async updateTarget(id: string, data: any): Promise<TargetItem> {
    const raw = await apiClient.patch<any>(`/targets/${id}`, data);
    return mapTargetItem(raw);
  },
};
