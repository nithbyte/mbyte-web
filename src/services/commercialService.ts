import { orderService } from "./orderService";
import { collectionService } from "./collectionService";
import { fieldForceService } from "./fieldForceService";
import { mockOrders, mockCollections, mockMRs } from "../mock";
import type {
  CommercialKPIs,
  DailyCommercialTrend,
  MrCommercialPerformance,
} from "../types";

export const commercialService = {
  async getCommercialKPIs(): Promise<CommercialKPIs> {
    const orderKpis = await orderService.getOrderKPIs();
    const colKpis = await collectionService.getCollectionKPIs();

    const realizationRate =
      orderKpis.monthlyValue > 0
        ? Math.round((colKpis.monthlyValue / orderKpis.monthlyValue) * 100)
        : 100;

    return {
      todayOrdersCount: orderKpis.todayCount,
      todayOrdersValue: orderKpis.todayValue,
      monthlyOrdersCount: orderKpis.monthlyCount,
      monthlyOrdersValue: orderKpis.monthlyValue,
      todayCollectionsCount: colKpis.todayCount,
      todayCollectionsValue: colKpis.todayValue,
      monthlyCollectionsCount: colKpis.monthlyCount,
      monthlyCollectionsValue: colKpis.monthlyValue,
      pendingFulfillmentCount: orderKpis.pendingCount,
      averageOrderValue: orderKpis.averageOrderValue,
      collectionRealizationRate: realizationRate,
    };
  },

  async getDailyTrends(): Promise<DailyCommercialTrend[]> {
    const orderTrends = await orderService.getOrderTrend();
    const colTrends = await collectionService.getCollectionTrend();

    const result: DailyCommercialTrend[] = [];

    for (let i = 0; i < orderTrends.length; i++) {
      const o = orderTrends[i];
      const c = colTrends.find((item) => item.date === o.date) || {
        amount: 0,
        count: 0,
      };

      result.push({
        date: o.date,
        label: o.label,
        orderAmount: o.amount,
        orderCount: o.count,
        collectionAmount: c.amount,
        collectionCount: c.count,
      });
    }

    return result;
  },

  async getMrLeaderboard(): Promise<MrCommercialPerformance[]> {
    try {
      const [mrList, orders, collections] = await Promise.all([
        fieldForceService.getMRList(),
        orderService.getOrders({ limit: 200 }),
        collectionService.getCollections({ limit: 100 }),
      ]);

      if (mrList && mrList.length > 0) {
        const perfMap = new Map<string, MrCommercialPerformance>();

        for (const mr of mrList) {
          perfMap.set(mr.id, {
            mrId: mr.id,
            mrName: mr.name,
            employeeCode: mr.employeeId || "NP-MR-101",
            territoryName: mr.territoryName,
            ordersCount: 0,
            ordersValue: 0,
            collectionsCount: 0,
            collectionsValue: 0,
          });
        }

        for (const o of orders) {
          const existing = perfMap.get(o.mrId);
          if (existing) {
            existing.ordersCount++;
            existing.ordersValue += o.totalAmount;
          }
        }

        for (const c of collections) {
          const existing = perfMap.get(c.mrId);
          if (existing) {
            existing.collectionsCount++;
            existing.collectionsValue += c.amount;
          }
        }

        const leaderboard = Array.from(perfMap.values());
        leaderboard.sort((a, b) => b.ordersValue + b.collectionsValue - (a.ordersValue + a.collectionsValue));
        return leaderboard;
      }
    } catch (err) {
      console.warn("Failed to generate leaderboard from real services, falling back to mock:", err);
    }

    interface RawMRItem {
      id: string;
      employeeCode?: string;
      territoryId?: string;
      user?: { firstName?: string; lastName?: string };
    }

    const mrList = mockMRs as unknown as RawMRItem[];
    const perfMap = new Map<string, MrCommercialPerformance>();

    for (const mr of mrList) {
      const fullName = mr.user
        ? `${mr.user.firstName || ""} ${mr.user.lastName || ""}`.trim()
        : "Field Officer";

      perfMap.set(mr.id, {
        mrId: mr.id,
        mrName: fullName,
        employeeCode: mr.employeeCode || "NP-MR-101",
        territoryName: mr.territoryId === "ter_mdu_south" ? "Madurai South" : "Madurai North",
        ordersCount: 0,
        ordersValue: 0,
        collectionsCount: 0,
        collectionsValue: 0,
      });
    }

    // Tally orders
    for (const o of mockOrders) {
      const existing = perfMap.get(o.mrId);
      if (existing) {
        existing.ordersCount++;
        existing.ordersValue += o.totalAmount;
      }
    }

    // Tally collections
    for (const c of mockCollections) {
      const existing = perfMap.get(c.mrId);
      if (existing) {
        existing.collectionsCount++;
        existing.collectionsValue += c.amount;
      }
    }

    const leaderboard = Array.from(perfMap.values());
    leaderboard.sort((a, b) => b.ordersValue + b.collectionsValue - (a.ordersValue + a.collectionsValue));

    return leaderboard;
  },
};
