// src/providers/auth-provider.tsx

import { useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setIsLoading = useAuthStore((s) => s.setIsLoading);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const init = async () => {
      try {
        if (isMounted) setIsLoading(true);

        // Safety timeout: if init takes more than 10 seconds, force stop loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.error('Auth initialization timeout');
            setIsLoading(false);
          }
        }, 10000);

        const session = await authService.getSession();

        if (!isMounted) return;

        setSession(session);

        if (session?.user) {
          try {
            const profile = await authService.getProfile(session.user.id);
            if (isMounted) setProfile(profile);
          } catch (err) {
            console.error('Failed to fetch profile:', err);
            if (isMounted) setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      
      setSession(session);

      if (session?.user) {
        try {
          const profile = await authService.getProfile(session.user.id);
          if (isMounted) setProfile(profile);
        } catch (err) {
          console.error('Failed to fetch profile on auth change:', err);
          if (isMounted) setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setIsLoading, setSession, setProfile]);

  return <>{children}</>;
}
