export interface ReportFilterParams {
  date?: string;
  territoryId?: string;
  mrId?: string;
  productId?: string;
}

export type ReportTab =
  | "VISITS"
  | "MR_PERFORMANCE"
  | "PRODUCT_PRESENCE"
  | "SALES"
  | "COLLECTIONS"
  | "TARGET_ACHIEVEMENT";

export interface VisitReportItem {
  id: string;
  date: string;
  time: string;
  mrName: string;
  mrEmployeeCode: string;
  customerName: string;
  customerType: string;
  territoryName: string;
  status: string;
  verificationStatus: string;
  distanceMeters?: number;
  outcomeNotes: string;
  productsDiscussedCount: number;
}

export interface VisitReportData {
  items: VisitReportItem[];
  totalVisits: number;
  completedVisits: number;
  inProgressVisits: number;
  missedVisits: number;
  cancelledVisits: number;
  gpsVerifiedPercent: number;
  chartData: Array<{ label: string; count: number; color?: string }>;
}

export interface MRPerformanceReportItem {
  mrId: string;
  mrName: string;
  employeeCode: string;
  territoryName: string;
  dailyCallGoal: number;
  todayCompletedVisits: number;
  plannedCalls: number;
  completedCalls: number;
  callCompliancePercent: number;
  ordersBookedCount: number;
  ordersBookedValue: number;
  collectionsRealizedValue: number;
  monthlyTargetAmount: number;
  monthlyAchievedAmount: number;
  targetAchievementPercent: number;
}

export interface MRPerformanceReportData {
  items: MRPerformanceReportItem[];
  totalMRs: number;
  avgCompliancePercent: number;
  totalOrdersValue: number;
  totalCollectionsValue: number;
  chartData: Array<{ label: string; value: number; subLabel?: string; color?: string }>;
}

export interface ProductPresenceReportItem {
  id: string;
  productName: string;
  productSku: string;
  categoryName: string;
  pharmacyName: string;
  territoryName: string;
  auditedByMrName: string;
  status: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
  quantity: number;
  auditedAt: string;
}

export interface ProductPresenceReportData {
  items: ProductPresenceReportItem[];
  totalAudited: number;
  availableCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  stockAvailabilityRate: number;
  chartData: Array<{ label: string; count: number; color: string; percent: number }>;
}

export interface SalesReportItem {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerAddress: string;
  territoryName: string;
  mrName: string;
  mrEmployeeCode: string;
  distributorName: string;
  status: string;
  itemsCount: number;
  totalAmount: number;
  topProductNames: string[];
}

export interface SalesReportData {
  items: SalesReportItem[];
  totalOrders: number;
  totalSalesValue: number;
  avgOrderValue: number;
  topSellingProducts: Array<{ productName: string; quantity: number; revenue: number }>;
  chartData: Array<{ label: string; value: number; formattedValue: string; color?: string }>;
}

export interface CollectionReportItem {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  customerName: string;
  territoryName: string;
  mrName: string;
  mrEmployeeCode: string;
  paymentMode: string;
  referenceNumber: string;
  amount: number;
  notes: string;
}

export interface CollectionReportData {
  items: CollectionReportItem[];
  totalReceipts: number;
  totalCollectedValue: number;
  modeBreakdown: {
    upi: number;
    cheque: number;
    cash: number;
    bankTransfer: number;
  };
  chartData: Array<{ label: string; value: number; color: string; percent: number }>;
}

export interface TargetAchievementReportItem {
  id: string;
  mrId: string;
  mrName: string;
  employeeCode: string;
  territoryName: string;
  monthYear: string;
  targetAmount: number;
  achievedAmount: number;
  valueAchievementPercent: number;
  visitTarget: number;
  visitAchieved: number;
  visitAchievementPercent: number;
  status: "EXCEEDED" | "ON_TRACK" | "AT_RISK" | "BEHIND";
}

export interface TargetAchievementReportData {
  items: TargetAchievementReportItem[];
  totalTargetAmount: number;
  totalAchievedAmount: number;
  overallAchievementPercent: number;
  totalVisitTarget: number;
  totalVisitAchieved: number;
  overallVisitPercent: number;
  chartData: Array<{ label: string; target: number; achieved: number; percent: number }>;
}
