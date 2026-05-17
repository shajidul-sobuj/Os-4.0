import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  appwriteUser: any | null; // The standard Appwrite account object
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAppwriteUser: (appwriteUser: any | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  appwriteUser: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAppwriteUser: (appwriteUser) => set({ appwriteUser }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, appwriteUser: null, isAuthenticated: false }),
}));
