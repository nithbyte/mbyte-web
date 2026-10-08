import { mockCollections } from "../mock";
import type { Collection, CollectionQueryParams } from "../types";

export interface CollectionKPIs {
  todayCount: number;
  todayValue: number;
  monthlyCount: number;
  monthlyValue: number;
  upiTotal: number;
  chequeTotal: number;
  cashTotal: number;
  bankTransferTotal: number;
}

export interface CollectionTrendItem {
  date: string;
  label: string;
  amount: number;
  count: number;
}

export const collectionService = {
  async getCollections(params?: CollectionQueryParams): Promise<Collection[]> {
    let list = [...mockCollections];

    if (params?.mode && params.mode !== "ALL") {
      list = list.filter((c) => c.paymentMode === params.mode);
    }

    if (params?.mrId && params.mrId !== "ALL") {
      list = list.filter((c) => c.mrId === params.mrId);
    }

    if (params?.customerId && params.customerId !== "ALL") {
      list = list.filter((c) => c.pharmacyId === params.customerId);
    }

    if (params?.territoryId && params.territoryId !== "ALL") {
      list = list.filter((c) => c.territoryId === params.territoryId);
    }

    if (params?.date) {
      list = list.filter((c) => c.paymentDate === params.date);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.receiptNumber.toLowerCase().includes(q) ||
          c.pharmacyName.toLowerCase().includes(q) ||
          (c.mrName && c.mrName.toLowerCase().includes(q)) ||
          (c.referenceNumber && c.referenceNumber.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    // Sort by payment date descending
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.paymentDate).getTime();
      const timeB = new Date(b.createdAt || b.paymentDate).getTime();
      return timeB - timeA;
    });

    if (params?.limit) {
      list = list.slice(0, params.limit);
    }

    return Promise.resolve(list);
  },

  async getRecentCollections(limit: number = 5): Promise<Collection[]> {
    return this.getCollections({ limit });
  },

  async getCollectionById(id: string): Promise<Collection | null> {
    const item = mockCollections.find((c) => c.id === id);
    return Promise.resolve(item || null);
  },

  async getCollectionKPIs(params?: { mrId?: string; territoryId?: string }): Promise<CollectionKPIs> {
    let list = [...mockCollections];
    if (params?.mrId && params.mrId !== "ALL") {
      list = list.filter((c) => c.mrId === params.mrId);
    }
    if (params?.territoryId && params.territoryId !== "ALL") {
      list = list.filter((c) => c.territoryId === params.territoryId);
    }

    const todayDate = "2026-10-08";
    const currentMonthPrefix = "2026-10";

    const todayCollections = list.filter((c) => c.paymentDate === todayDate);
    const monthlyCollections = list.filter((c) => c.paymentDate.startsWith(currentMonthPrefix));

    const todayCount = todayCollections.length;
    const todayValue = Math.round(todayCollections.reduce((sum, c) => sum + c.amount, 0));

    const monthlyCount = monthlyCollections.length;
    const monthlyValue = Math.round(monthlyCollections.reduce((sum, c) => sum + c.amount, 0));

    let upiTotal = 0;
    let chequeTotal = 0;
    let cashTotal = 0;
    let bankTransferTotal = 0;

    for (const c of monthlyCollections) {
      if (c.paymentMode === "UPI") upiTotal += c.amount;
      else if (c.paymentMode === "CHEQUE") chequeTotal += c.amount;
      else if (c.paymentMode === "CASH") cashTotal += c.amount;
      else if (c.paymentMode === "BANK_TRANSFER") bankTransferTotal += c.amount;
    }

    return Promise.resolve({
      todayCount,
      todayValue,
      monthlyCount,
      monthlyValue,
      upiTotal: Math.round(upiTotal),
      chequeTotal: Math.round(chequeTotal),
      cashTotal: Math.round(cashTotal),
      bankTransferTotal: Math.round(bankTransferTotal),
    });
  },

  async getCollectionTrend(): Promise<CollectionTrendItem[]> {
    const days: CollectionTrendItem[] = [];
    for (let day = 1; day <= 8; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `2026-10-${dayStr}`;
      const colsOnDay = mockCollections.filter((c) => c.paymentDate === dateStr);
      const totalVal = Math.round(colsOnDay.reduce((s, c) => s + c.amount, 0));
      days.push({
        date: dateStr,
        label: `Oct ${dayStr}`,
        amount: totalVal,
        count: colsOnDay.length,
      });
    }

    return Promise.resolve(days);
  },
};
