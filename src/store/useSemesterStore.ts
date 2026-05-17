import { create } from "zustand";
import { Semester } from "@/types";

interface SemesterState {
  semesters: Semester[];
  activeSemesterId: string | null;
  isLoading: boolean;
  setSemesters: (semesters: Semester[]) => void;
  setActiveSemesterId: (id: string | null) => void;
  addSemester: (semester: Semester) => void;
  updateSemester: (id: string, data: Partial<Semester>) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useSemesterStore = create<SemesterState>((set) => ({
  semesters: [],
  activeSemesterId: null,
  isLoading: true,
  setSemesters: (semesters) => {
    // Also try to set active semester if not set and there's an active one in the list
    set((state) => {
      let activeId = state.activeSemesterId;
      if (!activeId) {
        const active = semesters.find(s => s.isActive);
        if (active) activeId = active.$id;
        else if (semesters.length > 0) activeId = semesters[0].$id;
      }
      return { semesters, activeSemesterId: activeId };
    });
  },
  setActiveSemesterId: (id) => set({ activeSemesterId: id }),
  addSemester: (semester) => set((state) => ({ 
    semesters: [...state.semesters, semester],
    ...(semester.isActive ? { activeSemesterId: semester.$id } : {}) 
  })),
  updateSemester: (id, data) => set((state) => ({
    semesters: state.semesters.map(s => s.$id === id ? { ...s, ...data } : s)
  })),
  setLoading: (isLoading) => set({ isLoading })
}));
