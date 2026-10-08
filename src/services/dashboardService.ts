import {
  mockVisits,
  mockOrders,
  mockCollections,
  mockProductPresence,
  mockMRs,
  mockTerritories,
  mockTargets,
  mockDoctors,
} from "../mock";
import type {
  DashboardKPIs,
  ManagerDashboardData,
  TerritoryPerformance,
  AttentionCenterData,
  BelowTargetMRAlert,
  MissedVisitAlert,
  PendingCommercialAlert,
  StockAlert,
  Visit,
} from "../types";
import { fieldForceService } from "./fieldForceService";
import { productService } from "./productService";

interface MockTargetItem {
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

interface MockVisitItem extends Visit {
  scheduledDate?: string;
  scheduledStartTime?: string;
  distanceMeters?: number;
  priority?: string;
}

interface MockPresenceItem {
  id: string;
  organizationId: string;
  mrId?: string;
  auditedByMrId?: string;
  pharmacyId: string;
  pharmacyName: string;
  productId: string;
  productName: string;
  status: string;
  quantity?: number;
}

export const dashboardService = {
  async getKPIs(territoryId?: string): Promise<DashboardKPIs> {
    const today = "2026-10-08";

    // 1. Filter MRs by territory if specified
    const filteredMRs =
      territoryId && territoryId !== "ALL"
        ? mockMRs.filter((m) => m.territoryId === territoryId)
        : mockMRs;

    const mrIds = new Set(filteredMRs.map((m) => m.id));

    // 2. Filter Visits for today
    const rawVisits = mockVisits as unknown as MockVisitItem[];
    const todayVisits = rawVisits.filter(
      (v) => (v.scheduledDate === today || v.plannedDate === today) && mrIds.has(v.mrId)
    );

    const plannedToday = todayVisits.length;
    const completedToday = todayVisits.filter((v) => v.status === "COMPLETED").length;
    const inProgressToday = todayVisits.filter((v) => v.status === "IN_PROGRESS").length;
    const missedToday = todayVisits.filter((v) => v.status === "MISSED").length;

    const verifiedGpsCount = todayVisits.filter(
      (v) => v.verificationStatus === "VERIFIED" || (v.distanceMeters != null && v.distanceMeters <= 50)
    ).length;
    const outsideRadiusCount = todayVisits.filter(
      (v) => v.verificationStatus === "OUTSIDE_RADIUS" || (v.distanceMeters != null && v.distanceMeters > 50)
    ).length;

    const complianceRate =
      plannedToday > 0 ? Math.round((completedToday / plannedToday) * 100) : 0;
    const totalGpsAudited = verifiedGpsCount + outsideRadiusCount;
    const gpsComplianceRate =
      totalGpsAudited > 0
        ? Math.round((verifiedGpsCount / totalGpsAudited) * 100)
        : 100;

    // 3. Field Force Live Statuses
    let inFieldNow = 0;
    let concludedToday = 0;
    let travelingNow = 0;
    let idleNow = 0;

    filteredMRs.forEach((mr) => {
      const repVisits = todayVisits.filter((v) => v.mrId === mr.id);
      const repCompleted = repVisits.filter((v) => v.status === "COMPLETED").length;
      const repInProgress = repVisits.find((v) => v.status === "IN_PROGRESS");

      if (repInProgress) {
        inFieldNow++;
      } else if (repCompleted === repVisits.length && repVisits.length > 0) {
        concludedToday++;
      } else if (repCompleted > 0) {
        travelingNow++;
      } else {
        idleNow++;
      }
    });

    // 4. Commercial orders & collections
    const relevantOrders = mockOrders.filter((o) => mrIds.has(o.mrId));
    const totalOrderValue = relevantOrders.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const pendingOrders = relevantOrders.filter(
      (o) => o.status === "SUBMITTED" || o.status === "DRAFT" || o.status === "ACCEPTED"
    );
    const pendingOrdersValue = pendingOrders.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const relevantCollections = mockCollections.filter((c) => mrIds.has(c.mrId));
    const totalCollectionsValue = relevantCollections.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // Group collections by payment mode
    const modes = ["UPI", "CHEQUE", "BANK_TRANSFER", "CASH"] as const;
    const collectionsByMode = modes.map((mode) => {
      const modeItems = relevantCollections.filter((c) => c.paymentMode === mode);
      const amount = modeItems.reduce((acc, c) => acc + c.amount, 0);
      const percentage =
        totalCollectionsValue > 0
          ? Math.round((amount / totalCollectionsValue) * 100)
          : 0;
      return {
        mode,
        count: modeItems.length,
        amount,
        percentage,
      };
    });

    // 5. Product Availability & Stock Presence
    const rawPresence = mockProductPresence as unknown as MockPresenceItem[];
    const relevantAudits = rawPresence.filter(
      (p) => mrIds.has(p.auditedByMrId || p.mrId || "")
    );
    const auditsToUse = relevantAudits.length > 0 ? relevantAudits : rawPresence;

    const availableCount = auditsToUse.filter((p) => p.status === "AVAILABLE").length;
    const lowStockCount = auditsToUse.filter((p) => p.status === "LOW_STOCK").length;
    const outOfStockCount = auditsToUse.filter((p) => p.status === "OUT_OF_STOCK").length;
    const totalAudits = auditsToUse.length || 1;
    const availabilityRate = Math.round((availableCount / totalAudits) * 100);

    // Top stockout products
    const stockoutProductCounts: Record<string, number> = {};
    auditsToUse
      .filter((p) => p.status === "OUT_OF_STOCK")
      .forEach((p) => {
        stockoutProductCounts[p.productName] = (stockoutProductCounts[p.productName] || 0) + 1;
      });

    const topStockoutProducts = Object.entries(stockoutProductCounts)
      .map(([productName, stockoutCount]) => ({ productName, stockoutCount }))
      .sort((a, b) => b.stockoutCount - a.stockoutCount)
      .slice(0, 5);

    // 6. Monthly Targets & Achievement
    const rawTargets = mockTargets as unknown as MockTargetItem[];
    const filteredTargets = rawTargets.filter((t) => mrIds.has(t.mrId));
    const monthlyTargetTotal = filteredTargets.reduce(
      (sum, t) => sum + (t.targetAmount || 450000),
      0
    );
    const monthlyAchievedTotal = filteredTargets.reduce(
      (sum, t) => sum + (t.achievedAmount || 0),
      0
    );
    const overallAchievementRate =
      monthlyTargetTotal > 0
        ? Math.round((monthlyAchievedTotal / monthlyTargetTotal) * 100)
        : 0;

    // Day 8 of 31 days in October -> Benchmark is ~25.8%
    const benchmarkRate = 26;
    const pacingStatus =
      overallAchievementRate >= benchmarkRate + 5
        ? "AHEAD"
        : overallAchievementRate >= benchmarkRate - 5
        ? "ON_TRACK"
        : "BEHIND";

    return Promise.resolve({
      date: today,
      fieldForce: {
        total: filteredMRs.length,
        activeToday: filteredMRs.length,
        inFieldNow,
        travelingNow,
        concludedToday,
        idleNow,
      },
      calls: {
        plannedToday,
        completedToday,
        inProgressToday,
        missedToday,
        verifiedGpsCount,
        outsideRadiusCount,
        complianceRate,
        gpsComplianceRate,
      },
      commercial: {
        ordersBookedCount: relevantOrders.length,
        totalOrderValue,
        pendingOrdersCount: pendingOrders.length,
        pendingOrdersValue,
        collectionsCount: relevantCollections.length,
        totalCollectionsValue,
        collectionsByMode,
      },
      inventory: {
        auditsToday: auditsToUse.length,
        availableCount,
        lowStockCount,
        outOfStockCount,
        availabilityRate,
        topStockoutProducts,
      },
      targets: {
        monthlyTargetTotal,
        monthlyAchievedTotal,
        overallAchievementRate,
        benchmarkRate,
        pacingStatus,
      },
    });
  },

  async getAttentionCenter(territoryId?: string): Promise<AttentionCenterData> {
    const today = "2026-10-08";
    const filteredMRs =
      territoryId && territoryId !== "ALL"
        ? mockMRs.filter((m) => m.territoryId === territoryId)
        : mockMRs;

    const mrIds = new Set(filteredMRs.map((m) => m.id));

    // 1. Below-target MRs
    const belowTargetMRs: BelowTargetMRAlert[] = [];
    const rawTargets = mockTargets as unknown as MockTargetItem[];
    const targets = rawTargets.filter((t) => mrIds.has(t.mrId));
    const rawVisits = mockVisits as unknown as MockVisitItem[];

    filteredMRs.forEach((mr) => {
      const tgt = targets.find((t) => t.mrId === mr.id);
      const targetAmount = tgt?.targetAmount || 450000;
      const achievedAmount = tgt?.achievedAmount || 0;
      const achievementPercent = Math.round((achievedAmount / targetAmount) * 100);

      const repVisits = rawVisits.filter(
        (v) => (v.scheduledDate === today || v.plannedDate === today) && v.mrId === mr.id
      );
      const completedToday = repVisits.filter((v) => v.status === "COMPLETED").length;
      const plannedToday = repVisits.length || 10;

      // Flag if achievement < 44% or completed visits < 5
      if (achievementPercent < 44 || completedToday < 5) {
        const territory = mockTerritories.find((t) => t.id === mr.territoryId);
        const mrName = mr.user
          ? `${mr.user.firstName} ${mr.user.lastName}`
          : mr.employeeCode || mr.id;

        belowTargetMRs.push({
          mrId: mr.id,
          mrName,
          territoryName: territory?.name || mr.territoryId,
          monthlyTarget: targetAmount,
          monthlyAchieved: achievedAmount,
          achievementPercent,
          callsCompletedToday: completedToday,
          callsPlannedToday: plannedToday,
          severity: achievementPercent < 42 ? "HIGH" : "MEDIUM",
          shortfallAmount: targetAmount - achievedAmount,
        });
      }
    });

    // 2. Missed Visits
    const missedVisits: MissedVisitAlert[] = [];
    rawVisits
      .filter((v) => (v.scheduledDate === today || v.plannedDate === today) && mrIds.has(v.mrId))
      .filter((v) => v.status === "MISSED")
      .forEach((v) => {
        const mr = mockMRs.find((m) => m.id === v.mrId);
        const territory = mockTerritories.find((t) => t.id === mr?.territoryId);
        const doc = mockDoctors.find((d) => d.id === v.customerId);

        missedVisits.push({
          id: v.id,
          doctorName: v.customerName || doc?.name || "Doctor",
          specialty: doc?.specialty || "Clinic",
          mrName: mr?.user ? `${mr.user.firstName} ${mr.user.lastName}` : v.mrId,
          territoryName: territory?.name || "Tamil Nadu",
          scheduledTime: v.scheduledStartTime || "11:00 AM",
          priority: v.priority || "NORMAL",
        });
      });

    // 3. Critical Stockouts
    const criticalStockouts: StockAlert[] = await productService.getLowStockAlerts(6);

    // 4. Pending Commercial Items (Orders submitted or cheques waiting)
    const pendingCommercial: PendingCommercialAlert[] = [];

    mockOrders
      .filter((o) => mrIds.has(o.mrId) && (o.status === "SUBMITTED" || o.status === "DRAFT"))
      .slice(0, 4)
      .forEach((o) => {
        const mr = mockMRs.find((m) => m.id === o.mrId);
        pendingCommercial.push({
          id: o.id,
          type: "ORDER",
          identifier: o.orderNumber,
          customerName: o.pharmacyName,
          mrName: mr?.user ? `${mr.user.firstName} ${mr.user.lastName}` : o.mrId,
          amount: o.totalAmount,
          status: o.status,
          date: o.orderDate,
          actionRequired: "Review & Accept for Stockist Dispatch",
        });
      });

    mockCollections
      .filter((c) => mrIds.has(c.mrId) && c.paymentMode === "CHEQUE")
      .slice(0, 3)
      .forEach((c) => {
        const mr = mockMRs.find((m) => m.id === c.mrId);
        pendingCommercial.push({
          id: c.id,
          type: "COLLECTION",
          identifier: c.receiptNumber,
          customerName: c.pharmacyName,
          mrName: mr?.user ? `${mr.user.firstName} ${mr.user.lastName}` : c.mrId,
          amount: c.amount,
          status: "CHEQUE PENDING",
          date: c.paymentDate,
          actionRequired: `Verify Bank Clearance (${c.referenceNumber || "Chq"})`,
        });
      });

    const totalAlertsCount =
      belowTargetMRs.length +
      missedVisits.length +
      criticalStockouts.length +
      pendingCommercial.length;

    return Promise.resolve({
      totalAlertsCount,
      belowTargetMRs,
      missedVisits,
      criticalStockouts,
      pendingCommercial,
    });
  },

  async getTerritoryPerformance(): Promise<TerritoryPerformance[]> {
    const today = "2026-10-08";
    const rawVisits = mockVisits as unknown as MockVisitItem[];
    const rawPresence = mockProductPresence as unknown as MockPresenceItem[];

    return Promise.resolve(
      mockTerritories.map((territory) => {
        const territoryMRs = mockMRs.filter((m) => m.territoryId === territory.id);
        const mrIds = new Set(territoryMRs.map((m) => m.id));

        const territoryVisits = rawVisits.filter(
          (v) => (v.scheduledDate === today || v.plannedDate === today) && mrIds.has(v.mrId)
        );
        const callsPlanned = territoryVisits.length;
        const callsCompleted = territoryVisits.filter((v) => v.status === "COMPLETED").length;
        const complianceRate =
          callsPlanned > 0 ? Math.round((callsCompleted / callsPlanned) * 100) : 0;

        const territoryOrders = mockOrders.filter((o) => mrIds.has(o.mrId));
        const orderValue = territoryOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        const territoryCollections = mockCollections.filter((c) => mrIds.has(c.mrId));
        const collectionsValue = territoryCollections.reduce(
          (sum, c) => sum + c.amount,
          0
        );

        // Stock health in territory
        const territoryAudits = rawPresence.filter((p) => mrIds.has(p.mrId || ""));
        const availableCount = territoryAudits.filter((p) => p.status === "AVAILABLE").length;
        const stockHealthRate =
          territoryAudits.length > 0
            ? Math.round((availableCount / territoryAudits.length) * 100)
            : 70;

        return {
          territoryId: territory.id,
          territoryName: territory.name,
          totalMRs: territoryMRs.length,
          callsPlanned,
          callsCompleted,
          complianceRate,
          orderValue,
          collectionsValue,
          stockHealthRate,
        };
      })
    );
  },

  async getManagerDashboard(territoryId?: string): Promise<ManagerDashboardData> {
    const [kpis, territorySummary, fieldForceSummary, stockAlerts, attentionCenter] =
      await Promise.all([
        this.getKPIs(territoryId),
        this.getTerritoryPerformance(),
        fieldForceService.getFieldForce(territoryId),
        productService.getLowStockAlerts(6),
        this.getAttentionCenter(territoryId),
      ]);

    const rawVisits = mockVisits as unknown as MockVisitItem[];
    const recentVisits = rawVisits
      .filter((v) => v.scheduledDate === "2026-10-08" || v.plannedDate === "2026-10-08")
      .slice(0, 8);

    const recentOrders = [...mockOrders]
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 6);

    const recentCollections = [...mockCollections]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .slice(0, 6);

    return {
      kpis,
      territorySummary,
      fieldForceSummary,
      recentVisits,
      recentOrders,
      recentCollections,
      stockAlerts,
      attentionCenter,
    };
  },
};
