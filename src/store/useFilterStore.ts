import { create } from "zustand";
import { getLocalTodayDate, isValidIsoDate } from "@/lib/utils";

export interface FilterState {
  selectedTerritoryId: string;
  setSelectedTerritoryId: (id: string) => void;
  operatingDate: string; // ISO date 'YYYY-MM-DD' in local timezone
  setOperatingDate: (date: string) => void;
  resetOperatingDate: () => void;
  dateRange: "TODAY" | "WEEK" | "MONTH";
  setDateRange: (range: "TODAY" | "WEEK" | "MONTH") => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedTerritoryId: "ALL",
  setSelectedTerritoryId: (id) => set({ selectedTerritoryId: id }),
  operatingDate: getLocalTodayDate(),
  setOperatingDate: (date) => {
    if (isValidIsoDate(date)) {
      set({ operatingDate: date });
    }
  },
  resetOperatingDate: () => set({ operatingDate: getLocalTodayDate() }),
  dateRange: "TODAY",
  setDateRange: (range) => set({ dateRange: range }),
}));
