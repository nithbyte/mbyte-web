import { apiClient } from "../lib/api-client";
import { mockNotifications } from "../mock";

export interface AppNotification {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  message: string;
  category?: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

function mapNotification(item: any): AppNotification {
  return {
    id: item.id,
    organizationId: item.organizationId,
    userId: item.userId,
    title: item.title,
    message: item.message || item.body || "",
    category: item.category || item.type,
    type: item.type || item.category,
    entityType: item.entityType,
    entityId: item.entityId,
    isRead: Boolean(item.isRead),
    readAt: item.readAt,
    createdAt: item.createdAt,
  };
}

export const notificationService = {
  async getNotifications(params?: {
    isRead?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AppNotification[]> {
    try {
      const raw = await apiClient.get<any>("/notifications", {
        params: { limit: params?.limit || 20, ...params },
      });
      const list = Array.isArray(raw) ? raw : (raw as any)?.data || [];
      if (list && list.length > 0) {
        return list.map(mapNotification);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications from API, falling back to mock:", err);
    }

    let list = [...mockNotifications] as any[];
    if (params?.isRead !== undefined) {
      list = list.filter((n) => n.isRead === params.isRead);
    }
    return list.map(mapNotification);
  },

  async getUnreadCount(): Promise<number> {
    try {
      const raw = await apiClient.get<any>("/notifications/unread-count");
      if (raw && raw.unreadCount != null) {
        return Number(raw.unreadCount);
      }
    } catch {
      // Fallback
    }

    const count = (mockNotifications as any[]).filter((n) => !n.isRead).length;
    return Promise.resolve(count);
  },

  async markAsRead(id: string): Promise<AppNotification> {
    try {
      const raw = await apiClient.patch<any>(`/notifications/${id}/read`);
      if (raw && raw.id) {
        return mapNotification(raw);
      }
    } catch {
      // Fallback
    }

    const item = (mockNotifications as any[]).find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      return mapNotification(item);
    }
    return {
      id,
      organizationId: "org_novis_001",
      userId: "usr_mgr_001",
      title: "Notification",
      message: "Notification marked read",
      isRead: true,
      createdAt: new Date().toISOString(),
    };
  },

  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    try {
      const raw = await apiClient.post<any>("/notifications/read-all");
      return { success: true, count: raw?.count || 0 };
    } catch {
      (mockNotifications as any[]).forEach((n) => {
        n.isRead = true;
      });
      return { success: true, count: mockNotifications.length };
    }
  },

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
  }): Promise<AppNotification> {
    const raw = await apiClient.post<any>("/notifications", data);
    return mapNotification(raw);
  },
};
