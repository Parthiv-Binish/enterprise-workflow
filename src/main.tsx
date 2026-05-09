import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { debugError, debugLog, isDebug } from '@/lib/debug';
import AuthProvider from '@/providers/auth-provider';
import { useAuthStore } from '@/store/auth.store';

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
    return null;
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
