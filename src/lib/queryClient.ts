// ABOUTME: Singleton QueryClient configured with sensible defaults for retries and caching
// ABOUTME: Imported at application root to provide TanStack Query context.

import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // 3 retries with exponential backoff
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      staleTime: 60 * 1000, // 1 minute default
      onError: (error) => {
        // Global error handler for queries
        console.error("Query error:", error);
        // Only show toast for network errors or 500s, not for expected errors like 404
        if (error instanceof Error && error.message.includes("Network")) {
          toast.error("Network error. Please check your connection.");
        }
      }
    },
    mutations: {
      onError: (error) => {
        // Global error handler for mutations
        console.error("Mutation error:", error);
      }
    }
  }
});
