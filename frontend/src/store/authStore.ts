import { create } from "zustand";
import type { User, AuthState } from "@/types/index";
import { setAuthCookie, getAuthCookie, clearAuthCookie } from "@/lib/cookies";

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user: User, token: string) => {
    setAuthCookie(token, user);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    clearAuthCookie();
    set({ user: null, token: null, isAuthenticated: false });
  },

  initAuth: () => {
    const { token, user } = getAuthCookie();

    if (token && user) {
      set({
        user,
        token,
        isAuthenticated: true,
      });
    }
  },
}));

export default useAuthStore;
