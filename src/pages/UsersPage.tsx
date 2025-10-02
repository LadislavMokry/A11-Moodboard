// ABOUTME: Page that lists users using useUsers hook.

import { useUsers } from "@/hooks/useUsers";

export default function UsersPage() {
  const { data, isLoading, isError, error } = useUsers();

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p className="text-destructive">Error: {(error as Error).message}</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Users</h1>
      <ul className="list-disc pl-4 space-y-1">
        {data?.map((u) => (
          <li key={u.id}>
            {u.name} – {u.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
