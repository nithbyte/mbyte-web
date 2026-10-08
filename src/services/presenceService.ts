import { mockProductPresence } from "../mock";
import type { ProductPresenceAudit, PresenceQueryParams, PresenceCounts } from "../types";

// In-memory state for mock presence intelligence
const presenceState: ProductPresenceAudit[] = [...mockProductPresence];

export const presenceService = {
  async getPresenceAudits(params?: PresenceQueryParams): Promise<ProductPresenceAudit[]> {
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
    const dates = Array.from(
      new Set(presenceState.map((a) => (a.checkedAt || a.auditedAt).slice(0, 10)))
    );
    return Promise.resolve(dates.sort().reverse());
  },
};
