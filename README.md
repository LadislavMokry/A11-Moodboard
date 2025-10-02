# React 18 + Vite 7 Template

Out-of-the-box stack for SPAs with modern DX and zero vendor lock-in.

## Stack

• **React 18** + **TypeScript** (strict)  
• **Vite 7** – lightning-fast dev server & build  
• **Tailwind 4** + shadcn/ui components  
• **TanStack Query v5** – data-fetching, caching, retries  
• **React Router 7** – client-side routing  
• **Axios** – single HTTP wrapper with auth, timing, error mapping  
• **Zod** – runtime schema validation & typed responses  
• **Vitest + RTL + MSW** – unit/integration test harness  
• **GitHub Actions** CI (lint → test → build)  
• **Dependabot** weekly dependency updates

## Getting Started

```bash
pnpm i        # or npm install / yarn
pnpm dev      # start Vite dev server  http://localhost:5173

pnpm test     # run vitest in watch mode
pnpm build    # type-check & build production assets to /dist
pnpm preview  # serve /dist locally to verify
```

## Project Layout

```
src/
  lib/              # shared singletons (http, queryClient)
  schemas/          # Zod schemas & types
  services/         # API calls (axios + schema parsing)
  hooks/            # reusable data hooks (useUsers)
  pages/            # route components (Home, UsersPage)
  components/       # UI (shadcn ui/, ErrorBoundary)
```

## Extending

• **Add an API resource**

1. Define schema in `src/schemas/`.
2. Create service in `src/services/` that parses response.
3. Expose a hook in `src/hooks/` using TanStack Query.
4. Consume from a page/component.

• **Add a route**: create a page component and register it in `src/App.tsx` `<Routes>` list.

• **Run CI locally**: `node .github/workflows/ci.yml` steps (lint, test, build) – matches GitHub Actions.

## Dependency Updates

Dependabot is configured (`.github/dependabot.yml`) to open weekly PRs for npm packages except React 19 until ecosystem support lands.

---

Enjoy building! Pull requests and issues are welcome.
