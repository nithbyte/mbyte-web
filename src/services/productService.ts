import { apiClient, isMockFallbackAllowed } from "../lib/api-client";
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
import { authService } from "./authService";
import { isOrgMatch } from "../lib/utils";

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  status?: string;
  organizationId?: string;
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
    organizationId: p.organizationId || p.organization?.id || "",
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
      if (params?.organizationId) queryParams.organizationId = params.organizationId;

      const [prodsRes, vasRes, auditsRes] = await Promise.allSettled([
        apiClient.get<any>("/products", { params: queryParams }),
        apiClient.get<any>("/visual-aids", { params: { limit: 50 } }),
        apiClient.get<any>("/product-presence", { params: { limit: 100 } }),
      ]);

      const prodsData = prodsRes.status === "fulfilled" ? prodsRes.value : null;
      const prodsList = Array.isArray(prodsData) ? prodsData : (Array.isArray(prodsData?.items) ? prodsData.items : null);

      if (prodsList !== null) {
        const vasData = vasRes.status === "fulfilled" ? vasRes.value : [];
        const vasList = Array.isArray(vasData) ? vasData : (Array.isArray(vasData?.items) ? vasData.items : []);
        const auditsData = auditsRes.status === "fulfilled" ? auditsRes.value : [];
        const auditsList = Array.isArray(auditsData) ? auditsData : (Array.isArray(auditsData?.items) ? auditsData.items : []);

        return prodsList.map((p: any) => {
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
      if (!isMockFallbackAllowed()) {
        throw err;
      }
      console.warn("Real /products API call failed, falling back to mock:", err);
    }

    let list = [...productsState];

    // Enforce tenant scoping in mock fallback
    const currentUser = await authService.getCurrentUser();
    const effectiveOrgId = params?.organizationId || (currentUser?.role !== "SUPER_ADMIN" ? currentUser?.organizationId : undefined);
    if (effectiveOrgId) {
      list = list.filter((p) => isOrgMatch(p.organizationId, effectiveOrgId));
    }

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
      const res = await apiClient.get<any>("/product-categories", { params: { limit: 100 } });
      const items = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : null);
      if (items !== null && items.length > 0) {
        return items.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
          description: c.description,
          productCount: c.products?.length || c._count?.products || 0,
        }));
      }
    } catch {
      // fallback
    }

    return Promise.resolve([...mockProductCategories]);
  },

  async getVisualAidAnalytics(visualAidId?: string): Promise<{
    disclaimer: string;
    totalSessions: number;
    totalPresentationDurationSeconds: number;
    averageSessionDurationSeconds: number;
    slides: Array<{
      slideIdentifier: string;
      slideIndex: number;
      viewCount: number;
      totalDurationSeconds: number;
      averageDurationSeconds: number;
      feedbackSummary: Record<string, number>;
    }>;
    feedbackDistribution: Record<string, number>;
  }> {
    try {
      const res: any = await apiClient.get('/visual-aids/analytics/summary', {
        params: visualAidId ? { visualAidId } : {},
      });
      return (
        res?.data ||
        res || {
          disclaimer:
            'Slide display duration records screen presentation time during detailing visits and must NOT be interpreted as medical proof of doctor attention, comprehension, or clinical agreement.',
          totalSessions: 0,
          totalPresentationDurationSeconds: 0,
          averageSessionDurationSeconds: 0,
          slides: [],
          feedbackDistribution: {},
        }
      );
    } catch {
      return {
        disclaimer:
          'Slide display duration records screen presentation time during detailing visits and must NOT be interpreted as medical proof of doctor attention, comprehension, or clinical agreement.',
        totalSessions: 0,
        totalPresentationDurationSeconds: 0,
        averageSessionDurationSeconds: 0,
        slides: [],
        feedbackDistribution: {},
      };
    }
  },

  async getVisualAids(params?: { productId?: string; search?: string }): Promise<VisualAid[]> {
    try {
      const queryParams: Record<string, any> = { limit: 50 };
      if (params?.productId) queryParams.productId = params.productId;
      if (params?.search) queryParams.search = params.search;

      const res = await apiClient.get<any>("/visual-aids", { params: queryParams });
      const list = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : null);
      if (list !== null) {
        return list.map((v: any) => ({
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
      const res = await apiClient.get<any>("/product-presence", { params: { productId } });
      const audits = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : null);
      if (audits !== null) {
        return calculatePresenceSummary(productId, audits);
      }
    } catch {
      // fallback
    }
    return Promise.resolve(calculatePresenceSummary(productId));
  },

  async getLowStockAlerts(limit: number = 6): Promise<StockAlert[]> {
    try {
      const res = await apiClient.get<any>("/product-presence", { params: { limit: 50 } });
      const audits = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : null);
      if (audits !== null) {
        const issues = audits.filter((a: any) => a.status === "OUT_OF_STOCK" || a.status === "LOW_STOCK");
        return issues.slice(0, limit).map((audit: any) => ({
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
    } catch {
      // fallback
    }

    const currentUser = await authService.getCurrentUser();
    const effectiveOrgId = currentUser?.role !== "SUPER_ADMIN" ? currentUser?.organizationId : undefined;
    const alerts: StockAlert[] = [];
    let stockIssues = mockProductPresence.filter(
      (p) => p.status === "OUT_OF_STOCK" || p.status === "LOW_STOCK"
    );
    if (effectiveOrgId) {
      stockIssues = stockIssues.filter((p) => isOrgMatch(p.organizationId, effectiveOrgId));
    }

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

  async createProduct(input: import('../types').ProductInput): Promise<Product> {
    const currentUser = await authService.getCurrentUser();
    try {
      const payload: Record<string, any> = {
        categoryId: input.categoryId,
        sku: input.sku.trim(),
        brandName: input.name.trim(),
        genericName: input.genericName.trim(),
        dosageForm: input.dosageForm.trim(),
        packSize: input.packSize.trim(),
        mrp: Number(input.mrp),
        ptr: Number(input.ptr),
        pts: Number(input.pts),
        gstRate: Number(input.gstPercent || 12),
      };
      if (input.imageUrl) {
        payload.imageUrl = input.imageUrl;
      }
      if (currentUser?.role === "SUPER_ADMIN" && (input as any).organizationId) {
        payload.organizationId = (input as any).organizationId;
      }
      const res = await apiClient.post<any>('/products', payload);
      if (res && res.id) {
        const newProduct = mapApiProduct(res);
        productsState.unshift(newProduct);
        return newProduct;
      }
    } catch (err) {
      console.warn('Real POST /products failed, using mock:', err);
    }
    // Mock fallback: add to in-memory state
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      organizationId: currentUser?.organizationId || '',
      name: input.name,
      genericName: input.genericName,
      sku: input.sku,
      categoryId: input.categoryId,
      categoryName: mockProductCategories.find(c => c.id === input.categoryId)?.name || 'Therapeutics',
      dosageForm: input.dosageForm,
      strength: input.strength,
      packSize: input.packSize,
      mrp: input.mrp,
      ptr: input.ptr,
      pts: input.pts,
      gstPercent: input.gstPercent,
      description: input.description,
      imageUrl: input.imageUrl,
      isActive: input.isActive,
      visualAids: [],
      visualAidsCount: 0,
      presenceSummary: { totalAudits: 0, availableCount: 0, lowStockCount: 0, outOfStockCount: 0, unknownCount: 0, availabilityRate: 0, recentAudits: [] },
    };
    productsState.push(newProd);
    return Promise.resolve(newProd);
  },

  async updateProduct(id: string, input: Partial<import('../types').ProductInput>): Promise<Product> {
    try {
      const payload: Record<string, any> = {};
      if (input.name !== undefined) payload.brandName = input.name.trim();
      if (input.genericName !== undefined) payload.genericName = input.genericName.trim();
      if (input.sku !== undefined) payload.sku = input.sku.trim();
      if (input.categoryId !== undefined) payload.categoryId = input.categoryId;
      if (input.dosageForm !== undefined) payload.dosageForm = input.dosageForm.trim();
      if (input.packSize !== undefined) payload.packSize = input.packSize.trim();
      if (input.mrp !== undefined) payload.mrp = Number(input.mrp);
      if (input.ptr !== undefined) payload.ptr = Number(input.ptr);
      if (input.pts !== undefined) payload.pts = Number(input.pts);
      if (input.gstPercent !== undefined) payload.gstRate = Number(input.gstPercent);
      if (input.isActive !== undefined) payload.isActive = Boolean(input.isActive);
      if (input.imageUrl !== undefined) payload.imageUrl = input.imageUrl;

      const res = await apiClient.put<any>(`/products/${id}`, payload);
      if (res && res.id) {
        const updated = mapApiProduct(res);
        const idx = productsState.findIndex((p) => p.id === id);
        if (idx !== -1) {
          productsState[idx] = updated;
        }
        return updated;
      }
    } catch (err) {
      console.warn('Real PUT /products/:id failed, using mock:', err);
    }

    // Mock fallback: update in-memory state
    const idx = productsState.findIndex((p) => p.id === id);
    const existing = idx !== -1 ? productsState[idx] : null;
    const updated: Product = {
      id,
      organizationId: existing?.organizationId || '',
      name: input.name !== undefined ? input.name : (existing?.name || 'Product'),
      genericName: input.genericName !== undefined ? input.genericName : (existing?.genericName || ''),
      sku: input.sku !== undefined ? input.sku : (existing?.sku || 'SKU'),
      categoryId: input.categoryId !== undefined ? input.categoryId : (existing?.categoryId || ''),
      categoryName: input.categoryId
        ? (mockProductCategories.find((c) => c.id === input.categoryId)?.name || existing?.categoryName || 'General')
        : (existing?.categoryName || 'General'),
      dosageForm: input.dosageForm !== undefined ? input.dosageForm : (existing?.dosageForm || 'Tablet'),
      strength: input.strength !== undefined ? input.strength : (existing?.strength || '500mg'),
      packSize: input.packSize !== undefined ? input.packSize : (existing?.packSize || '10x10'),
      mrp: input.mrp !== undefined ? Number(input.mrp) : (existing?.mrp || 0),
      ptr: input.ptr !== undefined ? Number(input.ptr) : (existing?.ptr || 0),
      pts: input.pts !== undefined ? Number(input.pts) : (existing?.pts || 0),
      gstPercent: input.gstPercent !== undefined ? Number(input.gstPercent) : (existing?.gstPercent || 12),
      description: input.description !== undefined ? input.description : existing?.description,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl : existing?.imageUrl,
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : (existing?.isActive ?? true),
      visualAids: existing?.visualAids || [],
      visualAidsCount: existing?.visualAidsCount || 0,
      presenceSummary: existing?.presenceSummary || { totalAudits: 0, availableCount: 0, lowStockCount: 0, outOfStockCount: 0, unknownCount: 0, availabilityRate: 0, recentAudits: [] },
    };
    if (idx !== -1) {
      productsState[idx] = updated;
    } else {
      productsState.unshift(updated);
    }
    return Promise.resolve(updated);
  },

  async createVisualAid(input: {
    productId: string;
    title: string;
    type: string;
    fileUrl: string;
    thumbnailUrl?: string;
    description?: string;
    version?: string;
  }): Promise<import('../types').VisualAid> {
    try {
      const payload: Record<string, any> = {
        productId: input.productId,
        title: input.title,
        fileUrl: input.fileUrl,
        type: input.type || 'PDF',
        fileSizeBytes: 2 * 1024 * 1024, // 2MB default
        version: parseInt(input.version || '1', 10) || 1,
        isPublished: true,
      };
      if (input.thumbnailUrl) {
        payload.thumbnailUrl = input.thumbnailUrl;
      }
      const res = await apiClient.post<any>('/visual-aids', payload);
      if (res && res.id) {
        return {
          id: res.id,
          productId: res.productId,
          title: res.title,
          type: res.type,
          fileUrl: res.fileUrl,
          thumbnailUrl: res.thumbnailUrl,
          fileSizeBytes: res.fileSizeBytes,
          version: res.version || '1.0',
          isPublished: res.isPublished ?? true,
          description: res.description,
        };
      }
    } catch (err) {
      console.warn('Real POST /visual-aids failed, using mock:', err);
    }
    // Mock fallback
    const newVA: import('../types').VisualAid = {
      id: `va_${Date.now()}`,
      productId: input.productId,
      title: input.title,
      type: input.type,
      fileUrl: input.fileUrl || 'https://example.com/deck.pdf',
      thumbnailUrl: input.thumbnailUrl,
      version: input.version || '1.0',
      isPublished: true,
      publishedAt: new Date().toISOString(),
      description: input.description,
      fileSizeBytes: 2048000,
    };
    mockVisualAids.push(newVA as any);
    return Promise.resolve(newVA);
  },
};
