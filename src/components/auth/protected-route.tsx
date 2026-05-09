import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  const session = useAuthStore((s) => s.session);

  // wait for zustand persist hydration
  const hasHydrated = useAuthStore.persist?.hasHydrated?.();

  if (!hasHydrated) {
    return null;
  }

  if (!session) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
