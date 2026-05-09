import { useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setSession = useAuthStore((s) => s.setSession);
  const setIsLoading = useAuthStore((s) => s.setIsLoading);

  useEffect(() => {
    console.log('AUTH PROVIDER STARTED');

    const init = async () => {
      try {
        console.log('GETTING SESSION...');

        const session = await authService.getSession();

        console.log('SESSION RESULT:', session);

        setSession(session);

        console.log('SESSION SAVED TO STORE');
      } catch (err) {
        console.error('SESSION INIT ERROR:', err);
      } finally {
        console.log('LOADING FALSE');

        setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      console.log('AUTH STATE CHANGED:', event);
      console.log('NEW SESSION:', session);

      setSession(session);
    });

    return () => {
      console.log('AUTH SUBSCRIPTION CLEANED');

      subscription.unsubscribe();
    };
  }, [setSession, setIsLoading]);

  return <>{children}</>;
}
