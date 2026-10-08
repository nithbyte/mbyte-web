import { mockDoctors, mockTerritories, mockVisits } from "../mock";
import type { Doctor, DoctorInput, CustomerHistoryItem } from "../types";

export interface DoctorQueryParams {
  search?: string;
  territoryId?: string;
  specialty?: string;
  tier?: string;
}

// In-memory state for mock CRUD operations
const doctorsState: Doctor[] = [...mockDoctors];

export const doctorService = {
  async getDoctors(params?: DoctorQueryParams): Promise<Doctor[]> {
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
    const doc = doctorsState.find((d) => d.id === id);
    return Promise.resolve(doc || null);
  },

  async createDoctor(input: DoctorInput): Promise<Doctor> {
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

    // 1. Visits for this doctor
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

    // Initial Registration
    const doc = doctorsState.find((d) => d.id === id);
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
    const set = new Set(doctorsState.map((d) => d.specialty));
    return Promise.resolve(Array.from(set).sort());
  },
};
