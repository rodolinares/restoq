# RestoQ — AGENTS.md

## Stack

| Layer                | Technology                              |
| -------------------- | --------------------------------------- |
| Bundler / Dev Server | Vite 8                                  |
| UI Framework         | React 19 + TypeScript 6.0               |
| Styling              | Tailwind CSS 4 + shadcn/ui (radix-nova) |
| State Management     | Zustand 5                               |
| Font                 | Geist Variable                          |
| Icons                | Lucide                                  |

## Commands

```sh
pnpm dev         # Vite dev server
pnpm build       # tsc -b && vite build (type-check then bundle)
pnpm test        # vitest run
pnpm test:watch  # vitest (watch mode)
pnpm lint        # eslint .  (flat config, ESLint 10)
pnpm format      # prettier src/**/*.{css,ts,tsx} --write
pnpm preview     # vite preview
```

- Build **always runs `tsc -b` first** — type errors block bundling. Run `pnpm lint` before committing.
- Tests run with vitest. Run `pnpm test` before pushing.

## Code Conventions

- Path alias `@/` maps to `src/` (in tsconfig + vite).
- **Prettier** (enforced): `arrowParens: "avoid"`, `printWidth: 100`, `semi: false`, `singleQuote: true`, `trailingComma: "none"`.
- **TypeScript strictness** (from `tsconfig.app.json`): `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` all enabled. Fix all type errors — `tsc -b` will fail otherwise.
- Import type-only exports with `import type { ... }` (verbatimModuleSyntax requires it).
- Tailwind v4 uses `@import 'tailwindcss'` in CSS (no `tailwind.config.js`). Theme via `@theme inline {}` directive.
- shadcn/ui components go in `src/components/ui/`. Add new ones with `pnpm shadcn add <component>`.

## Architecture

- **Single-page app**, no router yet.
- Front-end only, all state persisted locally (no backend, no auth, no network dependency).
- **Prediction engine** (`PredictionEngine` interface in `src/types/inventory.ts`) is a replaceable module for future backend handoff.
- **Data model**: `PurchaseRecord` (name, units, purchaseDate) stored in Zustand with `persist` middleware → `localStorage`.
- **Prediction**: `purchaseEngine` in `src/lib/prediction.ts` derives consumption rate from purchase history to estimate current stock and days until empty. Grouped by product name in components.
