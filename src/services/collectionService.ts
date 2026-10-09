import { apiClient } from "../lib/api-client";
import { mockCollections } from "../mock";
import type { Collection, CollectionQueryParams, PaymentMode } from "../types";

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

function mapApiCollection(item: any): Collection {
  return {
    id: item.id,
    organizationId: item.organizationId,
    receiptNumber: item.receiptNumber,
    mrId: item.mrId,
    mrName: item.mr?.name || item.mrName || "Medical Representative",
    mrEmployeeCode: item.mr?.employeeCode || item.mrEmployeeCode,
    mrPhone: item.mr?.phone || item.mrPhone,
    pharmacyId: item.pharmacyId || item.customerId || item.id,
    pharmacyName: item.customer?.name || item.pharmacyName || "Pharmacy",
    customerName: item.customer?.name || item.customerName || item.pharmacyName,
    customerAddress: item.customer?.address || item.customerAddress,
    territoryId: item.territoryId || item.mr?.territoryId,
    territoryName: item.territoryName,
    amount: Number(item.amount || 0),
    paymentMode: item.paymentMode as PaymentMode,
    referenceNumber: item.referenceNumber || undefined,
    paymentDate:
      typeof item.paymentDate === "string"
        ? item.paymentDate.slice(0, 10)
        : typeof item.timestamp === "string"
        ? item.timestamp.slice(0, 10)
        : "2026-10-09",
    notes: item.notes || undefined,
    receiptImageUrl: item.receiptImageUrl || null,
    invoiceNumber: item.invoiceNumber || (item.order ? item.order.orderNumber : undefined),
    createdAt: item.createdAt || item.timestamp || new Date().toISOString(),
  };
}

export const collectionService = {
  async getCollections(params?: CollectionQueryParams): Promise<Collection[]> {
    try {
      const queryParams: Record<string, any> = { limit: Math.min(params?.limit || 100, 100) };
      if (params?.mode && params.mode !== "ALL") queryParams.paymentMode = params.mode;
      if (params?.mrId && params.mrId !== "ALL") queryParams.mrId = params.mrId;
      if (params?.customerId && params.customerId !== "ALL") queryParams.customerId = params.customerId;
      if (params?.date) queryParams.date = params.date;
      if (params?.search) queryParams.search = params.search;

      const raw = await apiClient.get<any>("/collections", { params: queryParams });
      const list = Array.isArray(raw) ? raw : (raw as any)?.data || [];
      if (list && list.length > 0) {
        let mapped: Collection[] = list.map(mapApiCollection);

        if (params?.search) {
          const q = params.search.toLowerCase().trim();
          mapped = mapped.filter(
            (c) =>
              c.receiptNumber.toLowerCase().includes(q) ||
              c.pharmacyName.toLowerCase().includes(q) ||
              (c.mrName && c.mrName.toLowerCase().includes(q)) ||
              (c.referenceNumber && c.referenceNumber.toLowerCase().includes(q)) ||
              (c.notes && c.notes.toLowerCase().includes(q))
          );
        }

        if (params?.territoryId && params.territoryId !== "ALL") {
          mapped = mapped.filter((c) => c.territoryId === params.territoryId);
        }

        mapped.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.paymentDate).getTime();
          const timeB = new Date(b.createdAt || b.paymentDate).getTime();
          return timeB - timeA;
        });

        if (params?.limit) {
          mapped = mapped.slice(0, params.limit);
        }

        return mapped;
      }
    } catch (err) {
      console.warn("Failed to fetch collections from backend, falling back to mock:", err);
    }

    // Fallback to mock
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
    try {
      const raw = await apiClient.get<any>(`/collections/${id}`);
      if (raw && raw.id) {
        return mapApiCollection(raw);
      }
    } catch {
      // Fallback
    }
    const item = mockCollections.find((c) => c.id === id);
    return Promise.resolve(item || null);
  },

  async getCollectionKPIs(params?: { mrId?: string; territoryId?: string }): Promise<CollectionKPIs> {
    try {
      const list = await this.getCollections(params);
      const todayDate = "2026-10-09";
      const currentMonthPrefix = "2026-10";

      const todayCollections = list.filter((c) => c.paymentDate === todayDate || c.createdAt.startsWith(todayDate));
      const monthlyCollections = list.filter((c) => c.paymentDate.startsWith(currentMonthPrefix) || c.createdAt.startsWith(currentMonthPrefix));

      const todayCount = todayCollections.length;
      const todayValue = Math.round(todayCollections.reduce((sum, c) => sum + c.amount, 0));

      const monthlyCount = monthlyCollections.length;
      const monthlyValue = Math.round(monthlyCollections.reduce((sum, c) => sum + c.amount, 0));

      let upiTotal = 0;
      let chequeTotal = 0;
      let cashTotal = 0;
      let bankTransferTotal = 0;

      for (const c of (monthlyCollections.length > 0 ? monthlyCollections : list)) {
        if (c.paymentMode === "UPI") upiTotal += c.amount;
        else if (c.paymentMode === "CHEQUE") chequeTotal += c.amount;
        else if (c.paymentMode === "CASH") cashTotal += c.amount;
        else if (c.paymentMode === "BANK_TRANSFER") bankTransferTotal += c.amount;
      }

      return {
        todayCount,
        todayValue,
        monthlyCount,
        monthlyValue,
        upiTotal: Math.round(upiTotal),
        chequeTotal: Math.round(chequeTotal),
        cashTotal: Math.round(cashTotal),
        bankTransferTotal: Math.round(bankTransferTotal),
      };
    } catch {
      // Fallback
    }

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
    try {
      const list = await this.getCollections({ limit: 100 });
      if (list && list.length > 0) {
        const days: CollectionTrendItem[] = [];
        for (let day = 1; day <= 9; day++) {
          const dayStr = day < 10 ? `0${day}` : `${day}`;
          const dateStr = `2026-10-${dayStr}`;
          const colsOnDay = list.filter((c) => c.paymentDate === dateStr || c.createdAt.startsWith(dateStr));
          const totalVal = Math.round(colsOnDay.reduce((s, c) => s + c.amount, 0));
          days.push({
            date: dateStr,
            label: `Oct ${dayStr}`,
            amount: totalVal,
            count: colsOnDay.length,
          });
        }
        return days;
      }
    } catch {
      // Fallback
    }

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
