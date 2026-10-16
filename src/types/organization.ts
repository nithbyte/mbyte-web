export interface Organization {
  id: string;
  name: string;
  slug: string;
  code: string;
  contactEmail: string;
  contactPhone?: string | null;
  address?: string | null;
  geofenceRadius: number;
  currency: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  code: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  geofenceRadius?: number;
  currency?: string;
  timezone?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  geofenceRadius?: number;
  isActive?: boolean;
}
