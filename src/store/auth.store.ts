// src/store/auth.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile } from '@/types/database';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => {
        console.log('[v0] setUser:', !!user);
        set({ user, isAuthenticated: !!user });
      },

      setProfile: (profile) => {
        console.log('[v0] setProfile:', !!profile);
        set({ profile });
      },

      setSession: (session) => {
        console.log('[v0] setSession:', !!session, session?.user?.email);
        set({
          session,
          user: session?.user || null,
          isAuthenticated: !!session,
        });
      },

      setIsLoading: (isLoading) => {
        console.log('[v0] setIsLoading:', isLoading);
        set({ isLoading });
      },

      logout: () => {
        console.log('[v0] logout');
        set({
          user: null,
          profile: null,
          session: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
  user: state.user,
  profile: state.profile,
  session: state.session,
  isAuthenticated: state.isAuthenticated,
}),
    }
  )
);
