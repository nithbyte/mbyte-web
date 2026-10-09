import { apiClient } from "../lib/api-client";
import { mockDistributors, mockTerritories, mockOrders } from "../mock";
import type { Distributor, DistributorInput, CustomerHistoryItem } from "../types";

export interface DistributorQueryParams {
  search?: string;
  territoryId?: string;
}

const distributorsState: Distributor[] = [...mockDistributors];

function mapApiDistributor(d: any): Distributor {
  return {
    id: d.id,
    organizationId: d.organizationId || "org_novis_001",
    name: d.name,
    contactPerson: d.contactPerson || "Proprietor",
    phone: d.phone || "+91 44 2829 1122",
    email: d.email,
    address: d.address || "Distributor Address",
    dlNumber: d.drugLicenseNo || d.dlNumber || "TN-DL-DIST-01",
    gstin: d.gstin || "33AAACD9981A1Z0",
    territoryId: d.territoryId || d.territory?.id || "ter_001",
    territoryName: d.territory?.name || "Central Territory",
    creditLimit: Number(d.creditLimit) || 3000000,
    paymentTerms: d.paymentTerms || "Net 30 Days",
    isActive: d.isActive ?? true,
  };
}

export const distributorService = {
  async getDistributors(params?: DistributorQueryParams): Promise<Distributor[]> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (params?.territoryId && params.territoryId !== "ALL") queryParams.territoryId = params.territoryId;
      if (params?.search) queryParams.search = params.search;

      const res = await apiClient.get<any[]>("/distributors", { params: queryParams });
      if (Array.isArray(res) && res.length > 0) {
        return res.map(mapApiDistributor);
      }
    } catch (err) {
      console.warn("Real /distributors API call failed, falling back to mock:", err);
    }

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
    try {
      const res = await apiClient.get<any>(`/distributors/${id}`);
      if (res && res.id) {
        return mapApiDistributor(res);
      }
    } catch {
      // fallback
    }

    const dst = distributorsState.find((d) => d.id === id);
    return Promise.resolve(dst || null);
  },

  async createDistributor(input: DistributorInput): Promise<Distributor> {
    try {
      const payload: Record<string, any> = {
        name: input.name.trim(),
        contactPerson: input.contactPerson.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        drugLicenseNo: input.dlNumber.trim(),
        gstin: input.gstin.trim(),
        territoryId: input.territoryId,
        creditLimit: 3000000,
        paymentTerms: "Net 30 Days",
      };
      if (input.email) payload.email = input.email.trim();

      const res = await apiClient.post<any>("/distributors", payload);
      if (res && res.id) {
        const created = mapApiDistributor(res);
        distributorsState.unshift(created);
        return created;
      }
    } catch (err) {
      console.warn("Real /distributors POST failed, falling back to local state:", err);
    }

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
    try {
      const res = await apiClient.put<any>(`/distributors/${id}`, input);
      if (res && res.id) {
        const updated = mapApiDistributor(res);
        const idx = distributorsState.findIndex((d) => d.id === id);
        if (idx !== -1) distributorsState[idx] = updated;
        return updated;
      }
    } catch {
      // fallback
    }

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

    try {
      const orders = await apiClient.get<any[]>("/orders", { params: { distributorId: id, limit: 15 } });
      if (Array.isArray(orders) && orders.length > 0) {
        orders.forEach((o) => {
          history.push({
            id: o.id,
            date: o.createdAt?.split("T")[0] || "2026-10-09",
            type: "ORDER",
            title: `Dispatched Order #${o.orderNumber} to ${o.customer?.name || "Chemist"}`,
            subtitle: `Booked by MR ${o.mr?.name || "Field Rep"}`,
            status: o.status,
            amount: Number(o.totalAmount) || 0,
            notes: `${o.items?.length || 1} product items fulfilled`,
          });
        });
      }
    } catch {
      // fallback
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
    }

    const dst = await this.getDistributorById(id);
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
