import { create } from "zustand";
import { StudyTopic, TopicStatus } from "@/types";

interface StudyTopicState {
  topics: StudyTopic[];
  isLoading: boolean;
  setTopics: (topics: StudyTopic[]) => void;
  addTopic: (topic: StudyTopic) => void;
  updateTopic: (id: string, data: Partial<StudyTopic>) => void;
  updateTopicStatus: (id: string, status: TopicStatus) => void;
  deleteTopic: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useStudyTopicStore = create<StudyTopicState>((set) => ({
  topics: [],
  isLoading: true,
  setTopics: (topics) => set({ topics }),
  addTopic: (topic) => set((s) => ({ topics: [topic, ...s.topics] })),
  updateTopic: (id, data) => set((s) => ({
    topics: s.topics.map((t) => (t.$id === id ? { ...t, ...data } : t)),
  })),
  updateTopicStatus: (id, status) => set((s) => ({
    topics: s.topics.map((t) =>
      t.$id === id
        ? { ...t, status, ...(status === "completed" ? { completedAt: new Date().toISOString() } : {}) }
        : t
    ),
  })),
  deleteTopic: (id) => set((s) => ({ topics: s.topics.filter((t) => t.$id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
}));
