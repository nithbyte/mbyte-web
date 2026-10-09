import { apiClient } from "../lib/api-client";
import {
  mockPharmacies,
  mockTerritories,
  mockOrders,
  mockCollections,
  mockProductPresence,
} from "../mock";
import type { Pharmacy, PharmacyInput, CustomerHistoryItem } from "../types";

export interface PharmacyQueryParams {
  search?: string;
  territoryId?: string;
}

const pharmaciesState: Pharmacy[] = [...mockPharmacies];

function mapApiPharmacy(p: any): Pharmacy {
  return {
    id: p.id,
    organizationId: p.organizationId || "org_novis_001",
    name: p.name,
    contactPerson: p.proprietorName || p.contactPerson || "Chemist In-Charge",
    phone: p.phone || "+91 44 2829 4455",
    email: p.email,
    address: p.address || "Chemist Address",
    drugLicenseNumber: p.drugLicenseNo || p.drugLicenseNumber || "TN-DL-001",
    territoryId: p.territoryId || p.territory?.id || "ter_001",
    territoryName: p.territory?.name || "Central Territory",
    creditLimit: Number(p.creditLimit) || 500000,
    outstandingBalance: Number(p.currentOutstanding) || 0,
    latitude: Number(p.latitude) || 13.0572,
    longitude: Number(p.longitude) || 80.2524,
  };
}

export const pharmacyService = {
  async getPharmacies(params?: PharmacyQueryParams): Promise<Pharmacy[]> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (params?.territoryId && params.territoryId !== "ALL") queryParams.territoryId = params.territoryId;
      if (params?.search) queryParams.search = params.search;

      const res = await apiClient.get<any[]>("/pharmacies", { params: queryParams });
      if (Array.isArray(res) && res.length > 0) {
        return res.map(mapApiPharmacy);
      }
    } catch (err) {
      console.warn("Real /pharmacies API call failed, falling back to mock:", err);
    }

    let list = [...pharmaciesState];

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

  async getPharmacyById(id: string): Promise<Pharmacy | null> {
    try {
      const res = await apiClient.get<any>(`/pharmacies/${id}`);
      if (res && res.id) {
        return mapApiPharmacy(res);
      }
    } catch {
      // fallback
    }

    const phm = pharmaciesState.find((p) => p.id === id);
    return Promise.resolve(phm || null);
  },

  async createPharmacy(input: PharmacyInput): Promise<Pharmacy> {
    try {
      const payload: Record<string, any> = {
        name: input.name.trim(),
        proprietorName: input.contactPerson.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        drugLicenseNo: input.drugLicenseNumber.trim(),
        territoryId: input.territoryId,
        creditLimit: 500000,
        latitude: input.latitude || 13.0572,
        longitude: input.longitude || 80.2524,
      };
      if (input.email) payload.email = input.email.trim();

      const res = await apiClient.post<any>("/pharmacies", payload);
      if (res && res.id) {
        const created = mapApiPharmacy(res);
        pharmaciesState.unshift(created);
        return created;
      }
    } catch (err) {
      console.warn("Real /pharmacies POST failed, falling back to local state:", err);
    }

    const territory = mockTerritories.find((t) => t.id === input.territoryId);
    const newPhm: Pharmacy = {
      id: `phm_${Date.now()}`,
      organizationId: "org_novis_001",
      name: input.name.trim(),
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim(),
      address: input.address.trim(),
      drugLicenseNumber: input.drugLicenseNumber.trim(),
      territoryId: input.territoryId,
      territoryName: territory?.name || "Madurai North",
      creditLimit: 500000,
      outstandingBalance: 0,
      latitude: input.latitude,
      longitude: input.longitude,
    };

    pharmaciesState.unshift(newPhm);
    return Promise.resolve(newPhm);
  },

  async updatePharmacy(id: string, input: Partial<PharmacyInput>): Promise<Pharmacy> {
    try {
      const res = await apiClient.put<any>(`/pharmacies/${id}`, input);
      if (res && res.id) {
        const updated = mapApiPharmacy(res);
        const idx = pharmaciesState.findIndex((p) => p.id === id);
        if (idx !== -1) pharmaciesState[idx] = updated;
        return updated;
      }
    } catch {
      // fallback
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
      // fallback
    }

    if (history.length === 0) {
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
        date: "2026-01-10",
        type: "CREATION",
        title: "Chemist Master Registry Enrollment",
        subtitle: `DL No: ${phm.drugLicenseNumber} • Owner: ${phm.contactPerson}`,
        status: "ACTIVE",
        notes: `GPS Pin: (${phm.latitude}, ${phm.longitude})`,
      });
    }

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return Promise.resolve(history);
  },
};
