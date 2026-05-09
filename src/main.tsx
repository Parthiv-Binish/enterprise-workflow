import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { debugError, debugLog, isDebug } from '@/lib/debug';
import AuthProvider from '@/providers/auth-provider';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

function Root() {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => unsub();
  }, []);

  if (!hydrated) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

if (isDebug()) {
  debugLog('bootstrap', 'Enterprise Workflow debug enabled');

  window.addEventListener('error', (ev) => {
    debugError('window', 'Uncaught error', ev.error);
  });

  window.addEventListener('unhandledrejection', (ev) => {
    debugError('window', 'Unhandled promise rejection', ev.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
