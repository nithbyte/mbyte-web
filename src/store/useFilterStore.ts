import { create } from "zustand";

interface FilterState {
  selectedTerritoryId: string;
  setSelectedTerritoryId: (id: string) => void;
  dateRange: "TODAY" | "WEEK" | "MONTH";
  setDateRange: (range: "TODAY" | "WEEK" | "MONTH") => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedTerritoryId: "ALL",
  setSelectedTerritoryId: (id) => set({ selectedTerritoryId: id }),
  dateRange: "TODAY",
  setDateRange: (range) => set({ dateRange: range }),
}));
