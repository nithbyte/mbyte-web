export interface ProductCategory {
  id: string;
  organizationId?: string;
  name: string;
  slug?: string;
  description?: string;
  productCount?: number;
}

export type ProductStatus = "ACTIVE" | "INACTIVE";

export type ProductPresenceStatus = "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";

export interface ProductPresenceAudit {
  id: string;
  organizationId: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress?: string;
  territoryId?: string;
  territoryName?: string;
  latitude?: number;
  longitude?: number;
  productId: string;
  productName: string;
  productSku?: string;
  genericName?: string;
  status: ProductPresenceStatus;
  quantity?: number;
  currentQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
  mrId?: string;
  mrName?: string;
  employeeCode?: string;
  auditedByMrId?: string;
  auditedByMrName?: string;
  checkedAt?: string;
  auditedAt: string;
}

export interface PresenceQueryParams {
  productId?: string;
  territoryId?: string;
  mrId?: string;
  pharmacyId?: string;
  date?: string;
  status?: string;
  search?: string;
}

export interface PresenceCounts {
  total: number;
  available: number;
  lowStock: number;
  outOfStock: number;
  unknown: number;
  availabilityRate: number;
}

export interface ProductPresenceSummary {
  totalAudits: number;
  availableCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  unknownCount: number;
  availabilityRate: number; // 0 to 100%
  recentAudits: ProductPresenceAudit[];
}

export interface VisualAid {
  id: string;
  organizationId?: string;
  productId: string;
  productName?: string;
  title: string;
  type: string; // "PDF" | "SLIDES" | "IMAGE" | "PRESENTATION" | "VIDEO"
  version: string | number;
  category?: string;
  publishedDate?: string;
  publishedAt?: string;
  fileUrl?: string;
  assetUrl?: string;
  thumbnailUrl?: string;
  fileSizeBytes?: number;
  isPublished?: boolean;
  description?: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: string; // brand name
  brandName?: string;
  genericName: string;
  sku: string;
  dosageForm: string;
  strength: string;
  packSize: string;
  price?: number; // alias to mrp
  mrp: number;
  ptr: number; // Price to Retailer
  pts: number; // Price to Stockist
  gstPercent: number;
  gstRate?: number;
  categoryId: string;
  categoryName?: string;
  description?: string;
  indications?: string;
  contraindications?: string;
  sideEffects?: string;
  imageUrl?: string;
  isActive: boolean;
  status?: ProductStatus;
  visualAidsCount?: number;
  visualAids?: VisualAid[];
  presenceSummary?: ProductPresenceSummary;
}

export interface ProductInput {
  name: string;
  sku: string;
  categoryId: string;
  genericName: string;
  description?: string;
  dosageForm: string;
  strength: string;
  packSize: string;
  mrp: number;
  ptr: number;
  pts: number;
  gstPercent: number;
  imageUrl?: string;
  isActive: boolean;
}
