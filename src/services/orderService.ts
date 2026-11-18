import { apiClient, isMockFallbackAllowed } from "../lib/api-client";
import { mockOrders } from "../mock";
import { authService } from "./authService";
import { isOrgMatch } from "../lib/utils";
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
    orderDate: o.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
    mrId: o.mrId || o.mr?.id || "mr_001",
    mrName: o.mr?.name || o.mrName || "Field MR",
    mrEmployeeCode: o.mr?.employeeCode || o.mrEmployeeCode || "",
    pharmacyId: o.pharmacyId || o.customerId,
    pharmacyName: o.customer?.name || o.pharmacyName || "Pharmacy",
    customerAddress: o.customer?.address || o.customerAddress || "",
    territoryId: o.territoryId || o.mr?.territoryId || "ter_001",
    territoryName: o.territoryName || o.mr?.territoryName || "Central Territory",
    distributorId: o.distributorId,
    distributorName: o.distributor?.name || o.distributorName || "Distributor Agency",
    status: o.status,
    totalAmount: Number(o.totalAmount) || 0,
    subtotalAmount: Number(o.subtotalAmount) || 0,
    discountAmount: Number(o.discountAmount) || 0,
    taxAmount: Number(o.taxAmount) || 0,
    remarks: o.remarks,
    notes: o.remarks || o.notes,
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
      if (params?.date) queryParams.date = params.date;
      if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
      if (params?.organizationId) queryParams.organizationId = params.organizationId;

      const res = await apiClient.get<any>("/orders", { params: queryParams });
      const items = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : null);
      if (items !== null) {
        let list = items.map(mapApiOrder);

        if (params?.territoryId && params.territoryId !== "ALL") {
          list = list.filter((o: any) => o.territoryId === params.territoryId);
        }

        if (params?.date) {
          list = list.filter((o: any) => o.orderDate === params.date);
        }

        if (params?.search && params.search.trim()) {
          const q = params.search.toLowerCase().trim();
          list = list.filter(
            (o: any) =>
              o.orderNumber.toLowerCase().includes(q) ||
              o.pharmacyName.toLowerCase().includes(q) ||
              (o.distributorName && o.distributorName.toLowerCase().includes(q)) ||
              (o.mrName && o.mrName.toLowerCase().includes(q)) ||
              (o.mrEmployeeCode && o.mrEmployeeCode.toLowerCase().includes(q)) ||
              (o.remarks && o.remarks.toLowerCase().includes(q)) ||
              (Array.isArray(o.items) &&
                o.items.some(
                  (it: any) =>
                    it.productName?.toLowerCase().includes(q) ||
                    it.sku?.toLowerCase().includes(q)
                ))
          );
        }

        if (params?.limit) {
          list = list.slice(0, params.limit);
        }

        return list;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err;
      }
      console.warn("Real /orders API call failed, falling back to mock:", err);
    }

    let list = [...mockOrders];

    // Enforce tenant scoping in mock fallback
    const currentUser = await authService.getCurrentUser();
    const effectiveOrgId = params?.organizationId || (currentUser?.role !== "SUPER_ADMIN" ? currentUser?.organizationId : undefined);
    if (effectiveOrgId) {
      list = list.filter((o) => isOrgMatch(o.organizationId, effectiveOrgId));
    }

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

  async getRecentOrders(
    limit: number = 5,
    params?: { territoryId?: string; date?: string }
  ): Promise<Order[]> {
    return this.getOrders({
      limit,
      territoryId: params?.territoryId,
      date: params?.date,
    });
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

  async getOrderKPIs(params?: {
    mrId?: string;
    territoryId?: string;
    date?: string;
  }): Promise<OrderKPIs> {
    const list = await this.getOrders({
      mrId: params?.mrId,
      territoryId: params?.territoryId,
    });

    const todayDate = params?.date || new Date().toISOString().split("T")[0];
    const currentMonthPrefix = todayDate.substring(0, 7);

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

  async getOrderTrend(params?: {
    territoryId?: string;
    mrId?: string;
    date?: string;
  }): Promise<OrderTrendItem[]> {
    const orders = await this.getOrders({
      territoryId: params?.territoryId,
      mrId: params?.mrId,
    });
    const days: OrderTrendItem[] = [];
    const anchor = params?.date ? new Date(`${params.date}T12:00:00`) : new Date();
    const baseDate = isNaN(anchor.getTime()) ? new Date() : anchor;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
      const ordersOnDay = orders.filter((o) => o.orderDate === dateStr);
      const totalVal = Math.round(ordersOnDay.reduce((s, o) => s + o.totalAmount, 0));
      days.push({
        date: dateStr,
        label,
        amount: totalVal,
        count: ordersOnDay.length,
      });
    }

    return Promise.resolve(days);
  },

  async updateOrderStatus(id: string, status: string, remarks?: string): Promise<Order> {
    try {
      const payload: Record<string, any> = { status };
      if (remarks && remarks.trim()) {
        payload.remarks = remarks.trim();
      }
      const res = await apiClient.put<any>(`/orders/${id}/status`, payload);
      if (res && res.id) {
        return mapApiOrder(res);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err;
      }
      console.warn("Real PUT /orders/:id/status failed, using mock:", err);
    }
    const order = mockOrders.find((o) => o.id === id);
    if (order) {
      order.status = status as any;
      return order;
    }
    throw new Error("Failed to update order status");
  },

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    try {
      const res = await apiClient.post<any>(`/orders/${id}/cancel`, reason ? { reason } : {});
      if (res && res.id) {
        return mapApiOrder(res);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err;
      }
      console.warn("Real POST /orders/:id/cancel failed, using mock:", err);
    }
    const order = mockOrders.find((o) => o.id === id);
    if (order) {
      order.status = "CANCELLED" as any;
      return order;
    }
    throw new Error("Failed to cancel order");
  },
};

