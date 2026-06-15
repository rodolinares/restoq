# RestoQ — AGENTS.md

## Stack

| Layer                | Technology                              |
| -------------------- | --------------------------------------- |
| Bundler / Dev Server | Vite 8                                  |
| UI Framework         | React 19 + TypeScript 6.0               |
| Styling              | Tailwind CSS 4 + shadcn/ui (radix-nova) |
| Animations           | tw-animate-css                          |
| Toasts               | sonner                                  |
| State Management     | Zustand 5                               |
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
pnpm deploy      # pnpm build && gh-pages -d dist
```

- Build **always runs `tsc -b` first** — type errors block bundling. Run `pnpm lint` before committing.
- Tests run with vitest. Run `pnpm test` before pushing.

## Code Conventions

- Path alias `@/` maps to `src/` (in tsconfig + vite).
- **Prettier** (enforced): `arrowParens: "avoid"`, `printWidth: 120`, `semi: false`, `singleQuote: true`, `trailingComma: "none"`.
- **TypeScript strictness** (from `tsconfig.app.json`): `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` all enabled. Fix all type errors — `tsc -b` will fail otherwise.
- Import type-only exports with `import type { ... }` (verbatimModuleSyntax requires it).
- Tailwind v4 uses `@import 'tailwindcss'` in CSS (no `tailwind.config.js`). Theme via `@theme inline {}` directive.
- shadcn/ui components go in `src/components/ui/`. Add new ones with `pnpm shadcn add <component>`.

## Architecture

- **Single-page app** — tab-based navigation (Inventory / Alerts) managed by `useState`, no router.
- Front-end only, all state persisted locally (no backend, no auth, no network dependency).
- **Data model**: `PurchaseRecord` (id, name, units, purchaseDate) stored in Zustand with `persist` middleware → `localStorage`.
- **Prediction**: `predictConsumption` in `src/lib/prediction.ts` derives consumption rate from purchase history to estimate current stock and days until empty. Grouped by product name in components.
- **Alerts**: `computeAlerts` in `src/lib/notifications.ts` filters products with ≤7 days until empty. Displayed in `AlertsView` with overdue and low-stock badges.
- **Notifications**: `useNotifications` hook requests permission and sends browser notifications via the service worker when alert state changes.
- **Theme**: `useTheme` hook persists a dark/light preference to localStorage, defaults to system preference, toggles `.dark` class on `<html>`.
- **PWA**: `vite-plugin-pwa` with `injectManifest` strategy. Service worker at `src/sw.ts` handles precaching, install/activate lifecycle, notification display and click-to-open.
- **Layout**: `AppShell` wraps a `Header` (theme toggle, alerts link) and `BottomNav` (two-tab bar with alert badge) around page content.
