import { apiClient, isMockFallbackAllowed } from "../lib/api-client";
import {
  mockPharmacies,
  mockTerritories,
  mockOrders,
  mockCollections,
  mockProductPresence,
} from "../mock";
import { authService } from "./authService";
import type { Pharmacy, PharmacyInput, CustomerHistoryItem, DoctorApprovalStatus } from "../types";
import { isOrgMatch } from "../lib/utils";

export interface PharmacyQueryParams {
  search?: string;
  territoryId?: string;
  organizationId?: string;
  approvalStatus?: DoctorApprovalStatus | "ALL";
  createdById?: string;
  myRegistrations?: boolean;
}

const pharmaciesState: Pharmacy[] = [...mockPharmacies];

function mapApiPharmacy(p: any): Pharmacy {
  return {
    id: p.id,
    organizationId: p.organizationId || p.organization?.id || "",
    name: p.name,
    contactPerson: p.proprietorName || p.contactPerson || "Proprietor",
    phone: p.phone || "",
    email: p.email || undefined,
    address: p.address || "",
    drugLicenseNumber: p.drugLicenseNo || p.drugLicenseNumber || "",
    gstNumber: p.gstin || p.gstNumber || undefined,
    territoryId: p.territoryId || p.territory?.id || "",
    territoryName: p.territory?.name || "Assigned Territory",
    creditLimit: p.creditLimit !== undefined && p.creditLimit !== null ? Number(p.creditLimit) : 0,
    outstandingBalance: Number(p.currentOutstanding) || 0,
    latitude: Number(p.latitude) || 13.0572,
    longitude: Number(p.longitude) || 80.2524,
    isActive: p.isActive ?? true,
    approvalStatus: p.approvalStatus || "APPROVED",
    createdById: p.createdById || undefined,
    createdBy: p.createdBy || undefined,
    reviewedById: p.reviewedById || undefined,
    reviewedBy: p.reviewedBy || undefined,
    reviewedAt: p.reviewedAt || undefined,
    rejectionReason: p.rejectionReason || undefined,
    createdAt: p.createdAt || undefined,
    updatedAt: p.updatedAt || undefined,
  };
}

export const pharmacyService = {
  async getPharmacies(params?: PharmacyQueryParams): Promise<Pharmacy[]> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (params?.territoryId && params.territoryId !== "ALL") queryParams.territoryId = params.territoryId;
      if (params?.search) queryParams.search = params.search;
      if (params?.organizationId) queryParams.organizationId = params.organizationId;
      if (params?.approvalStatus && params.approvalStatus !== "ALL") {
        queryParams.approvalStatus = params.approvalStatus;
      }
      if (params?.createdById) queryParams.createdById = params.createdById;
      if (params?.myRegistrations) queryParams.myRegistrations = params.myRegistrations;

      const res = await apiClient.get<any>("/pharmacies", { params: queryParams });
      const items = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : null);
      if (items !== null) {
        return items.map(mapApiPharmacy);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err;
      }
      console.warn("Real /pharmacies API call failed, falling back to mock:", err);
    }

    let list = [...pharmaciesState];

    const currentUser = await authService.getCurrentUser();
    const effectiveOrgId =
      params?.organizationId || (currentUser?.role !== "SUPER_ADMIN" ? currentUser?.organizationId : undefined);
    if (effectiveOrgId) {
      list = list.filter((p) => isOrgMatch(p.organizationId, effectiveOrgId));
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.contactPerson.toLowerCase().includes(q) ||
          p.drugLicenseNumber.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }

    if (params?.territoryId && params.territoryId !== "ALL") {
      list = list.filter((p) => p.territoryId === params.territoryId);
    }

    return Promise.resolve(list);
  },

  async getPendingPharmacies(params?: PharmacyQueryParams): Promise<Pharmacy[]> {
    try {
      const res = await apiClient.get<any>("/pharmacies/pending", { params });
      const items = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : null);
      if (items !== null) {
        return items.map(mapApiPharmacy);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      console.warn("Real /pharmacies/pending call failed, falling back to mock:", err);
    }
    return this.getPharmacies({ ...params, approvalStatus: "PENDING_APPROVAL" });
  },

  async approvePharmacy(id: string): Promise<Pharmacy> {
    try {
      const res = await apiClient.patch<any>(`/pharmacies/${id}/approve`);
      if (res && res.id) {
        const approved = mapApiPharmacy(res);
        const idx = pharmaciesState.findIndex((p) => p.id === id);
        if (idx !== -1) pharmaciesState[idx] = approved;
        return approved;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      console.warn("Real approvePharmacy call failed, updating local state:", err);
    }
    const idx = pharmaciesState.findIndex((p) => p.id === id);
    if (idx !== -1) {
      pharmaciesState[idx].approvalStatus = "APPROVED";
      return pharmaciesState[idx];
    }
    throw new Error("Pharmacy not found");
  },

  async rejectPharmacy(id: string, reason: string): Promise<Pharmacy> {
    if (!reason || !reason.trim()) {
      throw new Error("A rejection reason is mandatory.");
    }
    try {
      const res = await apiClient.patch<any>(`/pharmacies/${id}/reject`, { reason: reason.trim() });
      if (res && res.id) {
        const rejected = mapApiPharmacy(res);
        const idx = pharmaciesState.findIndex((p) => p.id === id);
        if (idx !== -1) pharmaciesState[idx] = rejected;
        return rejected;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      console.warn("Real rejectPharmacy call failed, updating local state:", err);
    }
    const idx = pharmaciesState.findIndex((p) => p.id === id);
    if (idx !== -1) {
      pharmaciesState[idx].approvalStatus = "REJECTED";
      pharmaciesState[idx].rejectionReason = reason.trim();
      return pharmaciesState[idx];
    }
    throw new Error("Pharmacy not found");
  },

  async getPharmacyById(id: string): Promise<Pharmacy | null> {
    try {
      const res = await apiClient.get<any>(`/pharmacies/${id}`);
      if (res && res.id) {
        return mapApiPharmacy(res);
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err;
      }
    }

    const phm = pharmaciesState.find((p) => p.id === id);
    return Promise.resolve(phm || null);
  },

  async createPharmacy(input: PharmacyInput): Promise<Pharmacy> {
    const currentUser = await authService.getCurrentUser();
    const effectiveOrgId = (input as any).organizationId || currentUser?.organizationId || "";

    try {
      const payload: Record<string, any> = {
        name: input.name.trim(),
        proprietorName: input.contactPerson.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        drugLicenseNo: input.drugLicenseNumber.trim(),
        territoryId: input.territoryId || undefined,
        creditLimit: input.creditLimit !== undefined ? Number(input.creditLimit) : undefined,
        latitude: Number(input.latitude) || 13.0572,
        longitude: Number(input.longitude) || 80.2524,
      };
      if (currentUser?.role === "SUPER_ADMIN" && effectiveOrgId) {
        payload.organizationId = effectiveOrgId;
      }
      if (input.email) payload.email = input.email.trim();
      if (input.gstNumber) payload.gstin = input.gstNumber.trim();

      const res = await apiClient.post<any>("/pharmacies", payload);
      if (res && res.id) {
        const created = mapApiPharmacy(res);
        pharmaciesState.unshift(created);
        return created;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err;
      }
      console.warn("Real /pharmacies POST failed, falling back to local state:", err);
    }

    const territory = mockTerritories.find((t) => t.id === input.territoryId);
    const newPhm: Pharmacy = {
      id: `phm_${Date.now()}`,
      organizationId: effectiveOrgId,
      name: input.name.trim(),
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim(),
      address: input.address.trim(),
      drugLicenseNumber: input.drugLicenseNumber.trim(),
      gstNumber: input.gstNumber?.trim(),
      territoryId: input.territoryId,
      territoryName: territory?.name || "Assigned Territory",
      creditLimit: input.creditLimit ?? 500000,
      outstandingBalance: 0,
      latitude: input.latitude,
      longitude: input.longitude,
      approvalStatus: "APPROVED",
    };

    pharmaciesState.unshift(newPhm);
    return Promise.resolve(newPhm);
  },

  async updatePharmacy(id: string, input: Partial<PharmacyInput>): Promise<Pharmacy> {
    try {
      const payload: Record<string, any> = {};
      if (input.name !== undefined) payload.name = input.name.trim();
      if (input.contactPerson !== undefined) payload.proprietorName = input.contactPerson.trim();
      if (input.phone !== undefined) payload.phone = input.phone.trim();
      if (input.email !== undefined) payload.email = input.email.trim();
      if (input.address !== undefined) payload.address = input.address.trim();
      if (input.drugLicenseNumber !== undefined) payload.drugLicenseNo = input.drugLicenseNumber.trim();
      if (input.gstNumber !== undefined) payload.gstin = input.gstNumber.trim();
      if (input.territoryId !== undefined) payload.territoryId = input.territoryId;
      if (input.latitude !== undefined) payload.latitude = Number(input.latitude);
      if (input.longitude !== undefined) payload.longitude = Number(input.longitude);
      if (input.creditLimit !== undefined) payload.creditLimit = Number(input.creditLimit);

      const res = await apiClient.put<any>(`/pharmacies/${id}`, payload);
      if (res && res.id) {
        const updated = mapApiPharmacy(res);
        const idx = pharmaciesState.findIndex((p) => p.id === id);
        if (idx !== -1) pharmaciesState[idx] = updated;
        return updated;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        throw err;
      }
    }

    const idx = pharmaciesState.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Pharmacy with ID ${id} not found.`);
    }

    const territory = input.territoryId
      ? mockTerritories.find((t) => t.id === input.territoryId)
      : undefined;

    const updated: Pharmacy = {
      ...pharmaciesState[idx],
      ...input,
      territoryName: territory?.name || pharmaciesState[idx].territoryName,
    };

    pharmaciesState[idx] = updated;
    return Promise.resolve(updated);
  },

  async getPharmacyHistory(id: string): Promise<CustomerHistoryItem[]> {
    const history: CustomerHistoryItem[] = [];

    try {
      const [ordersRes, colsRes, presenceRes] = await Promise.allSettled([
        apiClient.get<any[]>("/orders", { params: { customerId: id, limit: 10 } }),
        apiClient.get<any[]>("/collections", { params: { customerId: id, limit: 10 } }),
        apiClient.get<any[]>("/product-presence", { params: { customerId: id, limit: 10 } }),
      ]);

      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)) {
        ordersRes.value.forEach((o) => {
          history.push({
            id: o.id,
            date: o.createdAt?.split("T")[0] || "2026-10-09",
            type: "ORDER",
            title: `Commercial Order #${o.orderNumber}`,
            subtitle: `Booked by MR ${o.mr?.name || "Field MR"}`,
            status: o.status,
            amount: Number(o.totalAmount) || 0,
            notes: `${o.items?.length || 1} product lines ordered`,
          });
        });
      }

      if (colsRes.status === "fulfilled" && Array.isArray(colsRes.value)) {
        colsRes.value.forEach((c) => {
          history.push({
            id: c.id,
            date: c.paymentDate?.split("T")[0] || "2026-10-09",
            type: "COLLECTION",
            title: `Payment Receipt #${c.receiptNumber}`,
            subtitle: `Mode: ${c.paymentMode} • Ref: ${c.referenceNumber || "Cash"}`,
            status: "RECONCILED",
            amount: Number(c.amount) || 0,
            notes: c.notes,
          });
        });
      }

      if (presenceRes.status === "fulfilled" && Array.isArray(presenceRes.value)) {
        presenceRes.value.slice(0, 5).forEach((a) => {
          history.push({
            id: a.id,
            date: a.checkedAt?.split("T")[0] || "2026-10-09",
            type: "AUDIT",
            title: `Stock Audit: ${a.product?.brandName || a.productName || "Product"}`,
            subtitle: `Status: ${a.status} (Qty: ${a.quantity || 0})`,
            status: a.status,
            notes: a.notes || "Audited during chemist call",
          });
        });
      }
    } catch {
      // ignore
    }

    if (history.length === 0 && isMockFallbackAllowed()) {
      const orders = mockOrders.filter((o) => o.pharmacyId === id);
      orders.forEach((o) => {
        history.push({
          id: o.id,
          date: o.orderDate,
          type: "ORDER",
          title: `Commercial Order #${o.orderNumber}`,
          subtitle: `Booked by MR ${o.mrName || "Field MR"}`,
          status: o.status,
          amount: o.totalAmount,
          notes: `${o.items?.length || 0} product lines ordered`,
        });
      });

      const collections = mockCollections.filter((c) => c.pharmacyId === id);
      collections.forEach((c) => {
        history.push({
          id: c.id,
          date: c.paymentDate,
          type: "COLLECTION",
          title: `Payment Receipt #${c.receiptNumber}`,
          subtitle: `Mode: ${c.paymentMode} • Ref: ${c.referenceNumber || "Cash"}`,
          status: "RECONCILED",
          amount: c.amount,
          notes: c.notes,
        });
      });

      const audits = mockProductPresence.filter((p) => p.pharmacyId === id);
      audits.slice(0, 5).forEach((a) => {
        history.push({
          id: a.id,
          date: a.auditedAt || "2026-10-08",
          type: "AUDIT",
          title: `Stock Audit: ${a.productName}`,
          subtitle: `Status: ${a.status} (Qty: ${a.currentQuantity || 0})`,
          status: a.status,
          notes: a.notes || "Audited during representative chemist call",
        });
      });
    }

    const phm = await this.getPharmacyById(id);
    if (phm) {
      history.push({
        id: `reg_${id}`,
        date: phm.createdAt ? phm.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        type: "CREATION",
        title: "Chemist Master Registry Enrollment",
        subtitle: `DL No: ${phm.drugLicenseNumber || "N/A"} • Owner: ${phm.contactPerson}`,
        status: phm.approvalStatus || "ACTIVE",
        notes: `GPS Pin: (${phm.latitude}, ${phm.longitude})`,
      });
    }

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return Promise.resolve(history);
  },
};
