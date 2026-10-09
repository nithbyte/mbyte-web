import { apiClient } from "../lib/api-client";
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
import { visitService } from "./visitService";
import { orderService } from "./orderService";
import { collectionService } from "./collectionService";
import { territoryService } from "./territoryService";

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
    const today = "2026-10-09";

    try {
      const [dashSummary, fieldForce, visits, orders, collections, alerts] = await Promise.all([
        apiClient.get<any>("/reports/dashboard", {
          params: { territoryId: territoryId !== "ALL" ? territoryId : undefined },
        }).catch(() => null),
        fieldForceService.getFieldForce(territoryId),
        visitService.getVisits({
          territoryId: territoryId !== "ALL" ? territoryId : undefined,
          limit: 100,
        }),
        orderService.getOrders({
          territoryId: territoryId !== "ALL" ? territoryId : undefined,
          limit: 100,
        }),
        collectionService.getCollections({
          territoryId: territoryId !== "ALL" ? territoryId : undefined,
          limit: 100,
        }),
        productService.getLowStockAlerts(10),
      ]);

      const plannedToday = visits.length;
      const completedToday = visits.filter((v) => v.status === "COMPLETED").length;
      const inProgressToday = visits.filter((v) => v.status === "IN_PROGRESS").length;
      const missedToday = visits.filter((v) => v.status === "MISSED").length;

      const verifiedGpsCount = visits.filter((v) => v.verificationStatus === "VERIFIED").length;
      const outsideRadiusCount = visits.filter((v) => v.verificationStatus === "OUTSIDE_RADIUS").length;
      const complianceRate =
        plannedToday > 0 ? Math.round((completedToday / plannedToday) * 100) : 0;
      const totalGpsAudited = verifiedGpsCount + outsideRadiusCount;
      const gpsComplianceRate =
        totalGpsAudited > 0 ? Math.round((verifiedGpsCount / totalGpsAudited) * 100) : 100;

      const inFieldNow = fieldForce.filter((m) => m.status === "IN_FIELD").length;
      const concludedToday = fieldForce.filter((m) => m.status === "COMPLETED").length;
      const travelingNow = fieldForce.filter((m) => m.status === "ACTIVE").length;
      const idleNow = fieldForce.filter((m) => m.status === "IDLE").length;

      const totalOrderValue = Math.round(orders.reduce((sum, o) => sum + o.totalAmount, 0));
      const pendingOrders = orders.filter((o) => o.status === "SUBMITTED" || o.status === "DRAFT");
      const pendingOrdersValue = Math.round(pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0));

      const totalCollectionsValue = Math.round(collections.reduce((sum, c) => sum + c.amount, 0));
      const modes = ["UPI", "CHEQUE", "BANK_TRANSFER", "CASH"] as const;
      const collectionsByMode = modes.map((mode) => {
        const modeItems = collections.filter((c) => c.paymentMode === mode);
        const amount = Math.round(modeItems.reduce((acc, c) => acc + c.amount, 0));
        const percentage =
          totalCollectionsValue > 0 ? Math.round((amount / totalCollectionsValue) * 100) : 0;
        return { mode, count: modeItems.length, amount, percentage };
      });

      const availableCount = Math.max(1, 20 - alerts.length);
      const lowStockCount = alerts.filter((a) => a.status === "LOW_STOCK").length;
      const outOfStockCount = alerts.filter((a) => a.status === "OUT_OF_STOCK").length;
      const auditsToday = availableCount + lowStockCount + outOfStockCount;
      const availabilityRate = Math.round((availableCount / auditsToday) * 100);

      const topStockoutProducts = alerts.slice(0, 5).map((a) => ({
        productName: a.productName,
        stockoutCount: 1,
      }));

      const monthlyTargetTotal = dashSummary?.targets?.targetAmount || 450000;
      const monthlyAchievedTotal = dashSummary?.targets?.achievedAmount || 182500;
      const overallAchievementRate =
        monthlyTargetTotal > 0 ? Math.round((monthlyAchievedTotal / monthlyTargetTotal) * 100) : 0;
      const benchmarkRate = 26;
      const pacingStatus =
        overallAchievementRate >= benchmarkRate + 5
          ? "AHEAD"
          : overallAchievementRate >= benchmarkRate - 5
          ? "ON_TRACK"
          : "BEHIND";

      return {
        date: today,
        fieldForce: {
          total: fieldForce.length,
          activeToday: fieldForce.length,
          inFieldNow,
          travelingNow,
          concludedToday,
          idleNow,
        },
        calls: {
          plannedToday: dashSummary?.visits?.total || plannedToday,
          completedToday: dashSummary?.visits?.completed || completedToday,
          inProgressToday,
          missedToday,
          verifiedGpsCount: dashSummary?.visits?.verified || verifiedGpsCount,
          outsideRadiusCount,
          complianceRate: Math.round(dashSummary?.visits?.completionRate || complianceRate),
          gpsComplianceRate,
        },
        commercial: {
          ordersBookedCount: dashSummary?.sales?.totalOrders || orders.length,
          totalOrderValue: Math.round(dashSummary?.sales?.totalRevenue || totalOrderValue),
          pendingOrdersCount: pendingOrders.length,
          pendingOrdersValue,
          collectionsCount: dashSummary?.collections?.totalReceipts || collections.length,
          totalCollectionsValue: Math.round(dashSummary?.collections?.totalCollected || totalCollectionsValue),
          collectionsByMode,
        },
        inventory: {
          auditsToday,
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
      };
    } catch (err) {
      console.warn("Failed to fetch KPIs from real APIs, falling back to mock:", err);
    }

    // Fallback to mock
    const filteredMRs =
      territoryId && territoryId !== "ALL"
        ? mockMRs.filter((m) => m.territoryId === territoryId)
        : mockMRs;

    const mrIds = new Set(filteredMRs.map((m) => m.id));
    const rawVisits = mockVisits as unknown as MockVisitItem[];
    const todayVisits = rawVisits.filter(
      (v) => (v.scheduledDate === "2026-10-08" || v.plannedDate === "2026-10-08") && mrIds.has(v.mrId)
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

    const benchmarkRate = 26;
    const pacingStatus =
      overallAchievementRate >= benchmarkRate + 5
        ? "AHEAD"
        : overallAchievementRate >= benchmarkRate - 5
        ? "ON_TRACK"
        : "BEHIND";

    return Promise.resolve({
      date: "2026-10-08",
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
    try {
      const [mrList, visits, criticalStockouts, orders, collections] = await Promise.all([
        fieldForceService.getMRList({ territoryId }),
        visitService.getVisits({ territoryId, limit: 100 }),
        productService.getLowStockAlerts(6),
        orderService.getOrders({ territoryId, limit: 100 }),
        collectionService.getCollections({ territoryId, limit: 100 }),
      ]);

      const belowTargetMRs: BelowTargetMRAlert[] = mrList
        .filter((mr) => mr.achievementRate < 44 || (mr.todayVisits && mr.todayVisits.completed < 5))
        .map((mr) => ({
          mrId: mr.id,
          mrName: mr.name,
          territoryName: mr.territoryName,
          monthlyTarget: mr.monthlyTarget,
          monthlyAchieved: mr.monthlyAchieved,
          achievementPercent: mr.achievementRate,
          callsCompletedToday: mr.todayVisits?.completed || 0,
          callsPlannedToday: mr.todayVisits?.planned || 10,
          severity: mr.achievementRate < 42 ? "HIGH" : "MEDIUM",
          shortfallAmount: Math.max(0, mr.monthlyTarget - mr.monthlyAchieved),
        }));

      const missedVisits: MissedVisitAlert[] = visits
        .filter((v) => v.status === "MISSED")
        .map((v) => ({
          id: v.id,
          doctorName: v.customerName,
          specialty: "Clinic",
          mrName: v.mrName || "Medical Representative",
          territoryName: (v as any).territoryName || "Chennai Central",
          scheduledTime: (v as any).scheduledStartTime || "11:00 AM",
          priority: "NORMAL",
        }));

      const pendingCommercial: PendingCommercialAlert[] = [];

      orders
        .filter((o) => o.status === "SUBMITTED" || o.status === "DRAFT")
        .slice(0, 4)
        .forEach((o) => {
          pendingCommercial.push({
            id: o.id,
            type: "ORDER",
            identifier: o.orderNumber,
            customerName: o.pharmacyName,
            mrName: o.mrName || "MR",
            amount: o.totalAmount,
            status: o.status,
            date: o.orderDate,
            actionRequired: "Review & Accept for Stockist Dispatch",
          });
        });

      collections
        .filter((c) => c.paymentMode === "CHEQUE")
        .slice(0, 3)
        .forEach((c) => {
          pendingCommercial.push({
            id: c.id,
            type: "COLLECTION",
            identifier: c.receiptNumber,
            customerName: c.pharmacyName,
            mrName: c.mrName || "MR",
            amount: c.amount,
            status: "CHEQUE PENDING",
            date: c.paymentDate,
            actionRequired: `Verify Bank Clearance (${c.referenceNumber || "Chq"})`,
          });
        });

      const totalAlertsCount =
        belowTargetMRs.length + missedVisits.length + criticalStockouts.length + pendingCommercial.length;

      return {
        totalAlertsCount,
        belowTargetMRs,
        missedVisits,
        criticalStockouts,
        pendingCommercial,
      };
    } catch {
      // Fallback
    }

    const today = "2026-10-08";
    const filteredMRs =
      territoryId && territoryId !== "ALL"
        ? mockMRs.filter((m) => m.territoryId === territoryId)
        : mockMRs;

    const mrIds = new Set(filteredMRs.map((m) => m.id));

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

    const criticalStockouts: StockAlert[] = await productService.getLowStockAlerts(6);

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
    try {
      const [territories, mrList, visits, orders, collections] = await Promise.all([
        territoryService.getTerritories(),
        fieldForceService.getMRList(),
        visitService.getVisits({ limit: 100 }),
        orderService.getOrders({ limit: 100 }),
        collectionService.getCollections({ limit: 100 }),
      ]);

      if (territories && territories.length > 0) {
        return territories.map((territory) => {
          const territoryMRs = mrList.filter((m) => m.territoryId === territory.id);
          const territoryVisits = visits.filter((v) => (v as any).territoryId === territory.id);
          const callsPlanned = territoryVisits.length;
          const callsCompleted = territoryVisits.filter((v) => v.status === "COMPLETED").length;
          const complianceRate = callsPlanned > 0 ? Math.round((callsCompleted / callsPlanned) * 100) : 85;

          const territoryOrders = orders.filter((o) => o.territoryId === territory.id);
          const orderValue = Math.round(territoryOrders.reduce((sum, o) => sum + o.totalAmount, 0));

          const territoryCollections = collections.filter((c) => c.territoryId === territory.id);
          const collectionsValue = Math.round(territoryCollections.reduce((sum, c) => sum + c.amount, 0));

          return {
            territoryId: territory.id,
            territoryName: territory.name,
            totalMRs: territoryMRs.length || 1,
            callsPlanned: callsPlanned || 15,
            callsCompleted: callsCompleted || 12,
            complianceRate,
            orderValue,
            collectionsValue,
            stockHealthRate: 92,
          };
        });
      }
    } catch {
      // Fallback
    }

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
    const [kpis, territorySummary, fieldForceSummary, stockAlerts, attentionCenter, recentVisits, recentOrders, recentCollections] =
      await Promise.all([
        this.getKPIs(territoryId),
        this.getTerritoryPerformance(),
        fieldForceService.getFieldForce(territoryId),
        productService.getLowStockAlerts(6),
        this.getAttentionCenter(territoryId),
        visitService.getVisits({ territoryId, limit: 8 }),
        orderService.getRecentOrders(6),
        collectionService.getRecentCollections(6),
      ]);

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
