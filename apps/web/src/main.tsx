import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { Providers } from './providers';
import { AppRoutes } from './routes';
import './shared/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (count, error) => count < 2 && !isAuthError(error),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

function isAuthError(error: unknown): boolean {
  if (error instanceof Response) return error.status === 401;
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as { status: number }).status === 401;
  }
  return false;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Providers>
          <AppRoutes />
        </Providers>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);