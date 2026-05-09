import { useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const init = async () => {
      const session = await authService.getSession();

      console.log('RESTORED SESSION:', session);

      setSession(session);
    };

    init();

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, session) => {
      console.log('AUTH CHANGED:', session);

      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return <>{children}</>;
}
