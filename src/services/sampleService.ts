import { apiClient } from "../lib/api-client";

export type SampleMovementType =
  | "COMPANY_RECEIPT"
  | "DISPATCH_TO_MR"
  | "MR_RECEIPT_ACKNOWLEDGED"
  | "DISTRIBUTED_TO_DOCTOR"
  | "RETURN_TO_COMPANY"
  | "ADJUSTMENT_DAMAGE"
  | "ADJUSTMENT_EXPIRED"
  | "RECONCILIATION_CORRECTION";

export type SampleAckStatus = "PENDING" | "ACKNOWLEDGED" | "PARTIALLY_ACKNOWLEDGED" | "REJECTED";

export type DoctorConfirmationMethod = "DIGITAL_SIGNATURE" | "OTP_SMS" | "PHYSICAL_ACK_VERIFIED";

export interface SampleBatch {
  id: string;
  organizationId: string;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  manufacturingDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    brandName: string;
    genericName: string;
    dosageForm: string;
    packSize: string;
    sku: string;
  };
  inventoryBalances?: SampleInventoryBalance[];
}

export interface SampleInventoryBalance {
  id: string;
  organizationId: string;
  productId: string;
  batchId: string;
  mrId?: string | null;
  isWarehouse: boolean;
  quantity: number;
  inTransitQuantity: number;
  updatedAt: string;
  product?: {
    id: string;
    brandName: string;
    genericName: string;
    dosageForm: string;
    packSize: string;
    sku: string;
  };
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    manufacturingDate?: string | null;
    isActive: boolean;
  };
  mr?: {
    id: string;
    employeeCode: string;
    user?: { firstName: string; lastName: string; email: string };
    territory?: { id: string; name: string; code: string };
  };
}

export interface SampleLedgerEntry {
  id: string;
  organizationId: string;
  productId: string;
  batchId: string;
  movementType: SampleMovementType;
  quantity: number;
  sourceMrId?: string | null;
  targetMrId?: string | null;
  doctorId?: string | null;
  visitId?: string | null;
  visitProductId?: string | null;
  performedById: string;
  balanceBefore: number;
  balanceAfter: number;
  idempotencyKey?: string | null;
  acknowledgmentStatus: SampleAckStatus;
  acknowledgedAt?: string | null;
  acknowledgedById?: string | null;
  notes?: string | null;
  createdAt: string;
  product?: { id: string; brandName: string; genericName: string; sku: string };
  batch?: { id: string; batchNumber: string; expiryDate: string };
  sourceMr?: { user?: { firstName: string; lastName: string; email: string }; territory?: { id: string; name: string; code: string } };
  targetMr?: { user?: { firstName: string; lastName: string; email: string }; territory?: { id: string; name: string; code: string } };
  doctor?: { id: string; name: string; clinicName: string; specialty: string };
  visit?: { id: string; scheduledDate: string; status: string };
  performedBy?: { id: string; firstName: string; lastName: string; email: string };
}

export interface DoctorSampleReceipt {
  id: string;
  organizationId: string;
  visitId: string;
  doctorId: string;
  mrId: string;
  signatureData?: string | null;
  confirmationMethod: DoctorConfirmationMethod;
  acknowledgedAt: string;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  doctorComments?: string | null;
  doctor?: { id: string; name: string; clinicName: string; specialty: string; address: string };
  mr?: {
    id: string;
    user?: { firstName: string; lastName: string; email: string };
    territory?: { id: string; name: string; code: string };
  };
  visit?: { id: string; scheduledDate: string; status: string };
}

export interface CreateBatchParams {
  productId: string;
  batchNumber: string;
  expiryDate: string;
  manufacturingDate?: string;
  initialStockQuantity?: number;
}

export interface ReceiveStockParams {
  batchId: string;
  quantity: number;
  notes?: string;
}

export interface DispatchParams {
  targetMrId: string;
  batchId: string;
  quantity: number;
  notes?: string;
}

export interface AdjustStockParams {
  batchId: string;
  quantity: number;
  mrId?: string;
  movementType: SampleMovementType;
  notes: string;
}

export interface DispatchMultiParams {
  targetMrId: string;
  reference?: string;
  items: { batchId: string; quantity: number }[];
  notes?: string;
}

export interface ResolveDiscrepancyParams {
  ledgerEntryId: string;
  action: "RETURN_TO_WAREHOUSE" | "WRITE_OFF_DAMAGE";
  notes: string;
}

export interface ReturnSampleParams {
  batchId: string;
  quantity: number;
  mrId: string;
  notes?: string;
}

export interface SampleBalanceQueryParams {
  mrId?: string;
  productId?: string;
  batchId?: string;
  isWarehouse?: boolean;
  onlyAvailable?: boolean;
}

export interface SampleLedgerQueryParams {
  mrId?: string;
  productId?: string;
  batchId?: string;
  movementType?: SampleMovementType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const sampleService = {
  async getBatches(productId?: string, isActive?: boolean): Promise<SampleBatch[]> {
    const params = new URLSearchParams();
    if (productId) params.append("productId", productId);
    if (isActive !== undefined) params.append("isActive", String(isActive));
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<any>(`/samples/batches${query}`);
    return Array.isArray(res) ? res : res?.data || [];
  },

  async createBatch(params: CreateBatchParams): Promise<any> {
    return apiClient.post("/samples/batches", params);
  },

  async receiveStock(params: ReceiveStockParams): Promise<any> {
    return apiClient.post("/samples/receive", params);
  },

  async dispatchToMr(params: DispatchParams): Promise<any> {
    return apiClient.post("/samples/dispatch", params);
  },

  async adjustStock(params: AdjustStockParams): Promise<any> {
    return apiClient.post("/samples/adjust", params);
  },

  async getBalances(query?: SampleBalanceQueryParams): Promise<SampleInventoryBalance[]> {
    const params = new URLSearchParams();
    if (query?.mrId) params.append("mrId", query.mrId);
    if (query?.productId) params.append("productId", query.productId);
    if (query?.batchId) params.append("batchId", query.batchId);
    if (query?.isWarehouse !== undefined) params.append("isWarehouse", String(query.isWarehouse));
    if (query?.onlyAvailable !== undefined) params.append("onlyAvailable", String(query.onlyAvailable));
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<any>(`/samples/balances${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  },

  async getLedger(query?: SampleLedgerQueryParams): Promise<{ items: SampleLedgerEntry[]; total: number }> {
    const params = new URLSearchParams();
    if (query?.mrId) params.append("mrId", query.mrId);
    if (query?.productId) params.append("productId", query.productId);
    if (query?.batchId) params.append("batchId", query.batchId);
    if (query?.movementType) params.append("movementType", query.movementType);
    if (query?.startDate) params.append("startDate", query.startDate);
    if (query?.endDate) params.append("endDate", query.endDate);
    if (query?.page) params.append("page", String(query.page));
    if (query?.limit) params.append("limit", String(query.limit));
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<any>(`/samples/ledger${qs}`);
    if (Array.isArray(res)) return { items: res, total: res.length };
    if (Array.isArray(res?.data)) return { items: res.data, total: res.meta?.pagination?.totalRecords || res.data.length };
    return { items: res?.data?.items || res?.items || [], total: res?.data?.total || res?.total || 0 };
  },

  async getDoctorReceipt(visitId: string): Promise<DoctorSampleReceipt | null> {
    const res = await apiClient.get<any>(`/samples/receipts/${visitId}`);
    return res?.data || res || null;
  },

  async dispatchMultiToMr(params: DispatchMultiParams): Promise<any> {
    return apiClient.post("/samples/dispatch-multi", params);
  },

  async returnSamples(params: ReturnSampleParams): Promise<any> {
    return apiClient.post("/samples/return", params);
  },

  async getDiscrepancies(): Promise<SampleLedgerEntry[]> {
    const res = await apiClient.get<any>("/samples/discrepancies");
    return Array.isArray(res) ? res : res?.data || [];
  },

  async resolveDiscrepancy(params: ResolveDiscrepancyParams): Promise<any> {
    return apiClient.post("/samples/resolve-discrepancy", params);
  },

  async getReportsSummary(): Promise<any> {
    const res = await apiClient.get<any>("/samples/reports/summary");
    return res?.data || res;
  },
};
