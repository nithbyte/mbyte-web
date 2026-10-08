import collectionsData from "./data/collections.json";
import distributorsData from "./data/distributors.json";
import doctorsData from "./data/doctors.json";
import mrsData from "./data/mrs.json";
import notificationsData from "./data/notifications.json";
import ordersData from "./data/orders.json";
import pharmaciesData from "./data/pharmacies.json";
import productCategoriesData from "./data/productCategories.json";
import productPresenceData from "./data/productPresence.json";
import productsData from "./data/products.json";
import targetsData from "./data/targets.json";
import territoriesData from "./data/territories.json";
import usersData from "./data/users.json";
import visitsData from "./data/visits.json";
import visualAidsData from "./data/visualAids.json";

import type {
  Doctor,
  Pharmacy,
  Distributor,
  Visit,
  VisitStatus,
  VerificationStatus,
  VisitProductDiscussion,
  Order,
  OrderStatus,
  Collection,
  PaymentMode,
  Product,
  ProductCategory,
  ProductPresenceAudit,
  VisualAid,
  Territory,
  User,
} from "../types";

export const mockTerritories: Territory[] = territoriesData as unknown as Territory[];

interface RawPharmacy {
  id: string;
  organizationId: string;
  territoryId: string;
  name: string;
  proprietorName?: string;
  contactPerson?: string;
  drugLicenseNo?: string;
  drugLicenseNumber?: string;
  gstin?: string;
  address: string;
  phone: string;
  email?: string;
  latitude: number;
  longitude: number;
  creditLimit?: number;
  currentOutstanding?: number;
  outstandingBalance?: number;
}

interface RawDistributor {
  id: string;
  organizationId: string;
  territoryId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  drugLicenseNo?: string;
  dlNumber?: string;
  gstin: string;
  creditLimit?: number;
  paymentTerms?: string;
  isActive?: boolean;
}

export const mockPharmacies: Pharmacy[] = (pharmaciesData as unknown as RawPharmacy[]).map((p) => {
  const territory = mockTerritories.find((t) => t.id === p.territoryId);
  return {
    id: p.id,
    organizationId: p.organizationId || "org_novis_001",
    name: p.name,
    contactPerson: p.contactPerson || p.proprietorName || "Pharmacist In-Charge",
    phone: p.phone,
    email: p.email,
    address: p.address,
    drugLicenseNumber: p.drugLicenseNumber || p.drugLicenseNo || "TN-20B-1000",
    gstNumber: p.gstin,
    territoryId: p.territoryId,
    territoryName: territory?.name || "Madurai North",
    creditLimit: p.creditLimit || 200000,
    outstandingBalance: p.outstandingBalance ?? p.currentOutstanding ?? 0,
    latitude: p.latitude || 9.9252,
    longitude: p.longitude || 78.1198,
  };
});

export const mockDistributors: Distributor[] = (distributorsData as unknown as RawDistributor[]).map((d) => {
  const territory = mockTerritories.find((t) => t.id === d.territoryId);
  return {
    id: d.id,
    organizationId: d.organizationId || "org_novis_001",
    name: d.name,
    contactPerson: d.contactPerson || "Wholesale Manager",
    phone: d.phone,
    email: d.email,
    address: d.address,
    dlNumber: d.dlNumber || d.drugLicenseNo || "TN-DIST-01",
    gstin: d.gstin,
    territoryId: d.territoryId,
    territoryName: territory?.name || "Madurai North",
    creditLimit: d.creditLimit || 3000000,
    paymentTerms: d.paymentTerms || "Net 30 Days",
    isActive: d.isActive !== false,
  };
});

interface RawProduct {
  id: string;
  organizationId?: string;
  categoryId: string;
  sku: string;
  brandName?: string;
  name?: string;
  genericName: string;
  dosageForm: string;
  packSize: string;
  ptr: number;
  pts: number;
  mrp: number;
  gstRate?: number;
  gstPercent?: number;
  isActive?: boolean;
  indications?: string;
  contraindications?: string;
  sideEffects?: string;
  description?: string;
  imageUrl?: string;
}

interface RawVisualAid {
  id: string;
  organizationId?: string;
  productId: string;
  title: string;
  fileUrl?: string;
  assetUrl?: string;
  thumbnailUrl?: string;
  type?: string;
  fileSizeBytes?: number;
  version?: number | string;
  isPublished?: boolean;
  publishedAt?: string;
  publishedDate?: string;
  description?: string;
}

interface RawProductPresence {
  id: string;
  organizationId?: string;
  mrId?: string;
  pharmacyId: string;
  pharmacyName?: string;
  productId: string;
  productName?: string;
  productSku?: string;
  status: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
  quantity?: number;
  currentQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
  checkedAt?: string;
  auditedAt?: string;
}

const rawProductsList = productsData as unknown as RawProduct[];
const rawCategoriesList = productCategoriesData as unknown as Array<{ id: string; name: string; slug?: string; description?: string }>;
const rawVisualAidsList = visualAidsData as unknown as RawVisualAid[];
const rawPresenceList = productPresenceData as unknown as RawProductPresence[];

export const mockProductCategories: ProductCategory[] = rawCategoriesList.map((c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description || `Formulations and therapeutics for ${c.name}.`,
  productCount: rawProductsList.filter((p) => p.categoryId === c.id).length,
}));

export const mockProducts: Product[] = rawProductsList.map((p) => {
  const cat = mockProductCategories.find((c) => c.id === p.categoryId);
  const pName = p.name || p.brandName || "Formulation";
  return {
    id: p.id,
    organizationId: p.organizationId || "org_novis_001",
    name: pName,
    brandName: p.brandName || pName,
    genericName: p.genericName,
    sku: p.sku,
    dosageForm: p.dosageForm,
    strength: p.dosageForm === "Tablet" ? "Standard Therapeutic Dose" : "Clinical Regimen",
    packSize: p.packSize,
    price: p.mrp,
    mrp: p.mrp,
    ptr: p.ptr,
    pts: p.pts,
    gstPercent: p.gstPercent || p.gstRate || 12,
    gstRate: p.gstRate || p.gstPercent || 12,
    categoryId: p.categoryId,
    categoryName: cat?.name || "Specialty Pharma",
    description:
      p.description ||
      `${pName} (${p.genericName}) is a pharmaceutical formulation indicated for clinical regimens in ${cat?.name || "targeted care"}. Designed with high bioavailability and patient compliance in ${p.packSize}.`,
    indications:
      p.indications ||
      "Indicated for primary and adjunctive therapy in designated therapeutic regimens under physician guidance.",
    contraindications:
      p.contraindications ||
      `Hypersensitivity to ${p.genericName} or formulation components. Severe hepatic or renal impairment.`,
    sideEffects:
      p.sideEffects ||
      "Mild gastrointestinal symptoms, headache, or transient dizziness. Consult attending doctor if symptoms persist.",
    imageUrl:
      p.imageUrl ||
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    isActive: p.isActive !== false,
    status: p.isActive !== false ? "ACTIVE" : "INACTIVE",
  };
});

export const mockVisualAids: VisualAid[] = rawVisualAidsList.map((va) => {
  const prod = mockProducts.find((p) => p.id === va.productId);
  return {
    id: va.id,
    organizationId: va.organizationId || "org_novis_001",
    productId: va.productId,
    productName: prod?.name || "Pharmaceutical Formulation",
    title: va.title,
    type: va.type || "PDF",
    version: va.version || 1,
    category: prod?.categoryName || "Clinical Detailing",
    fileUrl: va.fileUrl || va.assetUrl || "https://assets.novispharma.com/detailing/sample-deck.pdf",
    assetUrl: va.assetUrl || va.fileUrl,
    thumbnailUrl:
      va.thumbnailUrl ||
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300",
    fileSizeBytes: va.fileSizeBytes || 4200000,
    isPublished: va.isPublished !== false,
    publishedAt: va.publishedAt || va.publishedDate || "2026-01-15T00:00:00.000Z",
    publishedDate: va.publishedDate || (va.publishedAt ? va.publishedAt.slice(0, 10) : "2026-01-15"),
    description: va.description || "Comprehensive clinical visual detailing deck for healthcare professional detailing.",
  };
});

interface RawMRItem {
  id: string;
  employeeCode?: string;
  territoryId?: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

export const mockMRs = mrsData;

export const mockProductPresence: ProductPresenceAudit[] = rawPresenceList.map((a, idx) => {
  const prod = mockProducts.find((p) => p.id === a.productId);
  const phm = mockPharmacies.find((p) => p.id === a.pharmacyId);
  const mr = (mockMRs as unknown as RawMRItem[]).find((m) => m.id === a.mrId);
  const mrFullName = mr?.user ? `${mr.user.firstName || ""} ${mr.user.lastName || ""}`.trim() : "Arun Kumar";
  const territory = mockTerritories.find(
    (t) => t.id === (phm?.territoryId || mr?.territoryId || "ter_mdu_north")
  );

  // Slight date distribution across recent days for realistic date filtering
  const dayOffset = idx % 4;
  const dateObj = new Date("2026-10-08T10:15:00.000Z");
  dateObj.setDate(dateObj.getDate() - dayOffset);
  const auditDateStr = dateObj.toISOString();

  return {
    id: a.id,
    organizationId: a.organizationId || "org_novis_001",
    pharmacyId: a.pharmacyId,
    pharmacyName: a.pharmacyName || phm?.name || "Registered Chemist",
    pharmacyAddress: phm?.address || "Commercial Road, Madurai",
    territoryId: territory?.id || "ter_mdu_north",
    territoryName: territory?.name || phm?.territoryName || "Madurai North",
    latitude: phm?.latitude || 9.9252 + (idx % 10) * 0.003,
    longitude: phm?.longitude || 78.1198 + (idx % 10) * 0.003,
    productId: a.productId,
    productName: a.productName || prod?.name || "Product",
    productSku: a.productSku || prod?.sku,
    genericName: prod?.genericName,
    status: a.status,
    quantity: a.quantity ?? a.currentQuantity ?? 0,
    currentQuantity: a.currentQuantity ?? a.quantity ?? 0,
    batchNumber: a.batchNumber || "BT-2026",
    expiryDate: a.expiryDate || "2027-12-31",
    notes: a.notes || "Audited during representative chemist visit",
    mrId: a.mrId || "mr_001",
    mrName: mrFullName,
    employeeCode: mr?.employeeCode || "NP-MR-101",
    auditedByMrId: a.mrId || "mr_001",
    auditedByMrName: mrFullName,
    checkedAt: auditDateStr,
    auditedAt: auditDateStr,
  };
});

export const mockDoctors: Doctor[] = doctorsData as unknown as Doctor[];
export const mockNotifications = notificationsData;
export const mockTargets = targetsData;
export const mockUsers: User[] = usersData as unknown as User[];

interface RawOrderItem {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  discount?: number;
  taxRate?: number;
  lineTotal?: number;
  subtotal?: number;
}

interface RawOrder {
  id: string;
  organizationId?: string;
  orderNumber: string;
  mrId: string;
  pharmacyId: string;
  pharmacyName: string;
  distributorId?: string;
  distributorName?: string;
  status: OrderStatus;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  remarks?: string;
  notes?: string;
  createdAt?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  items: RawOrderItem[];
}

const baseOrdersList = ordersData as unknown as RawOrder[];

const todayAdditionalOrders: RawOrder[] = [
  {
    id: "ord_today_001",
    organizationId: "org_novis_001",
    orderNumber: "ORD-2026-10-0033",
    mrId: "mr_001",
    pharmacyId: "phm_001",
    pharmacyName: "Apollo Pharmacy - Madurai North Branch 1",
    distributorId: "dst_001",
    distributorName: "Sri Ram Pharma Distributors",
    status: "ACCEPTED",
    subtotalAmount: 4050,
    discountAmount: 150,
    taxAmount: 420,
    totalAmount: 4320,
    remarks: "Priority morning chemist replenishment for chronic cardiac line",
    createdAt: "2026-10-08T09:15:00.000Z",
    orderDate: "2026-10-08",
    expectedDeliveryDate: "2026-10-09",
    items: [
      {
        id: "item_t1_1",
        productId: "prod_001",
        productName: "CardioVas 10mg",
        sku: "NP-CAD-01",
        unitPrice: 120,
        quantity: 20,
        discount: 5,
        taxRate: 12,
        lineTotal: 2553.6,
        subtotal: 2400,
      },
      {
        id: "item_t1_2",
        productId: "prod_004",
        productName: "NormoTens H",
        sku: "NP-CAD-04",
        unitPrice: 110,
        quantity: 15,
        discount: 0,
        taxRate: 12,
        lineTotal: 1766.4,
        subtotal: 1650,
      },
    ],
  },
  {
    id: "ord_today_002",
    organizationId: "org_novis_001",
    orderNumber: "ORD-2026-10-0034",
    mrId: "mr_002",
    pharmacyId: "phm_002",
    pharmacyName: "MedPlus Chemist - Madurai North Branch 2",
    distributorId: "dst_001",
    distributorName: "Sri Ram Pharma Distributors",
    status: "SUBMITTED",
    subtotalAmount: 8700,
    discountAmount: 200,
    taxAmount: 860,
    totalAmount: 9360,
    remarks: "Direct order booking during representative chemist call",
    createdAt: "2026-10-08T11:30:00.000Z",
    orderDate: "2026-10-08",
    expectedDeliveryDate: "2026-10-10",
    items: [
      {
        id: "item_t2_1",
        productId: "prod_002",
        productName: "CardioVas AM",
        sku: "NP-CAD-02",
        unitPrice: 145,
        quantity: 30,
        discount: 2,
        taxRate: 12,
        lineTotal: 4774,
        subtotal: 4350,
      },
      {
        id: "item_t2_2",
        productId: "prod_005",
        productName: "GlucoGuard 500",
        sku: "NP-DIA-01",
        unitPrice: 145,
        quantity: 30,
        discount: 0,
        taxRate: 12,
        lineTotal: 4872,
        subtotal: 4350,
      },
    ],
  },
  {
    id: "ord_today_003",
    organizationId: "org_novis_001",
    orderNumber: "ORD-2026-10-0035",
    mrId: "mr_003",
    pharmacyId: "phm_003",
    pharmacyName: "Care Medicals - Madurai North Branch 3",
    distributorId: "dst_002",
    distributorName: "Meenakshi Healthcare Logistics",
    status: "SUBMITTED",
    subtotalAmount: 3200,
    discountAmount: 50,
    taxAmount: 350,
    totalAmount: 3500,
    remarks: "Dispensing demand after physician consultation hours",
    createdAt: "2026-10-08T14:15:00.000Z",
    orderDate: "2026-10-08",
    expectedDeliveryDate: "2026-10-09",
    items: [
      {
        id: "item_t3_1",
        productId: "prod_003",
        productName: "CardioVas Trio",
        sku: "NP-CAD-03",
        unitPrice: 160,
        quantity: 20,
        discount: 0,
        taxRate: 12,
        lineTotal: 3584,
        subtotal: 3200,
      },
    ],
  },
  {
    id: "ord_today_004",
    organizationId: "org_novis_001",
    orderNumber: "ORD-2026-10-0036",
    mrId: "mr_001",
    pharmacyId: "phm_004",
    pharmacyName: "Sri Balaji Pharmacy - Madurai North Branch 4",
    distributorId: "dst_001",
    distributorName: "Sri Ram Pharma Distributors",
    status: "PROCESSING",
    subtotalAmount: 11200,
    discountAmount: 400,
    taxAmount: 1200,
    totalAmount: 12000,
    remarks: "Bulk monthly replenishment approved by purchase manager",
    createdAt: "2026-10-08T16:00:00.000Z",
    orderDate: "2026-10-08",
    expectedDeliveryDate: "2026-10-10",
    items: [
      {
        id: "item_t4_1",
        productId: "prod_001",
        productName: "CardioVas 10mg",
        sku: "NP-CAD-01",
        unitPrice: 120,
        quantity: 50,
        discount: 5,
        taxRate: 12,
        lineTotal: 6384,
        subtotal: 6000,
      },
      {
        id: "item_t4_2",
        productId: "prod_006",
        productName: "GlucoGuard Forte",
        sku: "NP-DIA-02",
        unitPrice: 175,
        quantity: 30,
        discount: 0,
        taxRate: 12,
        lineTotal: 5880,
        subtotal: 5250,
      },
    ],
  },
];

export const mockOrders: Order[] = [...baseOrdersList, ...todayAdditionalOrders].map((o) => {
  const mr = (mockMRs as unknown as RawMRItem[]).find((m) => m.id === o.mrId);
  const mrFullName = mr?.user ? `${mr.user.firstName || ""} ${mr.user.lastName || ""}`.trim() : "Arun Kumar";
  const phm = mockPharmacies.find((p) => p.id === o.pharmacyId);
  const territory = mockTerritories.find((t) => t.id === (phm?.territoryId || mr?.territoryId || "ter_mdu_north"));

  const oDate = o.orderDate || (o.createdAt ? o.createdAt.split("T")[0] : "2026-10-08");

  const normalizedItems = (o.items || []).map((item) => ({
    ...item,
    subtotal: item.subtotal ?? (item.lineTotal ?? item.unitPrice * item.quantity),
  }));

  return {
    ...o,
    organizationId: o.organizationId || "org_novis_001",
    mrName: mrFullName,
    mrEmployeeCode: mr?.employeeCode || "NP-MR-101",
    customerName: o.pharmacyName,
    customerAddress: phm?.address || "Commercial Road, Madurai",
    territoryId: territory?.id || "ter_mdu_north",
    territoryName: territory?.name || "Madurai North",
    orderDate: oDate,
    notes: o.notes || o.remarks || "Booked through field mobile application.",
    remarks: o.remarks || o.notes || "Booked through field mobile application.",
    items: normalizedItems,
  };
});

interface RawCollection {
  id: string;
  organizationId?: string;
  receiptNumber: string;
  mrId: string;
  pharmacyId: string;
  pharmacyName: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  receiptImageUrl?: string | null;
  createdAt?: string;
}

const baseCollectionsList = collectionsData as unknown as RawCollection[];

const todayAdditionalCollections: RawCollection[] = [
  {
    id: "col_today_003",
    organizationId: "org_novis_001",
    receiptNumber: "REC-2026-10-0031",
    mrId: "mr_003",
    pharmacyId: "phm_003",
    pharmacyName: "Care Medicals - Madurai North Branch 3",
    amount: 14200,
    paymentMode: "CASH",
    referenceNumber: "CSH-88201",
    paymentDate: "2026-10-08",
    notes: "Cash collection against overdue bill INV-2026-09-08 signed by proprietor",
    receiptImageUrl: null,
    createdAt: "2026-10-08T12:45:00.000Z",
  },
  {
    id: "col_today_004",
    organizationId: "org_novis_001",
    receiptNumber: "REC-2026-10-0032",
    mrId: "mr_001",
    pharmacyId: "phm_004",
    pharmacyName: "Sri Balaji Pharmacy - Madurai North Branch 4",
    amount: 9800,
    paymentMode: "BANK_TRANSFER",
    referenceNumber: "NEFT-991004",
    paymentDate: "2026-10-08",
    notes: "RTGS / Direct bank transfer for wholesale account clearance",
    receiptImageUrl: null,
    createdAt: "2026-10-08T15:20:00.000Z",
  },
];

export const mockCollections: Collection[] = [...baseCollectionsList, ...todayAdditionalCollections].map((c) => {
  const mr = (mockMRs as unknown as RawMRItem[]).find((m) => m.id === c.mrId);
  const mrFullName = mr?.user ? `${mr.user.firstName || ""} ${mr.user.lastName || ""}`.trim() : "Arun Kumar";
  const phm = mockPharmacies.find((p) => p.id === c.pharmacyId);
  const territory = mockTerritories.find((t) => t.id === (phm?.territoryId || mr?.territoryId || "ter_mdu_north"));

  return {
    ...c,
    organizationId: c.organizationId || "org_novis_001",
    mrName: mrFullName,
    mrEmployeeCode: mr?.employeeCode || "NP-MR-101",
    customerName: c.pharmacyName,
    customerAddress: phm?.address || "Commercial Road, Madurai",
    territoryId: territory?.id || "ter_mdu_north",
    territoryName: territory?.name || "Madurai North",
    notes: c.notes || `Payment collection via ${c.paymentMode} voucher.`,
    createdAt: c.createdAt || `${c.paymentDate}T10:00:00.000Z`,
  };
});

interface RawVisitData {
  id: string;
  organizationId?: string;
  mrId: string;
  customerType: "DOCTOR" | "PHARMACY";
  customerId: string;
  customerName: string;
  customerAddress?: string;
  scheduledDate?: string;
  plannedDate?: string;
  scheduledStartTime?: string;
  plannedStartTime?: string;
  scheduledEndTime?: string;
  plannedEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  durationSeconds?: number;
  status: VisitStatus;
  verificationStatus: VerificationStatus;
  distanceMeters?: number;
  distanceFromRegisteredMeters?: number;
  verifiedLatitude?: number;
  verifiedLongitude?: number;
  gpsAccuracy?: number;
  feedbackNotes?: string;
  doctorFeedback?: string;
  nextFollowUpDate?: string;
  priority?: "HIGH" | "NORMAL" | "LOW";
  visitProducts?: VisitProductDiscussion[];
  createdAt?: string;
}

const rawVisitsList = visitsData as unknown as RawVisitData[];

export const mockVisits: Visit[] = rawVisitsList.map((v) => {
  const doc = mockDoctors.find((d) => d.id === v.customerId);
  const phm = mockPharmacies.find((p) => p.id === v.customerId);
  const mr = (mockMRs as unknown as RawMRItem[]).find((m) => m.id === v.mrId);
  const mrFullName = mr?.user ? `${mr.user.firstName || ""} ${mr.user.lastName || ""}`.trim() : "Arun Kumar";
  const territory = mockTerritories.find(
    (t) => t.id === (doc?.territoryId || phm?.territoryId || mr?.territoryId || "ter_mdu_north")
  );

  // Set CANCELLED on sample visit to ensure cancelled status is testable
  const visitStatus: VisitStatus =
    v.id === "vis_today_010" || v.id === "vis_015" ? "CANCELLED" : v.status;
  const feedback =
    visitStatus === "CANCELLED"
      ? "Cancelled by physician clinic due to emergency surgical round."
      : v.feedbackNotes || v.doctorFeedback || "Detailed core therapeutic portfolio.";

  const sDate = v.scheduledDate || v.plannedDate || "2026-10-08";
  const sStart = v.scheduledStartTime || v.plannedStartTime || "09:00 AM";
  const sEnd = v.scheduledEndTime || v.plannedEndTime || "09:20 AM";

  return {
    id: v.id,
    organizationId: v.organizationId || "org_novis_001",
    mrId: v.mrId,
    mrName: mrFullName,
    employeeCode: mr?.employeeCode || "NP-MR-101",
    mrPhone: "+91984201000",
    customerId: v.customerId,
    customerName: v.customerName,
    customerType: v.customerType,
    customerAddress: v.customerAddress || doc?.address || phm?.address || "Commercial Road, Madurai",
    specialty: doc?.specialty || (v.customerType === "DOCTOR" ? "General Medicine" : "Retail Pharmacy"),
    territoryId: territory?.id || "ter_mdu_north",
    territoryName: territory?.name || "Madurai North",
    plannedDate: sDate,
    scheduledDate: sDate,
    plannedStartTime: sStart,
    scheduledStartTime: sStart,
    plannedEndTime: sEnd,
    scheduledEndTime: sEnd,
    actualStartTime: v.actualStartTime,
    actualEndTime: v.actualEndTime,
    durationSeconds: v.durationSeconds || (v.status === "COMPLETED" ? 900 : undefined),
    status: visitStatus,
    verificationStatus: v.verificationStatus || "VERIFIED",
    distanceMeters: v.distanceMeters ?? v.distanceFromRegisteredMeters ?? 18.5,
    distanceFromRegisteredMeters: v.distanceMeters ?? v.distanceFromRegisteredMeters ?? 18.5,
    verifiedLatitude: v.verifiedLatitude || doc?.latitude || phm?.latitude || 9.9321,
    verifiedLongitude: v.verifiedLongitude || doc?.longitude || phm?.longitude || 78.1448,
    latitude: v.verifiedLatitude || doc?.latitude || phm?.latitude || 9.9321,
    longitude: v.verifiedLongitude || doc?.longitude || phm?.longitude || 78.1448,
    gpsAccuracy: v.gpsAccuracy || 12,
    doctorFeedback: feedback,
    feedbackNotes: feedback,
    outcomeNotes: feedback,
    nextFollowUpDate: v.nextFollowUpDate || "2026-10-22",
    priority: v.priority || "NORMAL",
    visitProducts: v.visitProducts || [
      { productId: "prod_001", promoted: true, samplesQty: 2, feedback: "Prescribing to hypertensive patients" },
    ],
    createdAt: v.createdAt || `${sDate}T08:30:00.000Z`,
  };
});

