import { create } from "zustand";
import { getLocalTodayDate, isValidIsoDate } from "@/lib/utils";

export interface FilterState {
  selectedTerritoryId: string;
  setSelectedTerritoryId: (id: string) => void;
  operatingDate: string; // ISO date 'YYYY-MM-DD' in local timezone
  dateSelectionVersion: number; // increments whenever user explicitly selects Today/Yesterday/Date
  setOperatingDate: (date: string) => void;
  resetOperatingDate: () => void;
  dateRange: "TODAY" | "WEEK" | "MONTH";
  setDateRange: (range: "TODAY" | "WEEK" | "MONTH") => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedTerritoryId: "ALL",
  setSelectedTerritoryId: (id) => set({ selectedTerritoryId: id }),
  operatingDate: getLocalTodayDate(),
  dateSelectionVersion: 0,
  setOperatingDate: (date) => {
    if (isValidIsoDate(date)) {
      set((state) => ({
        operatingDate: date,
        dateSelectionVersion: state.dateSelectionVersion + 1,
      }));
    }
  },
  resetOperatingDate: () =>
    set((state) => ({
      operatingDate: getLocalTodayDate(),
      dateSelectionVersion: state.dateSelectionVersion + 1,
    })),
  dateRange: "TODAY",
  setDateRange: (range) => set({ dateRange: range }),
}));
