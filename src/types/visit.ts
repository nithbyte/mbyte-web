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
  | "MANUAL_EXCEPTION"
  | "UNVERIFIED";

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
}
