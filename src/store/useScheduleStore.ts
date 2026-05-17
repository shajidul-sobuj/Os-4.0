import { create } from "zustand";
import { Schedule } from "@/types";

interface ScheduleState {
  schedules: Schedule[];
  isLoading: boolean;
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, data: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  setLoading: (v: boolean) => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  isLoading: true,
  setSchedules: (schedules) => set({ schedules }),
  addSchedule: (schedule) => set((s) => ({ schedules: [...s.schedules, schedule] })),
  updateSchedule: (id, data) => set((s) => ({ schedules: s.schedules.map((sc) => (sc.$id === id ? { ...sc, ...data } : sc)) })),
  deleteSchedule: (id) => set((s) => ({ schedules: s.schedules.filter((sc) => sc.$id !== id) })),
  setLoading: (v) => set({ isLoading: v }),
}));
