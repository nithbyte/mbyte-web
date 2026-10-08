export const APP_CONFIG = {
  name: "MByte FieldOps",
  version: "1.0.0",
  organization: "Novis Pharma",
  tenantId: "org_novis_001",
  region: "Tamil Nadu",
  headquarters: "Madurai & Trichy Operations Hub",
} as const;

export const ROUTES = {
  dashboard: "/",
  fieldForce: "/field-force",
  doctors: "/doctors",
  pharmacies: "/pharmacies",
  visits: "/visits",
  orders: "/orders",
  collections: "/collections",
  products: "/products",
  reports: "/reports",
  settings: "/settings",
} as const;
