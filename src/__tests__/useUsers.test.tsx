// ABOUTME: Vitest test verifying that useUsers hook fetches and returns data
// ABOUTME: Uses MSW to mock /users endpoint.

import { useUsers } from "@/hooks/useUsers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const server = setupServer(
  rest.get("/users", (_req, res, ctx) => {
    return res(ctx.json([{ id: 1, name: "Laco", email: "laco@example.com" }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;

describe("useUsers", () => {
  it("fetches users list", async () => {
    const { result } = renderHook(() => useUsers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].name).toBe("Laco");
  });
});
