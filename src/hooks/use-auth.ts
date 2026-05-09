// src/hooks/use-auth.ts

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { Profile } from '@/types/database';
import { useAuthStore } from '@/store/auth.store';
import { debugError } from '@/lib/debug';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    setProfile,
    setSession,
    setIsLoading,
    logout: clearAuth,
  } = useAuthStore();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await authService.getSession();
        setSession(session);

        if (session?.user) {
          const profile = await authService.getProfile(session.user.id);
          setProfile(profile);
        }
      } catch (error) {
        debugError('useAuth.init', 'Auth initialization failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event: string, session: Session | null) => {
      setSession(session);

      if (session?.user) {
        try {
          const profile = await authService.getProfile(session.user.id);
          setProfile(profile);
        } catch (error) {
          debugError(
            'useAuth.onAuthStateChange',
            `getProfile failed (event=${event})`,
            error,
            { userId: session.user.id }
          );
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        navigate('/auth/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, queryClient, setIsLoading, setProfile, setSession]);

  const signIn = useMutation({
    mutationFn: authService.signIn,
    onSuccess: () => {
      toast.success('Welcome back!');
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      debugError('useAuth.signIn', 'mutation error', error);
      toast.error(error.message);
    },
  });

  const signUp = useMutation({
    mutationFn: authService.signUp,
    onSuccess: () => {
      toast.success('Account created! Please check your email to verify.');
    },
    onError: (error: Error) => {
      debugError('useAuth.signUp', 'mutation error', error);
      const msg = error.message;
      if (
        msg.includes('Database error saving new user') ||
        msg.includes('unexpected_failure')
      ) {
        toast.error(
          'Signup failed on the database (usually a missing/broken profiles trigger). Run `supabase/migrations/20250509120000_profiles_auth_trigger.sql` in the Supabase SQL Editor, then check Postgres logs if it persists.'
        );
        return;
      }
      toast.error(msg);
    },
  });

  const signOut = useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('Signed out successfully');
      navigate('/auth/login');
    },
    onError: (error: Error) => {
      debugError('useAuth.signOut', 'mutation error', error);
      toast.error(error.message);
    },
  });

  const resetPassword = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success('Password reset email sent');
    },
    onError: (error: Error) => {
      debugError('useAuth.resetPassword', 'mutation error', error);
      toast.error(error.message);
    },
  });

  const updatePassword = useMutation({
    mutationFn: authService.updatePassword,
    onSuccess: () => {
      toast.success('Password updated successfully');
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      debugError('useAuth.updatePassword', 'mutation error', error);
      toast.error(error.message);
    },
  });

  const updateProfile = useMutation({
    mutationFn: (updates: Partial<Profile>) =>
      authService.updateProfile(user!.id, updates),
    onSuccess: (data) => {
      setProfile(data);
      toast.success('Profile updated');
    },
    onError: (error: Error) => {
      debugError('useAuth.updateProfile', 'mutation error', error);
      toast.error(error.message);
    },
  });

  return {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };
}
