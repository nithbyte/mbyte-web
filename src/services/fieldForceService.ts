import { apiClient } from "../lib/api-client";
import {
  mockMRs,
  mockVisits,
  mockOrders,
  mockCollections,
  mockTerritories,
  mockTargets,
  mockUsers,
  mockProductPresence,
  mockProducts,
} from "../mock";
import type {
  MRPerformanceSummary,
  MRListItem,
  MRDetailsData,
  MRListFilterParams,
  User,
  Visit,
  Order,
  Collection,
} from "../types";
import { visitService } from "./visitService";
import { orderService } from "./orderService";
import { collectionService } from "./collectionService";
import { presenceService } from "./presenceService";

interface RawVisitItem extends Visit {
  scheduledDate?: string;
  distanceMeters?: number;
  visitProducts?: Array<{
    productId: string;
    promoted?: boolean;
    samplesQty?: number;
    feedback?: string;
  }>;
}

interface RawTargetItem {
  id: string;
  organizationId: string;
  mrId: string;
  territoryId: string;
  year: number;
  month: number;
  targetAmount: number | string;
  achievedAmount: number | string;
  visitTarget?: number;
  visitAchieved?: number;
  dailyCallGoal?: number;
  todayCompletedVisits?: number;
}

interface RawPresenceItem {
  id: string;
  organizationId: string;
  mrId?: string;
  pharmacyId: string;
  pharmacyName: string;
  productId: string;
  productName: string;
  status: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
  quantity?: number;
  checkedAt: string;
}

export const fieldForceService = {
  async getFieldForce(territoryId?: string): Promise<MRPerformanceSummary[]> {
    try {
      const raw = await apiClient.get<any>("/mrs", {
        params: { territoryId: territoryId !== "ALL" ? territoryId : undefined, limit: 100 },
      });
      const list = Array.isArray(raw) ? raw : (raw as any)?.data || [];
      if (list && list.length > 0) {
        const [visits, orders, collections] = await Promise.all([
          visitService.getVisits({ limit: 200 }),
          orderService.getOrders({ limit: 200 }),
          collectionService.getCollections({ limit: 100 }),
        ]);

        const summaries: MRPerformanceSummary[] = list.map((mr: any) => {
          const mrName = mr.user
            ? `${mr.user.firstName || ""} ${mr.user.lastName || ""}`.trim()
            : mr.employeeCode || mr.id;

          const mrVisits = visits.filter((v) => v.mrId === mr.id);
          const callsPlanned = mrVisits.length;
          const callsCompleted = mrVisits.filter((v) => v.status === "COMPLETED").length;
          const complianceRate =
            callsPlanned > 0 ? Math.round((callsCompleted / callsPlanned) * 100) : 0;

          const mrOrders = orders.filter((o) => o.mrId === mr.id);
          const ordersValue = mrOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

          const mrCollections = collections.filter((c) => c.mrId === mr.id);
          const collectionsValue = mrCollections.reduce((acc, curr) => acc + curr.amount, 0);

          let status: "ACTIVE" | "IN_FIELD" | "IDLE" | "COMPLETED" = "ACTIVE";
          const inProgressVisit = mrVisits.find((v) => v.status === "IN_PROGRESS");
          if (inProgressVisit) {
            status = "IN_FIELD";
          } else if (callsCompleted === callsPlanned && callsPlanned > 0) {
            status = "COMPLETED";
          } else if (callsCompleted > 0) {
            status = "ACTIVE";
          } else {
            status = "IDLE";
          }

          return {
            mrId: mr.id,
            name: mrName,
            territoryName: mr.territory?.name || mr.territoryId || "Assigned Territory",
            status,
            currentActivity: inProgressVisit
              ? `In-Call @ ${inProgressVisit.customerName}`
              : callsCompleted === callsPlanned && callsPlanned > 0
              ? "Daily Calls Concluded"
              : "En Route to Next Clinic",
            callsPlannedToday: callsPlanned,
            callsCompletedToday: callsCompleted,
            complianceRate,
            ordersBookedValue: ordersValue,
            collectionsValue,
            lastActiveTime: "14:45",
          };
        });

        return summaries;
      }
    } catch (err) {
      console.warn("Failed to fetch field force from API, falling back to mock:", err);
    }

    // Fallback to mock
    let mrs = [...mockMRs];
    if (territoryId && territoryId !== "ALL") {
      mrs = mrs.filter((m) => m.territoryId === territoryId);
    }

    const rawVisits = mockVisits as unknown as RawVisitItem[];

    const summaries: MRPerformanceSummary[] = mrs.map((mr) => {
      const mrVisits = rawVisits.filter(
        (v) => v.mrId === mr.id && (v.scheduledDate === "2026-10-08" || v.plannedDate === "2026-10-08")
      );
      const callsPlanned = mrVisits.length;
      const callsCompleted = mrVisits.filter((v) => v.status === "COMPLETED").length;
      const complianceRate =
        callsPlanned > 0 ? Math.round((callsCompleted / callsPlanned) * 100) : 0;

      const mrOrders = mockOrders.filter((o) => o.mrId === mr.id);
      const ordersValue = mrOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

      const mrCollections = mockCollections.filter((c) => c.mrId === mr.id);
      const collectionsValue = mrCollections.reduce((acc, curr) => acc + curr.amount, 0);

      let status: "ACTIVE" | "IN_FIELD" | "IDLE" | "COMPLETED" = "ACTIVE";
      const inProgressVisit = mrVisits.find((v) => v.status === "IN_PROGRESS");
      if (inProgressVisit) {
        status = "IN_FIELD";
      } else if (callsCompleted === callsPlanned && callsPlanned > 0) {
        status = "COMPLETED";
      } else if (callsCompleted > 0) {
        status = "ACTIVE";
      } else {
        status = "IDLE";
      }

      const territory = mockTerritories.find((t) => t.id === mr.territoryId);
      const territoryName = territory ? territory.name : mr.territoryId;

      const mrName = mr.user
        ? `${mr.user.firstName} ${mr.user.lastName}`
        : mr.employeeCode || mr.id;

      return {
        mrId: mr.id,
        name: mrName,
        territoryName,
        status,
        currentActivity: inProgressVisit
          ? `In-Call @ ${inProgressVisit.customerName}`
          : callsCompleted === callsPlanned
          ? "Daily Calls Concluded"
          : "En Route to Next Clinic",
        callsPlannedToday: callsPlanned,
        callsCompletedToday: callsCompleted,
        complianceRate,
        ordersBookedValue: ordersValue,
        collectionsValue,
        lastActiveTime: "14:45",
      };
    });

    return Promise.resolve(summaries);
  },

  async getMRList(filters?: MRListFilterParams): Promise<MRListItem[]> {
    try {
      const raw = await apiClient.get<any>("/mrs", {
        params: {
          territoryId: filters?.territoryId !== "ALL" ? filters?.territoryId : undefined,
          search: filters?.search,
          limit: 100,
        },
      });
      const list = Array.isArray(raw) ? raw : (raw as any)?.data || [];
      if (list && list.length > 0) {
        const [rawTargets, visits, orders, collections] = await Promise.all([
          apiClient.get<any>("/targets", { params: { limit: 100 } }).catch(() => []),
          visitService.getVisits({ limit: 200 }),
          orderService.getOrders({ limit: 200 }),
          collectionService.getCollections({ limit: 100 }),
        ]);

        const targetsList = Array.isArray(rawTargets) ? rawTargets : (rawTargets as any)?.data || [];

        let mappedList: MRListItem[] = list.map((mr: any) => {
          const mrName = mr.user
            ? `${mr.user.firstName || ""} ${mr.user.lastName || ""}`.trim()
            : mr.employeeCode || mr.id;

          const repVisitsToday = visits.filter((v) => v.mrId === mr.id);
          const planned = repVisitsToday.length;
          const completed = repVisitsToday.filter((v) => v.status === "COMPLETED").length;
          const inProgress = repVisitsToday.filter((v) => v.status === "IN_PROGRESS").length;
          const missed = repVisitsToday.filter((v) => v.status === "MISSED").length;
          const complianceRate = planned > 0 ? Math.round((completed / planned) * 100) : 0;

          const tgt = targetsList.find((t: any) => t.mrId === mr.id);
          const monthlyTarget = tgt?.targetAmount ? Number(tgt.targetAmount) : 450000;
          const monthlyAchieved = tgt?.achievedAmount ? Number(tgt.achievedAmount) : 0;
          const achievementRate = monthlyTarget > 0 ? Math.round((monthlyAchieved / monthlyTarget) * 100) : 0;

          const performanceStatus: "AHEAD" | "ON_TRACK" | "BELOW_TARGET" =
            achievementRate >= 45
              ? "AHEAD"
              : achievementRate >= 42
              ? "ON_TRACK"
              : "BELOW_TARGET";

          let status: "ACTIVE" | "IN_FIELD" | "IDLE" | "COMPLETED" = "ACTIVE";
          if (inProgress > 0) {
            status = "IN_FIELD";
          } else if (completed === planned && planned > 0) {
            status = "COMPLETED";
          } else if (completed > 0) {
            status = "ACTIVE";
          } else {
            status = "IDLE";
          }

          const mrOrders = orders.filter((o) => o.mrId === mr.id);
          const ordersValue = mrOrders.reduce((sum, o) => sum + o.totalAmount, 0);

          const mrCollections = collections.filter((c) => c.mrId === mr.id);
          const collectionsValue = mrCollections.reduce((sum, c) => sum + c.amount, 0);

          return {
            id: mr.id,
            employeeId: mr.employeeCode || "EMP-MR-001",
            name: mrName,
            email: mr.user?.email || "",
            phone: mr.user?.phone || "",
            territoryId: mr.territoryId,
            territoryName: mr.territory?.name || mr.territoryId || "Assigned Territory",
            managerId: mr.managerId || "",
            managerName: "Area Sales Manager",
            headquarters: mr.headquarters || "Chennai",
            designation: mr.designation || "Medical Representative",
            joiningDate: mr.joiningDate ? mr.joiningDate.slice(0, 10) : "2026-02-01",
            status,
            currentActivity:
              inProgress > 0
                ? "In-Call with Physician"
                : completed === planned && planned > 0
                ? "Completed Daily Call Plan"
                : "En Route to Next Clinic",
            todayVisits: {
              planned,
              completed,
              inProgress,
              missed,
              complianceRate,
            },
            monthlyTarget,
            monthlyAchieved,
            achievementRate,
            performanceStatus,
            ordersCount: mrOrders.length,
            ordersValue,
            collectionsValue,
          };
        });

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          mappedList = mappedList.filter(
            (mr) =>
              mr.name.toLowerCase().includes(q) ||
              mr.employeeId.toLowerCase().includes(q) ||
              mr.territoryName.toLowerCase().includes(q)
          );
        }

        if (filters?.territoryId && filters.territoryId !== "ALL") {
          mappedList = mappedList.filter((mr) => mr.territoryId === filters.territoryId);
        }

        if (filters?.managerId && filters.managerId !== "ALL") {
          mappedList = mappedList.filter((mr) => mr.managerId === filters.managerId);
        }

        if (filters?.status && filters.status !== "ALL") {
          mappedList = mappedList.filter((mr) => mr.status === filters.status);
        }

        if (filters?.performance && filters.performance !== "ALL") {
          mappedList = mappedList.filter((mr) => mr.performanceStatus === filters.performance);
        }

        return mappedList;
      }
    } catch (err) {
      console.warn("Failed to fetch MR list from API, falling back to mock:", err);
    }

    // Fallback to mock
    const rawVisits = mockVisits as unknown as RawVisitItem[];
    const rawTargets = mockTargets as unknown as RawTargetItem[];

    let list: MRListItem[] = mockMRs.map((mr) => {
      const territory = mockTerritories.find((t) => t.id === mr.territoryId);
      const territoryName = territory?.name || mr.territoryId;

      const manager = mockUsers.find((u) => u.id === mr.managerId);
      const managerName = manager
        ? `${manager.firstName} ${manager.lastName}`
        : "Area Sales Manager";

      const mrName = mr.user
        ? `${mr.user.firstName} ${mr.user.lastName}`
        : mr.employeeCode || mr.id;

      const repVisitsToday = rawVisits.filter(
        (v) => v.mrId === mr.id && (v.scheduledDate === "2026-10-08" || v.plannedDate === "2026-10-08")
      );
      const planned = repVisitsToday.length;
      const completed = repVisitsToday.filter((v) => v.status === "COMPLETED").length;
      const inProgress = repVisitsToday.filter((v) => v.status === "IN_PROGRESS").length;
      const missed = repVisitsToday.filter((v) => v.status === "MISSED").length;
      const complianceRate = planned > 0 ? Math.round((completed / planned) * 100) : 0;

      const tgt = rawTargets.find((t) => t.mrId === mr.id);
      const monthlyTarget = Number(tgt?.targetAmount) || 450000;
      const monthlyAchieved = Number(tgt?.achievedAmount) || 0;
      const achievementRate = Math.round((monthlyAchieved / monthlyTarget) * 100);

      const performanceStatus: "AHEAD" | "ON_TRACK" | "BELOW_TARGET" =
        achievementRate >= 45
          ? "AHEAD"
          : achievementRate >= 42
          ? "ON_TRACK"
          : "BELOW_TARGET";

      let status: "ACTIVE" | "IN_FIELD" | "IDLE" | "COMPLETED" = "ACTIVE";
      if (inProgress > 0) {
        status = "IN_FIELD";
      } else if (completed === planned && planned > 0) {
        status = "COMPLETED";
      } else if (completed > 0) {
        status = "ACTIVE";
      } else {
        status = "IDLE";
      }

      const mrOrders = mockOrders.filter((o) => o.mrId === mr.id);
      const ordersValue = mrOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      const mrCollections = mockCollections.filter((c) => c.mrId === mr.id);
      const collectionsValue = mrCollections.reduce((sum, c) => sum + c.amount, 0);

      return {
        id: mr.id,
        employeeId: mr.employeeCode,
        name: mrName,
        email: mr.user?.email || "",
        phone: mr.user?.phone || "",
        territoryId: mr.territoryId,
        territoryName,
        managerId: mr.managerId,
        managerName,
        headquarters: mr.headquarters || "Madurai",
        designation: mr.designation || "Medical Representative",
        joiningDate: mr.joiningDate || "2026-02-01",
        status,
        currentActivity:
          inProgress > 0
            ? "In-Call with Physician"
            : completed === planned
            ? "Completed Daily Call Plan"
            : "En Route to Next Clinic",
        todayVisits: {
          planned,
          completed,
          inProgress,
          missed,
          complianceRate,
        },
        monthlyTarget,
        monthlyAchieved,
        achievementRate,
        performanceStatus,
        ordersCount: mrOrders.length,
        ordersValue,
        collectionsValue,
      };
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (mr) =>
          mr.name.toLowerCase().includes(q) ||
          mr.employeeId.toLowerCase().includes(q) ||
          mr.territoryName.toLowerCase().includes(q)
      );
    }

    if (filters?.territoryId && filters.territoryId !== "ALL") {
      list = list.filter((mr) => mr.territoryId === filters.territoryId);
    }

    if (filters?.managerId && filters.managerId !== "ALL") {
      list = list.filter((mr) => mr.managerId === filters.managerId);
    }

    if (filters?.status && filters.status !== "ALL") {
      list = list.filter((mr) => mr.status === filters.status);
    }

    if (filters?.performance && filters.performance !== "ALL") {
      list = list.filter((mr) => mr.performanceStatus === filters.performance);
    }

    return Promise.resolve(list);
  },

  async getMRDetails(id: string): Promise<MRDetailsData | null> {
    try {
      const list = await this.getMRList();
      const mr = list.find((item) => item.id === id);
      if (!mr) return null;

      const [visits, orders, collections, audits] = await Promise.all([
        visitService.getVisits({ mrId: id, limit: 100 }),
        orderService.getOrders({ mrId: id, limit: 100 }),
        collectionService.getCollections({ mrId: id, limit: 100 }),
        presenceService.getPresenceAudits({ mrId: id }).catch(() => []),
      ]);

      const targetAmount = mr.monthlyTarget || 450000;
      const achievedAmount = mr.monthlyAchieved || 0;
      const achievementRate = Math.round((achievedAmount / targetAmount) * 100);
      const shortfall = Math.max(0, targetAmount - achievedAmount);
      const visitTarget = 220;
      const visitAchieved = visits.filter((v) => v.status === "COMPLETED").length;
      const visitAchievementRate = Math.round((visitAchieved / visitTarget) * 100);
      const dailyCallGoal = 10;

      let productsPromotedCount = 0;
      let samplesDistributedTotal = 0;
      const productStatsMap: Record<string, { detailingCount: number; samplesDistributed: number }> = {};

      visits.forEach((v) => {
        const rawV = v as RawVisitItem;
        if (rawV.visitProducts && rawV.visitProducts.length > 0) {
          rawV.visitProducts.forEach((vp) => {
            if (vp.promoted) productsPromotedCount++;
            const qty = vp.samplesQty || 0;
            samplesDistributedTotal += qty;

            if (!productStatsMap[vp.productId]) {
              productStatsMap[vp.productId] = { detailingCount: 0, samplesDistributed: 0 };
            }
            productStatsMap[vp.productId].detailingCount += 1;
            productStatsMap[vp.productId].samplesDistributed += qty;
          });
        }
      });

      const promotedProducts = Object.entries(productStatsMap).map(([productId, stats]) => ({
        productId,
        productName: productId,
        detailingCount: stats.detailingCount,
        samplesDistributed: stats.samplesDistributed,
      }));

      return {
        mr,
        visits,
        orders,
        collections,
        target: {
          year: 2026,
          month: 10,
          targetAmount,
          achievedAmount,
          achievementRate,
          shortfall,
          visitTarget,
          visitAchieved,
          visitAchievementRate,
          dailyCallGoal,
        },
        productActivity: {
          auditsCount: audits.length,
          productsPromotedCount,
          samplesDistributedTotal,
          recentAudits: audits.slice(0, 10).map((a) => ({
            id: a.id,
            pharmacyName: a.pharmacyName,
            productName: a.productName,
            status: a.status,
            quantity: (a as any).quantity,
            checkedAt: (a as any).checkedAt,
          })),
          promotedProducts,
        },
      };
    } catch {
      // Fallback
    }

    const list = await this.getMRList();
    const mr = list.find((item) => item.id === id);
    if (!mr) return Promise.resolve(null);

    const rawVisits = mockVisits as unknown as RawVisitItem[];
    const rawTargets = mockTargets as unknown as RawTargetItem[];
    const rawPresence = mockProductPresence as unknown as RawPresenceItem[];

    const visits: Visit[] = rawVisits
      .filter((v) => v.mrId === id)
      .sort((a, b) => new Date(b.actualStartTime || b.scheduledDate || b.plannedDate || "").getTime() - new Date(a.actualStartTime || a.scheduledDate || a.plannedDate || "").getTime());

    const orders: Order[] = mockOrders
      .filter((o) => o.mrId === id)
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    const collections: Collection[] = mockCollections
      .filter((c) => c.mrId === id)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const tgt = rawTargets.find((t) => t.mrId === id);
    const targetAmount = Number(tgt?.targetAmount) || mr.monthlyTarget;
    const achievedAmount = Number(tgt?.achievedAmount) || mr.monthlyAchieved;
    const achievementRate = Math.round((achievedAmount / targetAmount) * 100);
    const shortfall = Math.max(0, targetAmount - achievedAmount);
    const visitTarget = tgt?.visitTarget || 220;
    const visitAchieved = tgt?.visitAchieved || 85;
    const visitAchievementRate = Math.round((visitAchieved / visitTarget) * 100);
    const dailyCallGoal = tgt?.dailyCallGoal || 10;

    const mrAudits = rawPresence.filter((p) => p.mrId === id);
    let productsPromotedCount = 0;
    let samplesDistributedTotal = 0;
    const productStatsMap: Record<string, { detailingCount: number; samplesDistributed: number }> = {};

    visits.forEach((v) => {
      const rawV = v as RawVisitItem;
      if (rawV.visitProducts && rawV.visitProducts.length > 0) {
        rawV.visitProducts.forEach((vp) => {
          if (vp.promoted) productsPromotedCount++;
          const qty = vp.samplesQty || 0;
          samplesDistributedTotal += qty;

          if (!productStatsMap[vp.productId]) {
            productStatsMap[vp.productId] = { detailingCount: 0, samplesDistributed: 0 };
          }
          productStatsMap[vp.productId].detailingCount += 1;
          productStatsMap[vp.productId].samplesDistributed += qty;
        });
      }
    });

    const promotedProducts = Object.entries(productStatsMap).map(([productId, stats]) => {
      const prod = mockProducts.find((p) => p.id === productId);
      return {
        productId,
        productName: prod?.name || productId,
        detailingCount: stats.detailingCount,
        samplesDistributed: stats.samplesDistributed,
      };
    });

    return Promise.resolve({
      mr,
      visits,
      orders,
      collections,
      target: {
        year: 2026,
        month: 10,
        targetAmount,
        achievedAmount,
        achievementRate,
        shortfall,
        visitTarget,
        visitAchieved,
        visitAchievementRate,
        dailyCallGoal,
      },
      productActivity: {
        auditsCount: mrAudits.length,
        productsPromotedCount,
        samplesDistributedTotal,
        recentAudits: mrAudits.slice(0, 10).map((a) => ({
          id: a.id,
          pharmacyName: a.pharmacyName,
          productName: a.productName,
          status: a.status,
          quantity: a.quantity,
          checkedAt: a.checkedAt,
        })),
        promotedProducts,
      },
    });
  },

  async getManagers(): Promise<Array<{ id: string; name: string }>> {
    try {
      const raw = await apiClient.get<any>("/users", { params: { role: "MANAGER" } });
      const list = Array.isArray(raw) ? raw : (raw as any)?.data || [];
      if (list && list.length > 0) {
        return list.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        }));
      }
    } catch {
      // Fallback
    }

    const managers = mockUsers
      .filter((u) => u.role === "MANAGER" || u.role === "COMPANY_ADMIN")
      .map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
      }));
    return Promise.resolve(managers);
  },

  async getMRById(id: string): Promise<User | null> {
    try {
      const mr = await apiClient.get<any>(`/mrs/${id}`);
      if (mr && mr.id) {
        return {
          id: mr.id,
          organizationId: mr.organizationId,
          name: mr.user ? `${mr.user.firstName} ${mr.user.lastName}` : mr.employeeCode,
          firstName: mr.user?.firstName,
          lastName: mr.user?.lastName,
          email: mr.user?.email || "",
          phone: mr.user?.phone || "",
          role: "MR",
          employeeCode: mr.employeeCode,
          territoryId: mr.territoryId,
          territoryName: mr.territory?.name || mr.territoryId,
          status: "ACTIVE",
        };
      }
    } catch {
      // Fallback
    }

    const mr = mockMRs.find((m) => m.id === id);
    if (!mr) return Promise.resolve(null);

    const territory = mockTerritories.find((t) => t.id === mr.territoryId);
    const user: User = {
      id: mr.id,
      organizationId: mr.organizationId,
      name: mr.user ? `${mr.user.firstName} ${mr.user.lastName}` : mr.employeeCode,
      firstName: mr.user?.firstName,
      lastName: mr.user?.lastName,
      email: mr.user?.email || "",
      phone: mr.user?.phone || "",
      role: "MR",
      employeeCode: mr.employeeCode,
      territoryId: mr.territoryId,
      territoryName: territory?.name || mr.territoryId,
      status: "ACTIVE",
    };
    return Promise.resolve(user);
  },
};
