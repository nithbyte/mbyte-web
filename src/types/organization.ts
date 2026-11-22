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
  currency?: string;
  timezone?: string;
  isActive?: boolean;
}

export interface AppFeatures {
  doctorManagement: boolean;
  chemistManagement: boolean;
  geomapping: boolean;
  orderBooking: boolean;
  collections: boolean;
  dcrFiling: boolean;
  tourPlanning: boolean;
  productPresence: boolean;
  sampleTracking: boolean;
  chatAndCalling: boolean;
  expenseManagement: boolean;
  leaveManagement: boolean;
}

export const DEFAULT_APP_FEATURES: AppFeatures = {
  doctorManagement: true,
  chemistManagement: true,
  geomapping: true,
  orderBooking: true,
  collections: true,
  dcrFiling: true,
  tourPlanning: true,
  productPresence: true,
  sampleTracking: true,
  chatAndCalling: true,
  expenseManagement: true,
  leaveManagement: true,
};

export interface FeatureMeta {
  key: keyof AppFeatures;
  title: string;
  category: "Customer Network" | "Field GPS & Tracking" | "Field Detailing & Activity" | "Commercial & Sales" | "Workforce & Operations";
  description: string;
  mobileScope: boolean;
  webScope: boolean;
  icon: string;
}

export const APP_FEATURES_METADATA: FeatureMeta[] = [
  {
    key: "doctorManagement",
    title: "Doctor Management (Add/Edit)",
    category: "Customer Network",
    description: "Allows representatives and managers to add new doctors, update specialty, qualifications, and clinic locations.",
    mobileScope: true,
    webScope: true,
    icon: "Stethoscope",
  },
  {
    key: "chemistManagement",
    title: "Chemist & Pharmacy Master",
    category: "Customer Network",
    description: "Enables onboarding retail pharmacies, chemist contacts, and attached stockists.",
    mobileScope: true,
    webScope: true,
    icon: "Building2",
  },
  {
    key: "geomapping",
    title: "Geomapping & GPS Verification",
    category: "Field GPS & Tracking",
    description: "Enforces GPS geofence checks during visits, live location breadcrumbs, and route travel validation.",
    mobileScope: true,
    webScope: true,
    icon: "MapPin",
  },
  {
    key: "orderBooking",
    title: "Commercial Order Taking",
    category: "Commercial & Sales",
    description: "Allows field force to book chemist and doctor purchase orders, product quantities, and delivery schedules.",
    mobileScope: true,
    webScope: true,
    icon: "ShoppingCart",
  },
  {
    key: "collections",
    title: "Payment Receipts & Collections",
    category: "Commercial & Sales",
    description: "Enables logging cash/cheque payment receipts against invoices and tracking outstanding receivables.",
    mobileScope: true,
    webScope: true,
    icon: "Receipt",
  },
  {
    key: "dcrFiling",
    title: "Daily Call Reports (DCR)",
    category: "Field Detailing & Activity",
    description: "Daily submission of visit detailing logs, doctor feedback, visual aids shown, and manager reviews.",
    mobileScope: true,
    webScope: true,
    icon: "FileCheck",
  },
  {
    key: "tourPlanning",
    title: "Monthly Tour Plans (MTP)",
    category: "Field Detailing & Activity",
    description: "Advance monthly route planning, day-wise territory itineraries, and supervisor approvals.",
    mobileScope: true,
    webScope: true,
    icon: "Calendar",
  },
  {
    key: "productPresence",
    title: "Retail Shelf & Presence Audits",
    category: "Field Detailing & Activity",
    description: "Auditing brand visibility, shelf stock, competitor presence, and prescription velocity.",
    mobileScope: true,
    webScope: true,
    icon: "Package",
  },
  {
    key: "sampleTracking",
    title: "Drug Samples & Promo Materials",
    category: "Field Detailing & Activity",
    description: "Tracking sample allocation, doctor acknowledgement receipts, and promotional gift distribution.",
    mobileScope: true,
    webScope: true,
    icon: "Gift",
  },
  {
    key: "chatAndCalling",
    title: "In-App Audio Calling & Team Chat",
    category: "Workforce & Operations",
    description: "Built-in VoIP calling between reps, managers, and doctors, plus direct messaging channels.",
    mobileScope: true,
    webScope: true,
    icon: "Phone",
  },
  {
    key: "expenseManagement",
    title: "Field Expense Claims (TA/DA)",
    category: "Workforce & Operations",
    description: "Submitting daily travel allowances, fuel reimbursements, hotel bills, and approval workflows.",
    mobileScope: true,
    webScope: true,
    icon: "DollarSign",
  },
  {
    key: "leaveManagement",
    title: "Attendance & Leave Requests",
    category: "Workforce & Operations",
    description: "Mobile GPS punch-in/out attendance, duty shifts, and casual/sick leave applications.",
    mobileScope: true,
    webScope: true,
    icon: "Clock",
  },
];
