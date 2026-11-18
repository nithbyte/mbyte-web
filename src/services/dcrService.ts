import { apiClient } from "../lib/api-client";

export type DcrStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "REOPENED";
export type DcrUnlockRequestStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface DcrAudit {
  id: string;
  action: string;
  fromStatus: DcrStatus;
  toStatus: DcrStatus;
  comments?: string;
  createdAt: string;
  actor?: { firstName: string; lastName: string; email: string };
}

export interface DcrProductDiscussed {
  productId: string;
  brandName: string;
  dosageForm?: string | null;
  sku?: string | null;
  samplesQty: number;
  visitCount: number;
  customers: string[];
  feedbacks: string[];
}

export interface DcrVisualAidShown {
  sessionId: string;
  visualAidId: string;
  title: string;
  type: string;
  productName?: string | null;
  visitId?: string | null;
  customerName?: string | null;
  durationSeconds: number;
  startedAt: string;
  endedAt?: string | null;
  completed: boolean;
  notes?: string | null;
}

export interface DcrOrderBooked {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  visitId?: string | null;
  totalAmount: number;
  itemsCount: number;
  items: Array<{ productName: string; quantity: number; lineTotal: number }>;
  remarks?: string | null;
  createdAt: string;
}

export interface DcrFeedbackItem {
  visitId: string;
  customerName: string;
  customerType: string;
  status: string;
  startTime?: string | null;
  endTime?: string | null;
  durationSeconds?: number | null;
  feedbackNotes?: string | null;
  productFeedbacks: Array<{ productName: string; feedback: string }>;
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
  unlockRequestStatus?: DcrUnlockRequestStatus;
  unlockRequestedAt?: string;
  unlockRequestReason?: string;
  unlockReviewedAt?: string;
  unlockReviewedById?: string;
  unlockReviewComments?: string;
  unlockReviewedBy?: { id: string; firstName: string; lastName: string; email: string };
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
  orders?: any[];
  collections?: any[];
  productsDiscussed?: DcrProductDiscussed[];
  visualAidsShown?: DcrVisualAidShown[];
  ordersBooked?: DcrOrderBooked[];
  feedbacks?: DcrFeedbackItem[];
  audits?: DcrAudit[];
}

export interface DcrQueryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: DcrStatus | "ALL";
  unlockRequestStatus?: DcrUnlockRequestStatus | "ALL";
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
      if (params?.unlockRequestStatus && params.unlockRequestStatus !== "ALL") {
        query.unlockRequestStatus = params.unlockRequestStatus;
      }
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

  async reviewUnlockRequest(
    id: string,
    status: "APPROVED" | "REJECTED",
    comments?: string
  ): Promise<DailyCallReport> {
    return apiClient.post<DailyCallReport>(`/dcr/${id}/unlock-request/review`, {
      status,
      comments: comments?.trim() || undefined,
    });
  },
};
