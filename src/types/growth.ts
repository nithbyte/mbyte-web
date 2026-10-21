export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type ParticipantStatus = 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'OPTED_OUT';
export type AttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'LATE' | 'ON_DUTY' | 'ABSENT';
export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ==========================================
// CAMPAIGNS
// ==========================================
export interface CampaignParticipant {
  id: string;
  campaignId: string;
  userId: string;
  status: ParticipantStatus;
  progressPercent: number;
  completedAt?: string;
  lastActivityAt?: string;
  notes?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Campaign {
  id: string;
  organizationId: string;
  title: string;
  code: string;
  description?: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  targetAudience?: string;
  targetTerritoryId?: string;
  contentUrl?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  participants?: CampaignParticipant[];
  _count?: {
    participants: number;
    surveys: number;
  };
}

export interface CampaignMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalParticipants: number;
  completedParticipants: number;
  inProgressParticipants: number;
  completionRate: number;
  averageProgress: number;
}

// ==========================================
// TRAINING & QUIZZES
// ==========================================
export interface QuizOption {
  id: string;
  questionId?: string;
  optionText: string;
  isCorrect?: boolean;
  orderIndex: number;
}

export interface QuizQuestion {
  id: string;
  trainingModuleId?: string;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  points: number;
  orderIndex: number;
  explanation?: string;
  options: QuizOption[];
}

export interface TrainingModule {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  category: string;
  contentUrl?: string;
  estimatedMinutes?: number;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  questions?: QuizQuestion[];
  _count?: {
    questions: number;
    attempts: number;
  };
}

export interface QuizAttempt {
  id: string;
  trainingModuleId: string;
  organizationId: string;
  userId: string;
  attemptNumber: number;
  score: number;
  maxPossibleScore: number;
  percentage: number;
  passed: boolean;
  answers: any;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TrainingMetrics {
  totalModules: number;
  totalAttempts: number;
  passRate: number;
  averageScore: number;
  certifiedTraineesCount: number;
}

// ==========================================
// SURVEYS
// ==========================================
export interface SurveyQuestion {
  id: string;
  surveyId?: string;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING' | 'TEXT';
  options?: string[];
  isRequired: boolean;
  orderIndex: number;
}

export interface Survey {
  id: string;
  organizationId: string;
  campaignId?: string;
  title: string;
  description?: string;
  targetType?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    id: string;
    title: string;
    code: string;
  };
  questions?: SurveyQuestion[];
  _count?: {
    questions: number;
    responses: number;
  };
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  organizationId: string;
  respondentUserId: string;
  answers: Record<string, any>;
  submittedAt: string;
  createdAt: string;
  respondent?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SurveyAnalytics {
  surveyId: string;
  title: string;
  totalResponses: number;
  questions: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    totalAnswered: number;
    averageRating?: number;
    distribution?: Record<string, number>;
  }>;
}

// ==========================================
// DAILY ATTENDANCE
// ==========================================
export interface AttendanceCorrection {
  id: string;
  attendanceRecordId?: string;
  organizationId: string;
  mrId: string;
  userId: string;
  attendanceDate: string;
  requestedPunchIn: string;
  requestedPunchOut?: string;
  reason: string;
  status: CorrectionStatus;
  reviewedById?: string;
  reviewedAt?: string;
  managerComments?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  mr?: {
    id: string;
    employeeCode: string;
    territory?: string;
  };
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  mrId: string;
  userId: string;
  attendanceDate: string;
  punchInTime: string;
  punchInLatitude?: number;
  punchInLongitude?: number;
  punchInAddress?: string;
  punchInPhotoUrl?: string;
  punchInVerificationType: string;
  punchOutTime?: string;
  punchOutLatitude?: number;
  punchOutLongitude?: number;
  punchOutAddress?: string;
  totalWorkHours?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  mr?: {
    id: string;
    employeeCode: string;
    territory?: string;
  };
  corrections?: AttendanceCorrection[];
}

export interface AttendanceSummary {
  totalRecords: number;
  presentCount: number;
  halfDayCount: number;
  totalHours: number;
  averageDailyHours: number;
}
