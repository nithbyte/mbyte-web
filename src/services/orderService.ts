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

export const orderService = {
  async getOrders(params?: OrderQueryParams): Promise<Order[]> {
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

    // Sort by order date / timestamp descending
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
    const order = mockOrders.find((o) => o.id === id);
    return Promise.resolve(order || null);
  },

  async getOrderKPIs(params?: { mrId?: string; territoryId?: string }): Promise<OrderKPIs> {
    let list = [...mockOrders];
    if (params?.mrId && params.mrId !== "ALL") {
      list = list.filter((o) => o.mrId === params.mrId);
    }
    if (params?.territoryId && params.territoryId !== "ALL") {
      list = list.filter((o) => o.territoryId === params.territoryId);
    }

    const todayDate = "2026-10-08";
    const currentMonthPrefix = "2026-10";

    const todayOrders = list.filter((o) => o.orderDate === todayDate);
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
    const days: OrderTrendItem[] = [];
    for (let day = 1; day <= 8; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `2026-10-${dayStr}`;
      const ordersOnDay = mockOrders.filter((o) => o.orderDate === dateStr);
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
