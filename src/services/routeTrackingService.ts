import { apiClient, API_BASE_URL, tokenStorage } from "../lib/api-client";

export interface RouteBreadcrumb {
  id: string;
  sessionId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speedKmh?: number | null;
  heading?: number | null;
  batteryLevel?: number | null;
  capturedAt: string;
  isWorkHours?: boolean;
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

export interface LiveMrVisitPin {
  id: string;
  customerType: "DOCTOR" | "PHARMACY" | "DISTRIBUTOR" | string;
  customerName: string;
  clinicName?: string | null;
  status: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  latitude: number;
  longitude: number;
}

export type LiveConnectionState = "LIVE" | "RECENT" | "STALE" | "OFFLINE" | "DISABLED";
export type LiveMovementState = "MOVING" | "STATIONARY" | "OFFLINE";

export interface LiveMrRecord {
  mrId: string;
  userId: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  territoryId: string;
  territoryName: string;
  territoryCode: string;
  liveTrackingEnabled: boolean;
  liveTrackingUpdatedAt: string | null;
  connectionState: LiveConnectionState;
  movementState: LiveMovementState;
  isAtWork: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speedKmh: number;
  heading: number;
  batteryLevel: number | null;
  lastKnownAt: string | null;
  activeSessionId: string | null;
  todayDistanceKm: number;
  todayVisitsCompleted: number;
  todayVisitsTotal: number;
  trail: RouteBreadcrumb[];
  visitPins: LiveMrVisitPin[];
}

export interface LiveFleetSnapshot {
  date: string;
  serverTime: string;
  summary: {
    totalMrs: number;
    trackingEnabledCount: number;
    liveOnlineCount: number;
    movingCount: number;
    totalDistanceKm: number;
  };
  mrs: LiveMrRecord[];
}

export interface LiveStreamEvent {
  type: "location_update" | "tracking_toggled" | "session_status" | "heartbeat";
  timestamp?: string;
  mrId?: string;
  liveTrackingEnabled?: boolean;
  liveTrackingUpdatedAt?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  speedKmh?: number;
  heading?: number;
  batteryLevel?: number | null;
  capturedAt?: string;
  todayDistanceKm?: number;
  movementState?: LiveMovementState;
  connectionState?: LiveConnectionState;
  sessionId?: string;
  breadcrumb?: RouteBreadcrumb | null;
}

export type StreamConnectionStatus = "CONNECTING" | "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

export const routeTrackingService = {
  async getSessions(params?: {
    mrId?: string;
    dutyDate?: string;
    status?: string;
  }): Promise<RouteSession[]> {
    try {
      const res: any = await apiClient.get("/route-tracking/sessions", { params });
      return res?.data?.items || res?.items || res?.data || (Array.isArray(res) ? res : []);
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

  async getLiveSnapshot(params?: {
    territoryId?: string;
    date?: string;
  }): Promise<LiveFleetSnapshot> {
    const query: Record<string, string> = {};
    if (params?.territoryId && params.territoryId !== "ALL") {
      query.territoryId = params.territoryId;
    }
    if (params?.date) {
      query.date = params.date;
    }
    const res: any = await apiClient.get("/route-tracking/live/snapshot", { params: query });
    return res?.mrs ? res : res?.data || {
      date: params?.date || new Date().toISOString().slice(0, 10),
      serverTime: new Date().toISOString(),
      summary: {
        totalMrs: 0,
        trackingEnabledCount: 0,
        liveOnlineCount: 0,
        movingCount: 0,
        totalDistanceKm: 0,
      },
      mrs: [],
    };
  },

  async toggleMrTracking(
    mrId: string,
    enabled: boolean,
  ): Promise<{ mrId: string; liveTrackingEnabled: boolean; liveTrackingUpdatedAt: string }> {
    const res: any = await apiClient.patch(`/route-tracking/mrs/${mrId}/tracking`, { enabled });
    return res?.data || res;
  },

  async bulkToggleTracking(params: {
    enabled: boolean;
    territoryId?: string;
    mrIds?: string[];
  }): Promise<{ success: boolean; enabled: boolean; updatedCount: number; mrIds: string[] }> {
    const res: any = await apiClient.post("/route-tracking/mrs/bulk-tracking", params);
    return res?.data || res;
  },

  /**
   * Opens a zero-lag authenticated Server-Sent Events (SSE) stream using fetch() ReadableStream.
   * Automatically reconnects with exponential backoff on transient network drops.
   * Returns an unsubscribe cleanup function.
   */
  subscribeLiveStream(
    onEvent: (evt: LiveStreamEvent) => void,
    onStatusChange?: (status: StreamConnectionStatus) => void,
  ): () => void {
    let closed = false;
    let controller: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryMs = 1500;

    const connect = async () => {
      if (closed) return;
      const token = tokenStorage.getAccessToken();
      if (!token || !API_BASE_URL) {
        onStatusChange?.("DISCONNECTED");
        return;
      }

      onStatusChange?.(retryMs > 1500 ? "RECONNECTING" : "CONNECTING");
      controller = new AbortController();

      try {
        const response = await fetch(`${API_BASE_URL}/route-tracking/live/stream`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE stream HTTP ${response.status}`);
        }

        retryMs = 1500;
        onStatusChange?.("CONNECTED");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split(/\r?\n\r?\n/);
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            const lines = chunk.split(/\r?\n/);
            let eventType: string | undefined;
            const dataLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trim());
              }
            }

            if (dataLines.length > 0) {
              const rawData = dataLines.join("\n");
              try {
                const parsed = JSON.parse(rawData);
                const unwrapped = parsed?.data && parsed?.success !== undefined ? parsed.data : parsed;
                const finalEvent: LiveStreamEvent = {
                  ...(unwrapped?.data && typeof unwrapped.data === "object" ? unwrapped.data : unwrapped),
                  type: (unwrapped?.type || eventType || "location_update") as LiveStreamEvent["type"],
                };
                onEvent(finalEvent);
              } catch {
                // Ignore malformed keep-alive comments
              }
            }
          }
        }
      } catch (err: any) {
        if (closed || err?.name === "AbortError") return;
      }

      if (!closed) {
        onStatusChange?.("RECONNECTING");
        retryTimer = setTimeout(() => {
          retryMs = Math.min(retryMs * 1.6, 12000);
          connect();
        }, retryMs);
      }
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (controller) controller.abort();
      onStatusChange?.("DISCONNECTED");
    };
  },
};
