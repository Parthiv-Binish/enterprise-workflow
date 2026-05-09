// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { debugError, debugLog, isDebug } from '@/lib/debug';
import AuthProvider from '@/providers/auth-provider';
if (isDebug()) {
  debugLog('bootstrap', 'Enterprise Workflow debug enabled (DEV, VITE_DEBUG, or window.__EW_DEBUG__)');

  window.addEventListener('error', (ev) => {
    debugError('window', 'Uncaught error', ev.error, {
      message: ev.message,
      filename: ev.filename,
      lineno: ev.lineno,
      colno: ev.colno,
    });
  });

  window.addEventListener('unhandledrejection', (ev) => {
    debugError('window', 'Unhandled promise rejection', ev.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
  <AuthProvider>
    <App />
  </AuthProvider>
</React.StrictMode>
);
