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
    let initDone = false;

    const init = async () => {
      try {
        setIsLoading(true);

        const session = await authService.getSession();

        if (!isMounted) return;

        setSession(session);

        if (session?.user) {
          try {
            const profile = await authService.getProfile(session.user.id);
            if (isMounted) {
              setProfile(profile);
            }
          } catch (err) {
            console.error('[v0] Failed to fetch profile:', err);
            if (isMounted) setProfile(null);
          }
        } else {
          if (isMounted) setProfile(null);
        }
      } catch (err) {
        console.error('[v0] Auth initialization error:', err);
        if (isMounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          initDone = true;
        }
      }
    };

    // Start auth initialization
    init();

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      
      console.log('[v0] Auth state changed:', _event);
      
      setSession(session);

      if (session?.user) {
        try {
          const profile = await authService.getProfile(session.user.id);
          if (isMounted) setProfile(profile);
        } catch (err) {
          console.error('[v0] Failed to fetch profile on auth change:', err);
          if (isMounted) setProfile(null);
        }
      } else {
        if (isMounted) setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setIsLoading, setSession, setProfile]);

  return <>{children}</>;
}
