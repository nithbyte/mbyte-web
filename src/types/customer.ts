export type DoctorTier = "A_PLUS" | "A" | "B";

export interface Doctor {
  id: string;
  organizationId: string;
  name: string;
  specialty: string;
  qualification?: string;
  clinicName: string;
  address: string;
  phone: string;
  email?: string;
  territoryId: string;
  territoryName: string;
  tier: DoctorTier;
  visitFrequency: number; // calls per month
  lastVisitDate?: string;
  latitude: number;
  longitude: number;
  tags?: string[];
  isActive?: boolean;
}

export interface DoctorInput {
  name: string;
  specialty: string;
  qualification?: string;
  clinicName: string;
  address: string;
  phone: string;
  email?: string;
  territoryId: string;
  tier: DoctorTier;
  visitFrequency: number;
  latitude: number;
  longitude: number;
}

export interface Pharmacy {
  id: string;
  organizationId: string;
  name: string;
  contactPerson: string; // owner
  phone: string;
  email?: string;
  address: string;
  drugLicenseNumber: string;
  gstNumber?: string;
  territoryId: string;
  territoryName: string;
  creditLimit?: number;
  outstandingBalance?: number;
  latitude: number;
  longitude: number;
}

export interface PharmacyInput {
  name: string;
  contactPerson: string; // owner
  phone: string;
  email?: string;
  address: string;
  drugLicenseNumber: string;
  territoryId: string;
  latitude: number;
  longitude: number;
}

export interface Distributor {
  id: string;
  organizationId: string;
  name: string;
  contactPerson: string; // contact
  phone: string;
  email?: string;
  address: string;
  dlNumber: string;
  gstin: string;
  territoryId: string;
  territoryName: string;
  creditLimit?: number;
  paymentTerms?: string;
  isActive?: boolean;
}

export interface DistributorInput {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  dlNumber: string;
  gstin: string;
  territoryId: string;
}

export interface CustomerHistoryItem {
  id: string;
  date: string;
  type: "VISIT" | "ORDER" | "COLLECTION" | "AUDIT" | "CREATION";
  title: string;
  subtitle: string;
  status?: string;
  amount?: number;
  notes?: string;
  mrName?: string;
}
