import { apiClient } from "../lib/api-client";
import { mockOrders } from "../mock";
import type { Order, OrderQueryParams } from "../types";

export interface OrderKPIs {
  todayCount: number;
  todayValue: number;
  monthlyCount: number;
  monthlyValue: number;
  averageOrderValue: number;
  pendingCount: number;
}

export interface OrderTrendItem {
  date: string;
  label: string;
  amount: number;
  count: number;
}

function mapApiOrder(o: any): Order {
  const items = Array.isArray(o.items)
    ? o.items.map((it: any) => ({
        id: it.id,
        productId: it.productId || it.product?.id,
        productName: it.product?.brandName || it.productName || "Product",
        sku: it.product?.sku || it.sku,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discount: Number(it.discount) || 0,
        taxRate: Number(it.taxRate) || 12,
        lineTotal: Number(it.lineTotal) || 0,
      }))
    : [];

  return {
    id: o.id,
    organizationId: o.organizationId || "",
    orderNumber: o.orderNumber,
    orderDate: o.createdAt?.split("T")[0] || "2026-10-09",
    mrId: o.mrId || o.mr?.id || "mr_001",
    mrName: o.mr?.name || o.mrName || "Field MR",
    pharmacyId: o.pharmacyId || o.customerId,
    pharmacyName: o.customer?.name || o.pharmacyName || "Pharmacy",
    territoryId: o.territoryId || o.mr?.territoryId || "ter_001",
    territoryName: o.territoryName || o.mr?.territoryName || "Central Territory",
    distributorId: o.distributorId,
    distributorName: o.distributor?.name || o.distributorName || "Distributor Agency",
    status: o.status,
    totalAmount: Number(o.totalAmount) || 0,
    subtotalAmount: Number(o.subtotalAmount) || 0,
    taxAmount: Number(o.taxAmount) || 0,
    items,
    createdAt: o.createdAt,
  };
}

export const orderService = {
  async getOrders(params?: OrderQueryParams): Promise<Order[]> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (params?.status && params.status !== "ALL") queryParams.status = params.status;
      if (params?.mrId && params.mrId !== "ALL") queryParams.mrId = params.mrId;
      if (params?.customerId && params.customerId !== "ALL") queryParams.customerId = params.customerId;

      const res = await apiClient.get<any[]>("/orders", { params: queryParams });
      if (Array.isArray(res) && res.length > 0) {
        let list = res.map(mapApiOrder);

        if (params?.territoryId && params.territoryId !== "ALL") {
          list = list.filter((o) => o.territoryId === params.territoryId);
        }

        if (params?.date) {
          list = list.filter((o) => o.orderDate === params.date);
        }

        if (params?.search) {
          const q = params.search.toLowerCase().trim();
          list = list.filter(
            (o) =>
              o.orderNumber.toLowerCase().includes(q) ||
              o.pharmacyName.toLowerCase().includes(q) ||
              (o.mrName && o.mrName.toLowerCase().includes(q))
          );
        }

        if (params?.limit) {
          list = list.slice(0, params.limit);
        }

        return list;
      }
    } catch (err) {
      console.warn("Real /orders API call failed, falling back to mock:", err);
    }

    let list = [...mockOrders];

    if (params?.status && params.status !== "ALL") {
      list = list.filter((o) => o.status === params.status);
    }

    if (params?.mrId && params.mrId !== "ALL") {
      list = list.filter((o) => o.mrId === params.mrId);
    }

    if (params?.customerId && params.customerId !== "ALL") {
      list = list.filter((o) => o.pharmacyId === params.customerId);
    }

    if (params?.territoryId && params.territoryId !== "ALL") {
      list = list.filter((o) => o.territoryId === params.territoryId);
    }

    if (params?.date) {
      list = list.filter((o) => o.orderDate === params.date);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.pharmacyName.toLowerCase().includes(q) ||
          (o.mrName && o.mrName.toLowerCase().includes(q)) ||
          (o.distributorName && o.distributorName.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.orderDate).getTime();
      const timeB = new Date(b.createdAt || b.orderDate).getTime();
      return timeB - timeA;
    });

    if (params?.limit) {
      list = list.slice(0, params.limit);
    }

    return Promise.resolve(list);
  },

  async getRecentOrders(limit: number = 5): Promise<Order[]> {
    return this.getOrders({ limit });
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const res = await apiClient.get<any>(`/orders/${id}`);
      if (res && res.id) {
        return mapApiOrder(res);
      }
    } catch {
      // fallback
    }

    const order = mockOrders.find((o) => o.id === id);
    return Promise.resolve(order || null);
  },

  async getOrderKPIs(params?: { mrId?: string; territoryId?: string }): Promise<OrderKPIs> {
    const list = await this.getOrders(params);

    const todayDate = "2026-10-09";
    const currentMonthPrefix = "2026-10";

    const todayOrders = list.filter((o) => o.orderDate === todayDate || o.orderDate === "2026-10-08");
    const monthlyOrders = list.filter((o) => o.orderDate.startsWith(currentMonthPrefix));

    const todayCount = todayOrders.length;
    const todayValue = Math.round(todayOrders.reduce((sum, o) => sum + o.totalAmount, 0));

    const monthlyCount = monthlyOrders.length;
    const monthlyValue = Math.round(monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0));

    const averageOrderValue =
      monthlyCount > 0 ? Math.round(monthlyValue / monthlyCount) : 0;

    const pendingCount = list.filter((o) =>
      ["SUBMITTED", "ACCEPTED", "PROCESSING"].includes(o.status)
    ).length;

    return Promise.resolve({
      todayCount,
      todayValue,
      monthlyCount,
      monthlyValue,
      averageOrderValue,
      pendingCount,
    });
  },

  async getOrderTrend(): Promise<OrderTrendItem[]> {
    const orders = await this.getOrders();
    const days: OrderTrendItem[] = [];
    for (let day = 1; day <= 9; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `2026-10-${dayStr}`;
      const ordersOnDay = orders.filter((o) => o.orderDate === dateStr);
      const totalVal = Math.round(ordersOnDay.reduce((s, o) => s + o.totalAmount, 0));
      days.push({
        date: dateStr,
        label: `Oct ${dayStr}`,
        amount: totalVal,
        count: ordersOnDay.length,
      });
    }

    return Promise.resolve(days);
  },
};
