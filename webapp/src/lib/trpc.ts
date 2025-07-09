import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@visarun/backend/src/router';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/trpc`,
      headers: () => {
        const token = localStorage.getItem('visarun_access_token');
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

// Export the router type for type checking
export type { AppRouter };
