import { apiClient } from "../lib/api-client";
import { mockProductPresence } from "../mock";
import type { ProductPresenceAudit, PresenceQueryParams, PresenceCounts } from "../types";

const presenceState: ProductPresenceAudit[] = [...mockProductPresence];

function mapApiPresenceAudit(a: any): ProductPresenceAudit {
  return {
    id: a.id,
    organizationId: a.organizationId || "",
    pharmacyId: a.pharmacyId || a.customerId,
    pharmacyName: a.customer?.name || a.pharmacyName || "Pharmacy",
    territoryId: a.territoryId || a.territory?.id,
    territoryName: a.territory?.name || "Central Territory",
    mrId: a.mrId,
    mrName: a.mr?.name || "Field MR",
    auditedByMrId: a.mrId,
    auditedByMrName: a.mr?.name,
    productId: a.productId || a.product?.id,
    productName: a.product?.brandName || a.productName,
    status: a.status,
    quantity: a.quantity ?? a.currentQuantity,
    currentQuantity: a.quantity ?? a.currentQuantity,
    checkedAt: a.checkedAt || a.createdAt,
    auditedAt: a.checkedAt || a.createdAt,
    batchNumber: a.batchNumber,
    notes: a.notes,
  };
}

export const presenceService = {
  async getPresenceAudits(params?: PresenceQueryParams): Promise<ProductPresenceAudit[]> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (params?.productId && params.productId !== "ALL") queryParams.productId = params.productId;
      if (params?.territoryId && params.territoryId !== "ALL") queryParams.territoryId = params.territoryId;
      if (params?.mrId && params.mrId !== "ALL") queryParams.mrId = params.mrId;
      if (params?.pharmacyId && params.pharmacyId !== "ALL") queryParams.customerId = params.pharmacyId;
      if (params?.status && params.status !== "ALL") queryParams.status = params.status;

      const res = await apiClient.get<any[]>("/product-presence", { params: queryParams });
      if (Array.isArray(res) && res.length > 0) {
        let list = res.map(mapApiPresenceAudit);

        if (params?.search) {
          const q = params.search.toLowerCase();
          list = list.filter(
            (a) =>
              a.pharmacyName.toLowerCase().includes(q) ||
              a.productName.toLowerCase().includes(q) ||
              (a.mrName && a.mrName.toLowerCase().includes(q))
          );
        }

        return list;
      }
    } catch (err) {
      console.warn("Real /product-presence API failed, falling back to mock:", err);
    }

    let list = [...presenceState];

    if (params?.productId && params.productId !== "ALL") {
      list = list.filter((a) => a.productId === params.productId);
    }

    if (params?.territoryId && params.territoryId !== "ALL") {
      list = list.filter((a) => a.territoryId === params.territoryId);
    }

    if (params?.mrId && params.mrId !== "ALL") {
      list = list.filter((a) => a.mrId === params.mrId);
    }

    if (params?.pharmacyId && params.pharmacyId !== "ALL") {
      list = list.filter((a) => a.pharmacyId === params.pharmacyId);
    }

    if (params?.status && params.status !== "ALL") {
      list = list.filter((a) => a.status === params.status);
    }

    if (params?.date && params.date !== "ALL") {
      list = list.filter((a) => a.checkedAt?.startsWith(params.date!));
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.pharmacyName.toLowerCase().includes(q) ||
          a.productName.toLowerCase().includes(q) ||
          (a.mrName && a.mrName.toLowerCase().includes(q)) ||
          (a.territoryName && a.territoryName.toLowerCase().includes(q)) ||
          (a.notes && a.notes.toLowerCase().includes(q)) ||
          (a.batchNumber && a.batchNumber.toLowerCase().includes(q))
      );
    }

    // Sort by audit timestamp descending
    list.sort(
      (a, b) =>
        new Date(b.checkedAt || b.auditedAt).getTime() -
        new Date(a.checkedAt || a.auditedAt).getTime()
    );

    return Promise.resolve(list);
  },

  async getPresenceCounts(params?: PresenceQueryParams): Promise<PresenceCounts> {
    const list = await this.getPresenceAudits(params);
    const total = list.length;
    let available = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let unknown = 0;

    for (const item of list) {
      if (item.status === "AVAILABLE") available++;
      else if (item.status === "LOW_STOCK") lowStock++;
      else if (item.status === "OUT_OF_STOCK") outOfStock++;
      else if (item.status === "UNKNOWN") unknown++;
    }

    const availabilityRate = total > 0 ? Math.round((available / total) * 100) : 0;

    return {
      total,
      available,
      lowStock,
      outOfStock,
      unknown,
      availabilityRate,
    };
  },

  async getUniqueAuditDates(): Promise<string[]> {
    try {
      const audits = await this.getPresenceAudits();
      const dates = Array.from(
        new Set(audits.map((a) => (a.checkedAt || a.auditedAt).slice(0, 10)))
      );
      if (dates.length > 0) return dates.sort().reverse();
    } catch {
      // fallback
    }

    const dates = Array.from(
      new Set(presenceState.map((a) => (a.checkedAt || a.auditedAt).slice(0, 10)))
    );
    return Promise.resolve(dates.sort().reverse());
  },
};
