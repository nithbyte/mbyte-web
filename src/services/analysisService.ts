import { apiClient } from "../lib/api-client";

export interface MrAnalysisQuery {
  mrId?: string;
  startDate?: string;
  endDate?: string;
  customerType?: string;
  customerId?: string;
  visitStatus?: string;
  orderStatus?: string;
  productId?: string;
  search?: string;
}

export interface MrAnalysisData {
  mrProfile: {
    id: string;
    employeeCode: string;
    name: string;
    designation?: string | null;
    headquarters?: string | null;
    territoryName?: string | null;
  } | null;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    totalVisits: number;
    completedVisits: number;
    missedVisits: number;
    plannedVisits: number;
    completionRate: number;
    verifiedVisits: number;
    uniqueDoctorsVisited: number;
    uniqueChemistsVisited: number;
    uniqueCustomersVisited: number;
    totalOrders: number;
    totalOrdersAmount: number;
    deliveredOrdersCount: number;
    deliveredOrdersAmount: number;
    pendingOrdersCount: number;
    totalCollections: number;
    totalCollectionsAmount: number;
    totalSamplesDistributed: number;
    totalVisualAidsShown: number;
    totalExpensesClaimed: number;
    approvedExpensesAmount: number;
    dcrTotal: number;
    dcrApprovedCount: number;
    dcrSubmittedCount: number;
    dcrRejectedCount: number;
  };
  doctorsReport: Array<{
    id: string;
    name: string;
    specialty: string;
    address: string;
    customerType: string;
    tier?: string | null;
    totalVisits: number;
    completedVisits: number;
    missedVisits: number;
    lastVisitDate: string | null;
    totalSamplesGiven: number;
    visualAidsCount: number;
    productsDiscussed: string[];
    totalOrdersCount: number;
    totalOrdersAmount: number;
    latestFeedback: string | null;
  }>;
  chemistsReport: Array<{
    id: string;
    name: string;
    address: string;
    totalVisits: number;
    completedVisits: number;
    lastVisitDate: string | null;
    totalOrdersCount: number;
    totalOrdersAmount: number;
    deliveredOrdersAmount: number;
    totalCollectionsAmount: number;
    latestFeedback: string | null;
  }>;
  productsReport: Array<{
    productId: string;
    brandName: string;
    dosageForm?: string | null;
    visitsDetailed: number;
    samplesDistributed: number;
    visualAidSessions: number;
    ordersQuantity: number;
    ordersValue: number;
  }>;
  visits: Array<{
    id: string;
    scheduledDate: string;
    status: string;
    customerType: string;
    customerId: string;
    customerName: string;
    customerSubtitle: string;
    customerAddress: string;
    customerTier?: string | null;
    actualStartTime?: string | null;
    actualEndTime?: string | null;
    durationSeconds?: number | null;
    verificationStatus: string;
    distanceMeters?: number | null;
    isJointVisit: boolean;
    feedbackNotes?: string | null;
    productsDiscussed: Array<{
      productId: string;
      brandName: string;
      dosageForm?: string | null;
      samplesQty: number;
      feedback?: string | null;
    }>;
    visualAidsShown: Array<{
      sessionId: string;
      visualAidId: string;
      title: string;
      type: string;
      productName?: string | null;
      durationSeconds: number;
    }>;
    samplesCount: number;
    ordersCount: number;
    ordersAmount: number;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    customerType: string;
    customerId?: string | null;
    customerName: string;
    createdAt: string;
    totalAmount: number;
    subtotalAmount: number;
    taxAmount: number;
    remarks?: string | null;
    itemsCount: number;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  }>;
  collections: Array<{
    id: string;
    receiptNumber: string;
    customerType: string;
    customerId?: string | null;
    customerName: string;
    amount: number;
    paymentMode: string;
    paymentDate: string;
    referenceNumber?: string | null;
    notes?: string | null;
  }>;
  dcrs: Array<{
    id: string;
    date: string;
    status: string;
    totalPlannedCalls: number;
    totalExecutedCalls: number;
    totalDoctorsVisited: number;
    totalPharmaciesVisited: number;
    totalOrdersAmount: number;
    totalSamplesDistributed: number;
    workStartTime?: string | null;
    workEndTime?: string | null;
    totalWorkDurationMinutes?: number | null;
    reviewComments?: string | null;
    submissionNotes?: string | null;
  }>;
  expenses: Array<{
    id: string;
    claimNumber: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
    totalAmount: number;
  }>;
  filterOptions: {
    doctors: Array<{ id: string; name: string; specialty: string; customerType: string; tier?: string | null }>;
    chemists: Array<{ id: string; name: string; address: string }>;
    products: Array<{ id: string; brandName: string; dosageForm?: string | null }>;
  };
}

export interface CustomerFullHistoryData {
  customer: {
    id: string;
    name: string;
    customerType: string;
    doctorCategory?: string;
    qualification?: string | null;
    specialty?: string | null;
    clinicName?: string | null;
    registrationNo?: string | null;
    visitingHours?: string | null;
    visitFrequency?: number | null;
    subtitle: string;
    address: string;
    phone?: string | null;
    email?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    tier?: string | null;
    territoryId?: string | null;
    territoryName?: string | null;
    approvalStatus?: string | null;
    rejectionReason?: string | null;
    isActive?: boolean;
    createdAt?: string | null;
    createdBy?: { id: string; firstName: string; lastName: string; email?: string } | null;
    reviewedBy?: { id: string; firstName: string; lastName: string; email?: string } | null;
    reviewedAt?: string | null;
  } | null;
  lifetimeSummary: {
    totalVisits: number;
    completedVisits: number;
    firstVisitDate: string | null;
    lastVisitDate: string | null;
    avgDurationMinutes: number;
    totalOrdersCount: number;
    totalOrdersAmount: number;
    deliveredOrdersAmount: number;
    totalCollectionsAmount: number;
    totalSamplesGiven: number;
    totalVisualAidsShown: number;
    uniqueProductsDiscussed: number;
  };
  productsBreakdown: Array<{
    productId: string;
    brandName: string;
    timesDiscussed: number;
    samplesGiven: number;
    orderedQty: number;
    orderedValue: number;
  }>;
  filterOptions?: {
    mrs: Array<{ id: string; name: string; employeeCode: string | null }>;
    products: Array<{ id: string; brandName: string }>;
  };
  visits: Array<{
    id: string;
    mrId: string;
    mrName: string;
    mrEmployeeCode?: string | null;
    scheduledDate: string;
    status: string;
    actualStartTime?: string | null;
    actualEndTime?: string | null;
    durationSeconds?: number | null;
    verificationStatus: string;
    distanceMeters?: number | null;
    isJointVisit: boolean;
    feedbackNotes?: string | null;
    productsDiscussed: Array<{
      productId: string;
      brandName: string;
      dosageForm?: string | null;
      samplesQty: number;
      feedback?: string | null;
    }>;
    visualAidsShown: Array<{
      sessionId: string;
      title: string;
      type: string;
      productName?: string | null;
      durationSeconds: number;
    }>;
    samplesCount: number;
    linkedOrders: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
      status: string;
    }>;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    mrId?: string;
    mrName?: string;
    createdAt: string;
    totalAmount: number;
    remarks?: string | null;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      lineTotal: number;
    }>;
  }>;
  collections: Array<{
    id: string;
    receiptNumber: string;
    mrId?: string;
    mrName?: string;
    amount: number;
    paymentMode: string;
    paymentDate: string;
    referenceNumber?: string | null;
  }>;
}

export const analysisService = {
  async getMrAnalysis(query: MrAnalysisQuery): Promise<MrAnalysisData> {
    const params: Record<string, string> = {};
    if (query.mrId) params.mrId = query.mrId;
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.customerType && query.customerType !== "ALL") params.customerType = query.customerType;
    if (query.customerId && query.customerId !== "ALL") params.customerId = query.customerId;
    if (query.visitStatus && query.visitStatus !== "ALL") params.visitStatus = query.visitStatus;
    if (query.orderStatus && query.orderStatus !== "ALL") params.orderStatus = query.orderStatus;
    if (query.productId && query.productId !== "ALL") params.productId = query.productId;
    if (query.search && query.search.trim()) params.search = query.search.trim();

    return apiClient.get<MrAnalysisData>("/reports/mr-analysis", { params });
  },

  async getCustomerHistory(
    customerType: string,
    customerId: string,
    query: {
      startDate?: string;
      endDate?: string;
      mrId?: string;
      visitStatus?: string;
      productId?: string;
      search?: string;
    } = {},
  ): Promise<CustomerFullHistoryData> {
    const params: Record<string, string> = {};
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.mrId && query.mrId !== "ALL") params.mrId = query.mrId;
    if (query.visitStatus && query.visitStatus !== "ALL") params.visitStatus = query.visitStatus;
    if (query.productId && query.productId !== "ALL") params.productId = query.productId;
    if (query.search && query.search.trim()) params.search = query.search.trim();

    return apiClient.get<CustomerFullHistoryData>(
      `/reports/mr-analysis/customer/${encodeURIComponent(customerType)}/${encodeURIComponent(customerId)}`,
      { params },
    );
  },
};
