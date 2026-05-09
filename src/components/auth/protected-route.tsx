import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { LoadingSpinner } from '@/components/common/loading-spinner';

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
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
