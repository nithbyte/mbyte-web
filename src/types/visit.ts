export type VisitStatus =
  | "PLANNED"
  | "LOCATION_VERIFIED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MISSED"
  | "CANCELLED";

export type VerificationStatus =
  | "VERIFIED"
  | "OUTSIDE_RADIUS"
  | "EXCEPTION_REQUESTED"
  | "EXCEPTION_APPROVED"
  | "BYPASSED"
  | "MANUAL_EXCEPTION"
  | "UNVERIFIED";

export interface VisitAccompaniment {
  id: string;
  organizationId: string;
  visitId: string;
  managerId: string;
  mrId: string;
  accompaniedDate: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  jointObjectives?: string;
  coachingFeedback?: string | null;
  isPrivateCoaching: boolean;
  strengthsObserved?: string | null;
  areasOfImprovement?: string | null;
  rating?: number | null;
  manager?: { employeeCode?: string; user?: { firstName?: string; lastName?: string; email?: string } };
  mr?: { employeeCode?: string; user?: { firstName?: string; lastName?: string; email?: string } };
}

export interface VisitProductDiscussion {
  productId: string;
  productName?: string;
  promoted?: boolean;
  samplesQty?: number;
  feedback?: string;
}

export interface Visit {
  id: string;
  organizationId: string;
  mrId: string;
  mrName?: string;
  employeeCode?: string;
  mrPhone?: string;
  customerId: string;
  customerName: string;
  customerType: "DOCTOR" | "PHARMACY";
  customerAddress?: string;
  specialty?: string;
  territoryId?: string;
  territoryName?: string;
  plannedDate: string;
  scheduledDate?: string;
  plannedStartTime?: string;
  scheduledStartTime?: string;
  plannedEndTime?: string;
  scheduledEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  durationSeconds?: number;
  status: VisitStatus;
  verificationStatus: VerificationStatus;
  exceptionReason?: string | null;
  exceptionRequestedAt?: string | null;
  exceptionReviewedAt?: string | null;
  exceptionReviewedById?: string | null;
  exceptionReviewComments?: string | null;
  distanceMeters?: number;
  verifiedDistance?: number;
  distanceFromRegisteredMeters?: number;
  verifiedLatitude?: number;
  verifiedLongitude?: number;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  doctorFeedback?: string;
  feedbackNotes?: string;
  outcomeNotes?: string;
  nextFollowUpDate?: string;
  priority?: string;
  accompaniments?: VisitAccompaniment[];
  visitProducts?: VisitProductDiscussion[];
  productsDiscussed?: string[];
  samplesDistributed?: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  orderPlaced?: boolean;
  orderValue?: number;
  collectionAmount?: number;
  createdAt: string;
}

export interface VisitCounts {
  todayTotal: number;
  completed: number;
  inProgress: number;
  missed: number;
  cancelled: number;
  planned: number;
  gpsVerifiedRate: number; // percentage
}

export interface VisitQueryParams {
  date?: string;
  status?: string;
  verificationStatus?: string;
  mrId?: string;
  territoryId?: string;
  customerId?: string;
  customerType?: string;
  search?: string;
  limit?: number;
  organizationId?: string;
}
