import { apiClient } from "../lib/api-client";
import type { Organization, CreateOrganizationInput, UpdateOrganizationInput, AppFeatures } from "../types";
import { DEFAULT_APP_FEATURES } from "../types";

export const organizationService = {
  /**
   * List all active tenant organizations for public login dropdown (unauthenticated).
   */
  async getPublicList(): Promise<Array<{ id: string; name: string; slug: string; code: string; logoUrl?: string }>> {
    try {
      const res = await apiClient.get<any>("/organizations/public/list");
      return Array.isArray(res) ? res : res?.data || [];
    } catch (err) {
      console.warn("Failed to fetch public organizations list:", err);
      return [];
    }
  },

  /**
   * Get public organization branding and details by subdomain slug (unauthenticated).
   */
  async getPublicBySlug(slug: string): Promise<Organization> {
    const res = await apiClient.get<any>(`/organizations/public/by-slug/${slug.trim().toLowerCase()}`);
    if (res && (res.id || res.data?.id)) {
      return res.data || res;
    }
    throw new Error(`Organization with slug '${slug}' not found.`);
  },

  /**
   * List all tenant organizations (SUPER_ADMIN only).
   */
  async getOrganizations(params?: { search?: string; isActive?: boolean }): Promise<Organization[]> {
    try {
      const res = await apiClient.get<any>("/organizations", { params });
      const items = Array.isArray(res) ? res : res?.items || [];
      return items;
    } catch (err) {
      console.warn("Real /organizations call failed:", err);
      return [];
    }
  },

  /**
   * Get organization by ID.
   */
  async getOrganizationById(id: string): Promise<Organization> {
    const res = await apiClient.get<Organization>(`/organizations/${id}`);
    if (res && res.id) return res;
    throw new Error(`Organization with ID ${id} not found.`);
  },

  /**
   * Get tenant company features configuration.
   */
  async getTenantFeatures(orgId: string): Promise<AppFeatures> {
    try {
      const res = await apiClient.get<AppFeatures>(`/organizations/${orgId}/features`);
      if (res && typeof res === "object") {
        return { ...DEFAULT_APP_FEATURES, ...res };
      }
    } catch (err) {
      console.warn("Failed to fetch tenant features, using defaults:", err);
    }
    return DEFAULT_APP_FEATURES;
  },

  /**
   * Update tenant company features configuration.
   */
  async updateTenantFeatures(orgId: string, features: Partial<AppFeatures>): Promise<AppFeatures> {
    const res = await apiClient.put<AppFeatures>(`/organizations/${orgId}/features`, features);
    return res;
  },

  /**
   * List all users from a specific company (Super Admin).
   */
  async getTenantUsers(orgId: string, params?: { search?: string; status?: string; role?: string }): Promise<any[]> {
    try {
      const res = await apiClient.get<any>("/users", {
        params: {
          organizationId: orgId,
          limit: 100,
          ...params,
        },
      });
      return Array.isArray(res) ? res : res?.items || [];
    } catch (err) {
      console.warn("Failed to fetch tenant users:", err);
      return [];
    }
  },

  /**
   * Get specific user feature capability overrides.
   */
  async getUserFeatures(userId: string): Promise<{ effectiveFeatures: AppFeatures; overrides: Partial<AppFeatures> }> {
    try {
      const res = await apiClient.get<any>(`/users/${userId}/features`);
      return res;
    } catch (err) {
      console.warn("Failed to fetch user features:", err);
      return { effectiveFeatures: DEFAULT_APP_FEATURES, overrides: {} };
    }
  },

  /**
   * Update specific user feature capability overrides.
   */
  async updateUserFeatures(userId: string, features: Partial<AppFeatures>): Promise<{ effectiveFeatures: AppFeatures; overrides: Partial<AppFeatures> }> {
    const res = await apiClient.put<any>(`/users/${userId}/features`, features);
    return res;
  },

  /**
   * Register a new tenant organization (SUPER_ADMIN only).
   */
  async createOrganization(dto: CreateOrganizationInput): Promise<Organization> {
    const res = await apiClient.post<Organization>("/organizations", dto);
    if (res && res.id) return res;
    throw new Error("Failed to create organization");
  },

  /**
   * Update an organization (SUPER_ADMIN / COMPANY_ADMIN).
   */
  async updateOrganization(id: string, dto: UpdateOrganizationInput): Promise<Organization> {
    const res = await apiClient.put<Organization>(`/organizations/${id}`, dto);
    if (res && res.id) return res;
    throw new Error(`Failed to update organization ${id}`);
  },

  /**
   * Retry failed tenant database provisioning (SUPER_ADMIN only).
   */
  async retryProvisioning(id: string): Promise<Organization> {
    const res = await apiClient.post<Organization>(`/organizations/${id}/retry-provisioning`);
    if (res && res.id) return res;
    throw new Error(`Failed to re-provision tenant database for ${id}`);
  },

  /**
   * Soft-delete/archive an organization (SUPER_ADMIN only).
   */
  async deleteOrganization(id: string): Promise<void> {
    await apiClient.delete(`/organizations/${id}`);
  },
};
