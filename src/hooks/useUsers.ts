// ABOUTME: React hook for fetching users list using TanStack Query and User service
// ABOUTME: Returns query object with data, status, error.

import type { User } from "@/schemas/user";
import { getUsers } from "@/services/users";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export const useUsers = (): UseQueryResult<User[]> =>
  useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  });
