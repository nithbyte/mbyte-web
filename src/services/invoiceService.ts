import { apiClient } from "../lib/api-client";
import type {
  Invoice,
  PaymentAllocation,
  CustomerAging,
  CustomerStatement,
  ReceivablesSummary,
} from "../types/invoice";

export const invoiceService = {
  async getInvoices(params?: {
    status?: string;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Invoice[]; total: number }> {
    try {
      const res: any = await apiClient.get("/invoices", { params });
      return {
        data: res?.data || res || [],
        total: res?.meta?.total || (res?.data?.length ?? 0),
      };
    } catch {
      return { data: [], total: 0 };
    }
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      const res: any = await apiClient.get(`/invoices/${id}`);
      return res?.data || res || null;
    } catch {
      return null;
    }
  },

  async createInvoice(payload: any): Promise<Invoice> {
    const res: any = await apiClient.post("/invoices", payload);
    return res?.data || res;
  },

  async createFromOrder(orderId: string, payload?: any): Promise<Invoice> {
    const res: any = await apiClient.post(`/invoices/from-order/${orderId}`, payload || {});
    return res?.data || res;
  },

  async allocatePayment(
    invoiceId: string,
    payload: { collectionId: string; allocatedAmount: number; notes?: string }
  ): Promise<PaymentAllocation> {
    const res: any = await apiClient.post(`/invoices/${invoiceId}/allocations`, payload);
    return res?.data || res;
  },

  async reverseAllocation(
    allocationId: string,
    reversalReason: string
  ): Promise<PaymentAllocation> {
    const res: any = await apiClient.post(`/invoices/allocations/${allocationId}/reverse`, {
      reversalReason,
    });
    return res?.data || res;
  },

  async getAging(params?: { asOfDate?: string; territoryId?: string }): Promise<CustomerAging[]> {
    try {
      const res: any = await apiClient.get("/invoices/receivables/aging", { params });
      return res?.data || res || [];
    } catch {
      return [];
    }
  },

  async getStatement(customerId: string, asOfDate?: string): Promise<CustomerStatement | null> {
    try {
      const res: any = await apiClient.get("/invoices/receivables/statement", {
        params: { customerId, asOfDate },
      });
      return res?.data || res || null;
    } catch {
      return null;
    }
  },

  async getSummary(): Promise<ReceivablesSummary | null> {
    try {
      const res: any = await apiClient.get("/invoices/receivables/summary");
      return res?.data || res || null;
    } catch {
      return null;
    }
  },
};
