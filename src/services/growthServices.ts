import { apiClient } from "../lib/api-client";
import type {
  Campaign,
  CampaignMetrics,
  TrainingModule,
  QuizAttempt,
  TrainingMetrics,
  Survey,
  SurveyResponse,
  SurveyAnalytics,
  AttendanceRecord,
  AttendanceCorrection,
  AttendanceSummary,
} from "../types";

export const campaignService = {
  async getCampaigns(params?: { status?: string; search?: string }): Promise<Campaign[]> {
    try {
      const res = await apiClient.get<any>("/campaigns", { params });
      if (Array.isArray(res)) return res;
      return res?.items || res?.data || [];
    } catch {
      return [];
    }
  },

  async getCampaignById(id: string): Promise<Campaign> {
    return apiClient.get<Campaign>(`/campaigns/${id}`);
  },

  async createCampaign(data: Partial<Campaign> & { participantUserIds?: string[] }): Promise<Campaign> {
    return apiClient.post<Campaign>("/campaigns", data);
  },

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    return apiClient.put<Campaign>(`/campaigns/${id}`, data);
  },

  async enrollParticipants(id: string, userIds: string[]): Promise<any> {
    return apiClient.post(`/campaigns/${id}/enroll`, { userIds });
  },

  async getMetrics(campaignId?: string): Promise<CampaignMetrics> {
    try {
      return await apiClient.get<CampaignMetrics>("/campaigns/metrics", {
        params: campaignId ? { campaignId } : undefined,
      });
    } catch {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalParticipants: 0,
        completedParticipants: 0,
        inProgressParticipants: 0,
        completionRate: 0,
        averageProgress: 0,
      };
    }
  },
};

export const trainingService = {
  async getModules(params?: { category?: string; search?: string }): Promise<TrainingModule[]> {
    try {
      const res = await apiClient.get<any>("/training/modules", { params });
      if (Array.isArray(res)) return res;
      return res?.items || res?.data || [];
    } catch {
      return [];
    }
  },

  async getModuleById(id: string): Promise<TrainingModule> {
    return apiClient.get<TrainingModule>(`/training/modules/${id}/admin`);
  },

  async createModule(data: any): Promise<TrainingModule> {
    return apiClient.post<TrainingModule>("/training/modules", data);
  },

  async updateModule(id: string, data: any): Promise<TrainingModule> {
    return apiClient.put<TrainingModule>(`/training/modules/${id}`, data);
  },

  async addQuestion(moduleId: string, data: any): Promise<any> {
    return apiClient.post(`/training/modules/${moduleId}/questions`, data);
  },

  async deleteQuestion(moduleId: string, questionId: string): Promise<void> {
    return apiClient.delete(`/training/modules/${moduleId}/questions/${questionId}`);
  },

  async getAttempts(moduleId: string): Promise<QuizAttempt[]> {
    try {
      const res = await apiClient.get<QuizAttempt[]>(`/training/modules/${moduleId}/attempts`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getMetrics(): Promise<TrainingMetrics> {
    try {
      return await apiClient.get<TrainingMetrics>("/training/metrics");
    } catch {
      return {
        totalModules: 0,
        totalAttempts: 0,
        passRate: 0,
        averageScore: 0,
        certifiedTraineesCount: 0,
      };
    }
  },
};

export const surveyService = {
  async getSurveys(params?: { campaignId?: string; search?: string }): Promise<Survey[]> {
    try {
      const res = await apiClient.get<any>("/surveys", { params });
      if (Array.isArray(res)) return res;
      return res?.items || res?.data || [];
    } catch {
      return [];
    }
  },

  async getSurveyById(id: string): Promise<Survey> {
    return apiClient.get<Survey>(`/surveys/${id}`);
  },

  async createSurvey(data: any): Promise<Survey> {
    return apiClient.post<Survey>("/surveys", data);
  },

  async updateSurvey(id: string, data: any): Promise<Survey> {
    return apiClient.put<Survey>(`/surveys/${id}`, data);
  },

  async getResponses(id: string): Promise<SurveyResponse[]> {
    try {
      const res = await apiClient.get<SurveyResponse[]>(`/surveys/${id}/responses`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getAnalytics(id: string): Promise<SurveyAnalytics | null> {
    try {
      return await apiClient.get<SurveyAnalytics>(`/surveys/${id}/analytics`);
    } catch {
      return null;
    }
  },
};

export const attendanceService = {
  async getRecords(params?: { mrId?: string; startDate?: string; endDate?: string }): Promise<AttendanceRecord[]> {
    try {
      const res = await apiClient.get<any>("/attendance/records", { params });
      return Array.isArray(res) ? res : res?.items || [];
    } catch {
      return [];
    }
  },

  async getRecordById(id: string): Promise<AttendanceRecord> {
    return apiClient.get<AttendanceRecord>(`/attendance/records/${id}`);
  },

  async getCorrections(params?: { status?: string; mrId?: string }): Promise<AttendanceCorrection[]> {
    try {
      const res = await apiClient.get<any>("/attendance/corrections", { params });
      return Array.isArray(res) ? res : res?.items || [];
    } catch {
      return [];
    }
  },

  async reviewCorrection(id: string, data: { status: 'APPROVED' | 'REJECTED'; reviewNotes?: string }): Promise<any> {
    return apiClient.put(`/attendance/corrections/${id}/review`, data);
  },

  async getSummary(startDate?: string, endDate?: string): Promise<AttendanceSummary> {
    try {
      return await apiClient.get<AttendanceSummary>("/attendance/summary", {
        params: { startDate, endDate },
      });
    } catch {
      return {
        totalRecords: 0,
        presentCount: 0,
        halfDayCount: 0,
        totalHours: 0,
        averageDailyHours: 0,
      };
    }
  },
};
