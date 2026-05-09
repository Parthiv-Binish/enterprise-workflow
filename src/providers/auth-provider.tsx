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
    const init = async () => {
      try {
        setIsLoading(true);

        const session = await authService.getSession();

        setSession(session);

        if (session?.user) {
          const profile = await authService.getProfile(session.user.id);

          setProfile(profile);
        } else {
          setProfile(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        const profile = await authService.getProfile(session.user.id);

        setProfile(profile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
