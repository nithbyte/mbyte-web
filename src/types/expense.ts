export type ExpenseClaimStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED_FOR_CORRECTION";

export interface ExpensePolicy {
  id: string;
  organizationId: string;
  category: string;
  maxDailyLimit: number;
  mileageRatePerKm?: number | null;
  requiresReceiptAbove?: number | null;
  description?: string | null;
  isActive: boolean;
}

export interface ExpenseItem {
  id: string;
  claimId: string;
  date: string;
  category: string;
  amount: number;
  currency: string;
  distanceKm?: number | null;
  notes?: string | null;
  receiptUrl?: string | null;
  receiptFileId?: string | null;
}

export interface ExpenseAudit {
  id: string;
  claimId: string;
  actorId: string;
  action: string;
  fromStatus: ExpenseClaimStatus;
  toStatus: ExpenseClaimStatus;
  comments?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ExpenseClaim {
  id: string;
  organizationId: string;
  mrId: string;
  claimNumber: string;
  title: string;
  startDate: string;
  endDate: string;
  status: ExpenseClaimStatus;
  totalAmount: number;
  currency: string;
  submissionNotes?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvedById?: string | null;
  rejectedAt?: string | null;
  rejectedById?: string | null;
  reviewComments?: string | null;
  createdAt: string;
  updatedAt: string;
  mr?: {
    id: string;
    employeeCode: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    territory?: {
      name: string;
    };
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  rejectedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  items?: ExpenseItem[];
  audits?: ExpenseAudit[];
}

export interface ExpenseSummary {
  totalClaims: number;
  approvedAmount: number;
  pendingAmount: number;
  statusBreakdown: Record<string, { count: number; totalAmount: number }>;
  categoryBreakdown: Record<string, { count: number; totalAmount: number }>;
}
