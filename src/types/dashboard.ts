import { Visit } from "./visit";
import { Order, Collection } from "./order";
import { MRPerformanceSummary } from "./user";

export interface DashboardKPIs {
  date: string;
  fieldForce: {
    total: number;
    activeToday: number;
    inFieldNow: number;
    travelingNow: number;
    concludedToday: number;
    idleNow: number;
  };
  calls: {
    plannedToday: number;
    completedToday: number;
    inProgressToday: number;
    missedToday: number;
    verifiedGpsCount: number;
    outsideRadiusCount: number;
    complianceRate: number; // percentage
    gpsComplianceRate: number; // percentage
  };
  commercial: {
    ordersBookedCount: number;
    totalOrderValue: number;
    pendingOrdersCount: number;
    pendingOrdersValue: number;
    collectionsCount: number;
    totalCollectionsValue: number;
    collectionsByMode: Array<{
      mode: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
  };
  inventory: {
    auditsToday: number;
    availableCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    availabilityRate: number; // percentage
    topStockoutProducts: Array<{
      productName: string;
      stockoutCount: number;
    }>;
  };
  targets: {
    monthlyTargetTotal: number;
    monthlyAchievedTotal: number;
    overallAchievementRate: number; // percentage
    benchmarkRate: number; // e.g. 26% on day 8
    pacingStatus: "ON_TRACK" | "BEHIND" | "AHEAD";
  };
}

export interface TerritoryPerformance {
  territoryId: string;
  territoryName: string;
  totalMRs: number;
  callsPlanned: number;
  callsCompleted: number;
  complianceRate: number;
  orderValue: number;
  collectionsValue: number;
  stockHealthRate: number;
}

export interface StockAlert {
  id: string;
  pharmacyName: string;
  territoryName: string;
  productName: string;
  status: "LOW_STOCK" | "OUT_OF_STOCK";
  reportedQuantity?: number;
  auditedBy: string;
  auditedAt: string;
}

export interface BelowTargetMRAlert {
  mrId: string;
  mrName: string;
  territoryName: string;
  monthlyTarget: number;
  monthlyAchieved: number;
  achievementPercent: number;
  callsCompletedToday: number;
  callsPlannedToday: number;
  severity: "HIGH" | "MEDIUM";
  shortfallAmount: number;
}

export interface MissedVisitAlert {
  id: string;
  doctorName: string;
  specialty?: string;
  mrName: string;
  territoryName: string;
  scheduledTime: string;
  priority: string;
}

export interface PendingCommercialAlert {
  id: string;
  type: "ORDER" | "COLLECTION";
  identifier: string;
  customerName: string;
  mrName: string;
  amount: number;
  status: string;
  date: string;
  actionRequired: string;
}

export interface AttentionCenterData {
  totalAlertsCount: number;
  belowTargetMRs: BelowTargetMRAlert[];
  missedVisits: MissedVisitAlert[];
  criticalStockouts: StockAlert[];
  pendingCommercial: PendingCommercialAlert[];
}

export interface ManagerDashboardData {
  kpis: DashboardKPIs;
  territorySummary: TerritoryPerformance[];
  fieldForceSummary: MRPerformanceSummary[];
  recentVisits: Visit[];
  recentOrders: Order[];
  recentCollections: Collection[];
  stockAlerts: StockAlert[];
  attentionCenter: AttentionCenterData;
}
