import { apiClient } from "../lib/api-client";
import type { ExpenseClaim, ExpensePolicy, ExpenseItem, ExpenseSummary } from "../types";

export const expenseService = {
  // Policies
  async getPolicies(): Promise<ExpensePolicy[]> {
    try {
      const res = await apiClient.get<ExpensePolicy[]>("/expenses/policies");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async createPolicy(data: {
    category: string;
    maxDailyLimit: number;
    mileageRatePerKm?: number;
    requiresReceiptAbove?: number;
    description?: string;
  }): Promise<ExpensePolicy> {
    return apiClient.post<ExpensePolicy>("/expenses/policies", data);
  },

  async updatePolicy(id: string, data: any): Promise<ExpensePolicy> {
    return apiClient.put<ExpensePolicy>(`/expenses/policies/${id}`, data);
  },

  // Claims
  async getClaims(params?: {
    status?: string;
    mrId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ExpenseClaim[]; total: number }> {
    try {
      // apiClient interceptor unwraps envelope: for paginated responses,
      // the array is returned directly with _meta attached.
      const res = await apiClient.get<any>("/expenses", { params });
      if (Array.isArray(res)) {
        return { items: res, total: (res as any)._meta?.pagination?.totalRecords ?? res.length };
      }
      // fallback: server returned object with items/data key
      if (res && Array.isArray(res.items)) return { items: res.items, total: res.total ?? res.items.length };
      if (res && Array.isArray(res.data)) return { items: res.data, total: res.total ?? res.data.length };
      return { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async getClaimById(id: string): Promise<ExpenseClaim> {
    return apiClient.get<ExpenseClaim>(`/expenses/${id}`);
  },

  async createClaim(data: {
    title: string;
    startDate: string;
    endDate: string;
    currency?: string;
    submissionNotes?: string;
  }): Promise<ExpenseClaim> {
    return apiClient.post<ExpenseClaim>("/expenses", data);
  },

  async updateClaim(id: string, data: any): Promise<ExpenseClaim> {
    return apiClient.put<ExpenseClaim>(`/expenses/${id}`, data);
  },

  async deleteClaim(id: string): Promise<any> {
    return apiClient.delete(`/expenses/${id}`);
  },

  // Line Items
  async addItem(claimId: string, item: {
    date: string;
    category: string;
    amount: number;
    currency?: string;
    distanceKm?: number;
    notes?: string;
    receiptUrl?: string;
  }): Promise<ExpenseItem> {
    return apiClient.post<ExpenseItem>(`/expenses/${claimId}/items`, item);
  },

  async updateItem(claimId: string, itemId: string, item: any): Promise<ExpenseItem> {
    return apiClient.put<ExpenseItem>(`/expenses/${claimId}/items/${itemId}`, item);
  },

  async deleteItem(claimId: string, itemId: string): Promise<any> {
    return apiClient.delete(`/expenses/${claimId}/items/${itemId}`);
  },

  // Submission & Review
  async submitClaim(id: string, submissionNotes?: string): Promise<ExpenseClaim> {
    return apiClient.post<ExpenseClaim>(`/expenses/${id}/submit`, { submissionNotes });
  },

  async reviewClaim(id: string, action: "APPROVE" | "REJECT" | "RETURN_FOR_CORRECTION", comments?: string): Promise<ExpenseClaim> {
    return apiClient.post<ExpenseClaim>(`/expenses/${id}/review`, { action, comments });
  },

  // Summaries & Export
  async getSummary(params?: any): Promise<ExpenseSummary> {
    try {
      return await apiClient.get<ExpenseSummary>("/expenses/summary", { params });
    } catch {
      return {
        totalClaims: 0,
        approvedAmount: 0,
        pendingAmount: 0,
        statusBreakdown: {},
        categoryBreakdown: {},
      };
    }
  },

  async exportCsvUrl(params?: any): Promise<string> {
    const query = new URLSearchParams(params).toString();
    return `/api/v1/expenses/export${query ? `?${query}` : ""}`;
  },
};
