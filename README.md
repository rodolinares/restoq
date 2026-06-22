# Restoq — Home Inventory Tracker

Track what you buy, predict when you'll run out.

Mobile-first PWA. All data stays local — no backend, no sign-up.

## Stack

| Layer                | Technology                              |
| -------------------- | --------------------------------------- |
| Bundler / Dev Server | Vite 8                                  |
| UI Framework         | React 19 + TypeScript 6.0               |
| Styling              | Tailwind CSS 4 + shadcn/ui (radix-nova) |
| State Management     | Zustand 5 (persisted to localStorage)   |
| Font                 | Geist Variable                          |
| Icons                | Lucide                                  |

## Getting Started

```sh
pnpm install
pnpm dev
```

Open URL Vite prints (usually `http://localhost:5173/restoq/`).

## Features

- **Record purchases** — log product name, units, and purchase date.
- **Consumption predictions** — each product card shows estimated daily usage, current stock, and days until empty based on purchase history. Confidence: low (< 3 records), medium (3–5), high (6+).
- **Depletion tracking** — mark product as depleted (Frown icon). Stock resets to 0, days-until-empty to 0. Undo with X icon.
- **Low-stock alerts** — products with ≤7 days until empty appear in Alerts tab with Overdue / Low badges.
- **Browser notifications** — permission prompt on first alert; sends notification when alert state changes (deduplicated).
- **Search** — filter products by name.
- **Dark mode** — respects `prefers-color-scheme`, togglable, persisted.
- **PWA** — installable, works offline, auto-updating service worker.
- **Reset all data** — clear everything from Alerts tab (confirms first).

## Commands

| Command        | Description                                     |
| -------------- | ----------------------------------------------- |
| `pnpm dev`     | Vite dev server                                 |
| `pnpm build`   | `tsc -b && vite build` (type-check then bundle) |
| `pnpm test`    | Vitest run                                      |
| `pnpm lint`    | ESLint 10 (flat config)                         |
| `pnpm format`  | Prettier on `src/**/*.{css,ts,tsx}`             |
| `pnpm preview` | Vite preview                                    |
| `pnpm deploy`  | Build + deploy to GitHub Pages                  |

## Architecture

### Data Model

- **PurchaseRecord** — `id`, `name`, `units`, `purchaseDate`
- **Depletion** — `productName`, `depletedAt`

Products grouped by name at consumption time (not stored as separate entities).

### State

Zustand store (`usePurchaseStore`) with `persist` middleware writes to `localStorage` key `restoq-purchases`.

### Prediction Engine

`predictConsumption` in `src/lib/prediction.ts` computes a daily consumption rate from purchase history, estimates current stock from the last purchase, and projects days until empty. Depletion overrides stock to 0 and days-until-empty to 0.

### Notifications

`useNotifications` hook compares current alerts against previously sent ones (`restoq-notified-alerts` in localStorage) to avoid duplicate notifications. Sends via service worker if available, falls back to `new Notification()`.
