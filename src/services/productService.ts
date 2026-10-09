import { apiClient } from "../lib/api-client";
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

const productsState: Product[] = [...mockProducts];

function calculatePresenceSummary(productId: string, realAudits?: any[]): ProductPresenceSummary {
  const audits = (realAudits && realAudits.length > 0)
    ? realAudits.filter((a) => a.productId === productId || a.product?.id === productId)
    : mockProductPresence.filter((a) => a.productId === productId);

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
    recentAudits: audits.slice(0, 10).map((a) => ({
      id: a.id,
      organizationId: a.organizationId || "",
      pharmacyId: a.pharmacyId || a.customerId,
      pharmacyName: a.customer?.name || a.pharmacyName || "Pharmacy",
      productId: a.productId || a.product?.id,
      productName: a.product?.brandName || a.productName,
      status: a.status,
      quantity: a.quantity ?? a.currentQuantity,
      currentQuantity: a.quantity ?? a.currentQuantity,
      auditedByMrId: a.mrId || a.auditedByMrId,
      auditedByMrName: a.mr?.name || a.auditedByMrName,
      auditedAt: a.checkedAt || a.auditedAt,
      batchNumber: a.batchNumber,
      expiryDate: a.expiryDate,
      notes: a.notes,
    })),
  };
}

function mapApiProduct(p: any): Product {
  return {
    id: p.id,
    organizationId: p.organizationId || "org_novis_001",
    name: p.brandName || p.name,
    genericName: p.genericName || "",
    sku: p.sku || "",
    strength: p.strength || "",
    categoryId: p.categoryId || p.category?.id || "cat_001",
    categoryName: p.category?.name || p.categoryName || "Therapeutics",
    dosageForm: p.dosageForm || "Tablet",
    packSize: p.packSize || "10x10",
    ptr: Number(p.ptr) || 140,
    pts: Number(p.pts) || 126,
    mrp: Number(p.mrp) || 200,
    gstPercent: Number(p.gstPercent) || Number(p.gstRate) || 12,
    gstRate: Number(p.gstRate) || 12,
    description: p.description,
    isActive: p.isActive ?? true,
    visualAids: [],
    visualAidsCount: 0,
    presenceSummary: calculatePresenceSummary(p.id),
  };
}

export const productService = {
  async getProducts(params?: ProductQueryParams): Promise<Product[]> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (params?.categoryId && params.categoryId !== "ALL") queryParams.categoryId = params.categoryId;
      if (params?.search) queryParams.search = params.search;

      const [prodsRes, vasRes, auditsRes] = await Promise.allSettled([
        apiClient.get<any[]>("/products", { params: queryParams }),
        apiClient.get<any[]>("/visual-aids", { params: { limit: 50 } }),
        apiClient.get<any[]>("/product-presence", { params: { limit: 100 } }),
      ]);

      if (prodsRes.status === "fulfilled" && Array.isArray(prodsRes.value) && prodsRes.value.length > 0) {
        const vasList = vasRes.status === "fulfilled" && Array.isArray(vasRes.value) ? vasRes.value : [];
        const auditsList = auditsRes.status === "fulfilled" && Array.isArray(auditsRes.value) ? auditsRes.value : [];

        return prodsRes.value.map((p) => {
          const item = mapApiProduct(p);
          const va = vasList.filter((v: any) => v.productId === p.id);
          return {
            ...item,
            visualAids: va,
            visualAidsCount: va.length,
            presenceSummary: calculatePresenceSummary(p.id, auditsList),
          };
        });
      }
    } catch (err) {
      console.warn("Real /products API call failed, falling back to mock:", err);
    }

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
    try {
      const p = await apiClient.get<any>(`/products/${id}`);
      if (p && p.id) {
        const item = mapApiProduct(p);
        const vas = await this.getVisualAids({ productId: id });
        return {
          ...item,
          visualAids: vas,
          visualAidsCount: vas.length,
          presenceSummary: calculatePresenceSummary(p.id),
        };
      }
    } catch {
      // fallback
    }

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
    try {
      const res = await apiClient.get<any[]>("/product-categories");
      if (Array.isArray(res) && res.length > 0) {
        return res.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
          description: c.description,
          productCount: c.products?.length || c._count?.products || 3,
        }));
      }
    } catch {
      // fallback
    }

    return Promise.resolve([...mockProductCategories]);
  },

  async getVisualAids(params?: { productId?: string; search?: string }): Promise<VisualAid[]> {
    try {
      const queryParams: Record<string, any> = { limit: 50 };
      if (params?.productId) queryParams.productId = params.productId;
      if (params?.search) queryParams.search = params.search;

      const res = await apiClient.get<any[]>("/visual-aids", { params: queryParams });
      if (Array.isArray(res) && res.length > 0) {
        return res.map((v) => ({
          id: v.id,
          productId: v.productId,
          productName: v.product?.brandName || "Product",
          title: v.title,
          type: v.type,
          fileUrl: v.fileUrl,
          thumbnailUrl: v.thumbnailUrl,
          fileSizeBytes: Number(v.fileSizeBytes) || 1024000,
          totalPages: v.totalPages || 12,
          version: v.version || 1,
          isApproved: v.isPublished ?? true,
          approvedDate: v.publishedAt || "2026-01-01",
        }));
      }
    } catch {
      // fallback
    }

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
    try {
      const audits = await apiClient.get<any[]>("/product-presence", { params: { productId } });
      if (Array.isArray(audits)) {
        return calculatePresenceSummary(productId, audits);
      }
    } catch {
      // fallback
    }
    return Promise.resolve(calculatePresenceSummary(productId));
  },

  async getLowStockAlerts(limit: number = 6): Promise<StockAlert[]> {
    try {
      const audits = await apiClient.get<any[]>("/product-presence", { params: { limit: 50 } });
      if (Array.isArray(audits) && audits.length > 0) {
        const issues = audits.filter((a) => a.status === "OUT_OF_STOCK" || a.status === "LOW_STOCK");
        if (issues.length > 0) {
          return issues.slice(0, limit).map((audit) => ({
            id: audit.id,
            pharmacyName: audit.customer?.name || audit.pharmacyName || "Pharmacy",
            territoryName: audit.territory?.name || "Central District",
            productName: audit.product?.brandName || audit.productName || "Product",
            status: audit.status as "LOW_STOCK" | "OUT_OF_STOCK",
            reportedQuantity: audit.quantity,
            auditedBy: audit.mr?.name || "Field MR",
            auditedAt: audit.checkedAt || audit.createdAt,
          }));
        }
      }
    } catch {
      // fallback
    }

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
