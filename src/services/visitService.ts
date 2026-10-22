import { apiClient, isMockFallbackAllowed } from "../lib/api-client";
import { mockVisits } from "../mock";
import { authService } from "./authService";
import { isOrgMatch, getLocalTodayDate } from "../lib/utils";
import type { Visit, VisitQueryParams, VisitCounts } from "../types";

function mapApiVisit(v: any): Visit {
  const customerName = v.customer?.name || v.customerName || "Customer";
  const customerAddress = v.customer?.address || v.customerAddress || "Address";
  const specialty = v.customer?.specialty || v.specialty;

  let scheduledStartTimeStr = v.scheduledStartTime;
  if (scheduledStartTimeStr && typeof scheduledStartTimeStr === "string" && scheduledStartTimeStr.includes("T")) {
    try {
      const d = new Date(scheduledStartTimeStr);
      scheduledStartTimeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      // keep
    }
  }

  return {
    id: v.id,
    organizationId: v.organizationId || "",
    mrId: v.mrId || v.mr?.id || "mr_001",
    mrName: v.mr?.name || v.mrName || "Medical Representative",
    territoryId: v.territoryId || v.mr?.territoryId || "ter_001",
    territoryName: v.territoryName || v.mr?.territoryName || "Central Territory",
    customerId: v.doctorId || v.pharmacyId || v.distributorId || v.customerId,
    customerName,
    customerType: v.customerType || "DOCTOR",
    specialty,
    customerAddress,
    plannedDate: v.scheduledDate?.split("T")[0] || getLocalTodayDate(),
    scheduledDate: v.scheduledDate?.split("T")[0] || getLocalTodayDate(),
    scheduledStartTime: scheduledStartTimeStr || "10:00 AM",
    scheduledEndTime: v.scheduledEndTime || "10:30 AM",
    status: v.status || "PLANNED",
    verificationStatus: v.verificationStatus || "OUTSIDE_RADIUS",
    exceptionReason: v.exceptionReason,
    exceptionRequestedAt: v.exceptionRequestedAt,
    exceptionReviewedAt: v.exceptionReviewedAt,
    exceptionReviewedById: v.exceptionReviewedById,
    exceptionReviewComments: v.exceptionReviewComments,
    accompaniments: v.accompaniments,
    verifiedDistance: typeof v.distanceMeters === "number" ? v.distanceMeters : (typeof v.verifiedDistance === "number" ? v.verifiedDistance : 0),
    distanceMeters: typeof v.distanceMeters === "number" ? v.distanceMeters : (typeof v.verifiedDistance === "number" ? v.verifiedDistance : 0),
    actualStartTime: v.actualStartTime,
    actualEndTime: v.actualEndTime,
    feedbackNotes: v.feedbackNotes,
    doctorFeedback: v.feedbackNotes,
    durationSeconds: v.durationSeconds,
    createdAt: v.createdAt,
  };
}

export const visitService = {
  async getVisits(params?: VisitQueryParams): Promise<Visit[]> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (params?.date && params.date !== "ALL") queryParams.date = params.date;
      if (params?.mrId && params.mrId !== "ALL") queryParams.mrId = params.mrId;
      if (params?.status && params.status !== "ALL") queryParams.status = params.status;
      if (params?.customerId && params.customerId !== "ALL") queryParams.doctorId = params.customerId;
      if (params?.organizationId) queryParams.organizationId = params.organizationId;

      const res = await apiClient.get<any>("/visits", { params: queryParams });
      const items = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : null);
      if (items !== null) {
        let list = items.map(mapApiVisit);

        if (params?.territoryId && params.territoryId !== "ALL") {
          list = list.filter((v: any) => v.territoryId === params.territoryId);
        }

        if (params?.customerType && params.customerType !== "ALL") {
          list = list.filter((v: any) => v.customerType === params.customerType);
        }

        if (params?.verificationStatus && params.verificationStatus !== "ALL") {
          list = list.filter((v: any) => v.verificationStatus === params.verificationStatus);
        }

        if (params?.search) {
          const q = params.search.toLowerCase();
          list = list.filter(
            (v: any) =>
              v.customerName.toLowerCase().includes(q) ||
              (v.mrName && v.mrName.toLowerCase().includes(q)) ||
              (v.specialty && v.specialty.toLowerCase().includes(q))
          );
        }

        return list;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err;
      }
      console.warn("Real /visits API call failed, falling back to mock:", err);
    }

    let list = [...mockVisits];

    // Enforce tenant scoping in mock fallback
    const currentUser = await authService.getCurrentUser();
    const effectiveOrgId = params?.organizationId || (currentUser?.role !== "SUPER_ADMIN" ? currentUser?.organizationId : undefined);
    if (effectiveOrgId) {
      list = list.filter((v) => isOrgMatch(v.organizationId, effectiveOrgId));
    }

    if (params?.date && params.date !== "ALL") {
      list = list.filter(
        (v) => v.scheduledDate === params.date || v.plannedDate === params.date
      );
    }

    if (params?.mrId && params.mrId !== "ALL") {
      list = list.filter((v) => v.mrId === params.mrId);
    }

    if (params?.territoryId && params.territoryId !== "ALL") {
      list = list.filter((v) => v.territoryId === params.territoryId);
    }

    if (params?.customerId && params.customerId !== "ALL") {
      list = list.filter((v) => v.customerId === params.customerId);
    }

    if (params?.customerType && params.customerType !== "ALL") {
      list = list.filter((v) => v.customerType === params.customerType);
    }

    if (params?.status && params.status !== "ALL") {
      if (params.status === "IN_PROGRESS") {
        list = list.filter(
          (v) => v.status === "IN_PROGRESS" || v.status === "LOCATION_VERIFIED"
        );
      } else {
        list = list.filter((v) => v.status === params.status);
      }
    }

    if (params?.verificationStatus && params.verificationStatus !== "ALL") {
      list = list.filter((v) => v.verificationStatus === params.verificationStatus);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (v) =>
          v.customerName.toLowerCase().includes(q) ||
          (v.mrName && v.mrName.toLowerCase().includes(q)) ||
          (v.specialty && v.specialty.toLowerCase().includes(q)) ||
          (v.territoryName && v.territoryName.toLowerCase().includes(q)) ||
          (v.feedbackNotes && v.feedbackNotes.toLowerCase().includes(q)) ||
          (v.customerAddress && v.customerAddress.toLowerCase().includes(q))
      );
    }

    // Sort: Today's visits first by scheduled time
    list.sort((a, b) => {
      const dateA = a.scheduledDate || a.plannedDate || "";
      const dateB = b.scheduledDate || b.plannedDate || "";
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      return (a.scheduledStartTime || "").localeCompare(b.scheduledStartTime || "");
    });

    return Promise.resolve(list);
  },

  async getVisitCounts(params?: VisitQueryParams): Promise<VisitCounts> {
    const list = await this.getVisits(params);
    const total = list.length;
    let completed = 0;
    let inProgress = 0;
    let missed = 0;
    let cancelled = 0;
    let planned = 0;
    let verifiedCount = 0;

    for (const v of list) {
      if (v.status === "COMPLETED") completed++;
      else if (v.status === "IN_PROGRESS" || v.status === "LOCATION_VERIFIED") inProgress++;
      else if (v.status === "MISSED") missed++;
      else if (v.status === "CANCELLED") cancelled++;
      else if (v.status === "PLANNED") planned++;

      if (v.verificationStatus === "VERIFIED") verifiedCount++;
    }

    const gpsVerifiedRate = total > 0 ? Math.round((verifiedCount / total) * 100) : 100;

    return {
      todayTotal: total,
      completed,
      inProgress,
      missed,
      cancelled,
      planned,
      gpsVerifiedRate,
    };
  },

  async getTodayVisits(territoryId?: string): Promise<Visit[]> {
    return this.getVisits({ date: getLocalTodayDate(), territoryId });
  },

  async getUniqueVisitDates(): Promise<string[]> {
    try {
      const visits = await this.getVisits();
      const dates = Array.from(
        new Set(
          visits
            .map((v) => v.scheduledDate || v.plannedDate)
            .filter((d): d is string => Boolean(d))
        )
      );
      if (dates.length > 0) return dates.sort().reverse();
    } catch {
      // fallback
    }

    const dates = Array.from(
      new Set(
        mockVisits
          .map((v) => v.scheduledDate || v.plannedDate)
          .filter((d): d is string => Boolean(d))
      )
    );
    return Promise.resolve(dates.sort().reverse());
  },

  async getVisitById(id: string): Promise<Visit | null> {
    try {
      const res = await apiClient.get<any>(`/visits/${id}`);
      if (res && res.id) {
        return mapApiVisit(res);
      }
    } catch {
      // fallback
    }

    const v = mockVisits.find((item) => item.id === id);
    return Promise.resolve(v || null);
  },

  async createVisit(input: {
    mrId: string;
    customerId: string;
    customerType: 'DOCTOR' | 'PHARMACY';
    scheduledDate: string;
    scheduledStartTime: string;
    scheduledEndTime?: string;
    priority?: string;
    notes?: string;
  }): Promise<Visit> {
    try {
      const datePart = input.scheduledDate.includes('T')
        ? input.scheduledDate.split('T')[0]
        : input.scheduledDate;

      const payload: Record<string, any> = {
        mrId: input.mrId,
        customerType: input.customerType,
        scheduledDate: datePart,
      };

      if (input.customerType === 'DOCTOR') {
        payload.doctorId = input.customerId;
      } else if (input.customerType === 'PHARMACY') {
        payload.pharmacyId = input.customerId;
      }

      if (input.scheduledStartTime && input.scheduledStartTime.trim()) {
        try {
          payload.scheduledStartTime = new Date(`${datePart}T${input.scheduledStartTime.trim()}:00Z`).toISOString();
        } catch {
          // ignore
        }
      }

      if (input.scheduledEndTime && input.scheduledEndTime.trim()) {
        try {
          payload.scheduledEndTime = new Date(`${datePart}T${input.scheduledEndTime.trim()}:00Z`).toISOString();
        } catch {
          // ignore
        }
      }

      const res = await apiClient.post<any>('/visits', payload);
      if (res && res.id) {
        const mapped = mapApiVisit(res);
        mockVisits.unshift(mapped as any);
        return mapped;
      }
    } catch (err) {
      console.warn('Real POST /visits failed, using mock:', err);
    }
    // Mock fallback
    const currentUser = await authService.getCurrentUser();
    const newVisit: Visit = {
      id: `visit_${Date.now()}`,
      organizationId: currentUser?.organizationId || '',
      mrId: input.mrId,
      mrName: 'Medical Representative',
      customerId: input.customerId,
      customerName: 'Scheduled Customer',
      customerType: input.customerType,
      customerAddress: 'Address to be confirmed',
      plannedDate: input.scheduledDate,
      scheduledDate: input.scheduledDate,
      scheduledStartTime: input.scheduledStartTime,
      scheduledEndTime: input.scheduledEndTime || '',
      status: 'PLANNED',
      verificationStatus: 'UNVERIFIED',
      priority: input.priority || 'ROUTINE',
      feedbackNotes: input.notes,
      createdAt: new Date().toISOString(),
    };
    mockVisits.unshift(newVisit as any);
    return Promise.resolve(newVisit);
  },

  async reviewGeofenceException(visitId: string, approved: boolean, comments?: string): Promise<Visit> {
    try {
      const res = await apiClient.post<any>(`/visits/${visitId}/review-exception`, {
        approved,
        comments,
      });
      return mapApiVisit(res);
    } catch (err) {
      console.warn("POST /visits/:id/review-exception failed, using mock:", err);
      const visit = mockVisits.find((v) => v.id === visitId);
      if (visit) {
        visit.verificationStatus = approved ? ("EXCEPTION_APPROVED" as any) : ("OUTSIDE_RADIUS" as any);
        visit.status = approved ? ("LOCATION_VERIFIED" as any) : ("PLANNED" as any);
        (visit as any).exceptionReviewedAt = new Date().toISOString();
        (visit as any).exceptionReviewComments = comments || null;
        return visit as any;
      }
      throw err;
    }
  },

  async recordAccompaniment(visitId: string, data: {
    durationMinutes?: number;
    jointObjectives?: string;
    coachingFeedback?: string;
    isPrivateCoaching?: boolean;
    strengthsObserved?: string;
    areasOfImprovement?: string;
    rating?: number;
  }) {
    return apiClient.post<any>(`/visits/${visitId}/accompaniment`, data);
  },

  async getAccompaniments(visitId: string) {
    try {
      return await apiClient.get<any[]>(`/visits/${visitId}/accompaniments`);
    } catch {
      return [];
    }
  },

  async getJointVisits(params?: any) {
    try {
      return await apiClient.get<any[]>('/visits/joint-visits', { params });
    } catch {
      return [];
    }
  },
};
export type { VisitQueryParams };

