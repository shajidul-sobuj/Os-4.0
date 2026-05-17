import { create } from "zustand";
import { Exam } from "@/types";

interface ExamState {
  exams: Exam[];
  isLoading: boolean;
  setExams: (exams: Exam[]) => void;
  addExam: (exam: Exam) => void;
  updateExam: (id: string, data: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  setLoading: (v: boolean) => void;
}

export const useExamStore = create<ExamState>((set) => ({
  exams: [],
  isLoading: true,
  setExams: (exams) => set({ exams }),
  addExam: (exam) => set((s) => ({ exams: [...s.exams, exam] })),
  updateExam: (id, data) => set((s) => ({ exams: s.exams.map((e) => (e.$id === id ? { ...e, ...data } : e)) })),
  deleteExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.$id !== id) })),
  setLoading: (v) => set({ isLoading: v }),
}));
