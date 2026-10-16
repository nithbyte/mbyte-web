import { apiClient } from "../lib/api-client";
import type { Organization, CreateOrganizationInput, UpdateOrganizationInput } from "../types";

const fallbackOrganizations: Organization[] = [
  {
    id: "e9655eae-b478-4be3-8ead-109fdf31e467",
    name: "Novis Pharmaceuticals Private Limited",
    slug: "novis-pharma",
    code: "NOV",
    contactEmail: "admin@novispharma.com",
    contactPhone: "+91 98400 11111",
    address: "12 Medical Corridor, Mount Road, Chennai, Tamil Nadu 600002",
    geofenceRadius: 200,
    currency: "INR",
    timezone: "Asia/Kolkata",
    isActive: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-16T12:00:00.000Z",
  },
  {
    id: "org_zenith_002",
    name: "Zenith Lifesciences India",
    slug: "zenith-life",
    code: "ZEN",
    contactEmail: "ops@zenithlife.in",
    contactPhone: "+91 98410 88888",
    address: "45 Pharma City, Guindy, Chennai, Tamil Nadu 600032",
    geofenceRadius: 250,
    currency: "INR",
    timezone: "Asia/Kolkata",
    isActive: true,
    createdAt: "2026-10-05T00:00:00.000Z",
    updatedAt: "2026-10-15T00:00:00.000Z",
  },
];

export const organizationService = {
  /**
   * List all tenant organizations (SUPER_ADMIN only).
   */
  async getOrganizations(params?: { search?: string; isActive?: boolean }): Promise<Organization[]> {
    try {
      const res = await apiClient.get<any>("/organizations", { params });
      const items = Array.isArray(res) ? res : res?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        return items;
      }
    } catch (err) {
      console.warn("Real /organizations call failed, returning fallback list:", err);
    }
    return fallbackOrganizations;
  },

  /**
   * Get organization by ID.
   */
  async getOrganizationById(id: string): Promise<Organization> {
    try {
      const res = await apiClient.get<Organization>(`/organizations/${id}`);
      if (res && res.id) return res;
    } catch (err) {
      console.warn(`Failed to fetch organization ${id}:`, err);
    }
    const found = fallbackOrganizations.find((o) => o.id === id);
    if (found) return found;
    throw new Error(`Organization with ID ${id} not found.`);
  },

  /**
   * Register a new tenant organization (SUPER_ADMIN only).
   */
  async createOrganization(dto: CreateOrganizationInput): Promise<Organization> {
    try {
      const res = await apiClient.post<Organization>("/organizations", dto);
      if (res && res.id) return res;
    } catch (err: any) {
      console.warn("Backend /organizations POST failed:", err);
      throw err;
    }

    const created: Organization = {
      id: `org_${Date.now()}`,
      ...dto,
      geofenceRadius: dto.geofenceRadius || 200,
      currency: dto.currency || "INR",
      timezone: dto.timezone || "Asia/Kolkata",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fallbackOrganizations.push(created);
    return created;
  },

  /**
   * Update an organization (SUPER_ADMIN / COMPANY_ADMIN).
   */
  async updateOrganization(id: string, dto: UpdateOrganizationInput): Promise<Organization> {
    try {
      const res = await apiClient.put<Organization>(`/organizations/${id}`, dto);
      if (res && res.id) return res;
    } catch (err: any) {
      console.warn(`Backend PUT /organizations/${id} failed:`, err);
      throw err;
    }

    const idx = fallbackOrganizations.findIndex((o) => o.id === id);
    if (idx !== -1) {
      fallbackOrganizations[idx] = {
        ...fallbackOrganizations[idx],
        ...dto,
        updatedAt: new Date().toISOString(),
      };
      return fallbackOrganizations[idx];
    }
    throw new Error(`Organization ${id} not found.`);
  },

  /**
   * Soft-delete/archive an organization (SUPER_ADMIN only).
   */
  async deleteOrganization(id: string): Promise<void> {
    try {
      await apiClient.delete(`/organizations/${id}`);
    } catch (err) {
      console.warn(`Backend DELETE /organizations/${id} failed:`, err);
    }
    const idx = fallbackOrganizations.findIndex((o) => o.id === id);
    if (idx !== -1) {
      fallbackOrganizations[idx].isActive = false;
    }
  },
};
