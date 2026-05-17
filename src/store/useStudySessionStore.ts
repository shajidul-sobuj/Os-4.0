import { create } from "zustand";
import { StudySession } from "@/types";

interface StudySessionState {
  sessions: StudySession[];
  isLoading: boolean;
  setSessions: (sessions: StudySession[]) => void;
  addSession: (session: StudySession) => void;
  setLoading: (v: boolean) => void;
}

export const useStudySessionStore = create<StudySessionState>((set) => ({
  sessions: [],
  isLoading: false,
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  setLoading: (v) => set({ isLoading: v }),
}));
