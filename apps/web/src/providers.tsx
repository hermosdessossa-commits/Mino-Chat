import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthProvider';
import { SocketProvider } from './lib/socket';
import { YjsProvider } from './lib/yjs';
import { ThemeProvider } from './shared/providers/ThemeProvider';
import { UIProvider } from './stores/uiStore';
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

export function Providers({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-pulse-soft text-primary-600">Mino-Chat</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <YjsProvider>
              <ThemeProvider>
                <UIProvider>
                  {children}
                </UIProvider>
              </ThemeProvider>
            </YjsProvider>
          </SocketProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}