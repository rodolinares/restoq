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

- **Single-page app** — tab-based navigation (Inventory / Alerts / Shopping) managed by `useState`, no router.
- Front-end only, all state persisted locally (no backend, no auth, no network dependency).
- **Data model**: `Product` (id, name, category, unit, targetStock, createdAt), `StockSnapshot` (id, productId, quantity, takenAt), and `Purchase` (id, productId, quantity, purchasedAt). Products are explicit entities, not inferred from grouping.
- **Store**: `useInventoryStore` (Zustand + persist) at `src/store/inventoryStore.ts`. localStorage key: `restoq-inventory`.
- **Prediction**: `predictProduct` in `src/lib/prediction.ts` derives consumption rate from snapshot deltas to project current stock and days until empty. Confidence: none (0-1 snapshots), low (2), medium (3-4), high (5+). Negative rate or stock returns `none`. Also exports `computeAlertCount` (used by badge).
- **Stock snapshots**: `addSnapshot` in the Zustand store records quantity at a point in time. When ≤1 snapshot exists, prediction shows "Add a count to get a prediction". A `+` button on each `ProductCard` triggers `AddSnapshotDialog`.
- **Alerts**: `computeAlerts` in `src/lib/notifications.ts` filters products where `isAlert` is true. Displayed in `AlertsView` with overdue and low-stock sections. "Generate shopping list" button navigates to Shopping tab. `Reset all data` (with confirmation) lives in `AlertsView`.
- **Shopping**: `ShoppingView` generates an editable list from alert products, showing name, current stock, target stock, and suggested purchase quantity. "Copy list" writes plain text to clipboard.
- **Notifications**: `useNotifications` hook requests permission and sends browser notifications via the service worker when alert state changes. Tracks sent alerts in localStorage (`restoq-notified-alerts`) to avoid duplicates.
- **Theme**: `useTheme` hook persists a dark/light preference to localStorage, defaults to system preference, toggles `.dark` class on `<html>`. Runs `applyTheme` before React hydrates (module-level call).
- **PWA**: `vite-plugin-pwa` with `injectManifest` strategy. Service worker at `src/sw.ts` (`@ts-nocheck`, excluded from `tsconfig.app.json`). Handles precaching, install/activate lifecycle, notification display and click-to-open.
- **Layout**: `AppShell` wraps a `Header` (theme toggle, alerts link) and `BottomNav` (three-tab bar with alert badge) around page content.
- **Keyboard-aware dialog**: `AddSnapshotDialog` and `ProductFormDialog` use `useVisualViewport` hook to reposition when mobile keyboard opens.

## Tests

- Vitest. Tests co-located in `__tests__/` dirs next to source.
- `src/lib/__tests__/prediction.test.ts` — prediction logic.
- `src/store/__tests__/inventoryStore.test.ts` — store CRUD.
- Run focused: `pnpm test -- src/store/__tests__/inventoryStore.test.ts`
