import { mockVisits } from "../mock";
import type { Visit, VisitQueryParams, VisitCounts } from "../types";

export const visitService = {
  async getVisits(params?: VisitQueryParams): Promise<Visit[]> {
    let list = [...mockVisits];

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
    // When calculating dashboard counts, evaluate for the given query (or today by default)
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
    return this.getVisits({ date: "2026-10-08", territoryId });
  },

  async getUniqueVisitDates(): Promise<string[]> {
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
    const v = mockVisits.find((item) => item.id === id);
    return Promise.resolve(v || null);
  },
};
export type { VisitQueryParams };
