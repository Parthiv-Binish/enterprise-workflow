// src/App.tsx

import { RouterProvider } from 'react-router-dom';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { router } from '@/routes';
import { debugError, isDebug } from '@/lib/debug';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!isDebug()) return;
      debugError('ReactQuery.query', `FAILED queryKey=${JSON.stringify(query.queryKey)}`, error, {
        queryHash: query.queryHash,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (!isDebug()) return;
      debugError(
        'ReactQuery.mutation',
        `FAILED mutationKey=${JSON.stringify(mutation.options.mutationKey ?? '(anonymous)')}`,
        error
      );
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="workflow-theme">
        <TooltipProvider delayDuration={200}>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
