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

// In-memory state for mock CRUD operations
const pharmaciesState: Pharmacy[] = [...mockPharmacies];

export const pharmacyService = {
  async getPharmacies(params?: PharmacyQueryParams): Promise<Pharmacy[]> {
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
    const phm = pharmaciesState.find((p) => p.id === id);
    return Promise.resolve(phm || null);
  },

  async createPharmacy(input: PharmacyInput): Promise<Pharmacy> {
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

    // 1. Orders placed by this pharmacy
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

    // 2. Collections from this pharmacy
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

    // 3. Stock audits for this pharmacy
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

    // Registration item
    const phm = pharmaciesState.find((p) => p.id === id);
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
