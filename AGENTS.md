# Restoq — AGENTS.md

## Stack

| Layer                | Technology                              |
| -------------------- | --------------------------------------- |
| Bundler / Dev Server | Vite 8                                  |
| UI Framework         | React 19 + TypeScript 6.0               |
| Styling              | Tailwind CSS 4 + shadcn/ui (radix-nova) |
| Animations           | tw-animate-css                          |
| Toasts               | sonner                                  |
| State Management     | Zustand 5 (+ persist)                   |
| Icons                | Lucide                                  |
| Font                 | Geist Variable                          |
| PWA                  | vite-plugin-pwa + Workbox               |

## Commands

```sh
pnpm dev         # Vite dev server
pnpm build       # tsc -b && vite build (type-check then bundle)
pnpm test        # vitest run
pnpm test:watch  # vitest (watch mode)
pnpm lint        # eslint .  (flat config, ESLint 10)
pnpm format      # prettier "src/**/*.{css,ts,tsx}" --write
pnpm preview     # vite preview
pnpm deploy      # pnpm build && npx gh-pages -d dist
```

- Build **always runs `tsc -b` first** — type errors block bundling. Run `pnpm lint` before committing.
- `pnpm test` before pushing.
- Vite base path `/restoq/` (GitHub Pages deploy).

## Code Conventions

- Path alias `@/` maps to `src/` (in tsconfig + vite).
- **Prettier** (enforced): `arrowParens: "avoid"`, `printWidth: 120`, `semi: false`, `singleQuote: true`, `trailingComma: "none"`.
- **TypeScript strictness** (from `tsconfig.app.json`): `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` all enabled. Fix all type errors — `tsc -b` will fail otherwise.
- Import type-only exports with `import type { ... }` (verbatimModuleSyntax requires it).
- Tailwind v4 uses `@import 'tailwindcss'` in CSS (no `tailwind.config.js`). Theme via `@theme inline {}` directive.
- shadcn/ui components go in `src/components/ui/`. Add new ones with `pnpm shadcn add <component>`.
- `cn()` utility at `@/lib/utils` (clsx + tailwind-merge).

## Architecture

- **Single-page app** — tab-based navigation (Inventory / Alerts) managed by `useState`, no router.
- Front-end only, all state persisted locally (no backend, no auth, no network dependency).
- **Data model**: `PurchaseRecord` (id, name, units, purchaseDate) and `Depletion` (productName, depletedAt). Products grouped by name at consumption time (not stored as separate entity).
- **Store**: `usePurchaseStore` (Zustand + persist) at `src/store/inventoryStore.ts`. localStorage key: `restoq-purchases`.
- **Prediction**: `predictConsumption` in `src/lib/prediction.ts` derives consumption rate from purchase history to estimate current stock and days until empty. Also exports `computeAlertCount` (used by badge).
- **Depletion**: `markDepleted` in the Zustand store records when a product runs out. When a depletion exists after the last purchase, `predictConsumption` overrides stock to 0 and days-until-empty to 0. A `Frown` icon button in `ProductGroup` triggers depletion; an `X` button undoes it.
- **Alerts**: `computeAlerts` in `src/lib/notifications.ts` filters products with ≤7 days until empty. Displayed in `AlertsView` with overdue and low-stock badges. `Reset all data` (with confirmation) lives in `AlertsView`.
- **Notifications**: `useNotifications` hook requests permission and sends browser notifications via the service worker when alert state changes. Tracks sent alerts in localStorage (`restoq-notified-alerts`) to avoid duplicates.
- **Theme**: `useTheme` hook persists a dark/light preference to localStorage, defaults to system preference, toggles `.dark` class on `<html>`. Runs `applyTheme` before React hydrates (module-level call).
- **PWA**: `vite-plugin-pwa` with `injectManifest` strategy. Service worker at `src/sw.ts` (`@ts-nocheck`, excluded from `tsconfig.app.json`). Handles precaching, install/activate lifecycle, notification display and click-to-open.
- **Layout**: `AppShell` wraps a `Header` (theme toggle, alerts link) and `BottomNav` (two-tab bar with alert badge) around page content.
- **Keyboard-aware dialog**: `PurchaseFormDialog` uses `useVisualViewport` hook to reposition when mobile keyboard opens.

## Tests

- Vitest. Tests co-located in `__tests__/` dirs next to source.
- `src/lib/__tests__/prediction.test.ts` — prediction logic.
- `src/store/__tests__/inventoryStore.test.ts` — store CRUD.
- Run focused: `pnpm test -- src/store/__tests__/inventoryStore.test.ts`
