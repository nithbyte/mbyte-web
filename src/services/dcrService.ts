import { apiClient } from "../lib/api-client";

export type DcrStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "REOPENED";

export interface DcrAudit {
  id: string;
  action: string;
  fromStatus: DcrStatus;
  toStatus: DcrStatus;
  comments?: string;
  createdAt: string;
  actor?: { firstName: string; lastName: string; email: string };
}

export interface DailyCallReport {
  id: string;
  organizationId: string;
  mrId: string;
  territoryId: string;
  date: string;
  status: DcrStatus;
  submissionNotes?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedById?: string;
  reviewComments?: string;
  reopenedAt?: string;
  reopenedById?: string;
  reopenReason?: string;
  totalPlannedCalls: number;
  totalExecutedCalls: number;
  totalDoctorsVisited: number;
  totalPharmaciesVisited: number;
  totalDistributorsVisited: number;
  totalOrdersAmount: number | string;
  totalCollectionsAmount: number | string;
  totalSamplesDistributed: number;
  workStartTime?: string;
  workEndTime?: string;
  totalWorkDurationMinutes?: number;
  createdAt: string;
  updatedAt: string;
  mr?: {
    id: string;
    employeeCode: string;
    designation?: string;
    user?: { firstName: string; lastName: string; email: string };
  };
  territory?: { id: string; name: string; code: string; zone?: string };
  approvedBy?: { id: string; firstName: string; lastName: string; email: string };
  reopenedBy?: { id: string; firstName: string; lastName: string; email: string };
  visits?: any[];
  audits?: DcrAudit[];
}

export interface DcrQueryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: DcrStatus | "ALL";
  mrId?: string;
  territoryId?: string;
  page?: number;
  limit?: number;
}

export interface DcrSummary {
  date: string;
  mrId: string;
  status: DcrStatus;
  dcrId: string | null;
  reviewComments: string | null;
  reopenReason: string | null;
  totalPlannedCalls: number;
  totalExecutedCalls: number;
  totalDoctorsVisited: number;
  totalPharmaciesVisited: number;
  totalDistributorsVisited: number;
  totalOrdersAmount: number;
  totalCollectionsAmount: number;
  totalSamplesDistributed: number;
  workStartTime: string | null;
  workEndTime: string | null;
  totalWorkDurationMinutes: number;
  visits: any[];
  orders: any[];
  collections: any[];
}

export const dcrService = {
  async getDcrs(params?: DcrQueryParams): Promise<{ items: DailyCallReport[]; total: number }> {
    try {
      const query: Record<string, any> = { limit: params?.limit || 50, page: params?.page || 1 };
      if (params?.date) query.date = params.date;
      if (params?.startDate) query.startDate = params.startDate;
      if (params?.endDate) query.endDate = params.endDate;
      if (params?.status && params.status !== "ALL") query.status = params.status;
      if (params?.mrId && params.mrId !== "ALL") query.mrId = params.mrId;
      if (params?.territoryId && params.territoryId !== "ALL") query.territoryId = params.territoryId;

      const res = await apiClient.get<any>("/dcr", { params: query });
      if (Array.isArray(res)) {
        return { items: res, total: res.length };
      }
      return { items: res?.items || res || [], total: res?.total || (res?.items ? res.items.length : 0) };
    } catch (err) {
      console.warn("dcrService.getDcrs failed:", err);
      return { items: [], total: 0 };
    }
  },

  async getDcrById(id: string): Promise<DailyCallReport | null> {
    try {
      return await apiClient.get<DailyCallReport>(`/dcr/${id}`);
    } catch (err) {
      console.warn(`dcrService.getDcrById(${id}) failed:`, err);
      return null;
    }
  },

  async getDailySummary(date: string, mrId?: string): Promise<DcrSummary | null> {
    try {
      const params: Record<string, any> = { date };
      if (mrId) params.mrId = mrId;
      return await apiClient.get<DcrSummary>("/dcr/summary", { params });
    } catch (err) {
      console.warn(`dcrService.getDailySummary(${date}) failed:`, err);
      return null;
    }
  },

  async approveDcr(id: string, reviewComments?: string): Promise<DailyCallReport> {
    return apiClient.post<DailyCallReport>(`/dcr/${id}/approve`, { reviewComments });
  },

  async rejectDcr(id: string, reviewComments: string): Promise<DailyCallReport> {
    return apiClient.post<DailyCallReport>(`/dcr/${id}/reject`, { reviewComments });
  },

  async reopenDcr(id: string, reopenReason: string): Promise<DailyCallReport> {
    return apiClient.post<DailyCallReport>(`/dcr/${id}/reopen`, { reopenReason });
  },
};
