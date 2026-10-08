export type OrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "ACCEPTED"
  | "PROCESSING"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount?: number;
  taxRate?: number;
  lineTotal?: number;
}

export interface Order {
  id: string;
  organizationId: string;
  orderNumber: string;
  mrId: string;
  mrName?: string;
  mrEmployeeCode?: string;
  mrPhone?: string;
  pharmacyId: string;
  pharmacyName: string;
  customerName?: string;
  customerAddress?: string;
  territoryId?: string;
  territoryName?: string;
  distributorId?: string;
  distributorName?: string;
  items: OrderItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  createdAt?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  remarks?: string;
  visitId?: string;
}

export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";

export interface Collection {
  id: string;
  organizationId: string;
  receiptNumber: string;
  mrId: string;
  mrName?: string;
  mrEmployeeCode?: string;
  mrPhone?: string;
  pharmacyId: string;
  pharmacyName: string;
  customerName?: string;
  customerAddress?: string;
  territoryId?: string;
  territoryName?: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  receiptImageUrl?: string | null;
  invoiceNumber?: string;
  createdAt: string;
}

export interface OrderQueryParams {
  status?: string;
  mrId?: string;
  customerId?: string;
  territoryId?: string;
  date?: string;
  search?: string;
  limit?: number;
}

export interface CollectionQueryParams {
  mode?: PaymentMode | "ALL";
  mrId?: string;
  customerId?: string;
  territoryId?: string;
  date?: string;
  search?: string;
  limit?: number;
}

export interface CommercialKPIs {
  todayOrdersCount: number;
  todayOrdersValue: number;
  monthlyOrdersCount: number;
  monthlyOrdersValue: number;
  todayCollectionsCount: number;
  todayCollectionsValue: number;
  monthlyCollectionsCount: number;
  monthlyCollectionsValue: number;
  pendingFulfillmentCount: number;
  averageOrderValue: number;
  collectionRealizationRate: number;
}

export interface DailyCommercialTrend {
  date: string;
  label: string;
  orderAmount: number;
  orderCount: number;
  collectionAmount: number;
  collectionCount: number;
}

export interface MrCommercialPerformance {
  mrId: string;
  mrName: string;
  employeeCode: string;
  territoryName: string;
  ordersCount: number;
  ordersValue: number;
  collectionsCount: number;
  collectionsValue: number;
}
