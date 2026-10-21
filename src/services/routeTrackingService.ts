import { apiClient } from "../lib/api-client";

export interface RouteBreadcrumb {
  id: string;
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speedKmh?: number;
  batteryLevel?: number;
  capturedAt: string;
  isWorkHours: boolean;
  clientPointId?: string;
}

export interface RouteSession {
  id: string;
  organizationId: string;
  mrId: string;
  dutyDate: string;
  startedAt: string;
  endedAt?: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  startBatteryLevel?: number;
  endBatteryLevel?: number;
  totalDistanceKm: number;
  notes?: string;
  retentionUntil?: string;
  mr?: {
    id: string;
    employeeCode: string;
    user: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
  };
  _count?: {
    breadcrumbs: number;
  };
  breadcrumbs?: RouteBreadcrumb[];
}

export const routeTrackingService = {
  async getSessions(params?: {
    mrId?: string;
    dutyDate?: string;
    status?: string;
  }): Promise<RouteSession[]> {
    try {
      const res: any = await apiClient.get("/route-tracking/sessions", { params });
      return res?.data?.items || res?.data || res || [];
    } catch {
      return [];
    }
  },

  async getSessionPlayback(sessionId: string): Promise<RouteSession | null> {
    try {
      const res: any = await apiClient.get(`/route-tracking/sessions/${sessionId}`);
      return res?.data || res || null;
    } catch {
      return null;
    }
  },

  async triggerCleanup(): Promise<{ success: boolean; deletedSessions: number }> {
    try {
      const res: any = await apiClient.post("/route-tracking/maintenance/cleanup");
      return res?.data || res || { success: true, deletedSessions: 0 };
    } catch {
      return { success: false, deletedSessions: 0 };
    }
  },
};
