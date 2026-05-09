import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { LoadingSpinner } from '@/components/common/loading-spinner';

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // Once loading finishes, mark auth check as complete
    if (!isLoading) {
      setHasCheckedAuth(true);
    }
  }, [isLoading]);

  // Show loading spinner only on initial load or while auth is being initialized
  if (!hasCheckedAuth || isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // After auth check completes, if no session, redirect to login
  if (!session) {
    console.log('[v0] No session found, redirecting to login');
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location }}
        replace
      />
    );
  }

  console.log('[v0] Session valid, rendering protected content');
  return <>{children}</>;
}
