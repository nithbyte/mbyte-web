import { Visit } from "./visit";
import { Order, Collection } from "./order";

export type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "ADMIN" | "MANAGER" | "MR";

export interface Territory {
  id: string;
  name: string;
  code: string;
  region: string;
  state: string;
  activeMRsCount?: number;
}

export interface User {
  id: string;
  organizationId: string | null;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: UserRole | string;
  employeeId?: string;
  employeeCode?: string;
  territoryId?: string;
  territoryName?: string;
  managerId?: string;
  managerName?: string;
  avatarUrl?: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  designation?: string;
  createdAt?: string;
}

export interface MRPerformanceSummary {
  mrId: string;
  name: string;
  territoryName: string;
  status: "ACTIVE" | "IN_FIELD" | "IDLE" | "COMPLETED";
  currentActivity?: string;
  callsPlannedToday: number;
  callsCompletedToday: number;
  complianceRate: number; // percentage
  ordersBookedValue: number;
  collectionsValue: number;
  lastActiveTime?: string;
}

export interface MRListItem {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  territoryId: string;
  territoryName: string;
  managerId: string;
  managerName: string;
  headquarters: string;
  designation: string;
  joiningDate: string;
  status: "ACTIVE" | "IN_FIELD" | "IDLE" | "COMPLETED";
  currentActivity?: string;
  todayVisits: {
    planned: number;
    completed: number;
    inProgress: number;
    missed: number;
    complianceRate: number;
  };
  monthlyTarget: number;
  monthlyAchieved: number;
  achievementRate: number;
  performanceStatus: "AHEAD" | "ON_TRACK" | "BELOW_TARGET";
  ordersCount: number;
  ordersValue: number;
  collectionsValue: number;
}

export interface MRProductActivity {
  auditsCount: number;
  productsPromotedCount: number;
  samplesDistributedTotal: number;
  recentAudits: Array<{
    id: string;
    pharmacyName: string;
    productName: string;
    status: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
    quantity?: number;
    checkedAt: string;
  }>;
  promotedProducts: Array<{
    productId: string;
    productName: string;
    detailingCount: number;
    samplesDistributed: number;
  }>;
}

export interface MRDetailsData {
  mr: MRListItem;
  visits: Visit[];
  orders: Order[];
  collections: Collection[];
  target: {
    year: number;
    month: number;
    targetAmount: number;
    achievedAmount: number;
    achievementRate: number;
    shortfall: number;
    visitTarget: number;
    visitAchieved: number;
    visitAchievementRate: number;
    dailyCallGoal: number;
  };
  productActivity: MRProductActivity;
}

export interface MRListFilterParams {
  search?: string;
  territoryId?: string;
  managerId?: string;
  status?: string;
  performance?: "ALL" | "ON_TRACK" | "BELOW_TARGET" | "AHEAD";
}
