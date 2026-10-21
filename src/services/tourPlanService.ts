import { apiClient } from "../lib/api-client";

export type TourPlanStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "REOPENED";
export type TourActivityType = "FIELD_WORK" | "TRANSIT" | "CONFERENCE" | "MEETING" | "LEAVE" | "HOLIDAY";

export interface TourPlanCall {
  id: string;
  customerType: "DOCTOR" | "PHARMACY" | "DISTRIBUTOR";
  doctorId?: string;
  pharmacyId?: string;
  distributorId?: string;
  doctor?: { name: string; specialty: string; clinicName: string };
  pharmacy?: { name: string; address: string };
  distributor?: { name: string; address: string };
  priority: number;
  objective?: string;
  visitId?: string;
}

export interface TourPlanDay {
  id: string;
  date: string;
  dayOfWeek: number;
  isWorkingDay: boolean;
  activityType: TourActivityType;
  routeDescription?: string;
  targetCallCount: number;
  notes?: string;
  plannedCalls: TourPlanCall[];
}

export interface TourPlanAudit {
  id: string;
  action: string;
  fromStatus: TourPlanStatus;
  toStatus: TourPlanStatus;
  comments?: string;
  createdAt: string;
  actor?: { firstName: string; lastName: string; email: string };
}

export interface TourPlan {
  id: string;
  organizationId: string;
  mrId: string;
  territoryId: string;
  year: number;
  month: number;
  status: TourPlanStatus;
  version: number;
  submittedAt?: string;
  approvedAt?: string;
  reviewComments?: string;
  reopenedAt?: string;
  reopenReason?: string;
  createdAt: string;
  updatedAt: string;
  days: TourPlanDay[];
  audits?: TourPlanAudit[];
  mr?: {
    id: string;
    employeeCode: string;
    designation?: string;
    headquarters?: string;
    user?: { firstName: string; lastName: string; email: string };
  };
  territory?: { id: string; name: string; code: string; zone?: string };
  approvedBy?: { id: string; firstName: string; lastName: string; email: string };
  reopenedBy?: { id: string; firstName: string; lastName: string; email: string };
  _count?: { days: number };
}

export interface TourPlanQueryParams {
  year?: number;
  month?: number;
  status?: TourPlanStatus | "ALL";
  mrId?: string;
  territoryId?: string;
  page?: number;
  limit?: number;
}

export interface PlannedVsActualReport {
  year: number;
  month: number;
  mrId: string;
  tourPlanStatus: string;
  tourPlanVersion: number;
  totalPlannedCalls: number;
  completedPlannedCalls: number;
  missedPlannedCalls: number;
  totalExecutedVisits: number;
  unplannedExecutedVisits: number;
  completionRate: number;
  planDays: TourPlanDay[];
  visits: any[];
}

export const tourPlanService = {
  async getTourPlans(params?: TourPlanQueryParams): Promise<{ items: TourPlan[]; total: number }> {
    try {
      const query: Record<string, any> = { limit: params?.limit || 50, page: params?.page || 1 };
      if (params?.year) query.year = params.year;
      if (params?.month) query.month = params.month;
      if (params?.status && params.status !== "ALL") query.status = params.status;
      if (params?.mrId && params.mrId !== "ALL") query.mrId = params.mrId;
      if (params?.territoryId && params.territoryId !== "ALL") query.territoryId = params.territoryId;

      const res = await apiClient.get<any>("/tour-plans", { params: query });
      if (Array.isArray(res)) {
        return { items: res, total: res.length };
      }
      return { items: res?.items || res || [], total: res?.total || (res?.items ? res.items.length : 0) };
    } catch (err) {
      console.warn("tourPlanService.getTourPlans failed:", err);
      return { items: [], total: 0 };
    }
  },

  async getTourPlanById(id: string): Promise<TourPlan | null> {
    try {
      return await apiClient.get<TourPlan>(`/tour-plans/${id}`);
    } catch (err) {
      console.warn(`tourPlanService.getTourPlanById(${id}) failed:`, err);
      return null;
    }
  },

  async approveTourPlan(id: string, reviewComments?: string): Promise<TourPlan> {
    return apiClient.post<TourPlan>(`/tour-plans/${id}/approve`, { reviewComments });
  },

  async rejectTourPlan(id: string, reviewComments: string): Promise<TourPlan> {
    return apiClient.post<TourPlan>(`/tour-plans/${id}/reject`, { reviewComments });
  },

  async reopenTourPlan(id: string, reopenReason: string): Promise<TourPlan> {
    return apiClient.post<TourPlan>(`/tour-plans/${id}/reopen`, { reopenReason });
  },

  async getPlannedVsActual(year: number, month: number, mrId?: string, date?: string): Promise<PlannedVsActualReport | null> {
    try {
      const params: Record<string, any> = { year, month };
      if (mrId) params.mrId = mrId;
      if (date) params.date = date;
      return await apiClient.get<PlannedVsActualReport>("/tour-plans/planned-vs-actual", { params });
    } catch (err) {
      console.warn("tourPlanService.getPlannedVsActual failed:", err);
      return null;
    }
  },
};
