// ABOUTME: Singleton QueryClient configured with sensible defaults for retries and caching
// ABOUTME: Imported at application root to provide TanStack Query context.

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      staleTime: 60 * 1000 // 1 minute default
    }
  }
});
