import { create } from "zustand";
import { Habit } from "@/types";

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, data: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  setLoading: (v: boolean) => void;
}

export const useHabitStore = create<HabitState>((set) => ({
  habits: [],
  isLoading: true,
  setHabits: (habits) => set({ habits }),
  addHabit: (habit) => set((s) => ({ habits: [...s.habits, habit] })),
  updateHabit: (id, data) => set((s) => ({ habits: s.habits.map((h) => (h.$id === id ? { ...h, ...data } : h)) })),
  deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.$id !== id) })),
  setLoading: (v) => set({ isLoading: v }),
}));
