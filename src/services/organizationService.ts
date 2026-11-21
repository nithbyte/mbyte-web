import { apiClient } from "../lib/api-client";
import type { Organization, CreateOrganizationInput, UpdateOrganizationInput } from "../types";

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
