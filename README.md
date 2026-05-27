# RestoQ — Home Inventory Tracker

Track what you have, predict what you'll need.

A mobile-first PWA for managing home inventory with low-stock alerts and consumption-based depletion predictions. All data stays local — no backend, no sign-up.

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

Open the URL Vite prints (usually `http://localhost:5173`).

## Features

- **Inventory CRUD** — add, edit, delete items with quantity, unit, category, location, and notes.
- **Quantity adjustments** — tap `+` / `-` to restock or consume. Consumption events are automatically logged.
- **Consumption predictions** — each item card shows an estimated time until empty based on past usage rate. Confidence level adjusts with more data points (low < 2, medium 2–4, high 5+).
- **Low-stock / out alerts** — derived from `quantity ≤ minThreshold`, never stored. Presented in a dedicated Alerts tab.
- **Search, filter, sort** — by name, location, category, or urgency (soonest to run out first).
- **Dark mode** — respects `prefers-color-scheme`, togglable, persisted in localStorage.
- **PWA** — installable, works offline, auto-updating service worker.
- **Reset all data** — clear everything from the Alerts tab.

## Architecture

### Prediction Engine

The prediction engine is a replaceable module behind the `PredictionEngine` interface (`src/types/inventory.ts`). The current local implementation (`SimplePredictionEngine` in `src/lib/prediction.ts`) computes an average daily consumption rate from logged consumption events and projects how many days remain until the item reaches zero (or its threshold). To swap in a backend-powered engine, implement the same interface and wire it in — no other code changes needed.

### State

A single Zustand store (`useInventoryStore`) with `persist` middleware writes to `localStorage` key `restoq-inventory`. Everything (items + consumption log) is serialized and restored on page load.

### Data model

- **InventoryItem** — id, name, category, quantity, minThreshold, unit, location, notes, createdAt, updatedAt
- **ConsumptionEvent** — id, itemId, delta (negative), quantityAfter, timestamp

Low-stock is a derived filter (`quantity <= minThreshold`), never stored.

## Commands

| Command        | Description                                     |
| -------------- | ----------------------------------------------- |
| `pnpm dev`     | Vite dev server                                 |
| `pnpm build`   | `tsc -b && vite build` (type-check then bundle) |
| `pnpm lint`    | ESLint 10 (flat config)                         |
| `pnpm format`  | Prettier on `src/**/*.{css,ts,tsx}`             |
| `pnpm preview` | `vite preview`                                  |
