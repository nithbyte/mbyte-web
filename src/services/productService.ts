import {
  mockProducts,
  mockProductCategories,
  mockProductPresence,
  mockVisualAids,
  mockPharmacies,
  mockTerritories,
} from "../mock";
import type {
  Product,
  ProductCategory,
  VisualAid,
  StockAlert,
  ProductPresenceSummary,
} from "../types";

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  status?: string;
}

// In-memory state for mock operations
const productsState: Product[] = [...mockProducts];

function calculatePresenceSummary(productId: string): ProductPresenceSummary {
  const audits = mockProductPresence.filter((a) => a.productId === productId);
  const totalAudits = audits.length;
  let availableCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let unknownCount = 0;

  for (const a of audits) {
    if (a.status === "AVAILABLE") availableCount++;
    else if (a.status === "LOW_STOCK") lowStockCount++;
    else if (a.status === "OUT_OF_STOCK") outOfStockCount++;
    else unknownCount++;
  }

  const availabilityRate =
    totalAudits > 0 ? Math.round((availableCount / totalAudits) * 100) : 0;

  return {
    totalAudits,
    availableCount,
    lowStockCount,
    outOfStockCount,
    unknownCount,
    availabilityRate,
    recentAudits: audits.slice(0, 10),
  };
}

export const productService = {
  async getProducts(params?: ProductQueryParams): Promise<Product[]> {
    let list = [...productsState];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.genericName.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }

    if (params?.categoryId && params.categoryId !== "ALL") {
      list = list.filter((p) => p.categoryId === params.categoryId);
    }

    if (params?.status && params.status !== "ALL") {
      list = list.filter((p) =>
        params.status === "ACTIVE" ? p.isActive : !p.isActive
      );
    }

    const enriched = list.map((p) => {
      const va = mockVisualAids.filter((v) => v.productId === p.id);
      return {
        ...p,
        visualAids: va,
        visualAidsCount: va.length,
        presenceSummary: calculatePresenceSummary(p.id),
      };
    });

    return Promise.resolve(enriched);
  },

  async getProductById(id: string): Promise<Product | null> {
    const prod = productsState.find((p) => p.id === id);
    if (!prod) return Promise.resolve(null);
    const va = mockVisualAids.filter((v) => v.productId === prod.id);
    return Promise.resolve({
      ...prod,
      visualAids: va,
      visualAidsCount: va.length,
      presenceSummary: calculatePresenceSummary(prod.id),
    });
  },

  async getProductCategories(): Promise<ProductCategory[]> {
    return Promise.resolve([...mockProductCategories]);
  },

  async getVisualAids(params?: { productId?: string; search?: string }): Promise<VisualAid[]> {
    let list = [...mockVisualAids];
    if (params?.productId) {
      list = list.filter((v) => v.productId === params.productId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.productName && v.productName.toLowerCase().includes(q))
      );
    }
    return Promise.resolve(list);
  },

  async getProductPresenceSummary(productId: string): Promise<ProductPresenceSummary> {
    return Promise.resolve(calculatePresenceSummary(productId));
  },

  async getLowStockAlerts(limit: number = 6): Promise<StockAlert[]> {
    const alerts: StockAlert[] = [];

    const stockIssues = mockProductPresence.filter(
      (p) => p.status === "OUT_OF_STOCK" || p.status === "LOW_STOCK"
    );

    for (const audit of stockIssues) {
      const phm = mockPharmacies.find((p) => p.id === audit.pharmacyId);
      const ter = mockTerritories.find((t) => t.id === phm?.territoryId);

      alerts.push({
        id: audit.id,
        pharmacyName: audit.pharmacyName || phm?.name || "Pharmacy",
        territoryName: ter?.name || "Central District",
        productName: audit.productName,
        status: audit.status as "LOW_STOCK" | "OUT_OF_STOCK",
        reportedQuantity: audit.currentQuantity,
        auditedBy: audit.auditedByMrName || "Field MR",
        auditedAt: audit.auditedAt,
      });
    }

    alerts.sort(
      (a, b) => new Date(b.auditedAt).getTime() - new Date(a.auditedAt).getTime()
    );

    return Promise.resolve(alerts.slice(0, limit));
  },
};
