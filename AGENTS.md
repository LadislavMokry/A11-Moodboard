# Repository Guidelines

## Project Structure & Module Organization
- `src/` — application code.
  - `pages/` route components (e.g., `Home.tsx`, `UsersPage.tsx`).
  - `components/` reusable UI (e.g., `ErrorBoundary.tsx`).
  - `hooks/` data hooks (e.g., `useUsers.ts`).
  - `services/` API calls via Axios (parse with Zod).
  - `schemas/` Zod schemas and types.
  - `lib/` singletons/utilities (`http.ts`, `queryClient.ts`, `utils.ts`).
- `public/` — static assets.
- `index.html` — Vite entry; `vite.config.ts`/`vitest.config.ts` — tooling.

## Build, Test, and Development Commands
- `npm run dev` — start Vite dev server.
- `npm run build` — type-check and build to `dist/`.
- `npm run preview` — serve the production build locally.
- `npm run lint` — run ESLint across the repo.
- `npm test` — run Vitest (jsdom + RTL). Add `--coverage` if needed.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). React function components only.
- Indentation: 2 spaces; no trailing whitespace.
- Filenames: `PascalCase` for components/pages, `camelCase` for hooks/utils, `kebab-case` for asset files.
- Imports: use `@/` alias for `src/` (see `vite.config.ts`).
- Linting: ESLint with `typescript-eslint`, React Hooks, and Refresh. Fix issues before PRs.

## Testing Guidelines
- Framework: Vitest + React Testing Library; environment: `jsdom` (see `vitest.config.ts`).
- Location: co-locate or use `src/__tests__/`; name files `*.test.ts(x)`.
- Write tests for hooks, services, and component behavior. Mock HTTP via MSW when applicable.
- Run: `npm test`; keep tests deterministic and independent.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`). Keep messages imperative and concise.
- PRs: include a clear summary, linked issue (if any), test evidence (commands/output or screenshots), and notes on breaking changes.
- CI expectation: PRs should pass lint, test, and build locally before review.

## Security & Configuration Tips
- Environment vars must be prefixed `VITE_` to be exposed to the client.
- Centralize HTTP concerns in `src/lib/http.ts` (timeouts, headers, error mapping). Avoid per-call axios instances.

## Agent-Specific Instructions
- Follow structure and naming above; prefer small, focused changes.
- Do not introduce dependencies or broad refactors without discussion.
