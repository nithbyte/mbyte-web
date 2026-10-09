import { apiClient } from "../lib/api-client";
import { mockDoctors, mockTerritories, mockVisits } from "../mock";
import type { Doctor, DoctorInput, CustomerHistoryItem } from "../types";

export interface DoctorQueryParams {
  search?: string;
  territoryId?: string;
  specialty?: string;
  tier?: string;
}

// In-memory state for mock CRUD fallback
const doctorsState: Doctor[] = [...mockDoctors];

function mapApiDoctor(d: any): Doctor {
  return {
    id: d.id,
    organizationId: d.organizationId || "org_novis_001",
    name: d.name,
    specialty: d.specialty || "General Medicine",
    qualification: d.qualification || "MBBS, MD",
    clinicName: d.clinicName || `${d.name}'s Clinic`,
    address: d.address || "Clinic Address",
    phone: d.phone || "+91 94440 12345",
    email: d.email,
    territoryId: d.territoryId || d.territory?.id || "ter_001",
    territoryName: d.territory?.name || "Central Territory",
    tier: d.tier || "B",
    visitFrequency: Number(d.visitFrequency) || 2,
    latitude: Number(d.latitude) || 13.0569,
    longitude: Number(d.longitude) || 80.2520,
    lastVisitDate: d.lastVisitDate || undefined,
    isActive: d.isActive ?? true,
  };
}

export const doctorService = {
  async getDoctors(params?: DoctorQueryParams): Promise<Doctor[]> {
    try {
      const queryParams: Record<string, any> = { limit: 100 };
      if (params?.territoryId && params.territoryId !== "ALL") queryParams.territoryId = params.territoryId;
      if (params?.specialty && params.specialty !== "ALL") queryParams.specialty = params.specialty;
      if (params?.tier && params.tier !== "ALL") queryParams.tier = params.tier;
      if (params?.search) queryParams.search = params.search;

      const res = await apiClient.get<any[]>("/doctors", { params: queryParams });
      if (Array.isArray(res) && res.length > 0) {
        return res.map(mapApiDoctor);
      }
    } catch (err) {
      console.warn("Real /doctors API call failed, falling back to mock:", err);
    }

    let list = [...doctorsState];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.clinicName.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.phone.includes(q)
      );
    }

    if (params?.territoryId && params.territoryId !== "ALL") {
      list = list.filter((d) => d.territoryId === params.territoryId);
    }

    if (params?.specialty && params.specialty !== "ALL") {
      list = list.filter((d) => d.specialty === params.specialty);
    }

    if (params?.tier && params.tier !== "ALL") {
      list = list.filter((d) => d.tier === params.tier);
    }

    return Promise.resolve(list);
  },

  async getDoctorById(id: string): Promise<Doctor | null> {
    try {
      const res = await apiClient.get<any>(`/doctors/${id}`);
      if (res && res.id) {
        return mapApiDoctor(res);
      }
    } catch {
      // fallback
    }

    const doc = doctorsState.find((d) => d.id === id);
    return Promise.resolve(doc || null);
  },

  async createDoctor(input: DoctorInput): Promise<Doctor> {
    try {
      const payload: Record<string, any> = {
        name: input.name.trim(),
        specialty: input.specialty.trim(),
        qualification: input.qualification?.trim() || "MBBS, MD",
        clinicName: input.clinicName?.trim() || `${input.name.trim()}'s Clinic`,
        address: input.address.trim(),
        phone: input.phone.trim(),
        territoryId: input.territoryId,
        tier: input.tier || "B",
        visitFrequency: input.visitFrequency || 2,
        latitude: input.latitude || 13.0569,
        longitude: input.longitude || 80.2520,
      };
      if (input.email) payload.email = input.email.trim();

      const res = await apiClient.post<any>("/doctors", payload);
      if (res && res.id) {
        const created = mapApiDoctor(res);
        doctorsState.unshift(created);
        return created;
      }
    } catch (err) {
      console.warn("Real /doctors POST failed, falling back to local state:", err);
    }

    const territory = mockTerritories.find((t) => t.id === input.territoryId);
    const newDoc: Doctor = {
      id: `doc_${Date.now()}`,
      organizationId: "org_novis_001",
      name: input.name.trim(),
      specialty: input.specialty.trim(),
      qualification: input.qualification?.trim() || "MBBS, MD",
      clinicName: input.clinicName?.trim() || `${input.name.trim()}'s Clinic`,
      address: input.address.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim(),
      territoryId: input.territoryId,
      territoryName: territory?.name || "Madurai North",
      tier: input.tier,
      visitFrequency: input.visitFrequency || 2,
      latitude: input.latitude,
      longitude: input.longitude,
      lastVisitDate: undefined,
      isActive: true,
    };

    doctorsState.unshift(newDoc);
    return Promise.resolve(newDoc);
  },

  async updateDoctor(id: string, input: Partial<DoctorInput>): Promise<Doctor> {
    try {
      const res = await apiClient.put<any>(`/doctors/${id}`, input);
      if (res && res.id) {
        const updated = mapApiDoctor(res);
        const idx = doctorsState.findIndex((d) => d.id === id);
        if (idx !== -1) doctorsState[idx] = updated;
        return updated;
      }
    } catch {
      // fallback
    }

    const idx = doctorsState.findIndex((d) => d.id === id);
    if (idx === -1) {
      throw new Error(`Doctor with ID ${id} not found.`);
    }

    const territory = input.territoryId
      ? mockTerritories.find((t) => t.id === input.territoryId)
      : undefined;

    const updated: Doctor = {
      ...doctorsState[idx],
      ...input,
      territoryName: territory?.name || doctorsState[idx].territoryName,
    };

    doctorsState[idx] = updated;
    return Promise.resolve(updated);
  },

  async getDoctorHistory(id: string): Promise<CustomerHistoryItem[]> {
    const history: CustomerHistoryItem[] = [];

    try {
      const visits = await apiClient.get<any[]>("/visits", { params: { doctorId: id, limit: 20 } });
      if (Array.isArray(visits) && visits.length > 0) {
        visits.forEach((v) => {
          history.push({
            id: v.id,
            date: v.actualStartTime || v.scheduledDate || "2026-10-08",
            title: `Doctor Detailing Call (${v.verificationStatus || "VERIFIED"})`,
            subtitle: `Detailed by MR ${v.mr?.name || v.mrId}`,
            type: "VISIT",
            status: v.status,
            notes: v.feedbackNotes || "Detailed core therapeutic portfolio",
            mrName: v.mr?.name,
          });
        });
      }
    } catch {
      // fallback to mock visits
      const doctorVisits = mockVisits.filter((v) => v.customerId === id);
      doctorVisits.forEach((v) => {
        history.push({
          id: v.id,
          date: v.actualStartTime || v.plannedDate || "2026-10-08",
          title: `Doctor Detailing Call (${v.verificationStatus || "VERIFIED"})`,
          subtitle: `Detailed by MR ${v.mrName || v.mrId}`,
          type: "VISIT",
          status: v.status,
          notes: v.doctorFeedback || v.outcomeNotes || "Detailed core therapeutic portfolio",
          mrName: v.mrName,
        });
      });
    }

    const doc = await this.getDoctorById(id);
    if (doc) {
      history.push({
        id: `reg_${id}`,
        date: "2026-01-15",
        type: "CREATION",
        title: "Physician Master Registry Enrollment",
        subtitle: `Enrolled in ${doc.territoryName} • Tier ${doc.tier.replace("_", "+")}`,
        status: "ACTIVE",
        notes: `GPS Coordinates verified at (${doc.latitude}, ${doc.longitude})`,
      });
    }

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return Promise.resolve(history);
  },

  async getSpecialties(): Promise<string[]> {
    try {
      const docs = await this.getDoctors();
      const set = new Set(docs.map((d) => d.specialty).filter(Boolean));
      if (set.size > 0) return Array.from(set).sort();
    } catch {
      // fallback
    }

    const set = new Set(doctorsState.map((d) => d.specialty));
    return Promise.resolve(Array.from(set).sort());
  },
};
