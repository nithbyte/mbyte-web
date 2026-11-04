import { apiClient } from "../lib/api-client";
import type { Organization, CreateOrganizationInput, UpdateOrganizationInput } from "../types";

export const organizationService = {
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
   * Soft-delete/archive an organization (SUPER_ADMIN only).
   */
  async deleteOrganization(id: string): Promise<void> {
    await apiClient.delete(`/organizations/${id}`);
  },
};
