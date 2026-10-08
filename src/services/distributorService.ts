import { mockDistributors, mockTerritories, mockOrders } from "../mock";
import type { Distributor, DistributorInput, CustomerHistoryItem } from "../types";

export interface DistributorQueryParams {
  search?: string;
  territoryId?: string;
}

// In-memory state for mock CRUD operations
const distributorsState: Distributor[] = [...mockDistributors];

export const distributorService = {
  async getDistributors(params?: DistributorQueryParams): Promise<Distributor[]> {
    let list = [...distributorsState];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.contactPerson.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          d.gstin.toLowerCase().includes(q) ||
          d.address.toLowerCase().includes(q)
      );
    }

    if (params?.territoryId && params.territoryId !== "ALL") {
      list = list.filter((d) => d.territoryId === params.territoryId);
    }

    return Promise.resolve(list);
  },

  async getDistributorById(id: string): Promise<Distributor | null> {
    const dst = distributorsState.find((d) => d.id === id);
    return Promise.resolve(dst || null);
  },

  async createDistributor(input: DistributorInput): Promise<Distributor> {
    const territory = mockTerritories.find((t) => t.id === input.territoryId);
    const newDst: Distributor = {
      id: `dst_${Date.now()}`,
      organizationId: "org_novis_001",
      name: input.name.trim(),
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim(),
      address: input.address.trim(),
      dlNumber: input.dlNumber.trim(),
      gstin: input.gstin.trim(),
      territoryId: input.territoryId,
      territoryName: territory?.name || "Madurai North",
      creditLimit: 3000000,
      paymentTerms: "Net 30 Days",
      isActive: true,
    };

    distributorsState.unshift(newDst);
    return Promise.resolve(newDst);
  },

  async updateDistributor(id: string, input: Partial<DistributorInput>): Promise<Distributor> {
    const idx = distributorsState.findIndex((d) => d.id === id);
    if (idx === -1) {
      throw new Error(`Distributor with ID ${id} not found.`);
    }

    const territory = input.territoryId
      ? mockTerritories.find((t) => t.id === input.territoryId)
      : undefined;

    const updated: Distributor = {
      ...distributorsState[idx],
      ...input,
      territoryName: territory?.name || distributorsState[idx].territoryName,
    };

    distributorsState[idx] = updated;
    return Promise.resolve(updated);
  },

  async getDistributorHistory(id: string): Promise<CustomerHistoryItem[]> {
    const history: CustomerHistoryItem[] = [];

    // Orders fulfilled/assigned to this distributor
    const orders = mockOrders.filter((o) => o.distributorId === id);
    orders.forEach((o) => {
      history.push({
        id: o.id,
        date: o.orderDate,
        type: "ORDER",
        title: `Dispatched Order #${o.orderNumber} to ${o.pharmacyName}`,
        subtitle: `Booked by MR ${o.mrName || "Field Rep"}`,
        status: o.status,
        amount: o.totalAmount,
        notes: `${o.items?.length || 0} product items fulfilled`,
      });
    });

    const dst = distributorsState.find((d) => d.id === id);
    if (dst) {
      history.push({
        id: `reg_${id}`,
        date: "2026-01-05",
        type: "CREATION",
        title: "Wholesale Stockist Network Enrollment",
        subtitle: `GSTIN: ${dst.gstin} • DL: ${dst.dlNumber}`,
        status: "ACTIVE",
        notes: `Registered stockist for ${dst.territoryName}`,
      });
    }

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return Promise.resolve(history);
  },
};
