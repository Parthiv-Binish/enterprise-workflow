// src/hooks/use-auth.ts

import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { Profile } from '@/types/database';
import { useAuthStore } from '@/store/auth.store';
import { debugError } from '@/lib/debug';
import { toast } from 'sonner';

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
    logout: clearAuth,
  } = useAuthStore();

  const signIn = useMutation({
    mutationFn: authService.signIn,

    onSuccess: async (data) => {
      try {
        console.log('[v0] Login successful, session:', !!data.session);
        
        // Set session first - this updates both session and user in store
        setSession(data.session);

        // Then fetch and set profile
        if (data.session?.user) {
          try {
            const profile = await authService.getProfile(
              data.session.user.id
            );
            console.log('[v0] Profile fetched:', !!profile);
            setProfile(profile);
          } catch (profileError) {
            console.error('[v0] Failed to fetch profile:', profileError);
            // Continue even if profile fetch fails
            setProfile(null);
          }
        }

        toast.success('Welcome back!');
        
        // Give store a moment to sync before navigation
        setTimeout(() => {
          console.log('[v0] Navigating to dashboard');
          navigate('/dashboard');
        }, 100);
      } catch (error) {
        debugError('useAuth.signIn', 'post-login setup failed', error);
        toast.error('Login succeeded but profile setup failed.');
      }
    },

    onError: (error: Error) => {
      debugError('useAuth.signIn', 'mutation error', error);
      console.error('[v0] Login error:', error.message);
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
          'Signup failed on the database (usually a missing/broken profiles trigger).'
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
