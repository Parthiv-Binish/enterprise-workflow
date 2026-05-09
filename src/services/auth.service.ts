// src/services/auth.service.ts

import { supabase } from '@/integrations/supabase/client';
import { throwIfSupabaseError } from '@/lib/debug';
import type { Profile, UserRole } from '@/types/database';
import type { Session } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp({ email, password, full_name }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
      },
    });

    throwIfSupabaseError('auth.service', 'signUp', error, { email });
    return data;
  },

  async signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    throwIfSupabaseError('auth.service', 'signIn', error, { email });
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    throwIfSupabaseError('auth.service', 'signOut', error);
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    throwIfSupabaseError('auth.service', 'resetPassword', error, { email });
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    throwIfSupabaseError('auth.service', 'updatePassword', error);
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    throwIfSupabaseError('auth.service', 'getSession', error);
    return data.session;
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    throwIfSupabaseError('auth.service', 'getCurrentUser', error);
    return data.user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throwIfSupabaseError('auth.service', 'getProfile', error, { userId });
    }
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    throwIfSupabaseError('auth.service', 'updateProfile', error, { userId });
    return data;
  },

  async inviteUser(email: string, role: UserRole = 'employee') {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { role },
    });

    throwIfSupabaseError('auth.service', 'inviteUser', error, {
      email,
      hint: 'Requires service_role; anon key will fail here.',
    });
    return data;
  },

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
