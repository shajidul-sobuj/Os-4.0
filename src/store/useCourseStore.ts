import { create } from "zustand";
import { Course } from "@/types";

interface CourseState {
  courses: Course[];
  isLoading: boolean;
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  isLoading: true,
  setCourses: (courses) => set({ courses }),
  addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
  updateCourse: (id, data) => set((state) => ({
    courses: state.courses.map(c => c.$id === id ? { ...c, ...data } : c)
  })),
  deleteCourse: (id) => set((state) => ({
    courses: state.courses.filter(c => c.$id !== id)
  })),
  setLoading: (isLoading) => set({ isLoading })
}));
