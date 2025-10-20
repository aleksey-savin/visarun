import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { type AppRouter } from '@visarun/backend/src/router';
import { createTRPCReact } from '@trpc/react-query';
import { useAuth } from './auth';
import { useState } from 'react';

// Use the type AppRouter, not the value
export const trpc = createTRPCReact<AppRouter>();

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/trpc`,
          // Include authorization header with token if authenticated
          headers: () => {
            const token = auth.getAccessToken();
            return {
              Authorization: token ? `Bearer ${token}` : '',
            };
          },
          // Handle token expiry and refresh logic
          fetch: async (url, options) => {
            // First attempt with current token
            const response = await fetch(url, options);

            // If unauthorized (401), try to refresh the token
            if (response.status === 401) {
              const refreshSuccess = await auth.refreshAuth();

              // If refresh successful, retry with new token
              if (refreshSuccess) {
                const newToken = auth.getAccessToken();
                if (newToken && options?.headers) {
                  // Update Authorization header with new token
                  (options.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
                  // Retry the request
                  return fetch(url, options);
                }
              }
            }

            return response;
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
