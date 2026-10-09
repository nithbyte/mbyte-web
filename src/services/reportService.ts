import { apiClient } from "../lib/api-client";
import {
  mockVisits,
  mockMRs,
  mockOrders,
  mockCollections,
  mockProductPresence,
  mockProducts,
  mockProductCategories,
  mockTargets,
  mockTerritories,
} from "../mock";
import type {
  ReportFilterParams,
  VisitReportData,
  VisitReportItem,
  MRPerformanceReportData,
  MRPerformanceReportItem,
  ProductPresenceReportData,
  ProductPresenceReportItem,
  SalesReportData,
  SalesReportItem,
  CollectionReportData,
  CollectionReportItem,
  TargetAchievementReportData,
  TargetAchievementReportItem,
} from "../types";
import { visitService } from "./visitService";

interface RawMRItem {
  id: string;
  employeeCode?: string;
  territoryId?: string;
  dailyCallGoal?: number;
  monthlyTargetAmount?: number;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

interface RawTargetItem {
  id: string;
  organizationId: string;
  mrId: string;
  territoryId: string;
  year: number;
  month: number;
  targetAmount: number;
  achievedAmount: number;
  visitTarget?: number;
  visitAchieved?: number;
  dailyCallGoal?: number;
  todayCompletedVisits?: number;
}

export const reportService = {
  // 1. VISIT REPORT
  async getVisitReport(filters?: ReportFilterParams): Promise<VisitReportData> {
    try {
      const queryParams: Record<string, any> = {};
      if (filters?.territoryId && filters.territoryId !== "ALL") queryParams.territoryId = filters.territoryId;
      if (filters?.mrId && filters.mrId !== "ALL") queryParams.mrId = filters.mrId;
      if (filters?.date && filters.date !== "ALL") {
        queryParams.startDate = filters.date;
        queryParams.endDate = filters.date;
      }

      const [summaryData, visits] = await Promise.all([
        apiClient.get<any>("/reports/visit-summary", { params: queryParams }),
        visitService.getVisits({
          territoryId: filters?.territoryId,
          mrId: filters?.mrId,
          date: filters?.date !== "ALL" ? filters?.date : undefined,
          limit: 100,
        }),
      ]);

      if (summaryData && (summaryData.totalVisits != null || visits.length > 0)) {
        const totalVisits = summaryData.totalVisits || visits.length;
        const completedVisits = summaryData.completed != null ? summaryData.completed : visits.filter((v) => v.status === "COMPLETED").length;
        const inProgressVisits = summaryData.inProgress != null ? summaryData.inProgress : visits.filter((v) => v.status === "IN_PROGRESS").length;
        const missedVisits = summaryData.missed != null ? summaryData.missed : visits.filter((v) => v.status === "MISSED").length;
        const cancelledVisits = summaryData.cancelled != null ? summaryData.cancelled : visits.filter((v) => v.status === "CANCELLED").length;
        const gpsVerifiedPercent = summaryData.verificationRate != null ? Math.round(summaryData.verificationRate) : 95;

        const items: VisitReportItem[] = visits.map((v) => ({
          id: v.id,
          date: v.plannedDate || (v as any).scheduledDate || "2026-10-09",
          time: (v as any).scheduledStartTime || "09:00 AM",
          mrName: v.mrName || "Field Representative",
          mrEmployeeCode: (v as any).employeeCode || "EMP-MR-001",
          customerName: v.customerName,
          customerType: v.customerType,
          territoryName: (v as any).territoryName || "Chennai Central",
          status: v.status,
          verificationStatus: v.verificationStatus,
          distanceMeters: v.distanceMeters,
          outcomeNotes: (v as any).doctorFeedback || (v as any).feedbackNotes || "Detailing completed successfully.",
          productsDiscussedCount: v.productsDiscussed?.length || 1,
        }));

        const chartData = [
          { label: "Completed", count: completedVisits, color: "bg-emerald-500" },
          { label: "In Progress", count: inProgressVisits, color: "bg-sky-500" },
          { label: "Planned", count: Math.max(0, totalVisits - completedVisits - inProgressVisits - missedVisits - cancelledVisits), color: "bg-indigo-500" },
          { label: "Missed", count: missedVisits, color: "bg-amber-500" },
          { label: "Cancelled", count: cancelledVisits, color: "bg-rose-500" },
        ];

        return {
          items,
          totalVisits,
          completedVisits,
          inProgressVisits,
          missedVisits,
          cancelledVisits,
          gpsVerifiedPercent,
          chartData,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch visit report from API, falling back to mock:", err);
    }

    // Fallback to mock
    let list = [...mockVisits];

    if (filters?.date && filters.date !== "ALL") {
      list = list.filter((v) => (v.scheduledDate || v.plannedDate) === filters.date);
    }

    if (filters?.territoryId && filters.territoryId !== "ALL") {
      list = list.filter((v) => v.territoryId === filters.territoryId);
    }

    if (filters?.mrId && filters.mrId !== "ALL") {
      list = list.filter((v) => v.mrId === filters.mrId);
    }

    if (filters?.productId && filters.productId !== "ALL") {
      const pId = filters.productId;
      list = list.filter(
        (v) =>
          v.visitProducts?.some((p) => p.productId === pId) ||
          v.productsDiscussed?.includes(pId)
      );
    }

    const totalVisits = list.length;
    let completedVisits = 0;
    let inProgressVisits = 0;
    let missedVisits = 0;
    let cancelledVisits = 0;
    let plannedVisits = 0;
    let verifiedCount = 0;

    const items: VisitReportItem[] = list.map((v) => {
      if (v.status === "COMPLETED") completedVisits++;
      else if (v.status === "IN_PROGRESS" || v.status === "LOCATION_VERIFIED") inProgressVisits++;
      else if (v.status === "MISSED") missedVisits++;
      else if (v.status === "CANCELLED") cancelledVisits++;
      else if (v.status === "PLANNED") plannedVisits++;

      if (v.verificationStatus === "VERIFIED") verifiedCount++;

      return {
        id: v.id,
        date: v.scheduledDate || v.plannedDate,
        time: v.scheduledStartTime || v.plannedStartTime || "09:00 AM",
        mrName: v.mrName || "Field Representative",
        mrEmployeeCode: v.employeeCode || "NP-MR-101",
        customerName: v.customerName,
        customerType: v.customerType,
        territoryName: v.territoryName || "Madurai North",
        status: v.status,
        verificationStatus: v.verificationStatus,
        distanceMeters: v.distanceMeters ?? v.distanceFromRegisteredMeters,
        outcomeNotes: v.doctorFeedback || v.feedbackNotes || "Detailing completed successfully.",
        productsDiscussedCount: v.visitProducts?.length || 1,
      };
    });

    const gpsVerifiedPercent =
      totalVisits > 0 ? Math.round((verifiedCount / totalVisits) * 100) : 100;

    const chartData = [
      { label: "Completed", count: completedVisits, color: "bg-emerald-500" },
      { label: "In Progress", count: inProgressVisits, color: "bg-sky-500" },
      { label: "Planned", count: plannedVisits, color: "bg-indigo-500" },
      { label: "Missed", count: missedVisits, color: "bg-amber-500" },
      { label: "Cancelled", count: cancelledVisits, color: "bg-rose-500" },
    ];

    return Promise.resolve({
      items,
      totalVisits,
      completedVisits,
      inProgressVisits,
      missedVisits,
      cancelledVisits,
      gpsVerifiedPercent,
      chartData,
    });
  },

  // 2. MR PERFORMANCE REPORT
  async getMRPerformanceReport(filters?: ReportFilterParams): Promise<MRPerformanceReportData> {
    try {
      const queryParams: Record<string, any> = { year: 2026, month: 10 };
      if (filters?.territoryId && filters.territoryId !== "ALL") queryParams.territoryId = filters.territoryId;
      if (filters?.mrId && filters.mrId !== "ALL") queryParams.mrId = filters.mrId;

      const raw = await apiClient.get<any>("/reports/mr-performance", { params: queryParams });
      const apiList = Array.isArray(raw) ? raw : (raw as any)?.data || [];

      if (apiList && apiList.length > 0) {
        const items: MRPerformanceReportItem[] = apiList.map((m: any) => ({
          mrId: m.mrId,
          mrName: m.name,
          employeeCode: m.employeeCode,
          territoryName: m.territory || "Chennai Territory",
          dailyCallGoal: 10,
          todayCompletedVisits: m.visits?.completed || 0,
          plannedCalls: m.visits?.total || 10,
          completedCalls: m.visits?.completed || 0,
          callCompliancePercent: Math.round(m.visits?.completionRate || 0),
          ordersBookedCount: m.sales?.ordersCount || 0,
          ordersBookedValue: Math.round(m.sales?.totalSalesAmount || 0),
          collectionsRealizedValue: Math.round(m.collections?.totalCollectedAmount || 0),
          monthlyTargetAmount: Number(m.target?.salesTarget || 450000),
          monthlyAchievedAmount: Number(m.target?.salesAchieved || m.sales?.totalSalesAmount || 0),
          targetAchievementPercent: Math.round(m.target?.salesAchievementRate || 0),
        }));

        const totalMRs = items.length;
        const avgCompliancePercent =
          totalMRs > 0
            ? Math.round(items.reduce((s, m) => s + m.callCompliancePercent, 0) / totalMRs)
            : 0;
        const totalOrdersValue = items.reduce((s, m) => s + m.ordersBookedValue, 0);
        const totalCollectionsValue = items.reduce((s, m) => s + m.collectionsRealizedValue, 0);

        const chartData = items.slice(0, 8).map((m) => ({
          label: m.mrName.split(" ")[0],
          value: m.targetAchievementPercent,
          subLabel: `${m.targetAchievementPercent}%`,
          color: m.targetAchievementPercent >= 80 ? "bg-emerald-500" : "bg-sky-500",
        }));

        return {
          items,
          totalMRs,
          avgCompliancePercent,
          totalOrdersValue,
          totalCollectionsValue,
          chartData,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch MR performance report from API, falling back to mock:", err);
    }

    // Fallback to mock
    const rawMrs = mockMRs as unknown as RawMRItem[];
    const rawTgts = mockTargets as unknown as RawTargetItem[];

    let filteredMrs = rawMrs;

    if (filters?.territoryId && filters.territoryId !== "ALL") {
      filteredMrs = filteredMrs.filter((m) => m.territoryId === filters.territoryId);
    }

    if (filters?.mrId && filters.mrId !== "ALL") {
      filteredMrs = filteredMrs.filter((m) => m.id === filters.mrId);
    }

    const items: MRPerformanceReportItem[] = filteredMrs.map((mr) => {
      const mrFullName = mr.user
        ? `${mr.user.firstName || ""} ${mr.user.lastName || ""}`.trim()
        : "Field Officer";

      const territory = mockTerritories.find((t) => t.id === mr.territoryId);
      const target = rawTgts.find((t) => t.mrId === mr.id && t.month === 10);

      let mrVisits = mockVisits.filter((v) => v.mrId === mr.id);
      if (filters?.date && filters.date !== "ALL") {
        mrVisits = mrVisits.filter((v) => (v.scheduledDate || v.plannedDate) === filters.date);
      }
      const plannedCalls = mrVisits.length;
      const completedCalls = mrVisits.filter((v) => v.status === "COMPLETED").length;
      const callCompliancePercent =
        plannedCalls > 0 ? Math.round((completedCalls / plannedCalls) * 100) : 85;

      let mrOrders = mockOrders.filter((o) => o.mrId === mr.id);
      if (filters?.date && filters.date !== "ALL") {
        mrOrders = mrOrders.filter((o) => o.orderDate === filters.date);
      }
      if (filters?.productId && filters.productId !== "ALL") {
        mrOrders = mrOrders.filter((o) => o.items.some((i) => i.productId === filters.productId));
      }
      const ordersBookedCount = mrOrders.length;
      const ordersBookedValue = Math.round(mrOrders.reduce((sum, o) => sum + o.totalAmount, 0));

      let mrCols = mockCollections.filter((c) => c.mrId === mr.id);
      if (filters?.date && filters.date !== "ALL") {
        mrCols = mrCols.filter((c) => c.paymentDate === filters.date);
      }
      const collectionsRealizedValue = Math.round(mrCols.reduce((sum, c) => sum + c.amount, 0));

      const monthlyTargetAmount = target?.targetAmount || mr.monthlyTargetAmount || 450000;
      const monthlyAchievedAmount = target?.achievedAmount || ordersBookedValue || 185000;
      const targetAchievementPercent =
        monthlyTargetAmount > 0
          ? Math.round((monthlyAchievedAmount / monthlyTargetAmount) * 100)
          : 0;

      return {
        mrId: mr.id,
        mrName: mrFullName,
        employeeCode: mr.employeeCode || "NP-MR-101",
        territoryName: territory?.name || "Madurai North",
        dailyCallGoal: mr.dailyCallGoal || 10,
        todayCompletedVisits: target?.todayCompletedVisits || completedCalls || 4,
        plannedCalls,
        completedCalls,
        callCompliancePercent,
        ordersBookedCount,
        ordersBookedValue,
        collectionsRealizedValue,
        monthlyTargetAmount,
        monthlyAchievedAmount,
        targetAchievementPercent,
      };
    });

    const totalMRs = items.length;
    const avgCompliancePercent =
      totalMRs > 0
        ? Math.round(items.reduce((s, m) => s + m.callCompliancePercent, 0) / totalMRs)
        : 0;
    const totalOrdersValue = items.reduce((s, m) => s + m.ordersBookedValue, 0);
    const totalCollectionsValue = items.reduce((s, m) => s + m.collectionsRealizedValue, 0);

    const chartData = items.slice(0, 8).map((m) => ({
      label: m.mrName.split(" ")[0],
      value: m.targetAchievementPercent,
      subLabel: `${m.targetAchievementPercent}%`,
      color: m.targetAchievementPercent >= 80 ? "bg-emerald-500" : "bg-sky-500",
    }));

    return Promise.resolve({
      items,
      totalMRs,
      avgCompliancePercent,
      totalOrdersValue,
      totalCollectionsValue,
      chartData,
    });
  },

  // 3. PRODUCT PRESENCE REPORT
  async getProductPresenceReport(filters?: ReportFilterParams): Promise<ProductPresenceReportData> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (filters?.territoryId && filters.territoryId !== "ALL") queryParams.territoryId = filters.territoryId;
      if (filters?.mrId && filters.mrId !== "ALL") queryParams.mrId = filters.mrId;
      if (filters?.productId && filters.productId !== "ALL") queryParams.productId = filters.productId;

      const raw = await apiClient.get<any>("/reports/product-presence", { params: queryParams });
      if (raw && (raw.totalAudits != null || (raw.items && raw.items.length > 0))) {
        const totalAudited = raw.totalAudits || (raw.items ? raw.items.length : 0);
        const availableCount = raw.available || 0;
        const lowStockCount = raw.lowStock || 0;
        const outOfStockCount = raw.outOfStock || 0;
        const stockAvailabilityRate = Math.round(raw.availabilityRate || (totalAudited > 0 ? (availableCount / totalAudited) * 100 : 100));

        const items: ProductPresenceReportItem[] = (raw.items || []).map((a: any) => ({
          id: a.id,
          productName: a.product?.name || a.productName || "Product",
          productSku: a.product?.sku || a.productSku || "SKU",
          categoryName: a.product?.category?.name || "Therapeutics",
          pharmacyName: a.customer?.name || a.pharmacyName || "Pharmacy",
          territoryName: a.customer?.territory?.name || a.territoryName || "Chennai Central",
          auditedByMrName: a.mr?.user ? `${a.mr.user.firstName} ${a.mr.user.lastName}` : a.mrName || "Medical Representative",
          status: a.status,
          quantity: a.quantity ?? 0,
          auditedAt: a.auditedAt || a.createdAt || "2026-10-09",
        }));

        const chartData = [
          {
            label: "Available",
            count: availableCount,
            color: "bg-emerald-500",
            percent: totalAudited > 0 ? Math.round((availableCount / totalAudited) * 100) : 0,
          },
          {
            label: "Low Stock",
            count: lowStockCount,
            color: "bg-amber-500",
            percent: totalAudited > 0 ? Math.round((lowStockCount / totalAudited) * 100) : 0,
          },
          {
            label: "Out of Stock",
            count: outOfStockCount,
            color: "bg-rose-500",
            percent: totalAudited > 0 ? Math.round((outOfStockCount / totalAudited) * 100) : 0,
          },
        ];

        return {
          items,
          totalAudited,
          availableCount,
          lowStockCount,
          outOfStockCount,
          stockAvailabilityRate,
          chartData,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch product presence report from API, falling back to mock:", err);
    }

    // Fallback to mock
    let list = [...mockProductPresence];

    if (filters?.productId && filters.productId !== "ALL") {
      list = list.filter((p) => p.productId === filters.productId);
    }

    if (filters?.territoryId && filters.territoryId !== "ALL") {
      list = list.filter((p) => p.territoryId === filters.territoryId);
    }

    if (filters?.mrId && filters.mrId !== "ALL") {
      list = list.filter((p) => p.mrId === filters.mrId || p.auditedByMrId === filters.mrId);
    }

    if (filters?.date && filters.date !== "ALL") {
      list = list.filter((p) => (p.checkedAt || p.auditedAt || "").startsWith(filters.date!));
    }

    let availableCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const items: ProductPresenceReportItem[] = list.map((a) => {
      if (a.status === "AVAILABLE") availableCount++;
      else if (a.status === "LOW_STOCK") lowStockCount++;
      else if (a.status === "OUT_OF_STOCK") outOfStockCount++;

      const prod = mockProducts.find((p) => p.id === a.productId);
      const cat = mockProductCategories.find((c) => c.id === prod?.categoryId);

      return {
        id: a.id,
        productName: a.productName,
        productSku: a.productSku || prod?.sku || "NP-SKU",
        categoryName: cat?.name || "Therapeutics",
        pharmacyName: a.pharmacyName,
        territoryName: a.territoryName || "Madurai North",
        auditedByMrName: a.auditedByMrName || a.mrName || "Field Representative",
        status: a.status,
        quantity: a.currentQuantity ?? a.quantity ?? 0,
        auditedAt: a.checkedAt || a.auditedAt || "2026-10-08",
      };
    });

    const totalAudited = items.length;
    const stockAvailabilityRate =
      totalAudited > 0 ? Math.round((availableCount / totalAudited) * 100) : 100;

    const chartData = [
      {
        label: "Available",
        count: availableCount,
        color: "bg-emerald-500",
        percent: totalAudited > 0 ? Math.round((availableCount / totalAudited) * 100) : 0,
      },
      {
        label: "Low Stock",
        count: lowStockCount,
        color: "bg-amber-500",
        percent: totalAudited > 0 ? Math.round((lowStockCount / totalAudited) * 100) : 0,
      },
      {
        label: "Out of Stock",
        count: outOfStockCount,
        color: "bg-rose-500",
        percent: totalAudited > 0 ? Math.round((outOfStockCount / totalAudited) * 100) : 0,
      },
    ];

    return Promise.resolve({
      items,
      totalAudited,
      availableCount,
      lowStockCount,
      outOfStockCount,
      stockAvailabilityRate,
      chartData,
    });
  },

  // 4. SALES REPORT
  async getSalesReport(filters?: ReportFilterParams): Promise<SalesReportData> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (filters?.territoryId && filters.territoryId !== "ALL") queryParams.territoryId = filters.territoryId;
      if (filters?.mrId && filters.mrId !== "ALL") queryParams.mrId = filters.mrId;

      const raw = await apiClient.get<any>("/reports/orders", { params: queryParams });
      if (raw && (raw.totalOrders != null || (raw.items && raw.items.length > 0))) {
        const totalOrders = raw.totalOrders || (raw.items ? raw.items.length : 0);
        const totalSalesValue = Math.round(raw.totalRevenue || 0);
        const avgOrderValue = Math.round(raw.averageOrderValue || (totalOrders > 0 ? totalSalesValue / totalOrders : 0));

        const items: SalesReportItem[] = (raw.items || []).map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          orderDate: typeof o.orderDate === "string" ? o.orderDate.slice(0, 10) : "2026-10-09",
          customerName: o.customer?.name || o.pharmacyName || "Pharmacy Customer",
          customerAddress: o.customer?.address || "Thousand Lights, Chennai",
          territoryName: o.customer?.territory?.name || o.territoryName || "Chennai Central",
          mrName: o.mr?.user ? `${o.mr.user.firstName} ${o.mr.user.lastName}` : o.mrName || "Medical Representative",
          mrEmployeeCode: o.mr?.employeeCode || o.mrEmployeeCode || "EMP-MR-001",
          distributorName: o.distributor?.name || o.distributorName || "Apollo Distributor",
          status: o.status,
          itemsCount: o.items?.length || 1,
          totalAmount: Number(o.totalAmount || 0),
          topProductNames: (o.items || []).map((i: any) => i.product?.name || i.productName || "Pharma Product"),
        }));

        const topSellingProducts = (raw.topProducts || []).map((p: any) => ({
          productName: p.productName || "Pharma Product",
          quantity: p.quantity || 1,
          revenue: Math.round(p.revenue || 0),
        }));

        const chartData = topSellingProducts.map((p: any) => ({
          label: p.productName.length > 14 ? p.productName.slice(0, 14) + "..." : p.productName,
          value: p.revenue,
          formattedValue: `₹${(p.revenue / 1000).toFixed(1)}k`,
          color: "bg-sky-500",
        }));

        return {
          items,
          totalOrders,
          totalSalesValue,
          avgOrderValue,
          topSellingProducts,
          chartData,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch sales report from API, falling back to mock:", err);
    }

    // Fallback to mock
    let list = [...mockOrders];

    if (filters?.date && filters.date !== "ALL") {
      list = list.filter((o) => o.orderDate === filters.date);
    }

    if (filters?.territoryId && filters.territoryId !== "ALL") {
      list = list.filter((o) => o.territoryId === filters.territoryId);
    }

    if (filters?.mrId && filters.mrId !== "ALL") {
      list = list.filter((o) => o.mrId === filters.mrId);
    }

    if (filters?.productId && filters.productId !== "ALL") {
      list = list.filter((o) => o.items.some((i) => i.productId === filters.productId));
    }

    const prodRevenueMap = new Map<string, { quantity: number; revenue: number }>();

    const items: SalesReportItem[] = list.map((o) => {
      for (const item of o.items) {
        const existing = prodRevenueMap.get(item.productName) || { quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal || item.unitPrice * item.quantity;
        prodRevenueMap.set(item.productName, existing);
      }

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        orderDate: o.orderDate,
        customerName: o.pharmacyName,
        customerAddress: o.customerAddress || "Commercial Road, Madurai",
        territoryName: o.territoryName || "Madurai North",
        mrName: o.mrName || "Field Representative",
        mrEmployeeCode: o.mrEmployeeCode || "NP-MR-101",
        distributorName: o.distributorName || "Sri Ram Pharma Distributors",
        status: o.status,
        itemsCount: o.items?.length || 1,
        totalAmount: o.totalAmount,
        topProductNames: o.items.map((i) => i.productName),
      };
    });

    const totalOrders = items.length;
    const totalSalesValue = Math.round(items.reduce((s, o) => s + o.totalAmount, 0));
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSalesValue / totalOrders) : 0;

    const topSellingProducts = Array.from(prodRevenueMap.entries())
      .map(([productName, data]) => ({
        productName,
        quantity: data.quantity,
        revenue: Math.round(data.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const chartData = topSellingProducts.map((p) => ({
      label: p.productName.length > 14 ? p.productName.slice(0, 14) + "..." : p.productName,
      value: p.revenue,
      formattedValue: `₹${(p.revenue / 1000).toFixed(1)}k`,
      color: "bg-sky-500",
    }));

    return Promise.resolve({
      items,
      totalOrders,
      totalSalesValue,
      avgOrderValue,
      topSellingProducts,
      chartData,
    });
  },

  // 5. COLLECTION REPORT
  async getCollectionReport(filters?: ReportFilterParams): Promise<CollectionReportData> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (filters?.territoryId && filters.territoryId !== "ALL") queryParams.territoryId = filters.territoryId;
      if (filters?.mrId && filters.mrId !== "ALL") queryParams.mrId = filters.mrId;

      const raw = await apiClient.get<any>("/reports/collections", { params: queryParams });
      if (raw && (raw.totalCollections != null || (raw.items && raw.items.length > 0))) {
        const totalReceipts = raw.totalCollections || (raw.items ? raw.items.length : 0);
        const totalCollectedValue = Math.round(raw.totalCollected || 0);

        const modeMap = raw.byPaymentMode || {};
        const upi = Math.round(modeMap.UPI || 0);
        const cheque = Math.round(modeMap.CHEQUE || 0);
        const cash = Math.round(modeMap.CASH || 0);
        const bankTransfer = Math.round(modeMap.BANK_TRANSFER || 0);

        const items: CollectionReportItem[] = (raw.items || []).map((c: any) => ({
          id: c.id,
          receiptNumber: c.receiptNumber,
          paymentDate: typeof c.paymentDate === "string" ? c.paymentDate.slice(0, 10) : "2026-10-09",
          customerName: c.customer?.name || c.pharmacyName || "Pharmacy",
          territoryName: c.customer?.territory?.name || c.territoryName || "Chennai Central",
          mrName: c.mr?.name || (c.mr?.user ? `${c.mr.user.firstName} ${c.mr.user.lastName}` : "Medical Representative"),
          mrEmployeeCode: c.mr?.employeeCode || "EMP-MR-001",
          paymentMode: c.paymentMode,
          referenceNumber: c.referenceNumber || "DIRECT_RECEIPT",
          amount: Number(c.amount || 0),
          notes: c.notes || "Invoice settlement receipt",
        }));

        const chartData = [
          {
            label: "UPI Direct",
            value: upi,
            color: "bg-sky-500",
            percent: totalCollectedValue > 0 ? Math.round((upi / totalCollectedValue) * 100) : 0,
          },
          {
            label: "Bank Transfer",
            value: bankTransfer,
            color: "bg-indigo-500",
            percent: totalCollectedValue > 0 ? Math.round((bankTransfer / totalCollectedValue) * 100) : 0,
          },
          {
            label: "Cheque Clearing",
            value: cheque,
            color: "bg-amber-500",
            percent: totalCollectedValue > 0 ? Math.round((cheque / totalCollectedValue) * 100) : 0,
          },
          {
            label: "Direct Cash",
            value: cash,
            color: "bg-emerald-500",
            percent: totalCollectedValue > 0 ? Math.round((cash / totalCollectedValue) * 100) : 0,
          },
        ];

        return {
          items,
          totalReceipts,
          totalCollectedValue,
          modeBreakdown: { upi, cheque, cash, bankTransfer },
          chartData,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch collection report from API, falling back to mock:", err);
    }

    // Fallback to mock
    let list = [...mockCollections];

    if (filters?.date && filters.date !== "ALL") {
      list = list.filter((c) => c.paymentDate === filters.date);
    }

    if (filters?.territoryId && filters.territoryId !== "ALL") {
      list = list.filter((c) => c.territoryId === filters.territoryId);
    }

    if (filters?.mrId && filters.mrId !== "ALL") {
      list = list.filter((c) => c.mrId === filters.mrId);
    }

    let upi = 0;
    let cheque = 0;
    let cash = 0;
    let bankTransfer = 0;

    const items: CollectionReportItem[] = list.map((c) => {
      if (c.paymentMode === "UPI") upi += c.amount;
      else if (c.paymentMode === "CHEQUE") cheque += c.amount;
      else if (c.paymentMode === "CASH") cash += c.amount;
      else if (c.paymentMode === "BANK_TRANSFER") bankTransfer += c.amount;

      return {
        id: c.id,
        receiptNumber: c.receiptNumber,
        paymentDate: c.paymentDate,
        customerName: c.pharmacyName,
        territoryName: c.territoryName || "Madurai North",
        mrName: c.mrName || "Field Representative",
        mrEmployeeCode: c.mrEmployeeCode || "NP-MR-101",
        paymentMode: c.paymentMode,
        referenceNumber: c.referenceNumber || "DIRECT_CASH",
        amount: c.amount,
        notes: c.notes || "Invoice settlement receipt",
      };
    });

    const totalReceipts = items.length;
    const totalCollectedValue = Math.round(items.reduce((s, c) => s + c.amount, 0));

    const chartData = [
      {
        label: "UPI Direct",
        value: Math.round(upi),
        color: "bg-sky-500",
        percent: totalCollectedValue > 0 ? Math.round((upi / totalCollectedValue) * 100) : 0,
      },
      {
        label: "Bank Transfer",
        value: Math.round(bankTransfer),
        color: "bg-indigo-500",
        percent: totalCollectedValue > 0 ? Math.round((bankTransfer / totalCollectedValue) * 100) : 0,
      },
      {
        label: "Cheque Clearing",
        value: Math.round(cheque),
        color: "bg-amber-500",
        percent: totalCollectedValue > 0 ? Math.round((cheque / totalCollectedValue) * 100) : 0,
      },
      {
        label: "Direct Cash",
        value: Math.round(cash),
        color: "bg-emerald-500",
        percent: totalCollectedValue > 0 ? Math.round((cash / totalCollectedValue) * 100) : 0,
      },
    ];

    return Promise.resolve({
      items,
      totalReceipts,
      totalCollectedValue,
      modeBreakdown: {
        upi: Math.round(upi),
        cheque: Math.round(cheque),
        cash: Math.round(cash),
        bankTransfer: Math.round(bankTransfer),
      },
      chartData,
    });
  },

  // 6. TARGET ACHIEVEMENT REPORT
  async getTargetAchievementReport(filters?: ReportFilterParams): Promise<TargetAchievementReportData> {
    try {
      const queryParams: Record<string, any> = { year: 2026, month: 10 };
      if (filters?.territoryId && filters.territoryId !== "ALL") queryParams.territoryId = filters.territoryId;
      if (filters?.mrId && filters.mrId !== "ALL") queryParams.mrId = filters.mrId;

      const raw = await apiClient.get<any>("/reports/target-achievement", { params: queryParams });
      if (raw && (raw.targets || raw.totalTargetAmount != null)) {
        const totalTargetAmount = Number(raw.totalTargetAmount || 0);
        const totalAchievedAmount = Number(raw.totalAchievedAmount || 0);
        const overallAchievementPercent = Math.round(raw.revenueAchievementRate || 0);
        const totalVisitTarget = Number(raw.totalVisitTarget || 0);
        const totalVisitAchieved = Number(raw.totalVisitAchieved || 0);
        const overallVisitPercent = Math.round(raw.visitAchievementRate || 0);

        const items: TargetAchievementReportItem[] = (raw.targets || []).map((t: any) => {
          const valPct = Math.round(t.achievementRate || 0);
          const visitPct = Math.round(t.visitAchievementRate || 0);

          let status: "EXCEEDED" | "ON_TRACK" | "AT_RISK" | "BEHIND" = "ON_TRACK";
          if (valPct >= 100) status = "EXCEEDED";
          else if (valPct >= 80) status = "ON_TRACK";
          else if (valPct >= 60) status = "AT_RISK";
          else status = "BEHIND";

          return {
            id: t.id,
            mrId: t.mrId,
            mrName: t.mr?.name || "Medical Representative",
            employeeCode: t.mr?.employeeCode || "EMP-MR-001",
            territoryName: t.territory?.name || "Chennai Central",
            monthYear: "October 2026",
            targetAmount: Number(t.targetAmount || 0),
            achievedAmount: Number(t.achievedAmount || 0),
            valueAchievementPercent: valPct,
            visitTarget: Number(t.visitTarget || 0),
            visitAchieved: Number(t.visitAchieved || 0),
            visitAchievementPercent: visitPct,
            status,
          };
        });

        const chartData = items.slice(0, 8).map((t) => ({
          label: t.mrName.split(" ")[0],
          target: t.targetAmount,
          achieved: t.achievedAmount,
          percent: t.valueAchievementPercent,
        }));

        return {
          items,
          totalTargetAmount,
          totalAchievedAmount,
          overallAchievementPercent,
          totalVisitTarget,
          totalVisitAchieved,
          overallVisitPercent,
          chartData,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch target achievement report from API, falling back to mock:", err);
    }

    // Fallback to mock
    const rawTgts = mockTargets as unknown as RawTargetItem[];
    const rawMrs = mockMRs as unknown as RawMRItem[];

    let list = rawTgts.filter((t) => t.month === 10);

    if (filters?.territoryId && filters.territoryId !== "ALL") {
      list = list.filter((t) => t.territoryId === filters.territoryId);
    }

    if (filters?.mrId && filters.mrId !== "ALL") {
      list = list.filter((t) => t.mrId === filters.mrId);
    }

    const items: TargetAchievementReportItem[] = list.map((t) => {
      const mr = rawMrs.find((m) => m.id === t.mrId);
      const mrFullName = mr?.user
        ? `${mr.user.firstName || ""} ${mr.user.lastName || ""}`.trim()
        : "Field Officer";
      const territory = mockTerritories.find((ter) => ter.id === t.territoryId);

      const valPct =
        t.targetAmount > 0 ? Math.round((t.achievedAmount / t.targetAmount) * 100) : 0;
      const visitTgt = t.visitTarget || 220;
      const visitAch = t.visitAchieved || 85;
      const visitPct = visitTgt > 0 ? Math.round((visitAch / visitTgt) * 100) : 0;

      let status: "EXCEEDED" | "ON_TRACK" | "AT_RISK" | "BEHIND" = "ON_TRACK";
      if (valPct >= 100) status = "EXCEEDED";
      else if (valPct >= 80) status = "ON_TRACK";
      else if (valPct >= 60) status = "AT_RISK";
      else status = "BEHIND";

      return {
        id: t.id,
        mrId: t.mrId,
        mrName: mrFullName,
        employeeCode: mr?.employeeCode || "NP-MR-101",
        territoryName: territory?.name || "Madurai North",
        monthYear: "October 2026",
        targetAmount: t.targetAmount,
        achievedAmount: t.achievedAmount,
        valueAchievementPercent: valPct,
        visitTarget: visitTgt,
        visitAchieved: visitAch,
        visitAchievementPercent: visitPct,
        status,
      };
    });

    const totalTargetAmount = items.reduce((s, t) => s + t.targetAmount, 0);
    const totalAchievedAmount = items.reduce((s, t) => s + t.achievedAmount, 0);
    const overallAchievementPercent =
      totalTargetAmount > 0 ? Math.round((totalAchievedAmount / totalTargetAmount) * 100) : 0;

    const totalVisitTarget = items.reduce((s, t) => s + t.visitTarget, 0);
    const totalVisitAchieved = items.reduce((s, t) => s + t.visitAchieved, 0);
    const overallVisitPercent =
      totalVisitTarget > 0 ? Math.round((totalVisitAchieved / totalVisitTarget) * 100) : 0;

    const chartData = items.slice(0, 8).map((t) => ({
      label: t.mrName.split(" ")[0],
      target: t.targetAmount,
      achieved: t.achievedAmount,
      percent: t.valueAchievementPercent,
    }));

    return Promise.resolve({
      items,
      totalTargetAmount,
      totalAchievedAmount,
      overallAchievementPercent,
      totalVisitTarget,
      totalVisitAchieved,
      overallVisitPercent,
      chartData,
    });
  },
};
